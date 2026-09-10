"use client"

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type DragEvent,
} from "react"
import { ArrowUp, Ban, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Pencil, Plus } from "lucide-react"
import {
  CANVAS_H,
  CANVAS_W,
  clusterBox,
  tableBox,
  SCALE_MIN,
  TABLE_BASE,
  TABLE_STEP,
  PISTA_W_BASE,
  PISTA_W_STEP,
  hasSillas,
  clampNum,
  resolveDragPos,
  clampTamanoAgainstOthers,
  primerNombre,
  mesaSillas,
  mesaEscalaY,
  mesaRotacion,
  resolvedChairs,
  projectToSquareChairRing,
  scaleMaxFor,
  SILLA_MIN,
  SILLA_MAX,
  tamanoMinParaSillas,
} from "@/lib/mesas/layout"
import { normalizeMesaForma, normalizeMesaTipo } from "@/lib/mesas/types"
import type { MesaRecord, MesaSeatPerson } from "@/lib/mesas/types"
const HANDLE = 38
const HANDLE_BTN =
  "absolute z-40 flex items-center justify-center rounded-full border-2 bg-white shadow transition duration-150 hover:scale-110 hover:bg-[#fbf6ee] hover:shadow-md"
const ZOOM_MIN = 1
const ZOOM_MAX = 4
const EDGE = 8

function panLimits(vw: number, vh: number, scale: number) {
  const maxX = Math.max(0, (CANVAS_W * scale - vw) / 2)
  const maxY = Math.max(0, (CANVAS_H * scale - vh) / 2)
  return { maxX, maxY }
}

function clampPan(
  pan: { x: number; y: number },
  vw: number,
  vh: number,
  scale: number,
): { x: number; y: number } {
  const { maxX, maxY } = panLimits(vw, vh, scale)
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  }
}

type CroquisFloorProps = {
  mesas: MesaRecord[]
  personOnChair: (
    mesaId: string,
    chair: number,
  ) => MesaSeatPerson | undefined
  selectedId: string | null
  onSelect: (id: string | null) => void
  onOpen: (id: string) => void
  onMove: (id: string, posX: number, posY: number) => void
  onResize: (id: string, capacidad: number) => void
  onPatch: (id: string, patch: Partial<MesaRecord>) => void
  onAssignChair: (seatKey: string, mesaId: string, chair: number) => void
  onRemoveChair: (seatKey: string) => void
  onRemoveChairSlot?: (mesaId: string, chair: number) => void
  unassigned: MesaSeatPerson[]
  onDragEnd: () => void
  draggingMesaId: string | null
  setDraggingMesaId: (id: string | null) => void
  primaryColor: string
  desktop: boolean
  dragSeat: boolean
  setDragSeat: (v: boolean) => void
}

export function CroquisFloor({
  mesas,
  personOnChair,
  selectedId,
  onSelect,
  onOpen,
  onMove,
  onResize,
  onPatch,
  onAssignChair,
  onRemoveChair,
  onRemoveChairSlot,
  unassigned,
  onDragEnd,
  draggingMesaId,
  setDraggingMesaId,
  primaryColor,
  desktop,
  dragSeat,
  setDragSeat,
}: CroquisFloorProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = useState({ w: 360, h: 480 })
  const [userZoom, setUserZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [picker, setPicker] = useState<{
    mesaId: string
    chair: number
    person?: MesaSeatPerson
    x: number
    y: number
  } | null>(null)
  const [pickSearch, setPickSearch] = useState("")
  const [hoverMesaId, setHoverMesaId] = useState<string | null>(null)
  const [dropHover, setDropHover] = useState<{
    mesaId: string
    ok: boolean
  } | null>(null)

  const fitScale = Math.min(
    viewportSize.w / CANVAS_W,
    viewportSize.h / CANVAS_H,
  )
  const scale = fitScale * userZoom
  const zoomRef = useRef({ scale })
  zoomRef.current = { scale }
  const mesasLive = useRef(mesas)
  mesasLive.current = mesas
  const panRef = useRef(pan)
  panRef.current = pan
  const viewportSizeRef = useRef(viewportSize)
  viewportSizeRef.current = viewportSize
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize
  const onPatchRef = useRef(onPatch)
  onPatchRef.current = onPatch
  const personOnChairRef = useRef(personOnChair)
  personOnChairRef.current = personOnChair
  const onDragEndRef = useRef(onDragEnd)
  onDragEndRef.current = onDragEnd
  const pointerMoveRef = useRef<(e: PointerEvent) => void>(() => {})
  const endInteractRef = useRef<() => void>(() => {})

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

  useEffect(() => {
    setPan((p) =>
      clampPan(p, viewportSize.w, viewportSize.h, fitScale * userZoom),
    )
  }, [userZoom, viewportSize.w, viewportSize.h, fitScale])

  const edgeMouseRef = useRef<{ x: number; y: number } | null>(null)
  const edgeRafRef = useRef(0)

  const startEdgePan = () => {
    if (edgeRafRef.current) return
    const tick = () => {
      const pos = edgeMouseRef.current
      if (!pos) {
        edgeRafRef.current = 0
        return
      }
      const vs = viewportSizeRef.current
      let dx = 0
      let dy = 0
      if (pos.x < EDGE) dx = EDGE - pos.x
      else if (pos.x > vs.w - EDGE) dx = -(pos.x - (vs.w - EDGE))
      if (pos.y < EDGE) dy = EDGE - pos.y
      else if (pos.y > vs.h - EDGE) dy = -(pos.y - (vs.h - EDGE))
      if (dx || dy) {
        const k = 0.45
        setPan((p) =>
          clampPan(
            { x: p.x + dx * k, y: p.y + dy * k },
            vs.w,
            vs.h,
            zoomRef.current.scale,
          ),
        )
      }
      edgeRafRef.current = requestAnimationFrame(tick)
    }
    edgeRafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    return () => {
      if (edgeRafRef.current) cancelAnimationFrame(edgeRafRef.current)
    }
  }, [])
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null)
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
    moved: boolean
  } | null>(null)
  const mesaDragRef = useRef<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
    lastX: number
    lastY: number
  } | null>(null)
  const resizeRef = useRef<{
    id: string
    kind: "radial" | "east" | "south" | "rotate" | "chair" | "corner"
    chairIndex?: number
    startRot?: number
    startPointerAng?: number
  } | null>(null)
  const chairMovedRef = useRef(false)

  const clearPress = () => {
    if (pressRef.current?.timer) clearTimeout(pressRef.current.timer)
    if (pressRef.current) pressRef.current.timer = null
  }

  const onViewportTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      clearPress()
      mesaDragRef.current = null
      setDraggingMesaId(null)
      const [a, b] = [e.touches[0], e.touches[1]]
      pinchRef.current = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom: userZoom,
      }
    }
  }

  const onViewportTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      setUserZoom(
        Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, (pinchRef.current.zoom * dist) / pinchRef.current.dist),
        ),
      )
    }
  }

  const applyPan = (next: { x: number; y: number }) => {
    const vs = viewportSizeRef.current
    setPan(clampPan(next, vs.w, vs.h, zoomRef.current.scale))
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      setUserZoom((z) =>
        Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)),
        ),
      )
      return
    }
    let dx = e.deltaX
    let dy = e.deltaY
    if (e.shiftKey && Math.abs(dx) < 1) {
      dx = dy
      dy = 0
    }
    applyPan({ x: panRef.current.x - dx, y: panRef.current.y - dy })
  }

  const startMove = (mesa: MesaRecord, x: number, y: number) => {
    setDraggingMesaId(mesa.id)
    mesaDragRef.current = {
      id: mesa.id,
      startX: x,
      startY: y,
      origX: mesa.posX,
      origY: mesa.posY,
      lastX: mesa.posX,
      lastY: mesa.posY,
    }
  }

  const onMesaDown = (e: ReactPointerEvent, mesa: MesaRecord) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest("[data-handle]")) return
    if ((e.target as HTMLElement).closest("[data-chair]")) return
    if ((e.target as HTMLElement).closest("[data-pencil]")) return
    if ((e.target as HTMLElement).closest("[data-sillas]")) return
    e.preventDefault()
    e.stopPropagation()
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    onSelect(mesa.id)
    if (desktop) {
      startMove(mesa, e.clientX, e.clientY)
      return
    }
    clearPress()
    const timer = setTimeout(() => {
      if (!pressRef.current || pressRef.current.mesaId !== mesa.id) return
      startMove(mesa, e.clientX, e.clientY)
    }, 500)
    pressRef.current = {
      mesaId: mesa.id,
      x: e.clientX,
      y: e.clientY,
      timer,
      moved: false,
    }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const rz = resizeRef.current
    if (rz) {
      e.preventDefault()
      const mesa = mesasLive.current.find((m) => m.id === rz.id)
      if (!mesa) return
      const vp = viewportRef.current?.getBoundingClientRect()
      if (!vp) return
      const vs = viewportSizeRef.current
      const p = panRef.current
      const s = zoomRef.current.scale
      const cx =
        vp.left +
        (vs.w - CANVAS_W * s) / 2 +
        p.x +
        (mesa.posX / 100) * CANVAS_W * s
      const cy =
        vp.top +
        (vs.h - CANVAS_H * s) / 2 +
        p.y +
        (mesa.posY / 100) * CANVAS_H * s
      const dCanvas = Math.hypot(e.clientX - cx, e.clientY - cy) / s
      const tipo = normalizeMesaTipo(mesa.tipo)
      const forma = normalizeMesaForma(mesa.forma)
      const occ = (() => {
        const n = mesaSillas(mesa)
        let c = 0
        for (let i = 0; i < n; i++) {
          if (personOnChairRef.current(mesa.id, i)) c++
        }
        return c
      })()
      const min = hasSillas(tipo)
        ? forma === "cuadrada"
          ? SCALE_MIN
          : tamanoMinParaSillas(Math.max(SILLA_MIN, occ))
        : SCALE_MIN
      const max = scaleMaxFor(tipo, forma)
      if (rz.kind === "rotate") {
        const ang =
          (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
        const startRot = rz.startRot ?? mesaRotacion(mesa)
        const startAng = rz.startPointerAng ?? ang
        onPatchRef.current(rz.id, {
          rotacion: startRot + (ang - startAng),
        })
        return
      }
      if (rz.kind === "chair" && typeof rz.chairIndex === "number") {
        const offsetX = (vs.w - CANVAS_W * s) / 2 + p.x
        const offsetY = (vs.h - CANVAS_H * s) / 2 + p.y
        const px = (e.clientX - vp.left - offsetX) / s
        const py = (e.clientY - vp.top - offsetY) / s
        const tcx = (mesa.posX / 100) * CANVAS_W
        const tcy = (mesa.posY / 100) * CANVAS_H
        const rot = (-mesaRotacion(mesa) * Math.PI) / 180
        const dx = px - tcx
        const dy = py - tcy
        const lx = dx * Math.cos(rot) - dy * Math.sin(rot)
        const ly = dx * Math.sin(rot) + dy * Math.cos(rot)
        const cluster = clusterBox(
          mesa.capacidad,
          forma,
          tipo,
          mesaEscalaY(mesa),
        )
        const table = tableBox(
          mesa.capacidad,
          forma,
          tipo,
          mesaEscalaY(mesa),
        )
        const x = lx + cluster.w / 2
        const y = ly + cluster.h / 2
        const snapped = projectToSquareChairRing(
          x,
          y,
          cluster.w,
          cluster.h,
          table.w,
          table.h,
        )
        const n = mesaSillas(mesa)
        const pts = resolvedChairs(mesa).slice(0, n)
        pts[rz.chairIndex] = snapped
        chairMovedRef.current = true
        onPatchRef.current(rz.id, { chairPts: pts })
        return
      }
      if (rz.kind === "corner") {
        const rot = (-mesaRotacion(mesa) * Math.PI) / 180
        const dx = (e.clientX - cx) / s
        const dy = (e.clientY - cy) / s
        const lx = dx * Math.cos(rot) - dy * Math.sin(rot)
        const ly = dx * Math.sin(rot) + dy * Math.cos(rot)
        const tamano = (Math.abs(lx) * 2 - TABLE_BASE) / TABLE_STEP
        const sy = (Math.abs(ly) * 2 - TABLE_BASE) / TABLE_STEP
        onPatchRef.current(rz.id, {
          capacidad: clampNum(tamano, min, max),
          escalaY: clampNum(sy, min, max),
          chairPts: [],
        })
        return
      }
      if (rz.kind === "east") {
        const half = Math.abs(e.clientX - cx) / s
        const tamano = (half * 2 - TABLE_BASE) / TABLE_STEP
        onResizeRef.current(rz.id, clampNum(tamano, min, max))
        return
      }
      if (rz.kind === "south") {
        const half = Math.abs(e.clientY - cy) / s
        const sy = (half * 2 - TABLE_BASE) / TABLE_STEP
        onPatchRef.current(rz.id, {
          escalaY: clampNum(sy, min, max),
          chairPts: [],
        })
        return
      }
      let tamano: number
      if (tipo === "pista") {
        tamano = (dCanvas * 2 - PISTA_W_BASE) / PISTA_W_STEP
      } else {
        tamano = (dCanvas * 2 - TABLE_BASE) / TABLE_STEP
      }
      const nextTamano = clampTamanoAgainstOthers(
        mesa,
        clampNum(tamano, min, max),
        mesasLive.current,
        min,
        max,
      )
      onResizeRef.current(rz.id, nextTamano)
      return
    }
    const drag = mesaDragRef.current
    if (drag) {
      e.preventDefault()
      const s = zoomRef.current.scale
      const mesa = mesasLive.current.find((m) => m.id === drag.id)
      const rawX = Math.min(
        94,
        Math.max(6, drag.origX + ((e.clientX - drag.startX) / s / CANVAS_W) * 100),
      )
      const rawY = Math.min(
        92,
        Math.max(8, drag.origY + ((e.clientY - drag.startY) / s / CANVAS_H) * 100),
      )
      const placed = mesa
        ? resolveDragPos(
            mesa,
            { posX: drag.lastX, posY: drag.lastY },
            { posX: rawX, posY: rawY },
            mesasLive.current,
          )
        : { posX: rawX, posY: rawY }
      drag.lastX = placed.posX
      drag.lastY = placed.posY
      onMoveRef.current(drag.id, placed.posX, placed.posY)
      return
    }
    const press = pressRef.current
    if (press && !desktop) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 14) {
        clearPress()
      }
    }
    const pd = panDragRef.current
    if (pd) {
      applyPan({ x: pd.panX + (e.clientX - pd.x), y: pd.panY + (e.clientY - pd.y) })
    }
    const vp = viewportRef.current?.getBoundingClientRect()
    if (vp) {
      const x = e.clientX - vp.left
      const y = e.clientY - vp.top
      if (x >= 0 && y >= 0 && x <= vp.width && y <= vp.height) {
        edgeMouseRef.current = { x, y }
        startEdgePan()
      } else {
        edgeMouseRef.current = null
      }
    }
  }

  const skipChairClickRef = useRef(false)

  const mesaScreenCenter = (mesa: MesaRecord) => {
    const vp = viewportRef.current?.getBoundingClientRect()
    if (!vp) return null
    const vs = viewportSizeRef.current
    const p = panRef.current
    const s = zoomRef.current.scale
    return {
      x:
        vp.left +
        (vs.w - CANVAS_W * s) / 2 +
        p.x +
        (mesa.posX / 100) * CANVAS_W * s,
      y:
        vp.top +
        (vs.h - CANVAS_H * s) / 2 +
        p.y +
        (mesa.posY / 100) * CANVAS_H * s,
    }
  }

  const endInteract = () => {
    const rz = resizeRef.current
    if (rz?.kind === "chair" && chairMovedRef.current) {
      skipChairClickRef.current = true
    }
    const wasResize = Boolean(rz)
    const wasDrag = Boolean(mesaDragRef.current)
    resizeRef.current = null
    mesaDragRef.current = null
    chairMovedRef.current = false
    setDraggingMesaId(null)
    clearPress()
    pressRef.current = null
    panDragRef.current = null
    if (wasResize || wasDrag) onDragEndRef.current()
  }

  pointerMoveRef.current = (e) =>
    onPointerMove(e as unknown as ReactPointerEvent)
  endInteractRef.current = endInteract

  useEffect(() => {
    const move = (e: PointerEvent) => pointerMoveRef.current(e)
    const up = () => {
      if (resizeRef.current || mesaDragRef.current) endInteractRef.current()
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up, true)
    window.addEventListener("pointercancel", up, true)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up, true)
      window.removeEventListener("pointercancel", up, true)
    }
  }, [])

  const onMesaUp = (mesa: MesaRecord) => {
    const wasDrag = Boolean(mesaDragRef.current)
    const wasLong = Boolean(draggingMesaId)
    endInteract()
    if (desktop) return
    if (!wasDrag && !wasLong) onSelect(mesa.id)
  }

  const onHandleDown = (
    e: ReactPointerEvent,
    mesa: MesaRecord,
    kind: "radial" | "east" | "south" | "rotate" | "chair" | "corner",
    chairIndex?: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    mesaDragRef.current = null
    onSelect(mesa.id)
    const next: {
      id: string
      kind: "radial" | "east" | "south" | "rotate" | "chair" | "corner"
      chairIndex?: number
      startRot?: number
      startPointerAng?: number
    } = { id: mesa.id, kind, chairIndex }
    if (kind === "rotate") {
      const c = mesaScreenCenter(mesa)
      if (c) {
        next.startRot = mesaRotacion(mesa)
        next.startPointerAng =
          (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI
      }
    }
    if (kind === "chair") chairMovedRef.current = false
    resizeRef.current = next
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const openChairPicker = (
    e: React.MouseEvent | ReactPointerEvent,
    mesaId: string,
    chair: number,
    person?: MesaSeatPerson,
  ) => {
    e.stopPropagation()
    const vp = viewportRef.current?.getBoundingClientRect()
    if (!vp) return
    const t = "clientX" in e ? e : (e as ReactPointerEvent)
    setPickSearch("")
    setPicker({
      mesaId,
      chair,
      person,
      x: Math.min(vp.width - 16, Math.max(16, t.clientX - vp.left)),
      y: Math.min(vp.height - 16, Math.max(16, t.clientY - vp.top)),
    })
  }

  const dropSeat = (e: DragEvent, mesaId: string, chair: number) => {
    e.preventDefault()
    setDropHover(null)
    setDragSeat(false)
    const key = e.dataTransfer.getData("text/seat-key")
    if (!key) return
    onAssignChair(key, mesaId, chair)
  }

  const offsetX = (viewportSize.w - CANVAS_W * scale) / 2 + pan.x
  const offsetY = (viewportSize.h - CANVAS_H * scale) / 2 + pan.y
  const { maxX, maxY } = panLimits(viewportSize.w, viewportSize.h, scale)
  const canLeft = pan.x < maxX - 1
  const canRight = pan.x > -maxX + 1
  const canUp = pan.y < maxY - 1
  const canDown = pan.y > -maxY + 1
  const nudge = (dx: number, dy: number) => {
    applyPan({ x: pan.x + dx, y: pan.y + dy })
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-[#ebe6dc] ${
        desktop ? "" : "rounded-2xl border border-neutral-200"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-300/50 bg-[#e4dfd4] px-3 py-1.5">
        <p className="min-w-0 flex-1 truncate text-[11px] text-neutral-500">
          {desktop
            ? "Arrastrá el piso para recorrer · rueda · flechas · zoom"
            : "Tocá · mantené para mover"}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Minus className="h-3 w-3 text-neutral-400" />
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.05}
            value={userZoom}
            onChange={(e) => setUserZoom(Number(e.target.value))}
            className="h-1.5 w-[110px] cursor-pointer accent-[#c4a265] sm:w-[150px]"
            aria-label="Zoom"
          />
          <Plus className="h-3 w-3 text-neutral-400" />
          <span className="w-8 text-right text-[10px] font-semibold text-neutral-600">
            {Math.round(userZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => {
              setUserZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-sm"
          >
            Ver todo
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-hidden select-none"
        style={{ touchAction: "none", userSelect: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={onViewportTouchStart}
        onTouchMove={onViewportTouchMove}
        onTouchEnd={() => {
          pinchRef.current = null
        }}
        onPointerLeave={() => {
          edgeMouseRef.current = null
        }}
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerUp={endInteract}
        onPointerCancel={endInteract}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return
          setPicker(null)
          onSelect(null)
          panDragRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y,
          }
        }}
      >
        {picker ? (
          <div
            className="absolute z-50 w-[220px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
            style={{
              left: picker.x,
              top: picker.y,
              transform: "translate(-50%, 8px)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {picker.person ? (
              <div className="p-3">
                <p className="text-sm font-semibold text-neutral-900">
                  {picker.person.nombre}
                </p>
                {picker.person.grupo ? (
                  <p className="text-[11px] text-neutral-500">
                    {picker.person.grupo}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="mt-2 w-full rounded-full bg-[#f5d5d5] py-1.5 text-xs font-semibold text-[#8b6b6b]"
                  onClick={() => {
                    onRemoveChair(picker.person!.seatKey)
                    setPicker(null)
                  }}
                >
                  Sacar de la silla
                </button>
              </div>
            ) : (
              <div className="p-2">
                <p className="px-1 pb-1.5 text-[11px] font-semibold text-neutral-500">
                  Sentar acá
                </p>
                <input
                  value={pickSearch}
                  onChange={(e) => setPickSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="mb-1.5 w-full rounded-lg border px-2 py-1 text-xs outline-none"
                />
                <ul className="max-h-40 space-y-0.5 overflow-y-auto">
                  {unassigned
                    .filter((p) => {
                      const q = pickSearch.trim().toLowerCase()
                      if (!q) return true
                      return p.nombre.toLowerCase().includes(q)
                    })
                    .slice(0, 40)
                    .map((p) => (
                      <li key={p.seatKey}>
                        <button
                          type="button"
                          className="w-full truncate rounded-lg px-2 py-1.5 text-left text-xs hover:bg-neutral-100"
                          onClick={() => {
                            onAssignChair(p.seatKey, picker.mesaId, picker.chair)
                            setPicker(null)
                          }}
                        >
                          {p.nombre}
                        </button>
                      </li>
                    ))}
                  {unassigned.length === 0 ? (
                    <li className="px-2 py-3 text-center text-[11px] text-neutral-400">
                      Nadie sin mesa
                    </li>
                  ) : null}
                </ul>
                {onRemoveChairSlot ? (
                  <button
                    type="button"
                    className="mt-1 w-full rounded-full bg-[#eee8df] py-1.5 text-xs font-semibold text-neutral-600"
                    onClick={() => {
                      onRemoveChairSlot(picker.mesaId, picker.chair)
                      setPicker(null)
                    }}
                  >
                    Quitar esta silla
                  </button>
                ) : null}
              </div>
            )}
            <button
              type="button"
              className="w-full border-t py-1.5 text-[11px] text-neutral-500"
              onClick={() => setPicker(null)}
            >
              Cerrar
            </button>
          </div>
        ) : null}
        <div
          className="absolute origin-top-left"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            cursor: draggingMesaId ? "grabbing" : "grab",
            backgroundColor: "#e8d9bc",
            backgroundImage: `
              linear-gradient(90deg, rgba(120,72,28,0.07) 1px, transparent 1px),
              linear-gradient(rgba(120,72,28,0.07) 1px, transparent 1px),
              repeating-linear-gradient(
                90deg,
                #e4d2ae 0px,
                #e4d2ae 56px,
                #eddcb8 56px,
                #eddcb8 112px
              )
            `,
            backgroundSize: "28px 28px, 28px 28px, 112px 112px",
            boxShadow: "inset 0 0 80px rgba(80,40,10,0.12)",
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("[data-mesa]")) return
            if (e.button !== 0) return
            e.preventDefault()
            setPicker(null)
            onSelect(null)
            panDragRef.current = {
              x: e.clientX,
              y: e.clientY,
              panX: pan.x,
              panY: pan.y,
            }
            try {
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            } catch {
              /* ignore */
            }
          }}
        >
          <SalonDecor />
          {mesas.map((mesa) => {
            const tipo = normalizeMesaTipo(mesa.tipo)
            const forma = normalizeMesaForma(mesa.forma)
            const sillas = mesaSillas(mesa)
            let ocupadas = 0
            for (let i = 0; i < sillas; i++) {
              if (personOnChair(mesa.id, i)) ocupadas++
            }
            const minSillas = ocupadas
            const table = tableBox(
              mesa.capacidad,
              forma,
              tipo,
              mesaEscalaY(mesa),
            )
            const cluster = clusterBox(
              mesa.capacidad,
              forma,
              tipo,
              mesaEscalaY(mesa),
            )
            const chairs = resolvedChairs(mesa)
            const rot = mesaRotacion(mesa)
            const cx = (mesa.posX / 100) * CANVAS_W
            const cy = (mesa.posY / 100) * CANVAS_H
            const selected = selectedId === mesa.id
            const dragging = draggingMesaId === mesa.id
            const showUi =
              selected ||
              hoverMesaId === mesa.id ||
              dropHover?.mesaId === mesa.id
            const dropOn = dropHover?.mesaId === mesa.id
            const label =
              mesa.nombre.trim() ||
              (tipo === "pista" ? "Pista" : tipo === "objeto" ? "Mesa dulce" : String(mesa.numero))

            return (
              <div
                key={mesa.id}
                data-mesa
                className={`absolute ${dragging ? "z-30" : selected ? "z-20" : "z-[1]"}`}
                style={{
                  left: cx,
                  top: cy,
                  width: cluster.w,
                  height: cluster.h,
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                }}
                onPointerDown={(e) => onMesaDown(e, mesa)}
                onPointerUp={() => onMesaUp(mesa)}
                onMouseEnter={() => setHoverMesaId(mesa.id)}
                onMouseLeave={() =>
                  setHoverMesaId((id) => (id === mesa.id ? null : id))
                }
                onDragOver={
                  desktop
                    ? (e) => {
                        e.preventDefault()
                        const empty = chairs.findIndex(
                          (_, i) => !personOnChair(mesa.id, i),
                        )
                        const ok = tipo === "mesa" && empty >= 0
                        e.dataTransfer.dropEffect = ok ? "move" : "none"
                        setDropHover({ mesaId: mesa.id, ok })
                      }
                    : undefined
                }
                onDragLeave={() =>
                  setDropHover((d) => (d?.mesaId === mesa.id ? null : d))
                }
                onDrop={
                  desktop && sillas > 0
                    ? (e) => {
                        const empty = chairs.findIndex(
                          (_, i) => !personOnChair(mesa.id, i),
                        )
                        if (empty >= 0) dropSeat(e, mesa.id, empty)
                      }
                    : undefined
                }
              >
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center px-2 text-center"
                  style={{
                    width: table.w,
                    height: table.h,
                    borderRadius: table.radius,
                    background:
                      tipo === "pista"
                        ? "repeating-linear-gradient(90deg, #2a2420 0 18px, #3a332c 18px 36px)"
                        : tipo === "objeto"
                          ? "radial-gradient(circle at 40% 30%, #fff6e8, #e8c9a0 70%)"
                          : "radial-gradient(circle at 38% 32%, #fffaf2 0%, #f3e4c8 42%, #d7b07a 100%)",
                    border: tipo === "pista"
                      ? "3px solid #c9a227"
                      : `3px solid ${
                          dropOn
                            ? dropHover?.ok
                              ? "#16a34a"
                              : "#b91c1c"
                            : selected || dragging
                              ? primaryColor
                              : "#c4a265"
                        }`,
                    boxShadow: dropOn
                      ? dropHover?.ok
                        ? "0 0 0 5px rgba(22,163,74,0.35)"
                        : "0 0 0 5px rgba(185,28,28,0.25)"
                      : dragging
                      ? `0 0 0 4px ${primaryColor}33, 0 8px 18px rgba(80,40,10,0.25)`
                      : "0 6px 14px rgba(80,40,10,0.22), inset 0 1px 0 rgba(255,255,255,0.55)",
                    transform: dropOn ? "scale(1.04)" : undefined,
                  }}
                >
                  {tipo === "mesa" && showUi ? (
                    <button
                      type="button"
                      data-pencil
                      aria-label="Editar"
                      className="pointer-events-auto flex items-center justify-center rounded-full text-white shadow"
                      style={{
                        width: Math.min(table.w * 0.55, 52),
                        height: Math.min(table.h * 0.55, 52),
                        backgroundColor: primaryColor,
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen(mesa.id)
                      }}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                  ) : tipo === "mesa" ? (
                    <span
                      className="pointer-events-none leading-none font-bold"
                      style={{
                        color: selected || dragging ? primaryColor : "#6b3e12",
                        fontSize: Math.max(22, Math.min(40, table.w * 0.42)),
                      }}
                    >
                      {mesa.numero}
                    </span>
                  ) : (
                    <span
                      className="pointer-events-none max-w-full truncate text-[12px] font-bold leading-tight"
                      style={{
                        color: tipo === "pista" ? "#f3e6c8" : "#6b675f",
                      }}
                    >
                      {label}
                    </span>
                  )}
                  {tipo === "mesa" && mesa.nombre.trim() ? (
                    <span className="pointer-events-none max-w-full truncate text-[9px] font-medium text-[#7a5a32]">
                      {mesa.nombre.trim()}
                    </span>
                  ) : null}
                </div>

                {dropOn ? (
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow">
                    {dropHover?.ok ? (
                      <Plus className="h-7 w-7 text-green-600" strokeWidth={2.5} />
                    ) : (
                      <Ban className="h-7 w-7 text-red-500/80" />
                    )}
                  </div>
                ) : null}

                {showUi && desktop && tipo === "mesa" && forma === "cuadrada" ? (
                  <div
                    data-sillas
                    className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 shadow"
                    style={{ top: cluster.h / 2 + table.h / 2 + 6 }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
                      disabled={sillas <= minSillas}
                      onClick={() =>
                        onPatch(mesa.id, {
                          sillasFijas: Math.max(minSillas, sillas - 1),
                          chairPts: [],
                        })
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[1.25rem] text-center text-[11px] font-semibold">
                      {sillas}
                    </span>
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      onClick={() =>
                        onPatch(mesa.id, {
                          sillasFijas: Math.min(SILLA_MAX, sillas + 1),
                          chairPts: [],
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                {showUi && desktop && tipo === "mesa" && forma === "cuadrada" ? (
                  <button
                    type="button"
                    data-handle
                    aria-label="Girar"
                    className={`${HANDLE_BTN} cursor-grab`}
                    style={{
                      left: cluster.w / 2 - table.w / 2 - HANDLE / 2,
                      top: cluster.h / 2 - HANDLE / 2,
                      width: HANDLE,
                      height: HANDLE,
                      borderColor: primaryColor,
                    }}
                    onPointerDown={(e) => onHandleDown(e, mesa, "rotate")}
                    onPointerUp={endInteract}
                    onPointerCancel={endInteract}
                  >
                    <span
                      className="block rounded-full border-2"
                      style={{
                        width: 14,
                        height: 14,
                        borderColor: primaryColor,
                      }}
                    />
                  </button>
                ) : null}

                {showUi && desktop ? (
                  forma === "cuadrada" ? (
                    <button
                      type="button"
                      data-handle
                      aria-label="Agrandar"
                      className={`${HANDLE_BTN} cursor-default`}
                      style={{
                        left: cluster.w / 2 + table.w / 2 - HANDLE / 2,
                        top: cluster.h / 2 + table.h / 2 - HANDLE / 2,
                        width: HANDLE,
                        height: HANDLE,
                        borderColor: primaryColor,
                        color: primaryColor,
                      }}
                      onPointerDown={(e) => onHandleDown(e, mesa, "corner")}
                      onPointerUp={endInteract}
                      onPointerCancel={endInteract}
                    >
                      <ArrowUp
                        className="h-5 w-5"
                        style={{ transform: "rotate(135deg)" }}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-handle
                      aria-label="Agrandar o achicar"
                      className={`${HANDLE_BTN} cursor-default`}
                      style={{
                        left:
                          cluster.w / 2 +
                          (table.w / 2) * Math.cos(Math.PI / 4) -
                          HANDLE / 2,
                        top:
                          cluster.h / 2 +
                          (table.h / 2) * Math.sin(Math.PI / 4) -
                          HANDLE / 2,
                        width: HANDLE,
                        height: HANDLE,
                        borderColor: primaryColor,
                        color: primaryColor,
                      }}
                      onPointerDown={(e) => onHandleDown(e, mesa, "radial")}
                      onPointerUp={endInteract}
                      onPointerCancel={endInteract}
                    >
                      <ArrowUp
                        className="h-5 w-5"
                        style={{ transform: "rotate(135deg)" }}
                      />
                    </button>
                  )
                ) : null}
              </div>
            )
          })}
          {mesas.flatMap((mesa) => {
            const tipo = normalizeMesaTipo(mesa.tipo)
            const forma = normalizeMesaForma(mesa.forma)
            const cluster = clusterBox(
              mesa.capacidad,
              forma,
              tipo,
              mesaEscalaY(mesa),
            )
            const chairs = resolvedChairs(mesa)
            const rot = (mesaRotacion(mesa) * Math.PI) / 180
            const cx = (mesa.posX / 100) * CANVAS_W
            const cy = (mesa.posY / 100) * CANVAS_H
            const cos = Math.cos(rot)
            const sin = Math.sin(rot)
            return chairs.map((pt, i) => {
              const lx = pt.x - cluster.w / 2
              const ly = pt.y - cluster.h / 2
              const wx = cx + lx * cos - ly * sin
              const wy = cy + lx * sin + ly * cos
              const person = personOnChair(mesa.id, i)
              const showName =
                Boolean(person) &&
                (selectedId === mesa.id ||
                  hoverMesaId === mesa.id ||
                  draggingMesaId === mesa.id)
              const dx = pt.x - cluster.w / 2
              const dy = pt.y - cluster.h / 2
              const absX = Math.abs(dx)
              const absY = Math.abs(dy)
              const namePos =
                absX >= absY
                  ? dx >= 0
                    ? {
                        left: "100%",
                        marginLeft: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        textAlign: "left" as const,
                      }
                    : {
                        right: "100%",
                        marginRight: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        textAlign: "right" as const,
                      }
                  : dy >= 0
                    ? {
                        top: "100%",
                        marginTop: 6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        textAlign: "center" as const,
                      }
                    : {
                        bottom: "100%",
                        marginBottom: 6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        textAlign: "center" as const,
                      }
              return (
                <button
                  type="button"
                  key={`${mesa.id}-c-${i}`}
                  data-chair={i}
                  data-mesa
                  title={person?.nombre ?? "Silla vacía"}
                  aria-label={person ? person.nombre : `Silla ${i + 1} vacía`}
                  className="absolute z-[35] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center overflow-visible"
                  style={{
                    left: wx,
                    top: wy,
                    width: 40,
                    height: 40,
                  }}
                  draggable={Boolean(
                    desktop && person && forma !== "cuadrada",
                  )}
                  onDragStart={
                    desktop && person && forma !== "cuadrada"
                      ? (e) => {
                          e.stopPropagation()
                          e.dataTransfer.setData("text/seat-key", person.seatKey)
                          e.dataTransfer.effectAllowed = "move"
                          setDragSeat(true)
                        }
                      : undefined
                  }
                  onDragEnd={() => {
                    setDragSeat(false)
                    setDropHover(null)
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    if (desktop && forma === "cuadrada") {
                      onHandleDown(e, mesa, "chair", i)
                    }
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation()
                    endInteract()
                  }}
                  onMouseEnter={() => setHoverMesaId(mesa.id)}
                  onMouseLeave={() =>
                    setHoverMesaId((id) => (id === mesa.id ? null : id))
                  }
                  onClick={(e) => {
                    if (skipChairClickRef.current) {
                      skipChairClickRef.current = false
                      e.preventDefault()
                      return
                    }
                    openChairPicker(e, mesa.id, i, person)
                  }}
                  onDragOver={
                    desktop
                      ? (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }
                      : undefined
                  }
                  onDrop={
                    desktop
                      ? (e) => {
                          e.stopPropagation()
                          dropSeat(e, mesa.id, i)
                        }
                      : undefined
                  }
                >
                  {person ? (
                    <GuestToken estado={person.estado} />
                  ) : (
                    <ChiavariChair />
                  )}
                  {showName && person ? (
                    <span
                      className="pointer-events-none absolute z-30 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[20px] font-semibold leading-none"
                      style={{
                        ...namePos,
                        color: "#2c1a0c",
                        background: "rgba(255, 246, 230, 0.48)",
                        textShadow:
                          "0 0 4px rgba(255,246,230,0.9), 0 1px 2px rgba(255,246,230,0.8)",
                      }}
                    >
                      {primerNombre(person.nombre)}
                    </span>
                  ) : null}
                </button>
              )
            })
          })}
        </div>
        {canLeft ? (
          <button
            type="button"
            data-pan-arrow
            aria-label="Deslizar a la izquierda"
            className="absolute left-2 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => nudge(96, 0)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
        {canRight ? (
          <button
            type="button"
            data-pan-arrow
            aria-label="Deslizar a la derecha"
            className="absolute right-2 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => nudge(-96, 0)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
        {canUp ? (
          <button
            type="button"
            data-pan-arrow
            aria-label="Deslizar arriba"
            className="absolute left-1/2 top-2 z-40 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => nudge(0, 96)}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        ) : null}
        {canDown ? (
          <button
            type="button"
            data-pan-arrow
            aria-label="Deslizar abajo"
            className="absolute bottom-2 left-1/2 z-40 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => nudge(0, -96)}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function GuestToken({ estado }: { estado: MesaSeatPerson["estado"] }) {
  const dress =
    estado === "confirmado"
      ? "#2f6b4f"
      : estado === "no_asiste"
        ? "#a67c7c"
        : "#c4a265"
  const ring =
    estado === "confirmado"
      ? "#155724"
      : estado === "no_asiste"
        ? "#8b6b6b"
        : "#a8884a"
  const skin = "#f3d7c0"
  return (
    <span
      className="relative flex h-[36px] w-[36px] items-center justify-center overflow-hidden rounded-full"
      style={{
        background: "radial-gradient(circle at 35% 30%, #fff6ea, #ead7b6)",
        boxShadow: `inset 0 0 0 2px ${ring}, 0 2px 5px rgba(60,30,10,0.25)`,
      }}
    >
      <span
        className="absolute bottom-[3px] left-1/2 h-[15px] w-[18px] -translate-x-1/2 rounded-t-[10px]"
        style={{
          background: `linear-gradient(180deg, ${dress} 0%, ${dress}cc 100%)`,
        }}
      />
      <span
        className="absolute left-1/2 top-[5px] h-[13px] w-[13px] -translate-x-1/2 rounded-full"
        style={{ background: skin }}
      />
      <span
        className="absolute left-1/2 top-[16px] h-[4px] w-[8px] -translate-x-1/2 rounded-full"
        style={{ background: dress }}
      />
    </span>
  )
}

function ChiavariChair() {
  return (
    <span
      className="relative flex h-[32px] w-[32px] items-center justify-center rounded-full"
      style={{
        background: "rgba(255, 246, 230, 0.35)",
        boxShadow: "inset 0 0 0 1.5px rgba(201,162,39,0.7)",
      }}
    >
      <span className="relative block h-[18px] w-[14px]">
        <span className="absolute left-1/2 top-0 h-[7px] w-[10px] -translate-x-1/2 rounded-t-[3px] border border-[#c9a227] bg-[#f7efe0]/80" />
        <span className="absolute bottom-0 left-1/2 h-[10px] w-[14px] -translate-x-1/2 rounded-[3px] border border-[#c9a227] bg-[#efe0c4]/80" />
      </span>
    </span>
  )
}

function SalonDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={`light-${i}`}
          className="absolute top-3 h-1.5 w-1.5 rounded-full"
          style={{
            left: `${4 + i * 4.4}%`,
            background: i % 3 === 0 ? "#ffe08a" : "#fff6d0",
            boxShadow: "0 0 8px 2px rgba(255, 214, 120, 0.85)",
          }}
        />
      ))}
      <span className="absolute left-[8%] top-2 h-px w-[84%] bg-gradient-to-r from-transparent via-[#d4b46a] to-transparent opacity-70" />
      <span className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[#d48aa4]/25 blur-2xl" />
      <span className="absolute -right-10 -top-6 h-36 w-36 rounded-full bg-[#7d9b6a]/20 blur-2xl" />
      <span className="absolute -bottom-8 -left-6 h-32 w-32 rounded-full bg-[#e8c96a]/20 blur-2xl" />
      <span className="absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-[#d48aa4]/20 blur-2xl" />
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-[#c9a227]/50 bg-[#3a2a18]/80 px-4 py-1 text-[10px] tracking-[0.35em] text-[#f3e6c8] uppercase">
        Salón
      </span>
    </div>
  )
}
