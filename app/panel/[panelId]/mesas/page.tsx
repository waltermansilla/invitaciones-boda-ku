"use client"

import { use, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { PanelPinGate } from "@/components/panel-pin-gate"
import { MesasWorkspace } from "@/components/panel/mesas/mesas-workspace"
import type { MesasPlanPayload } from "@/lib/mesas/types"

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || "Error")
    return data
  })

type PanelTheme = { primaryColor?: string }

type PanelData = {
  evento?: { nombre_evento?: string; tipo_evento?: string }
  invitados?: unknown[]
  panelConfig?: {
    theme?: PanelTheme
    mesas?: boolean
    activeVariante?: string
  }
}

type MesasData = MesasPlanPayload & { eventoId?: string }

export default function MesasPage({
  params,
  searchParams,
}: {
  params: Promise<{ panelId: string }>
  searchParams: Promise<{ pv?: string }>
}) {
  const { panelId } = use(params)
  const sp = use(searchParams)
  const panelVariant = (sp.pv || "default").trim() || "default"

  const panelApiUrl = panelId
    ? `/api/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`
    : null
  const mesasApiUrl = panelId ? `/api/panel/${panelId}/mesas` : null

  const {
    data: panelData,
    error: panelError,
    isLoading: panelLoading,
  } = useSWR<PanelData>(panelApiUrl, fetcher)
  const {
    data: mesasData,
    error: mesasError,
    isLoading: mesasLoading,
  } = useSWR<MesasData>(
    panelData?.panelConfig?.mesas ? mesasApiUrl : null,
    fetcher,
  )

  const primaryColor =
    panelData?.panelConfig?.theme?.primaryColor || "#6B7F5A"
  const tituloEvento =
    panelData?.evento?.nombre_evento ||
    panelData?.evento?.tipo_evento ||
    "Evento"

  const initialPlan = useMemo<MesasPlanPayload>(
    () => ({
      mesas: mesasData?.mesas || [],
      asientos: mesasData?.asientos || [],
    }),
    [mesasData],
  )

  if (panelLoading) {
    return (
      <PanelPinGate panelId={panelId} primaryColor={primaryColor}>
        <div className="flex min-h-screen items-center justify-center bg-[#f7f5f1] text-sm text-neutral-600">
          Cargando…
        </div>
      </PanelPinGate>
    )
  }

  if (panelError || !panelData) {
    return (
      <PanelPinGate panelId={panelId} primaryColor={primaryColor}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f5f1] px-6 text-center">
          <p className="text-sm text-neutral-700">
            {panelError instanceof Error
              ? panelError.message
              : "No se pudo cargar el panel"}
          </p>
          <Link
            href={`/panel/${panelId}`}
            className="text-sm font-medium underline"
          >
            Volver
          </Link>
        </div>
      </PanelPinGate>
    )
  }

  if (!panelData.panelConfig?.mesas) {
    return (
      <PanelPinGate panelId={panelId} primaryColor={primaryColor}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f5f1] px-6 text-center">
          <p className="text-sm text-neutral-700">
            Mesas no está habilitado en este panel.
          </p>
          <Link
            href={`/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`}
            className="text-sm font-medium underline"
          >
            Volver al panel
          </Link>
        </div>
      </PanelPinGate>
    )
  }

  if (mesasError) {
    return (
      <PanelPinGate panelId={panelId} primaryColor={primaryColor}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f5f1] px-6 text-center">
          <p className="text-sm text-neutral-700">
            {mesasError instanceof Error
              ? mesasError.message
              : "Error al cargar mesas"}
          </p>
          <p className="max-w-sm text-xs text-neutral-500">
            Si es la primera vez, corré el script{" "}
            <code className="rounded bg-neutral-200 px-1">010_mesas.sql</code>{" "}
            en Supabase.
          </p>
          <Link
            href={`/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`}
            className="text-sm font-medium underline"
          >
            Volver
          </Link>
        </div>
      </PanelPinGate>
    )
  }

  if (mesasLoading || !mesasData) {
    return (
      <PanelPinGate panelId={panelId} primaryColor={primaryColor}>
        <div className="flex min-h-screen items-center justify-center bg-[#f7f5f1] text-sm text-neutral-600">
          Cargando mesas…
        </div>
      </PanelPinGate>
    )
  }

  return (
    <PanelPinGate panelId={panelId} primaryColor={primaryColor}>
      <MesasWorkspace
        key={`${panelId}-${panelVariant}-${mesasData.eventoId || "x"}`}
        panelId={panelId}
        panelVariant={panelVariant}
        primaryColor={primaryColor}
        tituloEvento={tituloEvento}
        invitados={(panelData.invitados || []) as {
          id: string
          nombre: string
          tipo: string
          estado: string
          integrantes?: {
            id: string
            nombre: string
            estado: string
            es_colado?: boolean
          }[]
        }[]}
        initialPlan={initialPlan}
      />
    </PanelPinGate>
  )
}
