import { NextRequest, NextResponse } from "next/server"
import {
  getAuthorizedPanelConfig,
} from "@/lib/config-loader"
import { resolveEventoForPanelConfig } from "@/lib/panel-evento-resolve"
import { createApiClient } from "@/lib/supabase/api"
import {
  loadMesasPlan,
  parseMesasPlanBody,
  saveMesasPlan,
} from "@/lib/mesas/server"

function mesasEnabled(config: ReturnType<typeof getAuthorizedPanelConfig>): boolean {
  return Boolean(config?.rsvpPanel?.mesas)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> },
) {
  const { panelId } = await params
  if (!panelId || typeof panelId !== "string" || panelId.length > 200) {
    return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
  }

  const config = getAuthorizedPanelConfig(panelId)
  if (!config) {
    return NextResponse.json(
      { error: "Panel no encontrado o desactivado" },
      { status: 404 },
    )
  }
  if (!mesasEnabled(config)) {
    return NextResponse.json(
      { error: "Mesas no habilitado para este panel" },
      { status: 403 },
    )
  }

  try {
    const supabase = createApiClient()
    const resolved = await resolveEventoForPanelConfig(supabase, config)
    if (!resolved.ok) {
      return NextResponse.json(
        {
          error:
            resolved.reason === "ambiguous"
              ? "Varias filas en eventos coinciden con este panel."
              : "Evento no encontrado",
        },
        { status: resolved.reason === "ambiguous" ? 500 : 404 },
      )
    }
    const plan = await loadMesasPlan(String(resolved.evento.id))
    return NextResponse.json({
      eventoId: resolved.evento.id,
      ...plan,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> },
) {
  const { panelId } = await params
  if (!panelId || typeof panelId !== "string" || panelId.length > 200) {
    return NextResponse.json({ error: "panelId inválido" }, { status: 400 })
  }

  const config = getAuthorizedPanelConfig(panelId)
  if (!config) {
    return NextResponse.json(
      { error: "Panel no encontrado o desactivado" },
      { status: 404 },
    )
  }
  if (!mesasEnabled(config)) {
    return NextResponse.json(
      { error: "Mesas no habilitado para este panel" },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const plan = parseMesasPlanBody(body)
  if (!plan) {
    return NextResponse.json(
      { error: "Payload inválido: se esperan mesas[] y asientos[]" },
      { status: 400 },
    )
  }
  if (plan.mesas.length > 80) {
    return NextResponse.json({ error: "Demasiadas mesas" }, { status: 400 })
  }
  if (plan.asientos.length > 2000) {
    return NextResponse.json({ error: "Demasiados asientos" }, { status: 400 })
  }

  try {
    const supabase = createApiClient()
    const resolved = await resolveEventoForPanelConfig(supabase, config)
    if (!resolved.ok) {
      return NextResponse.json(
        {
          error:
            resolved.reason === "ambiguous"
              ? "Varias filas en eventos coinciden con este panel."
              : "Evento no encontrado",
        },
        { status: resolved.reason === "ambiguous" ? 500 : 404 },
      )
    }
    const saved = await saveMesasPlan(String(resolved.evento.id), plan)
    return NextResponse.json({
      eventoId: resolved.evento.id,
      ...saved,
      ok: true,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
