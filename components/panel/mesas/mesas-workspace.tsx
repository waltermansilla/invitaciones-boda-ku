"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  Minus,
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
  MesaForma,
  MesaRecord,
  MesaSeatPerson,
  MesaTipo,
  MesasPlanPayload,
} from "@/lib/mesas/types"
import { normalizeMesaForma, normalizeMesaTipo } from "@/lib/mesas/types"
import {
  SILLA_MIN,
  SILLA_MAX,
  SCALE_MAX,
  SCALE_MIN,
  clampNum,
  hasSillas,
  mesaSillas,
  scaleMaxFor,
  tamanoMinParaSillas,
  untangleMesas,
} from "@/lib/mesas/layout"
import { CroquisFloor } from "@/components/panel/mesas/croquis-floor"

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
  const col = index % 3
  const row = Math.floor(index / 3)
  return {
    posX: Math.min(86, 16 + col * 28),
    posY: Math.min(82, 18 + row * 30),
  }
}

function normalizeMesa(m: MesaRecord): MesaRecord {
  const tipo = normalizeMesaTipo(m.tipo)
  const forma = normalizeMesaForma(m.forma)
  const cap = hasSillas(tipo)
    ? clampNum(m.capacidad || SILLA_MIN, SILLA_MIN, scaleMaxFor(tipo, forma))
    : clampNum(m.capacidad || 6, 4, SCALE_MAX)
  return { ...m, tipo, forma, capacidad: cap }
}

function useDesktop(): boolean {
  const [d, setD] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const apply = () => setD(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
  return d
}

function mesasPlanSnapshot(
  mesas: MesaRecord[],
  asientos: MesaAsientoRecord[],
) {
  const mesasN = mesas.map(normalizeMesa)
  const asientosN = asientos.filter((a) => {
    const mesa = mesasN.find((m) => m.id === a.mesaId)
    if (!mesa) return false
    return a.orden >= 0 && a.orden < mesaSillas(mesa)
  })
  return JSON.stringify({ mesas: mesasN, asientos: asientosN })
}

export function MesasWorkspace({
  panelId,
  panelVariant,
  primaryColor,
  tituloEvento,
  invitados,
  initialPlan,
}: MesasWorkspaceProps) {
  const desktop = useDesktop()
  const [view, setView] = useState<ViewMode>("croquis")
  const [mesas, setMesas] = useState<MesaRecord[]>(() =>
    untangleMesas(initialPlan.mesas.map(normalizeMesa)),
  )
  const [asientos, setAsientos] = useState<MesaAsientoRecord[]>(
    initialPlan.asientos,
  )
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [openMesaId, setOpenMesaId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createCount, setCreateCount] = useState(1)
  const [createForma, setCreateForma] = useState<MesaForma>("redonda")
  const [draggingMesaId, setDraggingMesaId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [mobileUnassigned, setMobileUnassigned] = useState(false)
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [dragSeat, setDragSeat] = useState(false)

  const mesasRef = useRef(mesas)
  const asientosRef = useRef(asientos)
  mesasRef.current = mesas
  asientosRef.current = asientos
  const lastSavedRef = useRef<string | null>(null)
  const savingRef = useRef(false)

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
    for (const a of asientos) {
      const mesa = mesaById.get(a.mesaId)
      if (!mesa) continue
              if (a.orden < 0 || a.orden >= mesaSillas(mesa)) continue
      m.set(a.seatKey, a)
    }
    return m
  }, [asientos, mesaById])

  const chairMap = useMemo(() => {
    const m = new Map<string, MesaSeatPerson>()
    for (const a of asientos) {
      const p = personByKey.get(a.seatKey)
      if (p) m.set(`${a.mesaId}:${a.orden}`, p)
    }
    return m
  }, [asientos, personByKey])

  const personOnChair = useCallback(
    (mesaId: string, chair: number) => chairMap.get(`${mesaId}:${chair}`),
    [chairMap],
  )

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

  const unassigned = useMemo(() => {
    const q = search.trim().toLowerCase()
    return persons.filter((p) => {
      if (assignmentBySeat.has(p.seatKey)) return false
      if (p.estado === "no_asiste") return false
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.grupo || "").toLowerCase().includes(q)
      )
    })
  }, [persons, assignmentBySeat, search])

  const persist = useCallback(
    async (
      nextMesas: MesaRecord[] = mesasRef.current,
      nextAsientos: MesaAsientoRecord[] = asientosRef.current,
      opts?: { keepalive?: boolean },
    ) => {
      const body = mesasPlanSnapshot(nextMesas, nextAsientos)
      if (lastSavedRef.current === null) {
        lastSavedRef.current = body
        return
      }
      if (body === lastSavedRef.current) return
      const keepalive = Boolean(opts?.keepalive)
      if (!keepalive && savingRef.current) return
      if (!keepalive) {
        savingRef.current = true
        setSaving(true)
        setSaveErr(null)
      }
      try {
        const res = await fetch(`/api/panel/${panelId}/mesas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive,
        })
        if (keepalive) {
          lastSavedRef.current = body
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "No se pudo guardar",
          )
        }
        lastSavedRef.current = body
      } catch (e) {
        if (!keepalive) {
          setSaveErr(e instanceof Error ? e.message : "Error al guardar")
        }
      } finally {
        if (!keepalive) {
          savingRef.current = false
          setSaving(false)
        }
      }
    },
    [panelId],
  )

  const persistRef = useRef(persist)
  persistRef.current = persist

  useEffect(() => {
    lastSavedRef.current = mesasPlanSnapshot(
      mesasRef.current,
      asientosRef.current,
    )
    const id = window.setInterval(() => {
      void persistRef.current()
    }, 60_000)
    const onLeave = () => {
      void persistRef.current(undefined, undefined, { keepalive: true })
    }
    window.addEventListener("pagehide", onLeave)
    window.addEventListener("beforeunload", onLeave)
    const onVis = () => {
      if (document.visibilityState === "hidden") onLeave()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("pagehide", onLeave)
      window.removeEventListener("beforeunload", onLeave)
      document.removeEventListener("visibilitychange", onVis)
      onLeave()
    }
  }, [])

  const addPieces = async (pieces: Omit<MesaRecord, "id" | "numero" | "orden">[]) => {
    const start = mesas.length
    let num = nextNumero(mesas)
    const added: MesaRecord[] = pieces.map((p, i) => {
      const pos = p.posX ? p : { ...p, ...defaultPos(start + i) }
      return {
        ...normalizeMesa({
          id: newMesaId(),
          numero: num++,
          orden: start + i,
          posX: pos.posX,
          posY: pos.posY,
          nombre: p.nombre,
          capacidad: p.capacidad,
          forma: p.forma,
          tipo: p.tipo,
          sillasFijas: p.sillasFijas,
        }),
      }
    })
    const next = untangleMesas([...mesas, ...added])
    setMesas(next)
    setShowCreate(false)
    setCreateCount(1)
  }

  const createMesas = () => {
    const n = Math.min(MAX_MESAS - mesas.length, Math.max(1, createCount))
    const start = mesas.length
    void addPieces(
      Array.from({ length: n }, (_, i) => {
        const pos = defaultPos(start + i)
        return {
          nombre: "",
          capacidad: SILLA_MIN,
          forma: createForma,
          tipo: "mesa" as MesaTipo,
          sillasFijas: createForma === "cuadrada" ? 8 : undefined,
          posX: pos.posX,
          posY: pos.posY,
        }
      }),
    )
  }

  const updateMesaLocal = (id: string, patch: Partial<MesaRecord>) => {
    setMesas((prev) =>
      prev.map((m) => (m.id === id ? normalizeMesa({ ...m, ...patch }) : m)),
    )
  }

  const occupiedOnMesa = (id: string) =>
    asientosRef.current.filter(
      (a) => a.mesaId === id && personByKey.has(a.seatKey),
    ).length

  const resizeMesa = (id: string, tamano: number) => {
    setMesas((prev) => {
      const mesa = prev.find((m) => m.id === id)
      if (!mesa) return prev
      const forma = normalizeMesaForma(mesa.forma)
      const minTam =
        hasSillas(mesa.tipo) && forma !== "cuadrada"
          ? tamanoMinParaSillas(Math.max(SILLA_MIN, occupiedOnMesa(id)))
          : SCALE_MIN
      const nextTamano = clampNum(
        tamano,
        minTam,
        scaleMaxFor(mesa.tipo, forma),
      )
      if (
        Math.abs(mesa.capacidad - nextTamano) < 0.002 &&
        forma !== "cuadrada"
      ) {
        return prev
      }
      return prev.map((m) =>
        m.id === id
          ? {
              ...m,
              capacidad: nextTamano,
              chairPts: forma === "cuadrada" ? [] : m.chairPts,
            }
          : m,
      )
    })
  }

  const deleteMesa = async (id: string) => {
    const nextMesas = mesas.filter((m) => m.id !== id)
    const nextAsientos = asientos.filter((a) => a.mesaId !== id)
    setMesas(nextMesas)
    setAsientos(nextAsientos)
    setOpenMesaId(null)
    setSelectedId(null)
  }

  const assignToChair = (seatKey: string, mesaId: string, chair: number) => {
    const mesa = mesaById.get(mesaId)
    if (!mesa || !hasSillas(mesa.tipo)) return
    const n = mesaSillas(mesa)
    if (chair < 0 || chair >= n) return
    const occupant = asientos.find(
      (a) => a.mesaId === mesaId && a.orden === chair,
    )
    setAsientos((prev) => {
      let next = prev.filter((a) => a.seatKey !== seatKey)
      if (occupant) next = next.filter((a) => a.seatKey !== occupant.seatKey)
      return [...next, { mesaId, seatKey, orden: chair }]
    })
  }

  const toggleSeatOnMesa = (seatKey: string, mesaId: string) => {
    const current = assignmentBySeat.get(seatKey)
    if (current?.mesaId === mesaId) {
      setAsientos((prev) => prev.filter((a) => a.seatKey !== seatKey))
      return
    }
    const mesa = mesaById.get(mesaId)
    if (!mesa) return
    const n = mesaSillas(mesa)
    const taken = new Set(
      asientos.filter((a) => a.mesaId === mesaId).map((a) => a.orden),
    )
    let chair = 0
    while (chair < n && taken.has(chair)) chair++
    if (chair >= n) {
      setSaveErr("Esa mesa no tiene sillas libres")
      return
    }
    assignToChair(seatKey, mesaId, chair)
  }

  const closeMesaModal = () => {
    setOpenMesaId(null)
  }

  useEffect(() => {
    if (!openMesaId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void closeMesaModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openMesaId])

  const openMesa = openMesaId ? mesaById.get(openMesaId) : null
  const selected = selectedId ? mesaById.get(selectedId) : null
  const sortedMesas = useMemo(
    () => [...mesas].sort((a, b) => a.numero - b.numero),
    [mesas],
  )

  const assignedCount = useMemo(() => {
    let n = 0
    for (const a of asientos) if (personByKey.has(a.seatKey)) n++
    return n
  }, [asientos, personByKey])

  const showCroquis = desktop || view === "croquis"

  const unassignedList = (
    <UnassignedList
      people={unassigned}
      search={search}
      setSearch={setSearch}
      totalFree={unassigned.length}
      desktop={desktop}
      selectedMesa={selected}
      onDragSeat={setDragSeat}
    />
  )

  return (
    <div
      className={
        desktop
          ? "relative flex h-screen flex-col overflow-hidden bg-[#faf9f7] text-neutral-800"
          : "relative flex min-h-screen flex-col bg-[#faf9f7] text-neutral-800"
      }
    >
      <header
        className="sticky top-0 z-30 shrink-0 border-b border-black/5 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
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
              {mesas.length > 0
                ? ` · ${assignedCount}/${persons.filter((p) => p.estado !== "no_asiste").length} con silla`
                : ""}
            </p>
          </div>
          {desktop ? (
            <button
              type="button"
              onClick={() => setShowUnassigned((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-medium"
            >
              {showUnassigned ? (
                <ChevronsRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronsLeft className="h-3.5 w-3.5" />
              )}
              {showUnassigned ? "Ocultar lista" : `Sin mesa (${unassigned.length})`}
            </button>
          ) : (
            <div className="flex rounded-full border border-white/30 bg-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setView("croquis")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  view === "croquis" ? "bg-white text-neutral-800" : "text-white"
                }`}
                aria-label="Croquis"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("lista")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  view === "lista" ? "bg-white text-neutral-800" : "text-white"
                }`}
                aria-label="Lista"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>
      {saveErr ? (
        <div className="pointer-events-none absolute left-1/2 top-16 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-2 text-center text-[12px] text-white shadow-lg">
          {saveErr}
        </div>
      ) : null}

      <div
        className={
          desktop
            ? "flex min-h-0 flex-1 overflow-hidden"
            : "flex min-h-0 flex-1 flex-col px-4 pb-28 pt-4"
        }
      >
        {mesas.length === 0 ? (
          <div className="flex flex-1 items-center justify-center bg-white px-6 py-16 text-center">
            <div>
              <p className="text-base font-semibold text-neutral-900">
                Armá el salón
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Tocá + para mesas, pista o mesa dulce
              </p>
            </div>
          </div>
        ) : showCroquis ? (
          <div className="relative min-h-0 min-w-0 flex-1">
            <CroquisFloor
              mesas={sortedMesas}
              personOnChair={personOnChair}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpen={(id) => setOpenMesaId(id)}
              onMove={(id, x, y) => updateMesaLocal(id, { posX: x, posY: y })}
              onResize={resizeMesa}
              onPatch={(id, patch) => {
                if (patch.sillasFijas != null) {
                  const mesa = mesasRef.current.find((m) => m.id === id)
                  const occ = occupiedOnMesa(id)
                  const minCh =
                    mesa && normalizeMesaForma(mesa.forma) === "cuadrada"
                      ? occ
                      : Math.max(SILLA_MIN, occ)
                  patch = {
                    ...patch,
                    sillasFijas: Math.max(minCh, patch.sillasFijas),
                    chairPts: [],
                  }
                }
                updateMesaLocal(id, patch)
              }}
              dragSeat={dragSeat}
              setDragSeat={setDragSeat}
              onAssignChair={assignToChair}
              onRemoveChair={(seatKey) => {
                setAsientos((prev) => prev.filter((a) => a.seatKey !== seatKey))
              }}
              onRemoveChairSlot={(mesaId, chair) => {
                setAsientos((prev) =>
                  prev
                    .filter(
                      (a) => !(a.mesaId === mesaId && a.orden === chair),
                    )
                    .map((a) =>
                      a.mesaId === mesaId && a.orden > chair
                        ? { ...a, orden: a.orden - 1 }
                        : a,
                    ),
                )
                const mesa = mesasRef.current.find((m) => m.id === mesaId)
                const n = mesa ? Math.max(0, mesaSillas(mesa) - 1) : 0
                updateMesaLocal(mesaId, { sillasFijas: n, chairPts: [] })
              }}
              unassigned={unassigned}
              onDragEnd={() => {}}
              draggingMesaId={draggingMesaId}
              setDraggingMesaId={setDraggingMesaId}
              primaryColor={primaryColor}
              desktop={desktop}
            />
            {desktop && selected && !showUnassigned ? (
              <div className="pointer-events-auto absolute left-3 top-12 z-20 w-64">
                <SelectedCard
                  mesa={selected}
                  assigned={seatsOnMesa(selected.id).length}
                  primaryColor={primaryColor}
                  onNombre={(nombre) => updateMesaLocal(selected.id, { nombre })}
                  onForma={(forma) =>
                    updateMesaLocal(selected.id, {
                      forma,
                      sillasFijas: forma === "cuadrada" ? 8 : undefined,
                      chairPts: [],
                    })
                  }
                  onPonerSillas={() =>
                    updateMesaLocal(selected.id, {
                      tipo: "mesa",
                      capacidad: Math.max(SILLA_MIN, selected.capacidad || SILLA_MIN),
                    })
                  }
                  onDelete={() => {
                    if (window.confirm("¿Eliminar esta pieza?")) {
                      void deleteMesa(selected.id)
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedMesas.map((mesa) => {
              const seats = seatsOnMesa(mesa.id)
              return (
                <li key={mesa.id}>
                  <button
                    type="button"
                    onClick={() => setOpenMesaId(mesa.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left shadow-sm"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center text-base font-bold text-white ${
                        mesa.forma === "redonda" ? "rounded-full" : "rounded-md"
                      }`}
                      style={{
                        backgroundColor:
                          mesa.tipo === "mesa" ? primaryColor : "#9a958c",
                      }}
                    >
                      {mesa.numero}
                    </span>
                    <span className="min-w-0 flex-1">
                      {mesa.nombre.trim() ? (
                        <span className="block truncate text-sm font-semibold">
                          {mesa.nombre.trim()}
                        </span>
                      ) : null}
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                        <Users className="h-3.5 w-3.5" />
                        {mesa.tipo === "mesa"
                          ? seats.length === 0
                            ? "Vacía"
                            : `${seats.length} persona${seats.length === 1 ? "" : "s"}`
                          : mesa.tipo === "pista"
                            ? "Pista"
                            : "Espacio"}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {desktop && mesas.length > 0 && showUnassigned ? (
          <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-hidden border-l border-neutral-200 bg-[#faf9f7] p-3">
            {selected ? (
              <SelectedCard
                mesa={selected}
                assigned={seatsOnMesa(selected.id).length}
                primaryColor={primaryColor}
                onNombre={(nombre) => updateMesaLocal(selected.id, { nombre })}
                onForma={(forma) =>
                  updateMesaLocal(selected.id, {
                    forma,
                    sillasFijas: forma === "cuadrada" ? 8 : undefined,
                    chairPts: [],
                  })
                }
                onPonerSillas={() =>
                  updateMesaLocal(selected.id, {
                    tipo: "mesa",
                    capacidad: Math.max(SILLA_MIN, selected.capacidad || SILLA_MIN),
                  })
                }
                onDelete={() => {
                  if (window.confirm("¿Eliminar esta pieza?")) {
                    void deleteMesa(selected.id)
                  }
                }}
              />
            ) : null}
            {unassignedList}
          </aside>
        ) : null}
      </div>

      {!desktop && showCroquis && mesas.length > 0 ? (
        <button
          type="button"
          onClick={() => setMobileUnassigned(true)}
          className="fixed bottom-6 left-5 z-40 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-lg"
        >
          Sin mesa ({unassigned.length})
        </button>
      ) : null}

      {!openMesaId && !showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          disabled={mesas.length >= MAX_MESAS || saving}
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
          aria-label="Agregar"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} />
        </button>
      ) : null}

      {showCreate ? (
        <CreateModal
          primaryColor={primaryColor}
          count={createCount}
          setCount={setCreateCount}
          forma={createForma}
          setForma={setCreateForma}
          maxAdd={MAX_MESAS - mesas.length}
          saving={saving}
          onClose={() => setShowCreate(false)}
          onCreateMesas={createMesas}
          onCreateEspacio={(tipo, nombre, forma) => {
            const pos = defaultPos(mesas.length)
            void addPieces([
              {
                nombre,
                capacidad: tipo === "pista" ? 8 : 6,
                forma,
                tipo,
                posX: pos.posX,
                posY: pos.posY,
              },
            ])
          }}
        />
      ) : null}

      {mobileUnassigned ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden"
          onClick={() => setMobileUnassigned(false)}
        >
          <div
            className="max-h-[75vh] w-full overflow-hidden rounded-t-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Sin mesa</p>
              <button type="button" onClick={() => setMobileUnassigned(false)}>
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>
            {unassignedList}
          </div>
        </div>
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
          onUpdateForma={(forma) => updateMesaLocal(openMesaId, { forma })}
          onPonerSillas={() =>
            updateMesaLocal(openMesaId, {
              tipo: "mesa",
              capacidad: Math.max(SILLA_MIN, openMesa.capacidad || SILLA_MIN),
            })
          }
          onDelete={() => {
            if (!window.confirm("¿Eliminar?")) return
            void deleteMesa(openMesaId)
          }}
        />
      ) : null}
    </div>
  )
}

function UnassignedList({
  people,
  search,
  setSearch,
  totalFree,
  desktop,
  selectedMesa,
  onDragSeat,
}: {
  people: MesaSeatPerson[]
  search: string
  setSearch: (s: string) => void
  totalFree: number
  desktop: boolean
  selectedMesa: MesaRecord | null
  onDragSeat?: (v: boolean) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-neutral-900">
        Sin mesa ({totalFree})
      </p>
      {desktop ? (
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Arrastrá a una silla vacía
          {selectedMesa?.tipo === "mesa"
            ? ` o a la mesa ${selectedMesa.numero}`
            : ""}
        </p>
      ) : null}
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="w-full rounded-xl border border-neutral-200 py-1.5 pl-8 pr-2 text-sm outline-none"
        />
      </div>
      <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {people.length === 0 ? (
          <li className="py-6 text-center text-xs text-neutral-400">
            Nadie pendiente
          </li>
        ) : (
          people.map((p) => (
            <li key={p.seatKey}>
              <div
                draggable={desktop}
                onDragStart={
                  desktop
                    ? (e) => {
                        e.dataTransfer.setData("text/seat-key", p.seatKey)
                        e.dataTransfer.effectAllowed = "move"
                        onDragSeat?.(true)
                      }
                    : undefined
                }
                onDragEnd={() => onDragSeat?.(false)}
                className={`flex cursor-grab items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs active:cursor-grabbing ${estadoSeatClass(p.estado)}`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${estadoSeatDotClass(p.estado)}`}
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {p.nombre}
                  {p.grupo ? (
                    <span className="font-normal opacity-70"> · {p.grupo}</span>
                  ) : null}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function SelectedCard({
  mesa,
  assigned,
  primaryColor,
  onNombre,
  onForma,
  onPonerSillas,
  onDelete,
}: {
  mesa: MesaRecord
  assigned: number
  primaryColor: string
  onNombre: (n: string) => void
  onForma: (f: MesaForma) => void
  onPonerSillas: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {mesa.tipo === "pista"
            ? "Pista"
            : mesa.tipo === "objeto"
              ? "Espacio"
              : `Mesa ${mesa.numero}`}
        </p>
        <button type="button" onClick={onDelete} className="text-neutral-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input
        value={mesa.nombre}
        onChange={(e) => onNombre(e.target.value)}
        placeholder={
          mesa.tipo === "pista" ? "Pista de baile" : "Nombre (opcional)"
        }
        className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm outline-none"
      />
      {mesa.tipo === "mesa" ? (
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => onForma("redonda")}
            className={`flex-1 rounded-full py-1 text-[11px] font-semibold ${
              mesa.forma === "redonda" ? "text-white" : "bg-neutral-100"
            }`}
            style={
              mesa.forma === "redonda"
                ? { backgroundColor: primaryColor }
                : undefined
            }
          >
            Redonda
          </button>
          <button
            type="button"
            onClick={() => onForma("cuadrada")}
            className={`flex-1 rounded-full py-1 text-[11px] font-semibold ${
              mesa.forma === "cuadrada" ? "text-white" : "bg-neutral-100"
            }`}
            style={
              mesa.forma === "cuadrada"
                ? { backgroundColor: primaryColor }
                : undefined
            }
          >
            Cuadrada
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPonerSillas}
          className="mt-2 w-full rounded-full py-1.5 text-[11px] font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Poner sillas
        </button>
      )}
      {mesa.tipo === "mesa" ? (
        <p className="mt-2 text-[11px] text-neutral-500">
          {assigned}/{mesa.capacidad} sillas
        </p>
      ) : null}
    </div>
  )
}

function CreateModal({
  primaryColor,
  count,
  setCount,
  forma,
  setForma,
  maxAdd,
  saving,
  onClose,
  onCreateMesas,
  onCreateEspacio,
}: {
  primaryColor: string
  count: number
  setCount: (n: number) => void
  forma: MesaForma
  setForma: (f: MesaForma) => void
  maxAdd: number
  saving: boolean
  onClose: () => void
  onCreateMesas: () => void
  onCreateEspacio: (tipo: MesaTipo, nombre: string, forma: MesaForma) => void
}) {
  const [tab, setTab] = useState<"mesas" | "espacio">("mesas")
  const [espacioNombre, setEspacioNombre] = useState("")

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agregar</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>
        <div className="mb-4 flex rounded-full bg-neutral-100 p-0.5">
          <button
            type="button"
            onClick={() => setTab("mesas")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold ${
              tab === "mesas" ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            Mesas
          </button>
          <button
            type="button"
            onClick={() => setTab("espacio")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold ${
              tab === "espacio" ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            Salón
          </button>
        </div>

        {tab === "mesas" ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["redonda", "cuadrada"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForma(id)}
                  className={`rounded-xl border py-3 text-xs font-semibold ${
                    forma === id ? "text-white" : "border-neutral-200"
                  }`}
                  style={
                    forma === id ? { backgroundColor: primaryColor } : undefined
                  }
                >
                  {id === "redonda" ? "Redonda" : "Cuadrada"}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => setCount(Math.max(1, count - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-3xl font-semibold tabular-nums">{count}</span>
              <button
                type="button"
                onClick={() => setCount(Math.min(maxAdd, count + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={onCreateMesas}
              disabled={saving || maxAdd < 1}
              className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              Crear
            </button>
          </>
        ) : (
          <>
            <input
              value={espacioNombre}
              onChange={(e) => setEspacioNombre(e.target.value)}
              placeholder="ej: novios/mesa dulce"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() =>
                onCreateEspacio(
                  "objeto",
                  espacioNombre.trim() || "Espacio",
                  "cuadrada",
                )
              }
              className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Crear
            </button>
          </>
        )}
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
  onUpdateForma,
  onPonerSillas,
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
  onUpdateForma: (forma: MesaForma) => void
  onPonerSillas: () => void
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
      if (asg && asg.mesaId !== mesa.id) return false
      if (p.estado === "no_asiste" && !onMesaKeys.has(p.seatKey)) return false
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.grupo || "").toLowerCase().includes(q)
      )
    })
  }, [persons, assignmentBySeat, mesa.id, q, onMesaKeys])

  const n = mesaSillas(mesa)
  const full = seats.length >= n && n > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[80vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
          <div
            className={`flex h-10 w-10 items-center justify-center text-sm font-bold text-white ${
              mesa.forma === "redonda" ? "rounded-full" : "rounded-md"
            }`}
            style={{
              backgroundColor: mesa.tipo === "mesa" ? primaryColor : "#9a958c",
            }}
          >
            {mesa.numero}
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={mesa.nombre}
              onChange={(e) => onUpdateNombre(e.target.value)}
              placeholder="Nombre (opcional)"
              className="w-full bg-transparent text-base font-semibold outline-none"
            />
            <p className="text-xs text-neutral-500">
              {mesa.tipo === "mesa"
                ? `${seats.length} personas`
                : mesa.tipo === "pista"
                  ? "Pista de baile"
                  : "Espacio del salón"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>

        {mesa.tipo !== "mesa" ? (
          <div className="p-4">
            <button
              type="button"
              onClick={onPonerSillas}
              className="w-full rounded-full py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Poner sillas y sentar gente
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1.5 px-4 pt-3">
              {(["redonda", "cuadrada"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onUpdateForma(id)}
                  className={`flex-1 rounded-full py-1.5 text-[11px] font-semibold ${
                    mesa.forma === id ? "text-white" : "bg-neutral-100"
                  }`}
                  style={
                    mesa.forma === id
                      ? { backgroundColor: primaryColor }
                      : undefined
                  }
                >
                  {id === "redonda" ? "Redonda" : "Cuadrada"}
                </button>
              ))}
            </div>
            <div className="px-4 pt-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none"
                />
              </div>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3">
              {list.map((p) => {
                const on = onMesaKeys.has(p.seatKey)
                return (
                  <li key={p.seatKey}>
                    <button
                      type="button"
                      disabled={!on && full}
                      onClick={() => onToggle(p.seatKey)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-35 ${estadoSeatClass(p.estado)}`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold text-white`}
                        style={
                          on
                            ? { backgroundColor: primaryColor, borderColor: "transparent" }
                            : undefined
                        }
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span className="truncate font-medium">{p.nombre}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <div className="flex items-center gap-2 border-t px-4 py-3">
          <button type="button" onClick={onDelete} className="p-2 text-neutral-400">
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
