import { createApiClient } from "@/lib/supabase/api"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { inferInvitationPathFromPanelId } from "@/lib/client-json-helpers"
import {
  findConfigByPanelId,
  getEventDataFromConfig,
  invitationPublicPathFromConfig,
} from "@/lib/config-loader"

type EventoRow = Record<string, unknown> & {
  id?: string
  panel_id?: string
  nombre_evento?: string | null
  tipo_evento?: string | null
  fecha_evento?: string | null
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

    let supabase: ReturnType<typeof createApiClient>
    try {
      supabase = createApiClient()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Supabase no configurado"
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    const config = findConfigByPanelId(panelId)
    const configData = config
      ? getEventDataFromConfig(config)
      : {
          panel_theme: null as null,
          panel_labels: null as null,
          nombre_evento: "",
          tipo_evento: "boda" as const,
          fecha_evento: null as string | null,
          slug: undefined as string | undefined,
        }

    const invitationPath =
      invitationPublicPathFromConfig(config) ??
      inferInvitationPathFromPanelId(panelId)

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("*")
      .eq("panel_id", panelId)
      .maybeSingle()

    if (eventoError) {
      return NextResponse.json(
        {
          error: eventoError.message || "Error leyendo evento",
          details: eventoError,
        },
        { status: 500 },
      )
    }

    if (!evento) {
      // Esquema base: solo panel_id + fecha_evento (scripts/001_create_rsvp_tables.sql).
      // Nombre/tipo vienen del JSON del cliente vía mergeEventoFromConfig.
      const { data: nuevoEvento, error: createError } = await supabase
        .from("eventos")
        .insert({
          panel_id: panelId,
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

      const eventoMerged =
        config && nuevoEvento
          ? mergeEventoFromConfig(nuevoEvento as EventoRow, configData)
          : nuevoEvento

      return NextResponse.json({
        evento: eventoMerged,
        invitados: [],
        stats: { confirmados: 0, noAsisten: 0, pendientes: 0 },
        invitationPath,
        panelConfig: {
          theme: configData.panel_theme,
          labels: configData.panel_labels,
        },
      })
    }

    const eventoMerged =
      config && configData
        ? mergeEventoFromConfig(evento as EventoRow, configData)
        : evento

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

    invitados?.forEach((inv) => {
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

    return NextResponse.json({
      evento: eventoMerged,
      invitados: invitados || [],
      stats: { confirmados, noAsisten, pendientes },
      invitationPath,
      panelConfig: {
        theme: configData.panel_theme,
        labels: configData.panel_labels,
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
  const body = await request.json()
  let supabase: ReturnType<typeof createApiClient>
  try {
    supabase = createApiClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase no configurado"
    return NextResponse.json({ error: msg }, { status: 503 })
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("id")
    .eq("panel_id", panelId)
    .single()

  if (!evento) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
  }

  const codigo = nanoid(8)

  const { data: invitado, error } = await supabase
    .from("invitados")
    .insert({
      evento_id: evento.id,
      nombre: body.nombre,
      codigo,
      tipo: body.tipo || "persona",
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
