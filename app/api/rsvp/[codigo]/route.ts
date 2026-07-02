import { createApiClient } from "@/lib/supabase/api"
import { NextRequest, NextResponse } from "next/server"

// GET: Obtener datos del invitado por código
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const supabase = createApiClient()

  const { data: invitado, error } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("codigo", codigo)
    .single()

  if (error || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  if (invitado.registro_auto_rsvp) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ invitado })
}

// POST: Confirmar asistencia
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const body = await request.json()
  const supabase = createApiClient()

  // Obtener invitado
  const { data: invitado, error: getError } = await supabase
    .from("invitados")
    .select("id, tipo, cupo_colados, estado, fecha_confirmacion, registro_auto_rsvp")
    .eq("codigo", codigo)
    .single()

  if (getError || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  if (invitado.registro_auto_rsvp) {
    if (invitado.fecha_confirmacion || invitado.estado !== "pendiente") {
      return NextResponse.json(
        { error: "Esta confirmación no se puede modificar desde la invitación" },
        { status: 403 },
      )
    }
    const { data: integrantesPrevios } = await supabase
      .from("integrantes")
      .select("fecha_confirmacion, estado")
      .eq("invitado_id", invitado.id)
    const yaConfirmoIntegrante = (integrantesPrevios || []).some(
      (int) =>
        int.fecha_confirmacion ||
        (int.estado && int.estado !== "pendiente"),
    )
    if (yaConfirmoIntegrante) {
      return NextResponse.json(
        { error: "Esta confirmación no se puede modificar desde la invitación" },
        { status: 403 },
      )
    }
  }

  // Actualizar invitado
  const updateData: Record<string, unknown> = {
    estado: body.asiste ? "confirmado" : "no_asiste",
    fecha_confirmacion: new Date().toISOString(),
  }

  if (body.restricciones !== undefined) updateData.restricciones = body.restricciones
  if (body.mensaje !== undefined) updateData.mensaje = body.mensaje
  if (body.cancion !== undefined) updateData.cancion = body.cancion

  const { error: updateError } = await supabase
    .from("invitados")
    .update(updateData)
    .eq("id", invitado.id)

  if (updateError) {
    return NextResponse.json({ error: "Error guardando confirmación" }, { status: 500 })
  }

  // Persona solo admite integrantes con es_colado; limpiar filas fantasma heredadas
  if (invitado.tipo === "persona") {
    await supabase
      .from("integrantes")
      .delete()
      .eq("invitado_id", invitado.id)
      .eq("es_colado", false)
  }

  const integrantesBody = Array.isArray(body.integrantes) ? body.integrantes : []
  const integrantesToSave =
    invitado.tipo === "persona"
      ? integrantesBody.filter((int: { es_colado?: boolean }) =>
          Boolean(int.es_colado),
        )
      : integrantesBody

  // Integrantes (familia + colados de persona)
  if (integrantesToSave.length > 0 || (invitado.tipo === "familia" && integrantesBody.length > 0)) {
    const cupoColados =
      typeof invitado.cupo_colados === "number" && Number.isFinite(invitado.cupo_colados)
        ? Math.max(0, Math.floor(invitado.cupo_colados))
        : 0
    const coladosEnPayload = integrantesToSave.filter((int: { es_colado?: boolean }) =>
      Boolean(int.es_colado),
    ).length
    if (coladosEnPayload > cupoColados) {
      return NextResponse.json(
        { error: `Solo se permiten ${cupoColados} colado(s) para este invitado.` },
        { status: 400 },
      )
    }

    const { data: currentIntegrantes } = await supabase
      .from("integrantes")
      .select("id")
      .eq("invitado_id", invitado.id)

    const currentIds = currentIntegrantes?.map((i) => i.id) || []
    const newIds = integrantesToSave
      .filter((i: { id?: string }) => i.id && !String(i.id).startsWith("new"))
      .map((i: { id: string }) => i.id)

    const toDelete = currentIds.filter((id) => !newIds.includes(id))
    if (toDelete.length > 0) {
      await supabase.from("integrantes").delete().in("id", toDelete)
    }

    for (const int of integrantesToSave) {
      const payload: Record<string, unknown> = {
        nombre: String(int.nombre || "").trim(),
        estado: int.asiste ? "confirmado" : "no_asiste",
        restricciones: int.restricciones || null,
        fecha_confirmacion: new Date().toISOString(),
        es_colado: Boolean(int.es_colado),
      }

      if (int.id && !String(int.id).startsWith("new") && currentIds.includes(int.id)) {
        await supabase.from("integrantes").update(payload).eq("id", int.id)
        continue
      }

      await supabase.from("integrantes").insert({
        invitado_id: invitado.id,
        ...payload,
      })
    }
  }

  // Obtener invitado actualizado
  const { data: invitadoActualizado } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitado.id)
    .single()

  return NextResponse.json({ invitado: invitadoActualizado })
}
