import { createApiClient } from "@/lib/supabase/api"
import { NextRequest, NextResponse } from "next/server"
import { findConfigByPanelId } from "@/lib/config-loader"
import {
  limiteInvitadosPanelFromConfig,
  plazasOcupadasPorInvitados,
} from "@/lib/panel-plazas"

// GET: Obtener invitado específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { invitadoId } = await params
  const supabase = createApiClient()

  const { data: invitado, error } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitadoId)
    .single()

  if (error || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ invitado })
}

// PUT: Actualizar invitado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { panelId, invitadoId } = await params
  const body = await request.json()
  const supabase = createApiClient()

  const limitePut = limiteInvitadosPanelFromConfig(
    findConfigByPanelId(panelId)?.rsvpPanel,
  )
  if (
    limitePut !== null &&
    body.integrantes !== undefined &&
    Array.isArray(body.integrantes)
  ) {
    const { data: invRow, error: invErr } = await supabase
      .from("invitados")
      .select("id, tipo, evento_id, integrantes (id)")
      .eq("id", invitadoId)
      .single()

    if (!invErr && invRow?.tipo === "familia" && invRow.evento_id) {
      const { data: allInv } = await supabase
        .from("invitados")
        .select("id, tipo, integrantes (id)")
        .eq("evento_id", invRow.evento_id)

      const sinEste = (allInv || []).filter(
        (i: { id: string }) => i.id !== invitadoId,
      )
      const otrasPlazas = plazasOcupadasPorInvitados(sinEste)
      const nuevasEste = Math.max(1, body.integrantes.length)
      if (otrasPlazas + nuevasEste > limitePut) {
        return NextResponse.json(
          {
            error: `Se alcanzó el límite de plazas del panel (${limitePut}).`,
          },
          { status: 400 },
        )
      }
    }
  }

  const updateData: Record<string, unknown> = {}

  if (body.nombre !== undefined) updateData.nombre = body.nombre
  if (body.estado !== undefined) {
    updateData.estado = body.estado
    if (body.estado === "confirmado" || body.estado === "no_asiste") {
      updateData.fecha_confirmacion = new Date().toISOString()
    }
    
    // Si es confirmación manual, también actualizar todos los integrantes con el mismo estado
    if (body.confirmado_manual) {
      await supabase
        .from("integrantes")
        .update({ estado: body.estado })
        .eq("invitado_id", invitadoId)
    }
  }
  if (body.pago_tarjeta !== undefined) updateData.pago_tarjeta = body.pago_tarjeta
  if (body.confirmado_manual !== undefined) updateData.confirmado_manual = body.confirmado_manual
  if (body.restricciones !== undefined) updateData.restricciones = body.restricciones
  if (body.mensaje !== undefined) updateData.mensaje = body.mensaje
  if (body.cancion !== undefined) updateData.cancion = body.cancion

  const { error } = await supabase
    .from("invitados")
    .update(updateData)
    .eq("id", invitadoId)

  if (error) {
    return NextResponse.json({ error: "Error actualizando invitado" }, { status: 500 })
  }

  // Si vienen integrantes, actualizar/crear/eliminar
  if (body.integrantes !== undefined) {
    const { data: currentIntegrantes } = await supabase
      .from("integrantes")
      .select("id")
      .eq("invitado_id", invitadoId)

    const currentIds = currentIntegrantes?.map((i) => i.id) || []
    const newIds = body.integrantes
      .filter((i: { id: string }) => i.id && !i.id.startsWith("new"))
      .map((i: { id: string }) => i.id)

    // Eliminar los que ya no están
    const toDelete = currentIds.filter((id) => !newIds.includes(id))
    if (toDelete.length > 0) {
      await supabase.from("integrantes").delete().in("id", toDelete)
    }

    // Actualizar existentes
    for (const int of body.integrantes) {
      if (int.id && !int.id.startsWith("new") && currentIds.includes(int.id)) {
        const payload: Record<string, unknown> = { nombre: int.nombre }
        if (int.estado !== undefined) payload.estado = int.estado
        await supabase.from("integrantes").update(payload).eq("id", int.id)
      }
    }

    // Crear nuevos
    const newIntegrantes = body.integrantes
      .filter((i: { id: string }) => !i.id || i.id.startsWith("new"))
      .map((i: { nombre: string; estado?: string }) => ({ invitado_id: invitadoId, nombre: i.nombre, estado: i.estado || "pendiente" }))

    if (newIntegrantes.length > 0) {
      await supabase.from("integrantes").insert(newIntegrantes)
    }
  }

  // Obtener invitado actualizado
  const { data: invitadoActualizado } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitadoId)
    .single()

  return NextResponse.json({ invitado: invitadoActualizado })
}

// DELETE: Eliminar invitado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { invitadoId } = await params
  const supabase = createApiClient()

  const { error } = await supabase
    .from("invitados")
    .delete()
    .eq("id", invitadoId)

  if (error) {
    return NextResponse.json({ error: "Error eliminando invitado" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
