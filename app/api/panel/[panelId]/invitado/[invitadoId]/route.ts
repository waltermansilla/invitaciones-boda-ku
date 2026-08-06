import { createApiClient } from "@/lib/supabase/api"
import { NextRequest, NextResponse } from "next/server"
import {
  eventoPanelIdMatchesConfig,
  getAuthorizedPanelConfig,
  type EventConfig,
} from "@/lib/config-loader"
import {
  limiteColadosMaxFromConfig,
  limiteInvitadosPanelFromConfig,
  plazasOcupadasPorInvitados,
} from "@/lib/panel-plazas"
import { validateInvitadoNombre, validateIntegrantesNombres, validateFamiliaIntegrantesCount } from "@/lib/invitado-nombre"

function panelIdParamInvalid(panelId: string): boolean {
  return (
    !panelId ||
    typeof panelId !== "string" ||
    panelId.length > 200 ||
    /[\s<>#"']/.test(panelId)
  )
}

function parseCupoColados(value: unknown): number | null {
  if (value === undefined) return null
  if (typeof value !== "number" || !Number.isFinite(value)) return 0
  const n = Math.floor(value)
  return n >= 0 ? n : 0
}

async function invitadoBelongsToPanel(
  supabase: ReturnType<typeof createApiClient>,
  invitadoId: string,
  panelAuth: EventConfig,
): Promise<boolean> {
  const { data: inv } = await supabase
    .from("invitados")
    .select("evento_id")
    .eq("id", invitadoId)
    .maybeSingle()
  if (!inv?.evento_id) return false
  const { data: ev } = await supabase
    .from("eventos")
    .select("panel_id")
    .eq("id", inv.evento_id)
    .maybeSingle()
  return Boolean(ev && eventoPanelIdMatchesConfig(ev.panel_id, panelAuth))
}

// GET: Obtener invitado específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { panelId, invitadoId } = await params
  if (panelIdParamInvalid(panelId)) {
    return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
  }
  const panelAuthGet = getAuthorizedPanelConfig(panelId)
  if (!panelAuthGet) {
    return NextResponse.json(
      { error: "Panel no encontrado o desactivado" },
      { status: 404 },
    )
  }

  const supabase = createApiClient()
  if (!(await invitadoBelongsToPanel(supabase, invitadoId, panelAuthGet))) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

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
  if (panelIdParamInvalid(panelId)) {
    return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
  }
  const panelAuth = getAuthorizedPanelConfig(panelId)
  if (!panelAuth) {
    return NextResponse.json(
      { error: "Panel no encontrado o desactivado" },
      { status: 404 },
    )
  }

  const supabase = createApiClient()
  if (!(await invitadoBelongsToPanel(supabase, invitadoId, panelAuth))) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  const body = await request.json()

  if (body.nombre !== undefined) {
    const nombreError = validateInvitadoNombre(body.nombre)
    if (nombreError) {
      return NextResponse.json({ error: nombreError }, { status: 400 })
    }
    body.nombre = String(body.nombre).trim()
  }

  if (body.panel_variant !== undefined) {
    const { data: invForTransfer, error: invTransferErr } = await supabase
      .from("invitados")
      .select("id, tipo, estado, integrantes (estado)")
      .eq("id", invitadoId)
      .single()
    if (invTransferErr || !invForTransfer) {
      return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
    }
    const canTransfer =
      invForTransfer.tipo === "familia"
        ? (invForTransfer.integrantes || []).every(
            (int: { estado: string }) => int.estado === "pendiente",
          )
        : invForTransfer.estado === "pendiente"
    if (!canTransfer) {
      return NextResponse.json(
        { error: "Solo invitados pendientes pueden cambiar de lista." },
        { status: 400 },
      )
    }
  }

  const limitePut = limiteInvitadosPanelFromConfig(panelAuth.rsvpPanel)
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
  if (body.panel_variant !== undefined) updateData.panel_variant = body.panel_variant
  const parsedCupoColados = parseCupoColados(body.cupo_colados)
  if (parsedCupoColados !== null) {
    const maxCupo = panelAuth.rsvpPanel?.colados
      ? limiteColadosMaxFromConfig(panelAuth.rsvpPanel)
      : 0
    updateData.cupo_colados = Math.min(parsedCupoColados, maxCupo)
  }

  const { error } = await supabase
    .from("invitados")
    .update(updateData)
    .eq("id", invitadoId)

  if (error) {
    return NextResponse.json({ error: "Error actualizando invitado" }, { status: 500 })
  }

  // Si vienen integrantes, actualizar/crear/eliminar
  if (body.integrantes !== undefined) {
    const integrantesError = validateIntegrantesNombres(body.integrantes)
    if (integrantesError) {
      return NextResponse.json({ error: integrantesError }, { status: 400 })
    }

    const { data: invTipoRow } = await supabase
      .from("invitados")
      .select("tipo")
      .eq("id", invitadoId)
      .single()

    if (invTipoRow?.tipo === "familia") {
      const countError = validateFamiliaIntegrantesCount(body.integrantes)
      if (countError) {
        return NextResponse.json({ error: countError }, { status: 400 })
      }
    }

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
        if (int.es_colado !== undefined) payload.es_colado = Boolean(int.es_colado)
        await supabase.from("integrantes").update(payload).eq("id", int.id)
      }
    }

    // Crear nuevos
    const newIntegrantes = body.integrantes
      .filter((i: { id: string }) => !i.id || i.id.startsWith("new"))
      .map((i: { nombre: string; estado?: string; es_colado?: boolean }) => ({
        invitado_id: invitadoId,
        nombre: i.nombre,
        estado: i.estado || "pendiente",
        es_colado: Boolean(i.es_colado),
      }))

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
  const { panelId, invitadoId } = await params
  if (panelIdParamInvalid(panelId)) {
    return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
  }
  const panelAuthDel = getAuthorizedPanelConfig(panelId)
  if (!panelAuthDel) {
    return NextResponse.json(
      { error: "Panel no encontrado o desactivado" },
      { status: 404 },
    )
  }

  const supabase = createApiClient()
  if (!(await invitadoBelongsToPanel(supabase, invitadoId, panelAuthDel))) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  // Código del invitado antes de borrar (para cupones referidos no usados)
  const { data: invRow } = await supabase
    .from("invitados")
    .select("codigo")
    .eq("id", invitadoId)
    .maybeSingle()
  const guestCodigo =
    typeof invRow?.codigo === "string" ? invRow.codigo.trim() : ""

  const { error } = await supabase
    .from("invitados")
    .delete()
    .eq("id", invitadoId)

  if (error) {
    return NextResponse.json({ error: "Error eliminando invitado" }, { status: 500 })
  }

  if (guestCodigo) {
    try {
      const { deleteUnusedReferralCouponForGuest } = await import(
        "@/lib/referrals/cleanup"
      )
      await deleteUnusedReferralCouponForGuest({
        panelId,
        guestCodigo,
      })
    } catch (cleanupErr) {
      console.error(
        "[panel DELETE] cleanup cupón referido",
        cleanupErr,
      )
      // El invitado ya se borró; no devolvemos error por el cupón
    }
  }

  return NextResponse.json({ success: true })
}
