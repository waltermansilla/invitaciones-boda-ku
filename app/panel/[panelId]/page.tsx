"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import useSWR from "swr"
import { Trash2, Edit2, Plus, Users, User, Check, X, Utensils, Music, MessageSquare, Settings, Send } from "lucide-react"
import {
  eventTypeLabelFromFolderTipo,
  invitationPathFromPanelIdSlug,
} from "@/lib/client-helpers-shared"

interface Integrante { id: string; nombre: string; estado: "pendiente" | "confirmado" | "no_asiste"; restricciones?: string }
interface Invitado { id: string; nombre: string; codigo?: string; tipo: "persona" | "familia" | "integrante"; estado: "pendiente" | "confirmado" | "no_asiste"; pago_tarjeta?: boolean; confirmado_manual?: boolean; restricciones?: string; mensaje?: string; cancion?: string; fecha_confirmacion?: string; integrantes?: Integrante[]; familiaId?: string; familiaNombre?: string; pago?: boolean }
interface Evento { id: string; panel_id: string; fecha_evento?: string; nombre_evento?: string; tipo_evento?: string }
interface PanelTheme { primaryColor?: string; backgroundColor?: string }
interface PanelLabels { title?: string; totalLabel?: string; confirmedLabel?: string; pendingLabel?: string; declinedLabel?: string; paymentPending?: string; addGuest?: string; copyLink?: string; sendInvite?: string; manualConfirm?: string; paidButton?: string; unpaidButton?: string }
interface PanelData {
  evento: Evento
  invitados: Invitado[]
  stats: { confirmados: number; noAsisten: number; pendientes: number }
  /** Ruta invitación pública, ej. `/baby/maxima` (viene de la API). */
  invitationPath?: string | null
  /** Token de acceso público de la invitación (`?k=`), si aplica. */
  invitationToken?: string | null
  panelConfig?: {
    theme?: PanelTheme
    labels?: PanelLabels
    /** Del JSON del cliente: `comun` = solo personas al agregar invitados. */
    confirmacion?: "formulario" | "comun"
    /** Tope de plazas (null = sin límite). */
    limiteInvitados?: number | null
    plazasOcupadas?: number
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const raw = await res.text()
  let json: Record<string, unknown> | null = null
  try {
    json = raw ? (JSON.parse(raw) as Record<string, unknown>) : null
  } catch {
    throw new Error(
      !res.ok
        ? `Error HTTP ${res.status}. El servidor no devolvió JSON (¿Supabase o .env.local?).`
        : "Respuesta del servidor no es JSON válido.",
    )
  }
  if (!res.ok) {
    const msg =
      (typeof json?.error === "string" && json.error) ||
      (typeof json?.message === "string" && json.message) ||
      `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}
const filterToEstado: Record<string, string> = { confirmados: "confirmado", pendientes: "pendiente", no_asiste: "no_asiste" }

// Helper para obtener texto del estado
const getEstadoTexto = (estado: string, plural: boolean) => {
  if (estado === "confirmado") return plural ? "Confirmados" : "Confirmado"
  if (estado === "no_asiste") return plural ? "No asisten" : "No asiste"
  return plural ? "Pendientes" : "Pendiente"
}

function parsePerMemberValues(raw: string | undefined): Record<string, string[]> {
  if (!raw) return {}
  const out: Record<string, string[]> = {}
  raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      // Formato esperado:
      // 1) "Nombre Apellido: valor"
      // 2) "Nombre Apellido - Etiqueta: valor"
      const idxColon = chunk.indexOf(":")
      if (idxColon <= 0) return
      const left = chunk.slice(0, idxColon).trim()
      const value = chunk.slice(idxColon + 1).trim()
      if (!value) return
      const hasPanelLabel = left.includes(" - ")
      const memberName = hasPanelLabel ? left.split(" - ")[0].trim() : left
      if (!memberName) return
      const displayValue = hasPanelLabel
        ? `${left.split(" - ")[1]?.trim() || ""}: ${value}`.trim()
        : value
      if (!out[memberName]) out[memberName] = []
      out[memberName].push(displayValue)
    })
  return out
}

export default function PanelPage({ params }: { params: Promise<{ panelId: string }> }) {
  const [panelId, setPanelId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"todos" | "confirmados" | "pendientes" | "no_asiste" | "pago_pendiente" | "con_alimentacion" | "con_musica" | "con_extra">("todos")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null)
  const [confirmManualInvitado, setConfirmManualInvitado] = useState<Invitado | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showLimitHelpModal, setShowLimitHelpModal] = useState(false)
  const [showUsageHelpModal, setShowUsageHelpModal] = useState(false)
  const giftCardEnabled = true

  useEffect(() => { params.then((p) => setPanelId(p.panelId)) }, [params])

  const { data, error, mutate } = useSWR<PanelData>(panelId ? `/api/panel/${panelId}` : null, fetcher, { refreshInterval: 30000 })
  
  // Configuración del panel desde el JSON del cliente
  const theme = data?.panelConfig?.theme
  const labels = data?.panelConfig?.labels
  const primaryColor = theme?.primaryColor || "#b8a88a"

  const handleSendInvitation = useCallback(
    (invitado: Invitado) => {
      const path =
        data?.invitationPath?.trim() ||
        (panelId ? invitationPathFromPanelIdSlug(panelId) : null) ||
        ""
      const query = new URLSearchParams()
      if (data?.invitationToken?.trim()) {
        query.set("k", data.invitationToken.trim())
      }
      query.set("c", invitado.codigo || "")
      const queryString = query.toString()
      const link = path
        ? `${window.location.origin}${path}?${queryString}`
        : `${window.location.origin}?${queryString}`
      const tipoEvento = String(data?.evento?.tipo_evento || "boda").toLowerCase()
      const eventoTexto = eventTypeLabelFromFolderTipo(tipoEvento)
      const nombreEvento = data?.evento?.nombre_evento?.trim() || ""
      const eventoDetalle = nombreEvento ? `${eventoTexto} ${nombreEvento} ♥️` : `${eventoTexto} ♥️`
      const message = `¡Hola, ${invitado.nombre}! Estás invitado a nuestra ${eventoTexto} 🫶🏼\nIngresá al enlace para ver tu invitación:\n\n${eventoDetalle}\n${link}`
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      )
    },
    [
      panelId,
      data?.invitationPath,
      data?.invitationToken,
      data?.evento?.nombre_evento,
      data?.evento?.tipo_evento,
    ],
  )

  const handleDelete = useCallback(async (invitadoId: string) => {
    if (!confirm("¿Eliminar este invitado?")) return
    await fetch(`/api/panel/${panelId}/invitado/${invitadoId}`, { method: "DELETE" })
    mutate()
  }, [panelId, mutate])

  const handleTogglePago = useCallback(async (invitado: Invitado) => {
    await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pago_tarjeta: !invitado.pago_tarjeta }) })
    mutate()
  }, [panelId, mutate])

  const handleConfirmManual = useCallback(async (invitado: Invitado, estado: "confirmado" | "no_asiste") => {
    await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado, confirmado_manual: true }) })
    mutate()
    setConfirmManualInvitado(null)
  }, [panelId, mutate])

  const applyFilter = useCallback(
    (next: "todos" | "confirmados" | "pendientes" | "no_asiste" | "pago_pendiente" | "con_alimentacion" | "con_musica" | "con_extra") => {
      setExpandedId(null)
      setFilter(next)
    },
    [],
  )

  if (error) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf9f7] p-4"><p className="text-red-500 font-medium">Error al cargar el panel</p><p className="text-xs text-neutral-500 text-center max-w-sm">{error?.message || String(error)}</p><button onClick={() => mutate()} className="mt-2 rounded-lg px-4 py-2 text-sm text-white" style={{backgroundColor: primaryColor}}>Reintentar</button></div>
  if (!panelId || !data) return <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]"><p className="text-neutral-500">Cargando...</p></div>

  const { evento, invitados, stats } = data
  const total = stats.confirmados + stats.noAsisten + stats.pendientes
  const limitePlazas = data.panelConfig?.limiteInvitados
  const plazasOcupadas = data.panelConfig?.plazasOcupadas ?? 0
  const cupoPanelLleno =
    typeof limitePlazas === "number" && plazasOcupadas >= limitePlazas
  let diasRestantes: number | null = null
  if (evento.fecha_evento) { diasRestantes = Math.ceil((new Date(evento.fecha_evento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) }

  // Nombre del evento (sin "La boda de" ni "Los XV de")
  const tipoEvento = String(evento.tipo_evento || "boda").toLowerCase()
  const nombreEvento = evento.nombre_evento || "Anto & Walter"
  const tituloEvento = `${eventTypeLabelFromFolderTipo(tipoEvento)} ${nombreEvento}`.trim()

  const hasDietary = (inv: Invitado) =>
    Boolean(inv.restricciones || inv.integrantes?.some((i) => Boolean(i.restricciones)))
  const hasMusic = (inv: Invitado) => Boolean(inv.cancion?.trim())
  const hasExtra = (inv: Invitado) =>
    Boolean(inv.mensaje?.trim() && inv.mensaje !== inv.cancion)
  const canFilterDietary = invitados.some((inv) => hasDietary(inv))
  const canFilterMusic = invitados.some((inv) => hasMusic(inv))
  const canFilterExtra = invitados.some((inv) => hasExtra(inv))
  const estadoFilter = filterToEstado[filter] || filter
  let itemsToDisplay: Invitado[] = []

  if (filter === "todos") {
    // Ordenar: pendientes primero, luego no asisten, luego confirmados
    const ordenEstado: Record<string, number> = { pendiente: 0, no_asiste: 1, confirmado: 2 }
    itemsToDisplay = invitados.map((inv) => ({ ...inv })).sort((a, b) => (ordenEstado[a.estado] ?? 1) - (ordenEstado[b.estado] ?? 1))
  } else if (filter === "pago_pendiente") {
    // Mostrar solo los que no pagaron tarjeta
    itemsToDisplay = invitados.filter((inv) => !inv.pago_tarjeta).map((inv) => ({ ...inv }))
  } else if (filter === "con_alimentacion") {
    itemsToDisplay = invitados.filter((inv) => hasDietary(inv)).map((inv) => ({ ...inv }))
  } else if (filter === "con_musica") {
    itemsToDisplay = invitados.filter((inv) => hasMusic(inv)).map((inv) => ({ ...inv }))
  } else if (filter === "con_extra") {
    itemsToDisplay = invitados.filter((inv) => hasExtra(inv)).map((inv) => ({ ...inv }))
  } else {
    for (const inv of invitados) {
      if (inv.tipo === "familia" && inv.integrantes && inv.integrantes.length > 0) {
        const estados = new Set(inv.integrantes.map((int) => int.estado))
        if (estados.size > 1) {
          for (const int of inv.integrantes) {
            if (int.estado === estadoFilter) {
              itemsToDisplay.push({ id: int.id, nombre: int.nombre, tipo: "integrante", estado: int.estado, restricciones: int.restricciones, familiaId: inv.id, familiaNombre: inv.nombre, codigo: inv.codigo, pago: inv.pago_tarjeta })
            }
          }
        } else if (estados.has(estadoFilter)) { itemsToDisplay.push({ ...inv }) }
      } else { if (inv.estado === estadoFilter) { itemsToDisplay.push({ ...inv }) } }
    }
  }

  const invitadosFiltrados = itemsToDisplay.filter((item) => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (item.familiaNombre && item.familiaNombre.toLowerCase().includes(searchTerm.toLowerCase())))

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="relative px-5 py-8 text-center text-white" style={{ backgroundColor: primaryColor }}>
        <h1 className="text-lg font-semibold tracking-[0.2em] uppercase">{labels?.title || "Panel de Invitados"}</h1>
        <p className="mt-1 text-sm font-light opacity-90">{tituloEvento}</p>
        {diasRestantes !== null && diasRestantes > 0 && <p className="mt-1 text-xs font-light opacity-80">Faltan {diasRestantes} días</p>}
        <div className="absolute bottom-3 right-5">
          <button
            type="button"
            onClick={() => setShowUsageHelpModal(true)}
            className="rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm"
          >
            ¿Cómo usar?
          </button>
        </div>
      </header>

      <div className="px-5 py-6">
        <div className="mb-3"><div className="rounded-lg bg-white px-4 py-6 text-center shadow-sm"><p className="text-4xl font-bold text-neutral-700">{total}</p><p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{labels?.totalLabel || "Total invitados"}</p></div></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg px-3 py-4 text-center" style={{ backgroundColor: "#d4edda" }}><p className="text-2xl font-bold" style={{ color: "#155724" }}>{stats.confirmados}</p><p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "#155724", opacity: 0.8 }}>{labels?.confirmedLabel || "Confirmados"}</p></div>
          <div className="rounded-lg bg-neutral-100 px-3 py-4 text-center"><p className="text-2xl font-bold text-neutral-600">{stats.pendientes}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">{labels?.pendingLabel || "Pendientes"}</p></div>
          <div className="rounded-lg px-3 py-4 text-center" style={{ backgroundColor: "#f5d5d5" }}><p className="text-2xl font-bold" style={{ color: "#8b6b6b" }}>{stats.noAsisten}</p><p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "#8b6b6b", opacity: 0.8 }}>{labels?.declinedLabel || "No asisten"}</p></div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <input type="text" placeholder="Buscar invitado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none" />
        <div className="flex flex-wrap gap-2">
          {(["todos", "confirmados", "pendientes", "no_asiste", "pago_pendiente"] as const).map((f) => (
            <button key={f} onClick={() => applyFilter(f)} className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors" style={{ backgroundColor: filter === f ? primaryColor : "#fff", color: filter === f ? "#fff" : "#666", border: filter === f ? "none" : "1px solid #e5e5e5" }}>
              {f === "no_asiste" ? "No asisten" : f === "todos" ? "Todos" : f === "pago_pendiente" ? "Pago pendiente" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {canFilterDietary && (
            <button onClick={() => applyFilter("con_alimentacion")} title="Filtrar por alimentación" className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors" style={{ backgroundColor: filter === "con_alimentacion" ? primaryColor : "#fff", color: filter === "con_alimentacion" ? "#fff" : "#666", border: filter === "con_alimentacion" ? "none" : "1px solid #e5e5e5" }}>
              <Utensils className="h-3 w-3" />
            </button>
          )}
          {canFilterMusic && (
            <button onClick={() => applyFilter("con_musica")} title="Filtrar por música" className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors" style={{ backgroundColor: filter === "con_musica" ? primaryColor : "#fff", color: filter === "con_musica" ? "#fff" : "#666", border: filter === "con_musica" ? "none" : "1px solid #e5e5e5" }}>
              <Music className="h-3 w-3" />
            </button>
          )}
          {canFilterExtra && (
            <button onClick={() => applyFilter("con_extra")} title="Filtrar por datos extra" className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors" style={{ backgroundColor: filter === "con_extra" ? primaryColor : "#fff", color: filter === "con_extra" ? "#fff" : "#666", border: filter === "con_extra" ? "none" : "1px solid #e5e5e5" }}>
              <MessageSquare className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {typeof limitePlazas === "number" && (
        <div className="px-5 pb-2 text-center">
          <p className="text-xs text-neutral-600">
            Plazas en panel:{" "}
            <span className="font-semibold tabular-nums">
              {plazasOcupadas} / {limitePlazas}
            </span>
          </p>
          {cupoPanelLleno && (
            <p className="mt-1 text-[11px] text-red-700">
              Límite alcanzado: no podés agregar más invitados hasta liberar plazas
              o aumentar el cupo.{" "}
              <button
                type="button"
                onClick={() => setShowLimitHelpModal(true)}
                className="underline underline-offset-2"
              >
                Ver más
              </button>
            </p>
          )}
        </div>
      )}

      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => !cupoPanelLleno && setShowAddModal(true)}
          disabled={cupoPanelLleno}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-5 w-5" />
          {labels?.addGuest || "Agregar Invitado"}
        </button>
      </div>

      <div className="px-5 pb-8">
        {invitadosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white py-12 text-center"><p className="text-neutral-500">{searchTerm ? "No se encontraron resultados" : "No hay invitados"}</p></div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {invitadosFiltrados.map((inv, idx) => <InvitadoRow key={inv.id} invitado={inv} isLast={idx === invitadosFiltrados.length - 1} giftCardEnabled={giftCardEnabled} primaryColor={primaryColor} labels={labels} expanded={expandedId === inv.id} onToggleExpand={() => setExpandedId(expandedId === inv.id ? null : inv.id)} onSendInvitation={handleSendInvitation} onDelete={handleDelete} onEdit={() => setEditingInvitado(inv)} onTogglePago={handleTogglePago} onOpenConfirmManual={() => setConfirmManualInvitado(inv)} />)}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddInvitadoModal
          panelId={panelId}
          primaryColor={primaryColor}
          soloPersona={data.panelConfig?.confirmacion === "comun"}
          onLimitReached={() => setShowLimitHelpModal(true)}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            mutate()
          }}
        />
      )}
      {showLimitHelpModal && (
        <LimitHelpModal
          onClose={() => setShowLimitHelpModal(false)}
        />
      )}
      {showUsageHelpModal && (
        <PanelUsageHelpModal
          onClose={() => setShowUsageHelpModal(false)}
          confirmacion={data.panelConfig?.confirmacion}
        />
      )}
      {editingInvitado && editingInvitado.tipo !== "integrante" && <EditInvitadoModal panelId={panelId} invitado={editingInvitado} primaryColor={primaryColor} onClose={() => setEditingInvitado(null)} onSuccess={() => { setEditingInvitado(null); mutate() }} />}
      {confirmManualInvitado && <ConfirmManualModal invitado={confirmManualInvitado} primaryColor={primaryColor} onClose={() => setConfirmManualInvitado(null)} onConfirm={handleConfirmManual} />}
    </div>
  )
}

function InvitadoRow({ invitado, isLast, giftCardEnabled, primaryColor, labels, expanded, onToggleExpand, onSendInvitation, onDelete, onEdit, onTogglePago, onOpenConfirmManual }: { invitado: Invitado; isLast: boolean; giftCardEnabled: boolean; primaryColor: string; labels?: PanelLabels; expanded: boolean; onToggleExpand: () => void; onSendInvitation: (inv: Invitado) => void; onDelete: (id: string) => void; onEdit: () => void; onTogglePago: (inv: Invitado) => void; onOpenConfirmManual: () => void }) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const estadoBg: Record<string, string> = { confirmado: "#d4edda", pendiente: "#f5f5f5", no_asiste: "#f5d5d5" }
  const estadoText: Record<string, string> = { confirmado: "#155724", pendiente: "#888", no_asiste: "#8b6b6b" }
  const bgColor = estadoBg[invitado.estado] || "#f5f5f5"
  const txtColor = estadoText[invitado.estado] || "#888"
  
  // Para familias: determinar si todos tienen el mismo estado
  let familiaEstadoUnico: string | null = null
  let estadosMixtos = false
  if (invitado.tipo === "familia" && invitado.integrantes?.length) {
    const estados = new Set(invitado.integrantes.map((i) => i.estado))
    if (estados.size === 1) {
      familiaEstadoUnico = invitado.integrantes[0].estado
    } else {
      estadosMixtos = true
    }
  }

  // Color del ícono
  let iconBg = bgColor, iconTxt = txtColor
  if (invitado.tipo === "familia" && invitado.integrantes?.length) {
    if (estadosMixtos) { iconBg = "#e5e5e5"; iconTxt = "#666" }
    else if (familiaEstadoUnico === "confirmado") { iconBg = estadoBg.confirmado; iconTxt = estadoText.confirmado }
    else if (familiaEstadoUnico === "no_asiste") { iconBg = estadoBg.no_asiste; iconTxt = estadoText.no_asiste }
    else { iconBg = estadoBg.pendiente; iconTxt = estadoText.pendiente }
  }

  // Badge de estado para mostrar
  const renderEstadoBadge = () => {
    // Para familias
    if (invitado.tipo === "familia" && invitado.integrantes?.length) {
      if (estadosMixtos) {
        // Estados mixtos: mostrar números
        const e = { confirmado: 0, pendiente: 0, no_asiste: 0 }
        invitado.integrantes!.forEach((i) => e[i.estado]++)
        return (
          <div className="flex gap-1">
            {e.confirmado > 0 && <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: estadoBg.confirmado, color: estadoText.confirmado }}>{e.confirmado}</span>}
            {e.pendiente > 0 && <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: estadoBg.pendiente, color: estadoText.pendiente }}>{e.pendiente}</span>}
            {e.no_asiste > 0 && <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: estadoBg.no_asiste, color: estadoText.no_asiste }}>{e.no_asiste}</span>}
          </div>
        )
      } else {
        // Todos tienen el mismo estado: mostrar texto en plural
        const color = familiaEstadoUnico === "confirmado" ? estadoBg.confirmado : familiaEstadoUnico === "no_asiste" ? estadoBg.no_asiste : estadoBg.pendiente
        const txt = familiaEstadoUnico === "confirmado" ? estadoText.confirmado : familiaEstadoUnico === "no_asiste" ? estadoText.no_asiste : estadoText.pendiente
        return <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: color, color: txt }}>{getEstadoTexto(familiaEstadoUnico!, true)}</span>
      }
    }
    
    // Para personas individuales o integrantes: singular
    return <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: bgColor, color: txtColor }}>{getEstadoTexto(invitado.estado, false)}</span>
  }

  const songsByMember = parsePerMemberValues(invitado.cancion)
  const extraByMember = parsePerMemberValues(
    invitado.mensaje && invitado.mensaje !== invitado.cancion ? invitado.mensaje : undefined,
  )
  const hasDietaryInfo = Boolean(
    invitado.restricciones ||
      invitado.integrantes?.some((i) => Boolean(i.restricciones)),
  )
  const hasSongInfo = Boolean(
    invitado.cancion?.trim() ||
      (invitado.integrantes?.length &&
        invitado.integrantes.some((i) => songsByMember[i.nombre]?.length)),
  )
  const hasExtraInfo = Boolean(
    (invitado.mensaje && invitado.mensaje !== invitado.cancion) ||
      (invitado.integrantes?.length &&
        invitado.integrantes.some((i) => extraByMember[i.nombre]?.length)),
  )

  useEffect(() => {
    if (!expanded) return
    const node = rowRef.current
    if (!node) return
    const raf = window.requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect()
      const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
      if (!fullyVisible) {
        node.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    })
    return () => window.cancelAnimationFrame(raf)
  }, [expanded])

  return (
    <div ref={rowRef} className={!isLast ? "border-b border-neutral-100" : ""}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>{invitado.tipo === "familia" ? <Users className="h-4 w-4" style={{ color: iconTxt }} /> : <User className="h-4 w-4" style={{ color: iconTxt }} />}</div>
        <div className="flex-1">
          <p className="font-medium text-neutral-800">{invitado.nombre}</p>
          {invitado.tipo === "familia" && invitado.integrantes && <p className="text-xs text-neutral-500">{invitado.integrantes.length} integrantes</p>}
          {invitado.tipo === "integrante" && invitado.familiaNombre && <p className="text-xs text-neutral-500">de {invitado.familiaNombre}</p>}
        </div>
        {(hasDietaryInfo || hasSongInfo || hasExtraInfo) && (
          <div className="flex items-center gap-1 text-neutral-500">
            {hasDietaryInfo && <Utensils className="h-3.5 w-3.5" />}
            {hasSongInfo && <Music className="h-3.5 w-3.5" />}
            {hasExtraInfo && <MessageSquare className="h-3.5 w-3.5" />}
          </div>
        )}
        {renderEstadoBadge()}
      </div>
      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {invitado.codigo && <button onClick={(e) => { e.stopPropagation(); onSendInvitation(invitado) }} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}><Send className="h-3 w-3" />{labels?.sendInvite || "Enviar invitación"}</button>}
            {invitado.estado === "pendiente" && invitado.tipo !== "integrante" && <button onClick={(e) => { e.stopPropagation(); onOpenConfirmManual() }} className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600"><Settings className="h-3 w-3" />{labels?.manualConfirm || "Confirmación manual"}</button>}
            {giftCardEnabled && invitado.tipo !== "integrante" && <button onClick={(e) => { e.stopPropagation(); onTogglePago(invitado) }} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium ${invitado.pago_tarjeta ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}><Check className="h-3 w-3" />{invitado.pago_tarjeta ? (labels?.paidButton || "Ya pagó") : (labels?.unpaidButton || "¿Pagó tarjeta?")}</button>}
            {invitado.tipo !== "integrante" && <><button onClick={(e) => { e.stopPropagation(); onEdit() }} className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600"><Edit2 className="h-3 w-3" />Editar</button><button onClick={(e) => { e.stopPropagation(); onDelete(invitado.id) }} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-600"><Trash2 className="h-3 w-3" />Eliminar</button></>}
          </div>
          {invitado.tipo !== "familia" && invitado.restricciones && <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600"><Utensils className="h-3 w-3" /><span>{invitado.restricciones}</span></div>}
          {invitado.tipo !== "familia" && invitado.cancion && <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600"><Music className="h-3 w-3" /><span>{invitado.cancion}</span></div>}
          {invitado.tipo !== "familia" && invitado.mensaje && invitado.mensaje !== invitado.cancion && <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600"><MessageSquare className="h-3 w-3" /><span>{invitado.mensaje}</span></div>}
          {invitado.tipo === "familia" && invitado.integrantes?.length && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-neutral-700">Integrantes:</p>
              <div className="space-y-1">
                {invitado.integrantes!.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded bg-white px-2 py-1">
                    <div className="min-w-0">
                      <span className="text-xs text-neutral-700">{i.nombre}</span>
                      {songsByMember[i.nombre]?.length ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-600">
                          <Music className="h-3 w-3" />
                          <span className="truncate">{songsByMember[i.nombre].join(" | ")}</span>
                        </div>
                      ) : null}
                      {extraByMember[i.nombre]?.length ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-600">
                          <MessageSquare className="h-3 w-3" />
                          <span className="truncate">{extraByMember[i.nombre].join(" | ")}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {i.restricciones && <span className="flex items-center gap-1 text-[10px] text-neutral-500"><Utensils className="h-3 w-3" />{i.restricciones}</span>}
                      <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: estadoBg[i.estado], color: estadoText[i.estado] }}>{getEstadoTexto(i.estado, false)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {invitado.restricciones && (
                <div className="mt-2 rounded bg-white px-2 py-2">
                  {invitado.restricciones && <div className="flex items-center gap-2 text-xs text-neutral-600"><Utensils className="h-3 w-3" /><span>{invitado.restricciones}</span></div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Modal de confirmación manual
function ConfirmManualModal({ invitado, primaryColor, onClose, onConfirm }: { invitado: Invitado; primaryColor: string; onClose: () => void; onConfirm: (inv: Invitado, estado: "confirmado" | "no_asiste") => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold text-center">Confirmación Manual</h2>
        <p className="mb-6 text-sm text-neutral-500 text-center">¿{invitado.nombre} asiste al evento?</p>
        <div className="flex gap-3">
          <button onClick={() => onConfirm(invitado, "no_asiste")} className="flex-1 rounded-lg bg-red-100 py-3 text-sm font-medium text-red-700">No asiste</button>
          <button onClick={() => onConfirm(invitado, "confirmado")} className="flex-1 rounded-lg py-3 text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function AddInvitadoModal({ panelId, primaryColor, soloPersona, onClose, onSuccess, onLimitReached }: { panelId: string; primaryColor: string; soloPersona?: boolean; onClose: () => void; onSuccess: () => void; onLimitReached?: () => void }) {
  const [tipo, setTipo] = useState<"persona" | "familia">("persona")
  const [nombre, setNombre] = useState("")
  const [integrantes, setIntegrantes] = useState<string[]>([])
  const [newIntegrante, setNewIntegrante] = useState("")
  const [saving, setSaving] = useState(false)
  const integranteInputRef = useRef<HTMLInputElement>(null)
  const handleAddIntegrante = () => { if (newIntegrante.trim()) { setIntegrantes([...integrantes, newIntegrante.trim()]); setNewIntegrante("") } }
  const handleRemoveIntegrante = (idx: number) => setIntegrantes(integrantes.filter((_, i) => i !== idx))
  const handleSave = async () => {
    if (!nombre.trim()) return
    const finalIntegrantes = [...integrantes]
    const effectiveTipo = soloPersona ? "persona" : tipo
    if (effectiveTipo === "familia" && integranteInputRef.current?.value.trim()) finalIntegrantes.push(integranteInputRef.current.value.trim())
    setSaving(true)
    try {
      const res = await fetch(`/api/panel/${panelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo: effectiveTipo,
          integrantes: effectiveTipo === "familia" ? finalIntegrantes : undefined,
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        if (typeof j.error === "string" && /l[ií]mite de plazas|l[ií]mite/i.test(j.error)) {
          onLimitReached?.()
        }
        alert(typeof j.error === "string" ? j.error : "Error al guardar")
        return
      }
      onSuccess()
    } catch {
      alert("Error al guardar")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Agregar Invitado</h2>
        {!soloPersona && (
        <div className="mb-4 flex gap-2"><button type="button" onClick={() => setTipo("persona")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tipo === "persona" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"}`}>Persona</button><button type="button" onClick={() => setTipo("familia")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tipo === "familia" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"}`}>Familia</button></div>
        )}
        <input type="text" placeholder={soloPersona || tipo === "persona" ? "Nombre completo" : "Nombre de la familia"} value={nombre} onChange={(e) => setNombre(e.target.value)} className="mb-4 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none" />
        {!soloPersona && tipo === "familia" && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Integrantes:</p>
            <div className="mb-2 flex flex-wrap gap-2">{integrantes.map((i, idx) => <span key={idx} className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm">{i}<button onClick={() => handleRemoveIntegrante(idx)} className="text-red-500"><X className="h-3 w-3" /></button></span>)}</div>
            <div className="flex gap-2"><input ref={integranteInputRef} type="text" placeholder="Nombre del integrante" value={newIntegrante} onChange={(e) => setNewIntegrante(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddIntegrante()} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none" /><button onClick={handleAddIntegrante} className="rounded-lg bg-neutral-100 px-3 py-2"><Plus className="h-4 w-4" /></button></div>
          </div>
        )}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-600">Cancelar</button><button onClick={handleSave} disabled={saving || !nombre.trim()} className="flex-1 rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: primaryColor }}>{saving ? "Guardando..." : "Guardar"}</button></div>
      </div>
    </div>
  )
}

function LimitHelpModal({ onClose }: { onClose: () => void }) {
  const waText = encodeURIComponent("Hola! Necesito solicitar cupo de más invitados para el panel de mi evento.")
  const waUrl = `https://wa.me/543456023759?text=${waText}`
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold text-center">Límite del panel alcanzado</h2>
        <p className="mb-6 text-sm text-neutral-600 text-center">
          Para habilitar más invitados, contactá a Momento Único y solicitá ampliación de cupo.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-700">
            Cerrar
          </button>
          <a href={waUrl} target="_blank" rel="noreferrer" className="flex-1 rounded-lg bg-emerald-600 py-3 text-center text-sm font-medium text-white">
            Pedir más cupo
          </a>
        </div>
      </div>
    </div>
  )
}

function PanelUsageHelpModal({
  onClose,
  confirmacion,
}: {
  onClose: () => void
  confirmacion?: "formulario" | "comun"
}) {
  const isComun = confirmacion === "comun"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold">Cómo usar el panel</h2>
        <p className="mb-4 text-sm text-neutral-600">
          Guía rápida para gestionar invitados sin complicarte.
        </p>
        <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm text-neutral-700">
          <div>
            <p className="font-semibold">1) Cargar invitados</p>
            <p>
              {isComun ? (
                <>
                  Tocá <strong>Agregar Invitado</strong>, completá el nombre y tocá <strong>Guardar</strong>.
                  En este modo se cargan invitados individuales.
                </>
              ) : (
                <>
                  Tocá <strong>Agregar Invitado</strong>. Elegí <strong>Persona</strong> o <strong>Familia</strong>, completá el nombre y tocá <strong>Guardar</strong>.
                  Usá <strong>Persona</strong> para enviar una invitación individual. Usá <strong>Familia</strong> cuando querés enviar una sola invitación a una pareja o grupo familiar.
                  En <strong>Familia</strong> cargás los integrantes con el botón <strong>+</strong>, y después cada uno puede confirmar por separado.
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-semibold">2) Enviar invitaciones por WhatsApp</p>
            <p>
              Abrí un invitado tocando su fila. Dentro del detalle, usá <strong>Enviar invitación</strong>.
              Se abre WhatsApp con el mensaje y link listos: elegí el contacto y enviá.
              {!isComun && (
                <>
                  {" "}
                  Si es <strong>Familia</strong>, ese link permite confirmar/editar a los integrantes del grupo.
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-semibold">3) Qué hace el invitado cuando recibe el link</p>
            <p>
              La persona entra a su invitación{" "}
              {isComun
                ? "y confirma desde el bloque de Confirmar asistencia."
                : "y completa el formulario RSVP (asiste/no asiste y datos opcionales)."}{" "}
              El estado se sincroniza en este panel.
            </p>
          </div>
          <div>
            <p className="font-semibold">4) Ver respuestas y organizarte</p>
            <p>
              Usá filtros: <strong>Todos</strong>, <strong>Confirmados</strong>, <strong>Pendientes</strong>, <strong>No asisten</strong> y <strong>Pago pendiente</strong>.
              Además, aparecen filtros por ícono para <strong>Alimentación</strong>, <strong>Música</strong> y <strong>Extras</strong> (solo si hay datos).
              {isComun && (
                <>
                  {" "}
                  Esos íconos/filtros aplican cuando el evento usa <strong>RSVP formulario</strong> con esos campos.
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-semibold">5) Corregir datos o estados</p>
            <p>
              En un pendiente podés usar <strong>Confirmación manual</strong>.
              Si necesitás ajustar algo fino, tocá <strong>Editar</strong>.
              {!isComun && <> En familias, cada integrante se puede modificar por separado.</>}
            </p>
          </div>
          <div>
            <p className="font-semibold">6) Marcar pagos (si lo usás)</p>
            <p>
              Dentro del invitado usá <strong>¿Pagó tarjeta?</strong> / <strong>Ya pagó</strong>.
              Después filtrá por <strong>Pago pendiente</strong> para ver quién falta.
            </p>
          </div>
          {!isComun && (
            <div>
              <p className="font-semibold">7) Entender íconos en cada fila</p>
              <p>
                Si ves íconos junto al estado, ese invitado dejó información:
                alimentación (<strong>cubiertos</strong>), canción (<strong>nota musical</strong>) o extra (<strong>mensaje</strong>, por ejemplo patente).
              </p>
            </div>
          )}
          {!isComun && (
            <div>
              <p className="font-semibold">8) RSVP sin invitado específico (solo formulario)</p>
              <p>
                Si en tu configuración está habilitado, una persona que entra sin código también puede registrar su confirmación
                en panel desde la invitación.
              </p>
            </div>
          )}
          <div>
            <p className="font-semibold">{isComun ? "7" : "9"}) Límite de cupo (caso específico)</p>
            <p>
              Si aparece “<strong>Límite alcanzado</strong>”, no se pueden crear más invitados.
              Tocá <strong>Ver más</strong> para abrir el modal y usar <strong>Pedir más cupo</strong> por WhatsApp.
            </p>
          </div>
          <div>
            <p className="font-semibold">{isComun ? "8" : "10"}) Si algo no coincide</p>
            <p>
              Verificá que estés en el panel correcto, usá el buscador y recargá si hace falta.
              El panel se actualiza automáticamente cada pocos segundos.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full shrink-0 rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

function EditInvitadoModal({ panelId, invitado, primaryColor, onClose, onSuccess }: { panelId: string; invitado: Invitado; primaryColor: string; onClose: () => void; onSuccess: () => void }) {
  const [nombre, setNombre] = useState(invitado.nombre)
  const [estado, setEstado] = useState<"pendiente" | "confirmado" | "no_asiste">(invitado.estado)
  const [integrantes, setIntegrantes] = useState<Array<{ id: string; nombre: string; estado: "pendiente" | "confirmado" | "no_asiste" }>>(invitado.integrantes?.map((i) => ({ id: i.id, nombre: i.nombre, estado: i.estado })) || [])
  const [editingIntegranteIdx, setEditingIntegranteIdx] = useState<number | null>(null)
  const [newIntegrante, setNewIntegrante] = useState("")
  const [saving, setSaving] = useState(false)
  const integranteInputRef = useRef<HTMLInputElement>(null)
  const handleAddIntegrante = () => { if (newIntegrante.trim()) { setIntegrantes([...integrantes, { id: `new-${Date.now()}`, nombre: newIntegrante.trim(), estado: "pendiente" }]); setNewIntegrante("") } }
  const handleRemoveIntegrante = (idx: number) => setIntegrantes(integrantes.filter((_, i) => i !== idx))
  const handleUpdateIntegrante = (idx: number, newNombre: string) => { const u = [...integrantes]; u[idx] = { ...u[idx], nombre: newNombre }; setIntegrantes(u) }
  const handleUpdateIntegranteEstado = (idx: number, newEstado: "pendiente" | "confirmado" | "no_asiste") => {
    if (integrantes[idx]?.estado === newEstado) return
    const ok = confirm("¿Confirmás cambiar el estado de asistencia de este integrante?")
    if (!ok) return
    const u = [...integrantes]
    u[idx] = { ...u[idx], estado: newEstado }
    setIntegrantes(u)
  }
  const handleUpdateEstadoPersona = (newEstado: "pendiente" | "confirmado" | "no_asiste") => {
    if (estado === newEstado) return
    const ok = confirm("¿Confirmás cambiar el estado de asistencia de este invitado?")
    if (!ok) return
    setEstado(newEstado)
  }
  const handleSave = async () => {
    if (!nombre.trim()) return
    const finalIntegrantes = [...integrantes]
    if (invitado.tipo === "familia" && integranteInputRef.current?.value.trim()) finalIntegrantes.push({ id: `new-${Date.now()}`, nombre: integranteInputRef.current.value.trim() })
    setSaving(true)
    try {
      const res = await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          estado: invitado.tipo === "persona" ? estado : undefined,
          integrantes: invitado.tipo === "familia" ? finalIntegrantes : undefined,
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        alert(typeof j.error === "string" ? j.error : "Error al guardar")
        return
      }
      onSuccess()
    } catch {
      alert("Error al guardar")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Editar Invitado</h2>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mb-4 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none" />
        {invitado.tipo === "persona" && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Estado de asistencia:</p>
            <div className="flex gap-2">
              {(["pendiente", "confirmado", "no_asiste"] as const).map((e) => (
                <button key={e} type="button" onClick={() => handleUpdateEstadoPersona(e)} title={e === "confirmado" ? "Asiste" : e === "no_asiste" ? "No asiste" : "Pendiente"} className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-[10px] font-medium ${estado === e ? "" : "bg-neutral-100 text-neutral-500"}`} style={estado === e ? { backgroundColor: e === "confirmado" ? "#d4edda" : e === "no_asiste" ? "#f5d5d5" : "#9ca3af", color: e === "confirmado" ? "#155724" : e === "no_asiste" ? "#8b6b6b" : "#111827" } : undefined}>
                  {e === "confirmado" ? <Check className="h-4 w-4" /> : e === "no_asiste" ? <X className="h-4 w-4" /> : <span>Pendiente</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {invitado.tipo === "familia" && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Integrantes:</p>
            <div className="mb-2 space-y-2">
              {integrantes.map((i, idx) => (
                <div key={i.id} className="rounded-lg border border-neutral-200 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={i.nombre}
                      onChange={(e) => handleUpdateIntegrante(idx, e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingIntegranteIdx(idx)}
                      title="Editar estado de asistencia"
                      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium leading-none"
                      style={{
                        backgroundColor:
                          i.estado === "confirmado"
                            ? "#d4edda"
                            : i.estado === "no_asiste"
                              ? "#f5d5d5"
                              : "#9ca3af",
                        color:
                          i.estado === "confirmado"
                            ? "#155724"
                            : i.estado === "no_asiste"
                              ? "#8b6b6b"
                              : "#111827",
                      }}
                    >
                      <span>
                        {i.estado === "confirmado"
                          ? "Asiste"
                          : i.estado === "no_asiste"
                            ? "No asiste"
                            : "Pendiente"}
                      </span>
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleRemoveIntegrante(idx)} className="rounded-lg bg-red-100 p-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2"><input ref={integranteInputRef} type="text" placeholder="Agregar integrante" value={newIntegrante} onChange={(e) => setNewIntegrante(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddIntegrante()} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none" /><button onClick={handleAddIntegrante} className="rounded-lg bg-neutral-100 px-3 py-2"><Plus className="h-4 w-4" /></button></div>
            {editingIntegranteIdx !== null && integrantes[editingIntegranteIdx] && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingIntegranteIdx(null)}>
                <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-2 text-base font-semibold text-center">Editar estado</h3>
                  <p className="mb-4 text-center text-sm text-neutral-600">{integrantes[editingIntegranteIdx].nombre}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(["pendiente", "confirmado", "no_asiste"] as const).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          handleUpdateIntegranteEstado(editingIntegranteIdx, e)
                          setEditingIntegranteIdx(null)
                        }}
                        className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-[10px] font-medium ${integrantes[editingIntegranteIdx].estado === e ? "" : "bg-neutral-100 text-neutral-500"}`}
                        style={
                          integrantes[editingIntegranteIdx].estado === e
                            ? {
                                backgroundColor:
                                  e === "confirmado"
                                    ? "#d4edda"
                                    : e === "no_asiste"
                                      ? "#f5d5d5"
                                      : "#9ca3af",
                                color:
                                  e === "confirmado"
                                    ? "#155724"
                                    : e === "no_asiste"
                                      ? "#8b6b6b"
                                      : "#111827",
                              }
                            : undefined
                        }
                      >
                        {e === "confirmado" ? "Asiste" : e === "no_asiste" ? "No asiste" : "Pendiente"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingIntegranteIdx(null)}
                    className="mt-4 w-full rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-600">Cancelar</button><button onClick={handleSave} disabled={saving || !nombre.trim()} className="flex-1 rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: primaryColor }}>{saving ? "Guardando..." : "Guardar"}</button></div>
      </div>
    </div>
  )
}
