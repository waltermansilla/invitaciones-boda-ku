"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { Check, X, Copy, Trash2, Edit2, Plus, Users, User, ChevronDown, ChevronUp } from "lucide-react"

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
  const [sortBy, setSortBy] = useState<"nombre" | "fecha" | "estado">("nombre")
  const [sortAsc, setSortAsc] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [giftCardEnabled, setGiftCardEnabled] = useState(true) // TODO: Leer del JSON

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
    // TODO: Obtener la ruta real de la invitación desde el JSON
    const link = `${baseUrl}/invitacion/${invitado.codigo}`
    navigator.clipboard.writeText(link)
    setCopiedId(invitado.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleDelete = useCallback(async (invitadoId: string) => {
    if (!confirm("¿Estás seguro de eliminar este invitado?")) return
    
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

  if (!panelId) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  if (error) return <div className="flex min-h-screen items-center justify-center text-red-500">Error cargando panel</div>
  if (!data) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>

  const { evento, invitados, stats } = data
  const total = stats.confirmados + stats.noAsisten + stats.pendientes

  // Calcular días restantes
  let diasRestantes: number | null = null
  if (evento.fecha_evento) {
    const hoy = new Date()
    const fechaEvento = new Date(evento.fecha_evento)
    diasRestantes = Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Filtrar invitados
  let invitadosFiltrados = invitados.filter((inv) => {
    if (filter === "todos") return true
    return inv.estado === filter
  })

  // Ordenar invitados
  invitadosFiltrados = [...invitadosFiltrados].sort((a, b) => {
    let comparison = 0
    if (sortBy === "nombre") {
      comparison = a.nombre.localeCompare(b.nombre)
    } else if (sortBy === "fecha") {
      const dateA = a.fecha_confirmacion ? new Date(a.fecha_confirmacion).getTime() : 0
      const dateB = b.fecha_confirmacion ? new Date(b.fecha_confirmacion).getTime() : 0
      comparison = dateA - dateB
    } else if (sortBy === "estado") {
      const order = { confirmado: 0, pendiente: 1, no_asiste: 2 }
      comparison = order[a.estado] - order[b.estado]
    }
    return sortAsc ? comparison : -comparison
  })

  const progressPercent = total > 0 ? ((stats.confirmados + stats.noAsisten) / total) * 100 : 0
  const confirmedPercent = total > 0 ? (stats.confirmados / total) * 100 : 0
  const noAsistePercent = total > 0 ? (stats.noAsisten / total) * 100 : 0

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-medium text-neutral-800 md:text-2xl">Panel de Confirmaciones</h1>
          
          {/* Días restantes */}
          {diasRestantes !== null && (
            <p className="mt-1 text-sm text-neutral-500">
              {diasRestantes > 0 ? `Faltan ${diasRestantes} días para el evento` : 
               diasRestantes === 0 ? "El evento es hoy" : 
               `El evento fue hace ${Math.abs(diasRestantes)} días`}
            </p>
          )}

          {/* Barra de progreso */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span>{stats.confirmados} confirmados</span>
              <span>{stats.noAsisten} no asisten</span>
              <span>{stats.pendientes} pendientes</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="flex h-full">
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${confirmedPercent}%` }} 
                />
                <div 
                  className="bg-red-400 transition-all duration-500" 
                  style={{ width: `${noAsistePercent}%` }} 
                />
              </div>
            </div>
            <p className="mt-2 text-center text-sm font-medium text-neutral-700">
              {stats.confirmados} confirmados, {stats.noAsisten} no asisten, {stats.pendientes} pendientes
            </p>
          </div>
        </div>
      </header>

      {/* Controles */}
      <div className="border-b border-neutral-200 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Filtrar:</span>
            {(["todos", "confirmados", "pendientes", "no_asiste"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  filter === f 
                    ? "bg-neutral-800 text-white" 
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {f === "no_asiste" ? "No asisten" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Ordenar */}
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="text-xs text-neutral-500">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
            >
              <option value="nombre">Nombre</option>
              <option value="fecha">Fecha confirmación</option>
              <option value="estado">Estado</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="rounded border border-neutral-200 p-1 hover:bg-neutral-50"
            >
              {sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Agregar */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded-full bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
          >
            <Plus className="h-3 w-3" />
            Agregar invitado
          </button>
        </div>
      </div>

      {/* Lista de invitados */}
      <main className="px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          {invitadosFiltrados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white py-12 text-center">
              <p className="text-neutral-500">No hay invitados {filter !== "todos" ? `${filter}` : ""}</p>
              {filter === "todos" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-sm font-medium text-neutral-800 underline"
                >
                  Agregar el primer invitado
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {invitadosFiltrados.map((invitado) => (
                <InvitadoCard
                  key={invitado.id}
                  invitado={invitado}
                  giftCardEnabled={giftCardEnabled}
                  copiedId={copiedId}
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
      </main>

      {/* Modal Agregar */}
      {showAddModal && (
        <AddInvitadoModal
          panelId={panelId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            mutate()
          }}
        />
      )}

      {/* Modal Editar */}
      {editingInvitado && (
        <EditInvitadoModal
          panelId={panelId}
          invitado={editingInvitado}
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

// Componente de tarjeta de invitado
function InvitadoCard({
  invitado,
  giftCardEnabled,
  copiedId,
  onCopyLink,
  onDelete,
  onEdit,
  onTogglePago,
  onConfirmManual,
}: {
  invitado: Invitado
  giftCardEnabled: boolean
  copiedId: string | null
  onCopyLink: (inv: Invitado) => void
  onDelete: (id: string) => void
  onEdit: () => void
  onTogglePago: (inv: Invitado) => void
  onConfirmManual: (inv: Invitado, estado: "confirmado" | "no_asiste") => void
}) {
  const estadoColors = {
    confirmado: "bg-emerald-100 text-emerald-700",
    pendiente: "bg-neutral-100 text-neutral-600",
    no_asiste: "bg-red-100 text-red-700",
  }

  const estadoLabels = {
    confirmado: "Confirmado",
    pendiente: "Pendiente",
    no_asiste: "No asiste",
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        {/* Icono tipo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          {invitado.tipo === "familia" ? (
            <Users className="h-5 w-5 text-neutral-600" />
          ) : (
            <User className="h-5 w-5 text-neutral-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-neutral-800">{invitado.nombre}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${estadoColors[invitado.estado]}`}>
              {estadoLabels[invitado.estado]}
              {invitado.confirmado_manual && " (manual)"}
            </span>
          </div>

          {/* Integrantes si es familia */}
          {invitado.tipo === "familia" && invitado.integrantes && invitado.integrantes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {invitado.integrantes.map((int) => (
                <span
                  key={int.id}
                  className={`rounded px-2 py-0.5 text-[10px] ${estadoColors[int.estado]}`}
                >
                  {int.nombre}
                </span>
              ))}
            </div>
          )}

          {/* Restricciones/mensaje */}
          {invitado.restricciones && (
            <p className="mt-1 text-xs text-neutral-500">Restricciones: {invitado.restricciones}</p>
          )}
          {invitado.mensaje && (
            <p className="mt-1 text-xs italic text-neutral-500">&quot;{invitado.mensaje}&quot;</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Pago tarjeta */}
          {giftCardEnabled && (
            <button
              onClick={() => onTogglePago(invitado)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                invitado.pago_tarjeta 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
              title="Marcar pago de tarjeta"
            >
              <Check className="h-3 w-3" />
              Pagó
            </button>
          )}

          {/* Copiar link */}
          <button
            onClick={() => onCopyLink(invitado)}
            className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <Copy className="h-3 w-3" />
            {copiedId === invitado.id ? "Copiado!" : "Copiar link"}
          </button>

          {/* Confirmar manual (solo si está pendiente) */}
          {invitado.estado === "pendiente" && (
            <>
              <button
                onClick={() => onConfirmManual(invitado, "confirmado")}
                className="rounded bg-emerald-100 p-1 text-emerald-700 transition-colors hover:bg-emerald-200"
                title="Confirmar manualmente"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => onConfirmManual(invitado, "no_asiste")}
                className="rounded bg-red-100 p-1 text-red-700 transition-colors hover:bg-red-200"
                title="Marcar como no asiste"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Editar */}
          <button
            onClick={onEdit}
            className="rounded bg-neutral-100 p-1 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          {/* Eliminar */}
          <button
            onClick={() => onDelete(invitado.id)}
            className="rounded bg-neutral-100 p-1 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para agregar invitado
function AddInvitadoModal({
  panelId,
  onClose,
  onSuccess,
}: {
  panelId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [tipo, setTipo] = useState<"persona" | "familia">("persona")
  const [nombre, setNombre] = useState("")
  const [integrantes, setIntegrantes] = useState<string[]>([])
  const [nuevoIntegrante, setNuevoIntegrante] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setLoading(true)
    try {
      await fetch(`/api/panel/${panelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo,
          integrantes: tipo === "familia" ? integrantes : [],
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
    }
  }

  const removeIntegrante = (index: number) => {
    setIntegrantes(integrantes.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-neutral-800">Agregar invitado</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo("persona")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm transition-colors ${
                tipo === "persona" 
                  ? "border-neutral-800 bg-neutral-800 text-white" 
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <User className="h-4 w-4" />
              Persona
            </button>
            <button
              type="button"
              onClick={() => setTipo("familia")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm transition-colors ${
                tipo === "familia" 
                  ? "border-neutral-800 bg-neutral-800 text-white" 
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Users className="h-4 w-4" />
              Familia
            </button>
          </div>

          {/* Nombre */}
          <div>
            <label className="mb-1 block text-sm text-neutral-600">
              {tipo === "familia" ? "Nombre de la familia" : "Nombre"}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === "familia" ? "Ej: Familia García" : "Ej: Juan Pérez"}
              className="w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Integrantes (solo familia) */}
          {tipo === "familia" && (
            <div>
              <label className="mb-1 block text-sm text-neutral-600">Integrantes</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoIntegrante}
                  onChange={(e) => setNuevoIntegrante(e.target.value)}
                  placeholder="Nombre del integrante"
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIntegrante())}
                />
                <button
                  type="button"
                  onClick={addIntegrante}
                  className="rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200"
                >
                  Agregar
                </button>
              </div>
              {integrantes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {integrantes.map((int, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600"
                    >
                      {int}
                      <button type="button" onClick={() => removeIntegrante(i)} className="hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="flex-1 rounded-lg bg-neutral-800 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para editar invitado
function EditInvitadoModal({
  panelId,
  invitado,
  onClose,
  onSuccess,
}: {
  panelId: string
  invitado: Invitado
  onClose: () => void
  onSuccess: () => void
}) {
  const [nombre, setNombre] = useState(invitado.nombre)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setLoading(true)
    try {
      await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      })
      onSuccess()
    } catch {
      alert("Error al actualizar invitado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-neutral-800">Editar invitado</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="flex-1 rounded-lg bg-neutral-800 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
