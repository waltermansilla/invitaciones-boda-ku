"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import useSWR from "swr"
import { Copy, Trash2, Edit2, Plus, Users, User, Check, X, Utensils, Music, MessageSquare, Settings } from "lucide-react"

interface Integrante { id: string; nombre: string; estado: "pendiente" | "confirmado" | "no_asiste"; restricciones?: string }
interface Invitado { id: string; nombre: string; codigo?: string; tipo: "persona" | "familia" | "integrante"; estado: "pendiente" | "confirmado" | "no_asiste"; pago_tarjeta?: boolean; confirmado_manual?: boolean; restricciones?: string; mensaje?: string; cancion?: string; fecha_confirmacion?: string; integrantes?: Integrante[]; familiaId?: string; familiaNombre?: string; pago?: boolean }
interface Evento { id: string; panel_id: string; fecha_evento?: string; nombre_evento?: string; tipo_evento?: string }
interface PanelData { evento: Evento; invitados: Invitado[]; stats: { confirmados: number; noAsisten: number; pendientes: number } }

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}
const filterToEstado: Record<string, string> = { confirmados: "confirmado", pendientes: "pendiente", no_asiste: "no_asiste" }

// Helper para obtener texto del estado
const getEstadoTexto = (estado: string, plural: boolean) => {
  if (estado === "confirmado") return plural ? "Confirmados" : "Confirmado"
  if (estado === "no_asiste") return plural ? "No asisten" : "No asiste"
  return plural ? "Pendientes" : "Pendiente"
}

export default function PanelPage({ params }: { params: Promise<{ panelId: string }> }) {
  const [panelId, setPanelId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"todos" | "confirmados" | "pendientes" | "no_asiste" | "pago_pendiente">("todos")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null)
  const [confirmManualInvitado, setConfirmManualInvitado] = useState<Invitado | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const giftCardEnabled = true

  useEffect(() => { params.then((p) => setPanelId(p.panelId)) }, [params])

  const { data, error, mutate } = useSWR<PanelData>(panelId ? `/api/panel/${panelId}` : null, fetcher, { refreshInterval: 30000 })
  
  // Color del tema desde el JSON del cliente
  const primaryColor = (data?.evento as { primary_color?: string })?.primary_color || "#b8a88a"

  const handleCopyLink = useCallback((invitado: Invitado) => {
    // Inferir slug y tipo del panelId (ej: "anto-walter-boda" -> "anto-walter", tipo "boda")
    const slug = panelId?.replace(/-boda$/, "").replace(/-xv$/, "") || ""
    const tipo = panelId?.includes("-xv") ? "xv" : "boda"
    const link = `${window.location.origin}/${tipo}/${slug}?c=${invitado.codigo || ""}`
    navigator.clipboard.writeText(link)
    setCopiedId(invitado.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [panelId])

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

  if (error) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf9f7] p-4"><p className="text-red-500 font-medium">Error al cargar el panel</p><p className="text-xs text-neutral-500 text-center max-w-sm">{error?.message || String(error)}</p><button onClick={() => mutate()} className="mt-2 rounded-lg px-4 py-2 text-sm text-white" style={{backgroundColor: primaryColor}}>Reintentar</button></div>
  if (!panelId || !data) return <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]"><p className="text-neutral-500">Cargando...</p></div>

  const { evento, invitados, stats } = data
  const total = stats.confirmados + stats.noAsisten + stats.pendientes
  let diasRestantes: number | null = null
  if (evento.fecha_evento) { diasRestantes = Math.ceil((new Date(evento.fecha_evento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) }

  // Nombre del evento (sin "La boda de" ni "Los XV de")
  const tipoEvento = evento.tipo_evento || "boda"
  const nombreEvento = evento.nombre_evento || "Anto & Walter"
  const tituloEvento = tipoEvento === "xv" ? `XV ${nombreEvento}` : `Boda ${nombreEvento}`

  const estadoFilter = filterToEstado[filter] || filter
  let itemsToDisplay: Invitado[] = []

  if (filter === "todos") {
    // Ordenar: pendientes primero, luego no asisten, luego confirmados
    const ordenEstado: Record<string, number> = { pendiente: 0, no_asiste: 1, confirmado: 2 }
    itemsToDisplay = invitados.map((inv) => ({ ...inv })).sort((a, b) => (ordenEstado[a.estado] ?? 1) - (ordenEstado[b.estado] ?? 1))
  } else if (filter === "pago_pendiente") {
    // Mostrar solo los que no pagaron tarjeta
    itemsToDisplay = invitados.filter((inv) => !inv.pago_tarjeta).map((inv) => ({ ...inv }))
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
      <header className="px-5 py-8 text-center text-white" style={{ backgroundColor: primaryColor }}>
        <h1 className="text-lg font-semibold tracking-[0.2em] uppercase">Panel de Invitados</h1>
        <p className="mt-1 text-sm font-light opacity-90">{tituloEvento}</p>
        {diasRestantes !== null && diasRestantes > 0 && <p className="mt-1 text-xs font-light opacity-80">Faltan {diasRestantes} días</p>}
      </header>

      <div className="px-5 py-6">
        <div className="mb-3"><div className="rounded-lg bg-white px-4 py-6 text-center shadow-sm"><p className="text-4xl font-bold text-neutral-700">{total}</p><p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">Total invitados</p></div></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg px-3 py-4 text-center" style={{ backgroundColor: "#d4edda" }}><p className="text-2xl font-bold" style={{ color: "#155724" }}>{stats.confirmados}</p><p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "#155724", opacity: 0.8 }}>Confirmados</p></div>
          <div className="rounded-lg bg-neutral-100 px-3 py-4 text-center"><p className="text-2xl font-bold text-neutral-600">{stats.pendientes}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">Pendientes</p></div>
          <div className="rounded-lg px-3 py-4 text-center" style={{ backgroundColor: "#f5d5d5" }}><p className="text-2xl font-bold" style={{ color: "#8b6b6b" }}>{stats.noAsisten}</p><p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "#8b6b6b", opacity: 0.8 }}>No asisten</p></div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <input type="text" placeholder="Buscar invitado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none" />
        <div className="flex flex-wrap gap-2">
          {(["todos", "confirmados", "pendientes", "no_asiste", "pago_pendiente"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="rounded-full px-4 py-2 text-xs font-medium transition-colors" style={{ backgroundColor: filter === f ? primaryColor : "#fff", color: filter === f ? "#fff" : "#666", border: filter === f ? "none" : "1px solid #e5e5e5" }}>
              {f === "no_asiste" ? "No asisten" : f === "todos" ? "Todos" : f === "pago_pendiente" ? "Pago pendiente" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-4"><button onClick={() => setShowAddModal(true)} className="flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}><Plus className="h-5 w-5" />Agregar Invitado</button></div>

      <div className="px-5 pb-8">
        {invitadosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white py-12 text-center"><p className="text-neutral-500">{searchTerm ? "No se encontraron resultados" : "No hay invitados"}</p></div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {invitadosFiltrados.map((inv, idx) => <InvitadoRow key={inv.id} invitado={inv} isLast={idx === invitadosFiltrados.length - 1} copiedId={copiedId} giftCardEnabled={giftCardEnabled} primaryColor={primaryColor} expanded={expandedId === inv.id} onToggleExpand={() => setExpandedId(expandedId === inv.id ? null : inv.id)} onCopyLink={handleCopyLink} onDelete={handleDelete} onEdit={() => setEditingInvitado(inv)} onTogglePago={handleTogglePago} onOpenConfirmManual={() => setConfirmManualInvitado(inv)} />)}
          </div>
        )}
      </div>

      {showAddModal && <AddInvitadoModal panelId={panelId} primaryColor={primaryColor} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); mutate() }} />}
      {editingInvitado && editingInvitado.tipo !== "integrante" && <EditInvitadoModal panelId={panelId} invitado={editingInvitado} primaryColor={primaryColor} onClose={() => setEditingInvitado(null)} onSuccess={() => { setEditingInvitado(null); mutate() }} />}
      {confirmManualInvitado && <ConfirmManualModal invitado={confirmManualInvitado} primaryColor={primaryColor} onClose={() => setConfirmManualInvitado(null)} onConfirm={handleConfirmManual} />}
    </div>
  )
}

function InvitadoRow({ invitado, isLast, copiedId, giftCardEnabled, primaryColor, expanded, onToggleExpand, onCopyLink, onDelete, onEdit, onTogglePago, onOpenConfirmManual }: { invitado: Invitado; isLast: boolean; copiedId: string | null; giftCardEnabled: boolean; primaryColor: string; expanded: boolean; onToggleExpand: () => void; onCopyLink: (inv: Invitado) => void; onDelete: (id: string) => void; onEdit: () => void; onTogglePago: (inv: Invitado) => void; onOpenConfirmManual: () => void }) {
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

  return (
    <div className={!isLast ? "border-b border-neutral-100" : ""}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>{invitado.tipo === "familia" ? <Users className="h-4 w-4" style={{ color: iconTxt }} /> : <User className="h-4 w-4" style={{ color: iconTxt }} />}</div>
        <div className="flex-1">
          <p className="font-medium text-neutral-800">{invitado.nombre}</p>
          {invitado.tipo === "familia" && invitado.integrantes && <p className="text-xs text-neutral-500">{invitado.integrantes.length} integrantes</p>}
          {invitado.tipo === "integrante" && invitado.familiaNombre && <p className="text-xs text-neutral-500">de {invitado.familiaNombre}</p>}
        </div>
        {renderEstadoBadge()}
      </div>
      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {invitado.codigo && <button onClick={(e) => { e.stopPropagation(); onCopyLink(invitado) }} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}><Copy className="h-3 w-3" />{copiedId === invitado.id ? "Copiado!" : "Copiar link"}</button>}
            {invitado.estado === "pendiente" && invitado.tipo !== "integrante" && <button onClick={(e) => { e.stopPropagation(); onOpenConfirmManual() }} className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600"><Settings className="h-3 w-3" />Confirmación manual</button>}
            {giftCardEnabled && invitado.tipo !== "integrante" && <button onClick={(e) => { e.stopPropagation(); onTogglePago(invitado) }} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium ${invitado.pago_tarjeta ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}><Check className="h-3 w-3" />{invitado.pago_tarjeta ? "Ya pagó" : "¿Pagó tarjeta?"}</button>}
            {invitado.tipo !== "integrante" && <><button onClick={(e) => { e.stopPropagation(); onEdit() }} className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600"><Edit2 className="h-3 w-3" />Editar</button><button onClick={(e) => { e.stopPropagation(); onDelete(invitado.id) }} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-600"><Trash2 className="h-3 w-3" />Eliminar</button></>}
          </div>
          {invitado.restricciones && <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600"><Utensils className="h-3 w-3" /><span>{invitado.restricciones}</span></div>}
          {invitado.cancion && <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600"><Music className="h-3 w-3" /><span>{invitado.cancion}</span></div>}
          {invitado.mensaje && invitado.mensaje !== invitado.cancion && <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600"><MessageSquare className="h-3 w-3" /><span>{invitado.mensaje}</span></div>}
          {invitado.tipo === "familia" && invitado.integrantes?.length && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-neutral-700">Integrantes:</p>
              <div className="space-y-1">
                {invitado.integrantes!.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded bg-white px-2 py-1">
                    <span className="text-xs text-neutral-700">{i.nombre}</span>
                    <div className="flex items-center gap-2">
                      {i.restricciones && <span className="flex items-center gap-1 text-[10px] text-neutral-500"><Utensils className="h-3 w-3" />{i.restricciones}</span>}
                      {estadosMixtos ? (
                        <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: estadoBg[i.estado], color: estadoText[i.estado] }}>{getEstadoTexto(i.estado, false)}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
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

function AddInvitadoModal({ panelId, primaryColor, onClose, onSuccess }: { panelId: string; primaryColor: string; onClose: () => void; onSuccess: () => void }) {
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
    if (tipo === "familia" && integranteInputRef.current?.value.trim()) finalIntegrantes.push(integranteInputRef.current.value.trim())
    setSaving(true)
    try { await fetch(`/api/panel/${panelId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nombre.trim(), tipo, integrantes: tipo === "familia" ? finalIntegrantes : undefined }) }); onSuccess() } catch { alert("Error al guardar") } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Agregar Invitado</h2>
        <div className="mb-4 flex gap-2"><button onClick={() => setTipo("persona")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tipo === "persona" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"}`}>Persona</button><button onClick={() => setTipo("familia")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tipo === "familia" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"}`}>Familia</button></div>
        <input type="text" placeholder={tipo === "persona" ? "Nombre completo" : "Nombre de la familia"} value={nombre} onChange={(e) => setNombre(e.target.value)} className="mb-4 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none" />
        {tipo === "familia" && (
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

function EditInvitadoModal({ panelId, invitado, primaryColor, onClose, onSuccess }: { panelId: string; invitado: Invitado; primaryColor: string; onClose: () => void; onSuccess: () => void }) {
  const [nombre, setNombre] = useState(invitado.nombre)
  const [integrantes, setIntegrantes] = useState<Array<{ id: string; nombre: string }>>(invitado.integrantes?.map((i) => ({ id: i.id, nombre: i.nombre })) || [])
  const [newIntegrante, setNewIntegrante] = useState("")
  const [saving, setSaving] = useState(false)
  const integranteInputRef = useRef<HTMLInputElement>(null)
  const handleAddIntegrante = () => { if (newIntegrante.trim()) { setIntegrantes([...integrantes, { id: `new-${Date.now()}`, nombre: newIntegrante.trim() }]); setNewIntegrante("") } }
  const handleRemoveIntegrante = (idx: number) => setIntegrantes(integrantes.filter((_, i) => i !== idx))
  const handleUpdateIntegrante = (idx: number, newNombre: string) => { const u = [...integrantes]; u[idx] = { ...u[idx], nombre: newNombre }; setIntegrantes(u) }
  const handleSave = async () => {
    if (!nombre.trim()) return
    const finalIntegrantes = [...integrantes]
    if (invitado.tipo === "familia" && integranteInputRef.current?.value.trim()) finalIntegrantes.push({ id: `new-${Date.now()}`, nombre: integranteInputRef.current.value.trim() })
    setSaving(true)
    try { await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nombre.trim(), integrantes: invitado.tipo === "familia" ? finalIntegrantes : undefined }) }); onSuccess() } catch { alert("Error al guardar") } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Editar Invitado</h2>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mb-4 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none" />
        {invitado.tipo === "familia" && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Integrantes:</p>
            <div className="mb-2 space-y-2">{integrantes.map((i, idx) => <div key={i.id} className="flex items-center gap-2"><input type="text" value={i.nombre} onChange={(e) => handleUpdateIntegrante(idx, e.target.value)} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none" /><button onClick={() => handleRemoveIntegrante(idx)} className="rounded-lg bg-red-100 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>
            <div className="flex gap-2"><input ref={integranteInputRef} type="text" placeholder="Agregar integrante" value={newIntegrante} onChange={(e) => setNewIntegrante(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddIntegrante()} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none" /><button onClick={handleAddIntegrante} className="rounded-lg bg-neutral-100 px-3 py-2"><Plus className="h-4 w-4" /></button></div>
          </div>
        )}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-600">Cancelar</button><button onClick={handleSave} disabled={saving || !nombre.trim()} className="flex-1 rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: primaryColor }}>{saving ? "Guardando..." : "Guardar"}</button></div>
      </div>
    </div>
  )
}
