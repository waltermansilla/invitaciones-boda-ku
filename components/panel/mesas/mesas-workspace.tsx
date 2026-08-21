"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import Link from "next/link"
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"
import {
  flattenSeatsFromInvitados,
  estadoSeatClass,
  estadoSeatDotClass,
} from "@/lib/mesas/seats"
import type {
  MesaAsientoRecord,
  MesaRecord,
  MesaSeatPerson,
  MesasPlanPayload,
} from "@/lib/mesas/types"

const MESA_CAPACIDAD = 15
const MAX_MESAS = 40

type ViewMode = "lista" | "croquis"

type InvitadoLite = {
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
}

type MesasWorkspaceProps = {
  panelId: string
  panelVariant: string
  primaryColor: string
  tituloEvento: string
  invitados: InvitadoLite[]
  initialPlan: MesasPlanPayload
}

function newMesaId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `mesa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nextNumero(mesas: MesaRecord[]): number {
  let max = 0
  for (const m of mesas) if (m.numero > max) max = m.numero
  return max + 1
}

function defaultPos(index: number): { posX: number; posY: number } {
  const cols = 4
  const col = index % cols
  const row = Math.floor(index / cols)
  return {
    posX: Math.min(88, 14 + col * 24),
    posY: Math.min(86, 14 + row * 24),
  }
}

function withCap(m: MesaRecord): MesaRecord {
  return { ...m, capacidad: MESA_CAPACIDAD }
}

export function MesasWorkspace({
  panelId,
  panelVariant,
  primaryColor,
  tituloEvento,
  invitados,
  initialPlan,
}: MesasWorkspaceProps) {
  const [view, setView] = useState<ViewMode>("lista")
  const [mesas, setMesas] = useState<MesaRecord[]>(() =>
    initialPlan.mesas.map(withCap),
  )
  const [asientos, setAsientos] = useState<MesaAsientoRecord[]>(
    initialPlan.asientos,
  )
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [openMesaId, setOpenMesaId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createCount, setCreateCount] = useState(1)
  const [draggingMesaId, setDraggingMesaId] = useState<string | null>(null)

  const mesasRef = useRef(mesas)
  const asientosRef = useRef(asientos)
  mesasRef.current = mesas
  asientosRef.current = asientos

  const persons = useMemo(
    () => flattenSeatsFromInvitados(invitados),
    [invitados],
  )
  const personByKey = useMemo(() => {
    const m = new Map<string, MesaSeatPerson>()
    for (const p of persons) m.set(p.seatKey, p)
    return m
  }, [persons])

  const mesaById = useMemo(() => {
    const m = new Map<string, MesaRecord>()
    for (const mesa of mesas) m.set(mesa.id, mesa)
    return m
  }, [mesas])

  const assignmentBySeat = useMemo(() => {
    const m = new Map<string, MesaAsientoRecord>()
    for (const a of asientos) m.set(a.seatKey, a)
    return m
  }, [asientos])

  const seatsOnMesa = useCallback(
    (mesaId: string) => {
      return asientos
        .filter((a) => a.mesaId === mesaId)
        .sort((a, b) => a.orden - b.orden)
        .map((a) => ({ ...a, person: personByKey.get(a.seatKey) }))
        .filter((x) => x.person)
    },
    [asientos, personByKey],
  )

  const persist = useCallback(
    async (
      nextMesas: MesaRecord[] = mesasRef.current,
      nextAsientos: MesaAsientoRecord[] = asientosRef.current,
    ) => {
      setSaving(true)
      setSaveErr(null)
      try {
        const res = await fetch(`/api/panel/${panelId}/mesas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mesas: nextMesas.map(withCap),
            asientos: nextAsientos,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "No se pudo guardar",
          )
        }
        if (Array.isArray(data.mesas) && Array.isArray(data.asientos)) {
          setMesas(data.mesas.map(withCap))
          setAsientos(data.asientos)
        }
      } catch (e) {
        setSaveErr(e instanceof Error ? e.message : "Error al guardar")
      } finally {
        setSaving(false)
      }
    },
    [panelId],
  )

  const createMesas = async () => {
    const n = Math.min(
      MAX_MESAS - mesas.length,
      Math.max(1, Math.floor(createCount)),
    )
    if (n <= 0) return
    const start = mesas.length
    const added: MesaRecord[] = []
    let num = nextNumero(mesas)
    for (let i = 0; i < n; i++) {
      const pos = defaultPos(start + i)
      added.push({
        id: newMesaId(),
        numero: num++,
        nombre: "",
        capacidad: MESA_CAPACIDAD,
        orden: start + i,
        posX: pos.posX,
        posY: pos.posY,
      })
    }
    const next = [...mesas, ...added]
    setMesas(next)
    setShowCreate(false)
    setCreateCount(1)
    await persist(next, asientos)
  }

  const updateMesaLocal = (id: string, patch: Partial<MesaRecord>) => {
    setMesas((prev) =>
      prev.map((m) =>
        m.id === id ? withCap({ ...m, ...patch, capacidad: MESA_CAPACIDAD }) : m,
      ),
    )
  }

  const deleteMesa = async (id: string) => {
    const nextMesas = mesas.filter((m) => m.id !== id)
    const nextAsientos = asientos.filter((a) => a.mesaId !== id)
    setMesas(nextMesas)
    setAsientos(nextAsientos)
    setOpenMesaId(null)
    await persist(nextMesas, nextAsientos)
  }

  const toggleSeatOnMesa = (seatKey: string, mesaId: string) => {
    const current = assignmentBySeat.get(seatKey)
    if (current?.mesaId === mesaId) {
      setAsientos((prev) => prev.filter((a) => a.seatKey !== seatKey))
      return
    }
    const others = asientos.filter(
      (a) => a.mesaId === mesaId && a.seatKey !== seatKey,
    )
    if (others.length >= MESA_CAPACIDAD) {
      setSaveErr(`Máximo ${MESA_CAPACIDAD} por mesa`)
      return
    }
    setAsientos((prev) => {
      const without = prev.filter((a) => a.seatKey !== seatKey)
      const orden = without.filter((a) => a.mesaId === mesaId).length
      return [...without, { mesaId, seatKey, orden }]
    })
  }

  const closeMesaModal = async () => {
    setOpenMesaId(null)
    await persist()
  }

  const moveMesaPos = (id: string, posX: number, posY: number) => {
    updateMesaLocal(id, { posX, posY })
  }

  const finishCroquisDrag = async () => {
    await persist()
  }

  useEffect(() => {
    if (!openMesaId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void closeMesaModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // closeMesaModal cierra y persiste el estado actual vía refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMesaId])

  const openMesa = openMesaId ? mesaById.get(openMesaId) : null
  const sortedMesas = useMemo(
    () => [...mesas].sort((a, b) => a.numero - b.numero),
    [mesas],
  )

  const assignedCount = useMemo(() => {
    let n = 0
    for (const a of asientos) if (personByKey.has(a.seatKey)) n++
    return n
  }, [asientos, personByKey])

  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-800">
      <header
        className="sticky top-0 z-30 border-b border-black/5 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <Link
            href={`/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Panel
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold tracking-[0.14em] uppercase">
              Mesas
            </h1>
            <p className="truncate text-xs font-light opacity-90">
              {tituloEvento}
            </p>
          </div>
          <div className="flex rounded-full border border-white/30 bg-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setView("lista")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                view === "lista" ? "bg-white text-neutral-800" : "text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView("croquis")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                view === "croquis" ? "bg-white text-neutral-800" : "text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
        {(saving || saveErr) && (
          <div className="border-t border-white/15 bg-black/10 px-4 py-1 text-center text-[11px]">
            {saveErr ? (
              <span className="text-red-100">{saveErr}</span>
            ) : (
              <span className="opacity-80">Guardando…</span>
            )}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-5">
        {mesas.length > 0 ? (
          <p className="mb-4 text-sm text-neutral-500">
            {mesas.length} mesas · {assignedCount}/{persons.length} con mesa
          </p>
        ) : null}

        {mesas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-neutral-900">
              Sin mesas todavía
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Tocá el + para crearlas
            </p>
          </div>
        ) : view === "lista" ? (
          <ul className="space-y-2">
            {sortedMesas.map((mesa) => {
              const seats = seatsOnMesa(mesa.id)
              return (
                <li key={mesa.id}>
                  <button
                    type="button"
                    onClick={() => setOpenMesaId(mesa.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left shadow-sm active:scale-[0.99]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {mesa.numero}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900">
                        Mesa {mesa.numero}
                        {mesa.nombre ? ` · ${mesa.nombre}` : ""}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {seats.length === 0
                          ? "Vacía"
                          : `${seats.length} persona${seats.length === 1 ? "" : "s"}`}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <CroquisView
            mesas={sortedMesas}
            seatsOnMesa={seatsOnMesa}
            onOpen={(id) => setOpenMesaId(id)}
            onMoveMesa={moveMesaPos}
            onDragEnd={() => void finishCroquisDrag()}
            draggingMesaId={draggingMesaId}
            setDraggingMesaId={setDraggingMesaId}
            primaryColor={primaryColor}
          />
        )}
      </div>

      {/* FAB + — oculto en croquis si está editando? keep always when not in modals */}
      {!openMesaId && !showCreate ? (
        <button
          type="button"
          onClick={() => {
            setCreateCount(1)
            setShowCreate(true)
          }}
          disabled={mesas.length >= MAX_MESAS || saving}
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
          aria-label="Crear mesas"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} />
        </button>
      ) : null}

      {showCreate ? (
        <CreateCountModal
          primaryColor={primaryColor}
          count={createCount}
          setCount={setCreateCount}
          maxAdd={MAX_MESAS - mesas.length}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onConfirm={() => void createMesas()}
        />
      ) : null}

      {openMesa && openMesaId ? (
        <AssignMesaModal
          mesa={openMesa}
          primaryColor={primaryColor}
          persons={persons}
          assignmentBySeat={assignmentBySeat}
          seats={seatsOnMesa(openMesaId)}
          onClose={() => void closeMesaModal()}
          onToggle={(seatKey) => toggleSeatOnMesa(seatKey, openMesaId)}
          onUpdateNombre={(nombre) => updateMesaLocal(openMesaId, { nombre })}
          onDelete={() => {
            if (
              typeof window !== "undefined" &&
              !window.confirm(`¿Eliminar Mesa ${openMesa.numero}?`)
            ) {
              return
            }
            void deleteMesa(openMesaId)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateCountModal({
  primaryColor,
  count,
  setCount,
  maxAdd,
  saving,
  onClose,
  onConfirm,
}: {
  primaryColor: string
  count: number
  setCount: (n: number) => void
  maxAdd: number
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            ¿Cuántas mesas?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-5 py-2">
          <button
            type="button"
            onClick={() => setCount(Math.max(1, count - 1))}
            disabled={count <= 1}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-30"
            aria-label="Menos"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="min-w-[3rem] text-center text-4xl font-semibold tabular-nums text-neutral-900">
            {count}
          </span>
          <button
            type="button"
            onClick={() => setCount(Math.min(maxAdd, count + 1))}
            disabled={count >= maxAdd}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-30"
            aria-label="Más"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={saving || maxAdd < 1}
          className="mt-6 w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {saving ? "Creando…" : "Crear"}
        </button>
      </div>
    </div>
  )
}

function AssignMesaModal({
  mesa,
  primaryColor,
  persons,
  assignmentBySeat,
  seats,
  onClose,
  onToggle,
  onUpdateNombre,
  onDelete,
}: {
  mesa: MesaRecord
  primaryColor: string
  persons: MesaSeatPerson[]
  assignmentBySeat: Map<string, MesaAsientoRecord>
  seats: { seatKey: string; person?: MesaSeatPerson }[]
  onClose: () => void
  onToggle: (seatKey: string) => void
  onUpdateNombre: (nombre: string) => void
  onDelete: () => void
}) {
  const [search, setSearch] = useState("")
  const q = search.trim().toLowerCase()

  const onMesaKeys = useMemo(
    () => new Set(seats.map((s) => s.seatKey)),
    [seats],
  )

  const list = useMemo(() => {
    return persons.filter((p) => {
      const asg = assignmentBySeat.get(p.seatKey)
      // En esta mesa o sin mesa (no mostrar los de otras)
      if (asg && asg.mesaId !== mesa.id) return false
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.grupo || "").toLowerCase().includes(q)
      )
    })
  }, [persons, assignmentBySeat, mesa.id, q])

  const full = seats.length >= MESA_CAPACIDAD

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[80vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-neutral-100 px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {mesa.numero}
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={mesa.nombre}
              onChange={(e) => onUpdateNombre(e.target.value)}
              placeholder={`Mesa ${mesa.numero}`}
              className="w-full border-0 bg-transparent text-base font-semibold text-neutral-900 outline-none placeholder:text-neutral-400"
            />
            <p className="text-xs text-neutral-500">{seats.length} personas</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-xl border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3">
          {list.length === 0 ? (
            <li className="py-10 text-center text-sm text-neutral-400">
              Nadie para mostrar
            </li>
          ) : (
            list.map((p) => {
              const on = onMesaKeys.has(p.seatKey)
              const disabled = !on && full
              return (
                <li key={p.seatKey}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(p.seatKey)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-35 ${estadoSeatClass(p.estado)}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        on
                          ? "border-transparent text-white"
                          : "border-neutral-300 bg-white"
                      }`}
                      style={on ? { backgroundColor: primaryColor } : undefined}
                    >
                      {on ? (
                        <span className="text-[11px] font-bold">✓</span>
                      ) : null}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${estadoSeatDotClass(p.estado)}`}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {p.nombre}
                      {p.grupo ? (
                        <span className="font-normal text-neutral-500">
                          {" "}
                          · {p.grupo}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="flex shrink-0 items-center gap-2 border-t border-neutral-100 px-4 py-3">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-2.5 text-neutral-400 hover:bg-[#f5d5d5] hover:text-[#8b6b6b]"
            aria-label="Eliminar mesa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

function CroquisView({
  mesas,
  seatsOnMesa,
  onOpen,
  onMoveMesa,
  onDragEnd,
  draggingMesaId,
  setDraggingMesaId,
  primaryColor,
}: {
  mesas: MesaRecord[]
  seatsOnMesa: (
    id: string,
  ) => { seatKey: string; person?: MesaSeatPerson }[]
  onOpen: (id: string) => void
  onMoveMesa: (id: string, posX: number, posY: number) => void
  onDragEnd: () => void
  draggingMesaId: string | null
  setDraggingMesaId: (id: string | null) => void
  primaryColor: string
}) {
  const CANVAS_W = 1100
  const CANVAS_H = 860
  const TABLE_R = 36
  const PEOPLE_R = 62
  const PERSON_SIZE = 22
  const LONG_MS = 1000

  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = useState({ w: 360, h: 480 })
  const [userZoom, setUserZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fitScale = Math.min(
    viewportSize.w / CANVAS_W,
    viewportSize.h / CANVAS_H,
    1,
  )
  const scale = fitScale * userZoom

  const zoomRef = useRef({ userZoom, pan, fitScale, scale })
  zoomRef.current = { userZoom, pan, fitScale, scale }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      setViewportSize({ w: r.width, h: Math.max(280, r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Reset pan when back to fit zoom
  useEffect(() => {
    if (userZoom <= 1.02) setPan({ x: 0, y: 0 })
  }, [userZoom])

  const pinchRef = useRef<{
    dist: number
    zoom: number
  } | null>(null)

  const panDragRef = useRef<{
    x: number
    y: number
    panX: number
    panY: number
  } | null>(null)

  const pressRef = useRef<{
    mesaId: string
    x: number
    y: number
    timer: ReturnType<typeof setTimeout> | null
    long: boolean
    pointerId: number
  } | null>(null)

  const mesaDragRef = useRef<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const clearPressTimer = () => {
    if (pressRef.current?.timer) clearTimeout(pressRef.current.timer)
    if (pressRef.current) pressRef.current.timer = null
  }

  const onViewportTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      clearPressTimer()
      pressRef.current = null
      mesaDragRef.current = null
      setDraggingMesaId(null)
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      pinchRef.current = { dist, zoom: zoomRef.current.userZoom }
      panDragRef.current = null
    }
  }

  const onViewportTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const next = Math.min(
        4,
        Math.max(1, (pinchRef.current.zoom * dist) / pinchRef.current.dist),
      )
      setUserZoom(next)
      return
    }
  }

  const onViewportTouchEnd = () => {
    if (pinchRef.current) pinchRef.current = null
  }

  const onViewportWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
    setUserZoom((z) => Math.min(4, Math.max(1, z * factor)))
  }

  const onMesaPointerDown = (e: ReactPointerEvent, mesa: MesaRecord) => {
    if (e.button !== 0) return
    e.stopPropagation()
    clearPressTimer()
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const startX = e.clientX
    const startY = e.clientY
    const timer = setTimeout(() => {
      if (!pressRef.current || pressRef.current.mesaId !== mesa.id) return
      pressRef.current.long = true
      setSelectedId(null)
      setDraggingMesaId(mesa.id)
      mesaDragRef.current = {
        id: mesa.id,
        startX,
        startY,
        origX: mesa.posX,
        origY: mesa.posY,
      }
    }, LONG_MS)
    pressRef.current = {
      mesaId: mesa.id,
      x: startX,
      y: startY,
      timer,
      long: false,
      pointerId: e.pointerId,
    }
  }

  const onMesaPointerMove = (e: ReactPointerEvent) => {
    const press = pressRef.current
    const drag = mesaDragRef.current

    if (drag && drag.id) {
      e.preventDefault()
      const { scale: s } = zoomRef.current
      const dxPx = (e.clientX - drag.startX) / s
      const dyPx = (e.clientY - drag.startY) / s
      const dx = (dxPx / CANVAS_W) * 100
      const dy = (dyPx / CANVAS_H) * 100
      onMoveMesa(
        drag.id,
        Math.min(92, Math.max(8, drag.origX + dx)),
        Math.min(90, Math.max(10, drag.origY + dy)),
      )
      return
    }

    if (press && !press.long) {
      const dist = Math.hypot(e.clientX - press.x, e.clientY - press.y)
      if (dist > 10) clearPressTimer()
    }
  }

  const onMesaPointerUp = (e: ReactPointerEvent, mesa: MesaRecord) => {
    const press = pressRef.current
    const wasLong = press?.long || Boolean(mesaDragRef.current)
    clearPressTimer()

    if (mesaDragRef.current) {
      mesaDragRef.current = null
      setDraggingMesaId(null)
      pressRef.current = null
      onDragEnd()
      return
    }

    pressRef.current = null
    if (wasLong) return

    // Tap corto
    if (selectedId === mesa.id) {
      // ya seleccionada: el lápiz maneja abrir; tap en mesa mantiene selección
      return
    }
    setSelectedId(mesa.id)
  }

  const onFloorPointerDown = (e: ReactPointerEvent) => {
    if (e.target !== e.currentTarget) return
    setSelectedId(null)
    if (userZoom <= 1.02) return
    panDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onFloorPointerMove = (e: ReactPointerEvent) => {
    onMesaPointerMove(e)
    const pd = panDragRef.current
    if (!pd) return
    setPan({
      x: pd.panX + (e.clientX - pd.x),
      y: pd.panY + (e.clientY - pd.y),
    })
  }

  const onFloorPointerUp = () => {
    panDragRef.current = null
  }

  const offsetX = (viewportSize.w - CANVAS_W * scale) / 2 + pan.x
  const offsetY = (viewportSize.h - CANVAS_H * scale) / 2 + pan.y

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#ebe6dc]">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-300/50 bg-[#e4dfd4] px-3 py-2">
        <p className="text-[11px] text-neutral-500">
          Tocá · mantene 1s para mover
          {userZoom > 1.02 ? " · pellizcá para zoom" : ""}
        </p>
        {userZoom > 1.02 ? (
          <button
            type="button"
            onClick={() => {
              setUserZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm"
          >
            Ver todo
          </button>
        ) : (
          <span className="text-[10px] text-neutral-400">Zoom: pellizco</span>
        )}
      </div>

      <div
        ref={viewportRef}
        className="relative h-[min(70vh,620px)] w-full touch-none overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={onViewportTouchStart}
        onTouchMove={onViewportTouchMove}
        onTouchEnd={onViewportTouchEnd}
        onWheel={onViewportWheel}
      >
        <div
          className="absolute origin-top-left"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.07) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          onPointerDown={onFloorPointerDown}
          onPointerMove={onFloorPointerMove}
          onPointerUp={onFloorPointerUp}
          onPointerCancel={onFloorPointerUp}
        >
          {mesas.map((mesa) => {
            const seats = seatsOnMesa(mesa.id)
            const n = seats.length
            const cx = (mesa.posX / 100) * CANVAS_W
            const cy = (mesa.posY / 100) * CANVAS_H
            const cluster = (PEOPLE_R + PERSON_SIZE / 2 + 8) * 2
            const selected = selectedId === mesa.id
            const dragging = draggingMesaId === mesa.id

            return (
              <div
                key={mesa.id}
                className={`absolute ${
                  dragging ? "z-30" : selected ? "z-20" : "z-[1]"
                }`}
                style={{
                  left: cx,
                  top: cy,
                  width: cluster,
                  height: cluster,
                  transform: "translate(-50%, -50%)",
                }}
                onPointerDown={(e) => onMesaPointerDown(e, mesa)}
                onPointerMove={onMesaPointerMove}
                onPointerUp={(e) => onMesaPointerUp(e, mesa)}
                onPointerCancel={(e) => onMesaPointerUp(e, mesa)}
              >
                {n > 0
                  ? seats.map((seat, i) => {
                      const angle = (i / n) * Math.PI * 2 - Math.PI / 2
                      const px = cluster / 2 + Math.cos(angle) * PEOPLE_R
                      const py = cluster / 2 + Math.sin(angle) * PEOPLE_R
                      const estado = seat.person!.estado
                      const fill =
                        estado === "confirmado"
                          ? "#155724"
                          : estado === "no_asiste"
                            ? "#8b6b6b"
                            : "#888888"
                      return (
                        <span
                          key={seat.seatKey}
                          title={seat.person!.nombre}
                          className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                          style={{ left: px, top: py }}
                        >
                          <span
                            className="flex flex-col items-center justify-start rounded-full shadow"
                            style={{
                              width: PERSON_SIZE,
                              height: PERSON_SIZE,
                              backgroundColor: fill,
                            }}
                          >
                            <span className="mt-[4px] h-[6px] w-[6px] rounded-full bg-white/90" />
                            <span className="mt-[2px] h-[7px] w-[11px] rounded-t-[3px] bg-white/75" />
                          </span>
                        </span>
                      )
                    })
                  : null}

                <div
                  className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[3px] bg-[#faf8f4] shadow-md"
                  style={{
                    width: TABLE_R * 2,
                    height: TABLE_R * 2,
                    borderColor: selected || dragging
                      ? primaryColor
                      : "rgba(0,0,0,0.16)",
                    boxShadow: dragging
                      ? `0 0 0 4px ${primaryColor}44`
                      : undefined,
                  }}
                >
                  {selected ? (
                    <button
                      type="button"
                      aria-label="Editar mesa"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow"
                      style={{ backgroundColor: primaryColor }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(null)
                        onOpen(mesa.id)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : (
                    <>
                      <span
                        className="text-base font-bold leading-none"
                        style={{ color: primaryColor }}
                      >
                        {mesa.numero}
                      </span>
                      <span className="mt-0.5 text-[10px] text-neutral-500">
                        {n}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
