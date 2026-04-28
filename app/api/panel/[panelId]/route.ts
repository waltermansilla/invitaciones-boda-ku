import { createApiClient } from "@/lib/supabase/api"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import {
  canonicalPanelIdFromConfig,
  getAuthorizedPanelConfig,
  getEventDataFromConfig,
  invitationAccessTokenFromConfig,
  invitationPublicPathFromConfig,
  panelVariantesFromConfig,
} from "@/lib/config-loader"
import { resolveEventoForPanelConfig } from "@/lib/panel-evento-resolve"
import { panelConfirmacionFromConfig } from "@/lib/panel-confirmacion"
import {
  limiteInvitadosPanelFromConfig,
  plazasDelAltaInvitado,
  plazasOcupadasPorInvitados,
} from "@/lib/panel-plazas"

type EventoRow = Record<string, unknown> & {
  id?: string
  panel_id?: string
  nombre_evento?: string | null
  tipo_evento?: string | null
  fecha_evento?: string | null
}

function normalizePanelVariant(
  value: string | null,
  allowed: string[],
  fallback: string,
): string {
  const raw = (value || "").trim()
  if (!raw) return fallback
  return allowed.includes(raw) ? raw : fallback
}

function resolveStoredVariantToKnown(
  storedValue: unknown,
  variantes: Array<{ id: string; legacyIds?: string[] }>,
  fallback: string,
): string {
  const raw =
    typeof storedValue === "string" && storedValue.trim()
      ? storedValue.trim()
      : ""
  if (!raw) return fallback
  const direct = variantes.find((v) => v.id === raw)
  if (direct) return direct.id
  const byLegacy = variantes.find((v) => (v.legacyIds || []).includes(raw))
  return byLegacy?.id || fallback
}

function mergeEventoFromConfig(
  evento: EventoRow,
  configData: ReturnType<typeof getEventDataFromConfig>,
): EventoRow {
  return {
    ...evento,
    nombre_evento: evento.nombre_evento ?? configData.nombre_evento ?? null,
    tipo_evento: evento.tipo_evento ?? configData.tipo_evento ?? "boda",
    fecha_evento: evento.fecha_evento ?? configData.fecha_evento ?? null,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  try {
    const { panelId } = await params
    if (
      !panelId ||
      typeof panelId !== "string" ||
      panelId.length > 200 ||
      /[\s<>#"']/.test(panelId)
    ) {
      return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
    }

    const config = getAuthorizedPanelConfig(panelId)
    if (!config) {
      return NextResponse.json(
        { error: "Panel no encontrado o desactivado" },
        { status: 404 },
      )
    }

    let supabase: ReturnType<typeof createApiClient>
    try {
      supabase = createApiClient()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Supabase no configurado"
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    const configData = getEventDataFromConfig(config)
    const { variantes, defaultVariante } = panelVariantesFromConfig(config)
    const activeVariante = normalizePanelVariant(
      request.nextUrl.searchParams.get("pv"),
      variantes.map((v) => v.id),
      defaultVariante,
    )

    const invitationPath = invitationPublicPathFromConfig(config)
    const invitationToken = invitationAccessTokenFromConfig(config)

    const confirmacionInvitacion = panelConfirmacionFromConfig(
      config.rsvpPanel?.confirmacion,
    )
    const limiteInvitados = limiteInvitadosPanelFromConfig(config.rsvpPanel)

    const canonicalPanelId = canonicalPanelIdFromConfig(config)
    if (!canonicalPanelId) {
      return NextResponse.json(
        { error: "El JSON del cliente no define rsvpPanel.panelId" },
        { status: 500 },
      )
    }

    let evento: EventoRow | null = null
    try {
      const resolved = await resolveEventoForPanelConfig(supabase, config)
      if (resolved.ok === false && resolved.reason === "ambiguous") {
        return NextResponse.json(
          {
            error:
              "Varias filas en `eventos` coinciden con este panel. Revisá `legacyPanelIds` y los `panel_id` en la base.",
            count: resolved.count,
          },
          { status: 500 },
        )
      }
      if (resolved.ok) {
        evento = resolved.evento
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (!evento) {
      // Esquema base: solo panel_id + fecha_evento (scripts/001_create_rsvp_tables.sql).
      // Nombre/tipo vienen del JSON del cliente vía mergeEventoFromConfig.
      const { data: nuevoEvento, error: createError } = await supabase
        .from("eventos")
        .insert({
          panel_id: canonicalPanelId,
          fecha_evento: configData.fecha_evento || null,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          {
            error: createError.message || "Error creando evento",
            details: createError,
          },
          { status: 500 },
        )
      }

      const eventoMerged = mergeEventoFromConfig(
        nuevoEvento as EventoRow,
        configData,
      )

      return NextResponse.json({
        evento: eventoMerged,
        invitados: [],
        stats: { confirmados: 0, noAsisten: 0, pendientes: 0 },
        invitationPath,
        invitationToken,
        panelConfig: {
          theme: configData.panel_theme,
          labels: configData.panel_labels,
          confirmacion: confirmacionInvitacion,
          limiteInvitados,
          plazasOcupadas: 0,
          variantes,
          defaultVariante,
          activeVariante,
        },
      })
    }

    const eventoMerged = mergeEventoFromConfig(evento as EventoRow, configData)

    const { data: invitados, error: invitadosError } = await supabase
      .from("invitados")
      .select(`*, integrantes (*)`)
      .eq("evento_id", (evento as EventoRow).id)
      .order("created_at", { ascending: true })

    if (invitadosError) {
      return NextResponse.json(
        {
          error: invitadosError.message || "Error obteniendo invitados",
          details: invitadosError,
        },
        { status: 500 },
      )
    }

    let confirmados = 0
    let noAsisten = 0
    let pendientes = 0

    const invitadosFiltradosPorVariante = (invitados || []).filter((inv) => {
      const rawVariant = (inv as Record<string, unknown>).panel_variant
      const variant = resolveStoredVariantToKnown(
        rawVariant,
        variantes,
        defaultVariante,
      )
      return variant === activeVariante
    })

    invitadosFiltradosPorVariante.forEach((inv) => {
      if (inv.tipo === "persona") {
        if (inv.estado === "confirmado") confirmados++
        else if (inv.estado === "no_asiste") noAsisten++
        else pendientes++
      } else {
        inv.integrantes?.forEach((int: { estado: string }) => {
          if (int.estado === "confirmado") confirmados++
          else if (int.estado === "no_asiste") noAsisten++
          else pendientes++
        })
      }
    })

    const plazasOcupadas = plazasOcupadasPorInvitados(invitados || [])

    return NextResponse.json({
      evento: eventoMerged,
      invitados: invitadosFiltradosPorVariante,
      stats: { confirmados, noAsisten, pendientes },
      invitationPath,
      invitationToken,
      panelConfig: {
        theme: configData.panel_theme,
        labels: configData.panel_labels,
        confirmacion: confirmacionInvitacion,
        limiteInvitados,
        plazasOcupadas,
        variantes,
        defaultVariante,
        activeVariante,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const { panelId } = await params
  if (
    !panelId ||
    typeof panelId !== "string" ||
    panelId.length > 200 ||
    /[\s<>#"']/.test(panelId)
  ) {
    return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
  }

  const configPost = getAuthorizedPanelConfig(panelId)
  if (!configPost) {
    return NextResponse.json(
      { error: "Panel no encontrado o desactivado" },
      { status: 404 },
    )
  }

  const body = await request.json()
  let supabase: ReturnType<typeof createApiClient>
  try {
    supabase = createApiClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase no configurado"
    return NextResponse.json({ error: msg }, { status: 503 })
  }

  let evento: { id: string }
  try {
    const resolved = await resolveEventoForPanelConfig(supabase, configPost)
    if (!resolved.ok && resolved.reason === "ambiguous") {
      return NextResponse.json(
        {
          error:
            "Varias filas en `eventos` coinciden con este panel. Revisá `legacyPanelIds` y la base.",
          count: resolved.count,
        },
        { status: 500 },
      )
    }
    if (!resolved.ok) {
      return NextResponse.json(
        { error: "Evento no encontrado. Abrí el panel una vez desde la invitación para crearlo." },
        { status: 404 },
      )
    }
    const id = resolved.evento.id
    if (typeof id !== "string") {
      return NextResponse.json({ error: "Evento sin id" }, { status: 500 })
    }
    evento = { id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (
    panelConfirmacionFromConfig(configPost.rsvpPanel?.confirmacion) ===
      "comun" &&
    body.tipo === "familia"
  ) {
    return NextResponse.json(
      {
        error:
          "Con confirmación común solo se permiten invitados individuales (sin familia).",
      },
      { status: 400 },
    )
  }

  const limitePost = limiteInvitadosPanelFromConfig(configPost.rsvpPanel)
  const { variantes, defaultVariante } = panelVariantesFromConfig(configPost)
  const activeVariante = normalizePanelVariant(
    request.nextUrl.searchParams.get("pv"),
    variantes.map((v) => v.id),
    defaultVariante,
  )
  if (limitePost !== null) {
    const { data: existentes } = await supabase
      .from("invitados")
      .select(`*, integrantes (*)`)
      .eq("evento_id", evento.id)
    const ocupadas = plazasOcupadasPorInvitados(existentes || [])
    const delta = plazasDelAltaInvitado(body.tipo, body.integrantes)
    if (ocupadas + delta > limitePost) {
      return NextResponse.json(
        {
          error: `Se alcanzó el límite de plazas del panel (${limitePost}).`,
        },
        { status: 400 },
      )
    }
  }

  const codigo = nanoid(8)

  const { data: invitado, error } = await supabase
    .from("invitados")
    .insert({
      evento_id: evento.id,
      nombre: body.nombre,
      codigo,
      tipo: body.tipo || "persona",
      panel_variant: activeVariante,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Error creando invitado" }, { status: 500 })
  }

  if (body.tipo === "familia" && body.integrantes?.length > 0) {
    const integrantes = body.integrantes.map((nombre: string) => ({
      invitado_id: invitado.id,
      nombre,
    }))
    await supabase.from("integrantes").insert(integrantes)
  }

  const { data: invitadoCompleto } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitado.id)
    .single()

  return NextResponse.json({ invitado: invitadoCompleto })
}
