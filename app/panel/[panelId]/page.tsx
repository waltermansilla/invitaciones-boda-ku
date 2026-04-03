"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import useSWR from "swr"
import { Copy, Trash2, Edit2, Plus, Users, User, Check, X, Utensils, Music, MessageSquare } from "lucide-react"

// Types
interface Integrante {
  id: string
  nombre: string
  estado: "pendiente" | "confirmado" | "no_asiste"
  restricciones?: string
}

interface Invitado {
  id: string
  nombre: string
  codigo: string
  tipo: "persona" | "familia"
  estado: "pendiente" | "confirmado" | "no_asiste"
  pago_tarjeta: boolean
  confirmado_manual: boolean
  restricciones?: string
  mensaje?: string
  cancion?: string
  fecha_confirmacion?: string
  integrantes?: Integrante[]
}

interface Evento {
  id: string
  panel_id: string
  fecha_evento?: string
}

interface PanelData {
  evento: Evento
  invitados: Invitado[]
  stats: {
    confirmados: number
    noAsisten: number
    pendientes: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PanelPage({ params }: { params: Promise<{ panelId: string }> }) {
  const [panelId, setPanelId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"todos" | "confirmados" | "pendientes" | "no_asiste">("todos")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const giftCardEnabled = true

  const primaryColor = "#b8a88a"

  useEffect(() => {
    params.then((p) => setPanelId(p.panelId))
  }, [params])

  const { data, error, mutate } = useSWR<PanelData>(
    panelId ? `/api/panel/${panelId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  const handleCopyLink = useCallback((invitado: Invitado) => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/boda/anto-walter?c=${invitado.codigo}`
    navigator.clipboard.writeText(link)
    setCopiedId(invitado.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleDelete = useCallback(async (invitadoId: string) => {
    if (!confirm("¿Eliminar este invitado?")) return
    await fetch(`/api/panel/${panelId}/invitado/${invitadoId}`, { method: "DELETE" })
    mutate()
  }, [panelId, mutate])

  const handleTogglePago = useCallback(async (invitado: Invitado) => {
    await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago_tarjeta: !invitado.pago_tarjeta }),
    })
    mutate()
  }, [panelId, mutate])

  const handleConfirmManual = useCallback(async (invitado: Invitado, estado: "confirmado" | "no_asiste") => {
    await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, confirmado_manual: true }),
    })
    mutate()
  }, [panelId, mutate])

  if (!panelId) return <LoadingScreen />
  if (error) return <ErrorScreen />
  if (!data) return <LoadingScreen />

  const { evento, invitados, stats } = data
  const total = stats.confirmados + stats.noAsisten + stats.pendientes

  let diasRestantes: number | null = null
  if (evento.fecha_evento) {
    const hoy = new Date()
    const fechaEvento = new Date(evento.fecha_evento)
    diasRestantes = Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  const invitadosFiltrados = invitados
    .filter((inv) => filter === "todos" || inv.estado === filter)
    .filter((inv) => inv.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header 
        className="px-5 py-8 text-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-lg font-semibold tracking-[0.2em] uppercase">
          Listado de Invitados
        </h1>
        {diasRestantes !== null && diasRestantes > 0 && (
          <p className="mt-2 text-sm font-light opacity-90">
            Faltan {diasRestantes} días para el evento
          </p>
        )}
      </header>

      {/* Stats Cards */}
      <div className="px-5 py-6">
        {/* Total grande arriba */}
        <div className="mb-3">
          <div className="rounded-lg bg-white px-4 py-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-neutral-700">{total}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">En total</p>
          </div>
        </div>
        {/* Los 3 estados abajo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg px-3 py-4 text-center" style={{ backgroundColor: "#d4edda" }}>
            <p className="text-2xl font-bold" style={{ color: "#155724" }}>{stats.confirmados}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "#155724", opacity: 0.8 }}>Confirmados</p>
          </div>
          <div className="rounded-lg bg-neutral-100 px-3 py-4 text-center">
            <p className="text-2xl font-bold text-neutral-600">{stats.pendientes}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">Pendientes</p>
          </div>
          <div className="rounded-lg px-3 py-4 text-center" style={{ backgroundColor: "#f5d5d5" }}>
            <p className="text-2xl font-bold" style={{ color: "#8b6b6b" }}>{stats.noAsisten}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "#8b6b6b", opacity: 0.8 }}>Inasistencias</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-5 pb-4">
        <input
          type="text"
          placeholder="Buscar invitado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
        />
        
        <div className="flex flex-wrap gap-2">
          {(["todos", "confirmados", "pendientes", "no_asiste"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-4 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === f ? primaryColor : "#fff",
                color: filter === f ? "#fff" : "#666",
                border: filter === f ? "none" : "1px solid #e5e5e5"
              }}
            >
              {f === "no_asiste" ? "No asisten" : f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Button */}
      <div className="px-5 pb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-5 w-5" />
          Agregar Invitado
        </button>
      </div>

      {/* Lista de invitados */}
      <div className="px-5 pb-8">
        {invitadosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white py-12 text-center">
            <p className="text-neutral-500">
              {searchTerm ? "No se encontraron resultados" : "No hay invitados"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {invitadosFiltrados.map((invitado, idx) => (
              <InvitadoRow
                key={invitado.id}
                invitado={invitado}
                isLast={idx === invitadosFiltrados.length - 1}
                copiedId={copiedId}
                giftCardEnabled={giftCardEnabled}
                primaryColor={primaryColor}
                expanded={expandedId === invitado.id}
                onToggleExpand={() => setExpandedId(expandedId === invitado.id ? null : invitado.id)}
                onCopyLink={handleCopyLink}
                onDelete={handleDelete}
                onEdit={() => setEditingInvitado(invitado)}
                onTogglePago={handleTogglePago}
                onConfirmManual={handleConfirmManual}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddInvitadoModal
          panelId={panelId}
          primaryColor={primaryColor}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            mutate()
          }}
        />
      )}

      {editingInvitado && (
        <EditInvitadoModal
          panelId={panelId}
          invitado={editingInvitado}
          primaryColor={primaryColor}
          onClose={() => setEditingInvitado(null)}
          onSuccess={() => {
            setEditingInvitado(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
      <p className="text-neutral-500">Cargando panel...</p>
    </div>
  )
}

function ErrorScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
      <p className="text-red-500">Error al cargar el panel</p>
    </div>
  )
}

function InvitadoRow({
  invitado,
  isLast,
  copiedId,
  giftCardEnabled,
  primaryColor,
  expanded,
  onToggleExpand,
  onCopyLink,
  onDelete,
  onEdit,
  onTogglePago,
  onConfirmManual,
}: {
  invitado: Invitado
  isLast: boolean
  copiedId: string | null
  giftCardEnabled: boolean
  primaryColor: string
  expanded: boolean
  onToggleExpand: () => void
  onCopyLink: (inv: Invitado) => void
  onDelete: (id: string) => void
  onEdit: () => void
  onTogglePago: (inv: Invitado) => void
  onConfirmManual: (inv: Invitado, estado: "confirmado" | "no_asiste") => void
}) {
  const estadoBg = {
    confirmado: "#d4edda",
    pendiente: "#f5f5f5",
    no_asiste: "#f5d5d5",
  }

  const estadoText = {
    confirmado: "#155724",
    pendiente: "#888",
    no_asiste: "#8b6b6b",
  }

  return (
    <div className={!isLast ? "border-b border-neutral-100" : ""}>
      <div 
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: estadoBg[invitado.estado] }}
        >
          {invitado.tipo === "familia" ? (
            <Users className="h-4 w-4" style={{ color: estadoText[invitado.estado] }} />
          ) : (
            <User className="h-4 w-4" style={{ color: estadoText[invitado.estado] }} />
          )}
        </div>

        <div className="flex-1">
          <p className="font-medium text-neutral-800">{invitado.nombre}</p>
          {invitado.tipo === "familia" && invitado.integrantes && (
            <p className="text-xs text-neutral-500">
              {invitado.integrantes.length} integrantes
            </p>
          )}
        </div>

        <span
          className="rounded px-2 py-1 text-[10px] font-medium uppercase"
          style={{ 
            backgroundColor: estadoBg[invitado.estado],
            color: estadoText[invitado.estado]
          }}
        >
          {invitado.estado === "confirmado" ? "Confirmado" : 
           invitado.estado === "no_asiste" ? "No asiste" : "Pendiente"}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onCopyLink(invitado); }}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Copy className="h-3 w-3" />
              {copiedId === invitado.id ? "Copiado!" : "Copiar link"}
            </button>

            {invitado.estado === "pendiente" && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirmManual(invitado, "confirmado"); }}
                  className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700"
                >
                  <Check className="h-3 w-3" />
                  Confirmar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirmManual(invitado, "no_asiste"); }}
                  className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700"
                >
                  <X className="h-3 w-3" />
                  No asiste
                </button>
              </>
            )}

            {giftCardEnabled && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePago(invitado); }}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium ${
                  invitado.pago_tarjeta 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                <Check className="h-3 w-3" />
                {invitado.pago_tarjeta ? "Pagó" : "Sin pagar"}
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600"
            >
              <Edit2 className="h-3 w-3" />
              Editar
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onDelete(invitado.id); }}
              className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-600"
            >
              <Trash2 className="h-3 w-3" />
              Eliminar
            </button>
          </div>

          {/* Detalles */}
          {(invitado.restricciones || invitado.mensaje || invitado.cancion) && (
            <div className="mt-3 space-y-2">
              {invitado.restricciones && (
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Utensils className="h-3 w-3" />
                  <span>{invitado.restricciones}</span>
                </div>
              )}
              {invitado.cancion && (
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Music className="h-3 w-3" />
                  <span>{invitado.cancion}</span>
                </div>
              )}
              {invitado.mensaje && (
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <MessageSquare className="h-3 w-3" />
                  <span>{invitado.mensaje}</span>
                </div>
              )}
            </div>
          )}

          {/* Integrantes */}
          {invitado.tipo === "familia" && invitado.integrantes && invitado.integrantes.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-neutral-600">Integrantes:</p>
              <div className="flex flex-wrap gap-1">
                {invitado.integrantes.map((int) => (
                  <span
                    key={int.id}
                    className="rounded px-2 py-1 text-[10px]"
                    style={{ 
                      backgroundColor: estadoBg[int.estado],
                      color: estadoText[int.estado]
                    }}
                  >
                    {int.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddInvitadoModal({
  panelId,
  primaryColor,
  onClose,
  onSuccess,
}: {
  panelId: string
  primaryColor: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [tipo, setTipo] = useState<"persona" | "familia">("persona")
  const [nombre, setNombre] = useState("")
  const [integrantes, setIntegrantes] = useState<string[]>([])
  const [nuevoIntegrante, setNuevoIntegrante] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    // Capturar el valor actual del input de integrante si hay algo escrito
    let integrantesFinales = [...integrantes]
    if (tipo === "familia" && nuevoIntegrante.trim()) {
      integrantesFinales.push(nuevoIntegrante.trim())
    }

    setLoading(true)
    try {
      await fetch(`/api/panel/${panelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo,
          integrantes: tipo === "familia" ? integrantesFinales : [],
        }),
      })
      onSuccess()
    } catch {
      alert("Error al crear invitado")
    } finally {
      setLoading(false)
    }
  }

  const addIntegrante = () => {
    if (nuevoIntegrante.trim()) {
      setIntegrantes([...integrantes, nuevoIntegrante.trim()])
      setNuevoIntegrante("")
      inputRef.current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 md:rounded-2xl">
        <h2 className="mb-6 text-center text-sm font-semibold tracking-[0.15em] uppercase text-neutral-800">
          Agregar Invitado
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTipo("persona")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-4 text-sm font-medium transition-colors"
              style={{
                backgroundColor: tipo === "persona" ? primaryColor : "#f5f5f5",
                color: tipo === "persona" ? "#fff" : "#666"
              }}
            >
              <User className="h-4 w-4" />
              Persona
            </button>
            <button
              type="button"
              onClick={() => setTipo("familia")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-4 text-sm font-medium transition-colors"
              style={{
                backgroundColor: tipo === "familia" ? primaryColor : "#f5f5f5",
                color: tipo === "familia" ? "#fff" : "#666"
              }}
            >
              <Users className="h-4 w-4" />
              Familia
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
              {tipo === "familia" ? "Nombre de la familia" : "Nombre completo"}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === "familia" ? "Ej: Familia García" : "Ej: Juan Pérez"}
              className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
              autoFocus
            />
          </div>

          {tipo === "familia" && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Integrantes
              </label>
              
              {integrantes.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {integrantes.map((int, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                      style={{ backgroundColor: primaryColor + "30", color: "#666" }}
                    >
                      {int}
                      <button
                        type="button"
                        onClick={() => setIntegrantes(integrantes.filter((_, i) => i !== idx))}
                        className="ml-1 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={nuevoIntegrante}
                  onChange={(e) => setNuevoIntegrante(e.target.value)}
                  placeholder="Nombre del integrante"
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIntegrante())}
                />
                <button
                  type="button"
                  onClick={addIntegrante}
                  className="rounded-lg px-4 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-200 py-4 text-sm font-medium text-neutral-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="flex-1 rounded-lg py-4 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditInvitadoModal({
  panelId,
  invitado,
  primaryColor,
  onClose,
  onSuccess,
}: {
  panelId: string
  invitado: Invitado
  primaryColor: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [nombre, setNombre] = useState(invitado.nombre)
  const [integrantes, setIntegrantes] = useState<{id: string; nombre: string}[]>(
    invitado.integrantes?.map((i) => ({ id: i.id, nombre: i.nombre })) || []
  )
  const [nuevoIntegrante, setNuevoIntegrante] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    // Capturar integrante en el input si hay algo
    let integrantesFinales = [...integrantes]
    if (invitado.tipo === "familia" && nuevoIntegrante.trim()) {
      integrantesFinales.push({ id: `new-${Date.now()}`, nombre: nuevoIntegrante.trim() })
    }

    setLoading(true)
    try {
      await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: nombre.trim(),
          integrantes: invitado.tipo === "familia" ? integrantesFinales : undefined
        }),
      })
      onSuccess()
    } catch {
      alert("Error al actualizar invitado")
    } finally {
      setLoading(false)
    }
  }

  const addIntegrante = () => {
    if (nuevoIntegrante.trim()) {
      setIntegrantes([...integrantes, { id: `new-${Date.now()}`, nombre: nuevoIntegrante.trim() }])
      setNuevoIntegrante("")
      inputRef.current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 md:rounded-2xl">
        <h2 className="mb-6 text-center text-sm font-semibold tracking-[0.15em] uppercase text-neutral-800">
          Editar Invitado
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
              {invitado.tipo === "familia" ? "Nombre de la familia" : "Nombre completo"}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
              autoFocus
            />
          </div>

          {invitado.tipo === "familia" && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Integrantes
              </label>
              
              {integrantes.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {integrantes.map((int, idx) => (
                    <span
                      key={int.id}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                      style={{ backgroundColor: primaryColor + "30", color: "#666" }}
                    >
                      <input
                        type="text"
                        value={int.nombre}
                        onChange={(e) => {
                          const newIntegrantes = [...integrantes]
                          newIntegrantes[idx].nombre = e.target.value
                          setIntegrantes(newIntegrantes)
                        }}
                        className="w-24 bg-transparent border-none text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIntegrantes(integrantes.filter((_, i) => i !== idx))}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={nuevoIntegrante}
                  onChange={(e) => setNuevoIntegrante(e.target.value)}
                  placeholder="Agregar integrante"
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIntegrante())}
                />
                <button
                  type="button"
                  onClick={addIntegrante}
                  className="rounded-lg px-4 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-200 py-4 text-sm font-medium text-neutral-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="flex-1 rounded-lg py-4 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
