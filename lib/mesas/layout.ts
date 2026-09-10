import type { MesaForma, MesaRecord, MesaTipo } from "./types"
import { normalizeMesaForma, normalizeMesaTipo } from "./types"

export const CANVAS_W = 2400
export const CANVAS_H = 1080

export const SILLA_MIN = 4
export const SILLA_MAX = 15
export const SCALE_MIN = 4
export const SCALE_MAX = 22
export const SCALE_MAX_SQUARE = 56

export const TABLE_BASE = 48
export const TABLE_STEP = 7
export const PISTA_W_BASE = 70
export const PISTA_W_STEP = 12
export const PISTA_H_BASE = 44
export const PISTA_H_STEP = 6

const CHAIR_GAP = 26
const HIT_PAD = 20
const OVERLAP_GAP = 10

export function clampNum(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export function clampInt(n: number, min: number, max: number): number {
  return Math.round(clampNum(n, min, max))
}

export function hasSillas(tipo: MesaTipo): boolean {
  return tipo === "mesa"
}

export function primerNombre(nombre: string): string {
  const t = nombre.trim()
  if (!t) return ""
  return t.split(/\s+/)[0] ?? t
}

export function scaleMaxFor(tipo: MesaTipo, forma: MesaForma): number {
  if (tipo === "mesa" && forma === "cuadrada") return SCALE_MAX_SQUARE
  return SCALE_MAX
}

export function tableBox(
  tamano: number,
  forma: MesaForma,
  tipo: MesaTipo,
  escalaY?: number,
): { w: number; h: number; radius: string } {
  const max = scaleMaxFor(tipo, forma)
  const s = clampNum(tamano || SCALE_MIN, SCALE_MIN, max)
  const sy = clampNum(escalaY ?? s, SCALE_MIN, max)
  if (tipo === "pista") {
    return {
      w: PISTA_W_BASE + s * PISTA_W_STEP,
      h: PISTA_H_BASE + s * PISTA_H_STEP,
      radius: "12px",
    }
  }
  if (forma === "cuadrada") {
    return {
      w: TABLE_BASE + s * TABLE_STEP,
      h: TABLE_BASE + sy * TABLE_STEP,
      radius: "10px",
    }
  }
  const d = TABLE_BASE + s * TABLE_STEP
  return { w: d, h: d, radius: "999px" }
}

export function clusterBox(
  tamano: number,
  forma: MesaForma,
  tipo: MesaTipo,
  escalaY?: number,
): { w: number; h: number } {
  const t = tableBox(tamano, forma, tipo, escalaY)
  if (!hasSillas(tipo)) {
    return { w: t.w + 24, h: t.h + 24 }
  }
  return { w: t.w + 120, h: t.h + 120 }
}

export function chairCount(
  tamano: number,
  tipo: MesaTipo,
  _forma?: MesaForma,
): number {
  if (!hasSillas(tipo)) return 0
  const s = clampNum(tamano || SCALE_MIN, SCALE_MIN, SCALE_MAX)
  const n = SILLA_MIN + Math.floor((s - SILLA_MIN) / 1.6 + 1e-6)
  return Math.min(SILLA_MAX, Math.max(SILLA_MIN, n))
}

/** Tamano mínimo para que haya al menos `n` sillas. */
export function tamanoMinParaSillas(n: number): number {
  const need = clampInt(n, SILLA_MIN, SILLA_MAX)
  return clampNum(
    SILLA_MIN + 1.6 * (need - SILLA_MIN),
    SCALE_MIN,
    SCALE_MAX,
  )
}

export function mesaSillas(mesa: MesaRecord): number {
  const tipo = normalizeMesaTipo(mesa.tipo)
  if (!hasSillas(tipo)) return 0
  const forma = normalizeMesaForma(mesa.forma)
  if (forma === "cuadrada") {
    if (
      typeof mesa.sillasFijas === "number" &&
      Number.isFinite(mesa.sillasFijas)
    ) {
      return clampInt(mesa.sillasFijas, 0, SILLA_MAX)
    }
    return 8
  }
  if (
    typeof mesa.sillasFijas === "number" &&
    Number.isFinite(mesa.sillasFijas)
  ) {
    return clampInt(mesa.sillasFijas, SILLA_MIN, SILLA_MAX)
  }
  return chairCount(mesa.capacidad, tipo, mesa.forma)
}

export function mesaEscalaY(mesa: MesaRecord): number {
  const max = scaleMaxFor(
    normalizeMesaTipo(mesa.tipo),
    normalizeMesaForma(mesa.forma),
  )
  if (typeof mesa.escalaY === "number" && Number.isFinite(mesa.escalaY)) {
    return clampNum(mesa.escalaY, SCALE_MIN, max)
  }
  return clampNum(mesa.capacidad || SCALE_MIN, SCALE_MIN, max)
}

export function mesaRotacion(mesa: MesaRecord): number {
  const r = mesa.rotacion
  if (!Number.isFinite(r)) return 0
  let d = r % 360
  if (d < 0) d += 360
  return d
}

export function resolvedChairs(mesa: MesaRecord): { x: number; y: number }[] {
  const tipo = normalizeMesaTipo(mesa.tipo)
  const forma = normalizeMesaForma(mesa.forma)
  const n = mesaSillas(mesa)
  const table = tableBox(mesa.capacidad, forma, tipo, mesaEscalaY(mesa))
  const cluster = clusterBox(mesa.capacidad, forma, tipo, mesaEscalaY(mesa))
  const def = chairPoints(n, forma, cluster.w, cluster.h, table.w, table.h)
  const saved = mesa.chairPts
  if (!Array.isArray(saved) || saved.length === 0) return def
  return def.map((p, i) => {
    const s = saved[i]
    if (!s || !Number.isFinite(s.x) || !Number.isFinite(s.y)) return p
    return { x: s.x, y: s.y }
  })
}

export function chairPoints(
  n: number,
  forma: MesaForma,
  clusterW: number,
  clusterH: number,
  tableW: number,
  tableH: number,
): { x: number; y: number }[] {
  if (n <= 0) return []
  const cx = clusterW / 2
  const cy = clusterH / 2
  const out: { x: number; y: number }[] = []
  if (forma === "redonda") {
    const r = Math.max(tableW, tableH) / 2 + CHAIR_GAP
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2
      out.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
    }
    return out
  }
  const pad = CHAIR_GAP
  const w = tableW + pad * 2
  const h = tableH + pad * 2
  const hw = w / 2
  const hh = h / 2
  const perim = 2 * (w + h)
  for (let i = 0; i < n; i++) {
    let d = ((i / n) * perim + w / 2) % perim
    if (d < w) out.push({ x: cx - hw + d, y: cy - hh })
    else {
      d -= w
      if (d < h) out.push({ x: cx + hw, y: cy - hh + d })
      else {
        d -= h
        if (d < w) out.push({ x: cx + hw - d, y: cy + hh })
        else {
          d -= w
          out.push({ x: cx - hw, y: cy + hh - d })
        }
      }
    }
  }
  return out
}

export function projectToSquareChairRing(
  x: number,
  y: number,
  clusterW: number,
  clusterH: number,
  tableW: number,
  tableH: number,
): { x: number; y: number } {
  const cx = clusterW / 2
  const cy = clusterH / 2
  const left = cx - tableW / 2 - CHAIR_GAP
  const right = cx + tableW / 2 + CHAIR_GAP
  const top = cy - tableH / 2 - CHAIR_GAP
  const bottom = cy + tableH / 2 + CHAIR_GAP
  const inside = x > left && x < right && y > top && y < bottom
  if (inside) {
    const dl = x - left
    const dr = right - x
    const dt = y - top
    const db = bottom - y
    const m = Math.min(dl, dr, dt, db)
    if (m === dl) return { x: left, y }
    if (m === dr) return { x: right, y }
    if (m === dt) return { x, y: top }
    return { x, y: bottom }
  }
  return {
    x: clampNum(x, left, right),
    y: clampNum(y, top, bottom),
  }
}

type Rect = { x: number; y: number; w: number; h: number }

export function mesaHitRect(
  mesa: Pick<MesaRecord, "capacidad" | "posX" | "posY" | "forma" | "tipo">,
): Rect {
  const tipo = normalizeMesaTipo(mesa.tipo)
  const forma = normalizeMesaForma(mesa.forma)
  const t = tableBox(mesa.capacidad, forma, tipo, mesaEscalaY(mesa as MesaRecord))
  const pad = hasSillas(tipo) ? CHAIR_GAP + HIT_PAD : 12
  const w = t.w + pad * 2
  const h = t.h + pad * 2
  const cx = (mesa.posX / 100) * CANVAS_W
  const cy = (mesa.posY / 100) * CANVAS_H
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

function aabbOverlap(a: Rect, b: Rect, gap: number): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  )
}

export function overlapsOthers(
  moving: Pick<MesaRecord, "id" | "capacidad" | "posX" | "posY" | "forma" | "tipo">,
  others: MesaRecord[],
): boolean {
  const a = mesaHitRect(moving)
  for (const other of others) {
    if (other.id === moving.id) continue
    if (aabbOverlap(a, mesaHitRect(other), OVERLAP_GAP)) return true
  }
  return false
}

export function resolveDragPos(
  moving: Pick<MesaRecord, "id" | "capacidad" | "posX" | "posY" | "forma" | "tipo">,
  last: { posX: number; posY: number },
  proposed: { posX: number; posY: number },
  others: MesaRecord[],
): { posX: number; posY: number } {
  const posX = clampNum(proposed.posX, 6, 94)
  const posY = clampNum(proposed.posY, 8, 92)
  let lastX = clampNum(last.posX, 6, 94)
  let lastY = clampNum(last.posY, 8, 92)
  if (overlapsOthers({ ...moving, posX: lastX, posY: lastY }, others)) {
    const fixed = separateOne({ ...moving, posX: lastX, posY: lastY }, others)
    lastX = fixed.posX
    lastY = fixed.posY
  }
  const free = (x: number, y: number) =>
    !overlapsOthers({ ...moving, posX: x, posY: y }, others)
  if (free(posX, posY)) return { posX, posY }
  if (free(posX, lastY)) return { posX, posY: lastY }
  if (free(lastX, posY)) return { posX: lastX, posY }
  return { posX: lastX, posY: lastY }
}

function separateOne(
  moving: Pick<MesaRecord, "id" | "capacidad" | "posX" | "posY" | "forma" | "tipo">,
  others: MesaRecord[],
): { posX: number; posY: number } {
  let posX = moving.posX
  let posY = moving.posY
  for (let iter = 0; iter < 16; iter++) {
    const a = mesaHitRect({ ...moving, posX, posY })
    let hit = false
    for (const other of others) {
      if (other.id === moving.id) continue
      const b = mesaHitRect(other)
      if (!aabbOverlap(a, b, OVERLAP_GAP)) continue
      hit = true
      const acx = a.x + a.w / 2
      const acy = a.y + a.h / 2
      const bcx = b.x + b.w / 2
      const bcy = b.y + b.h / 2
      let dx = acx - bcx
      let dy = acy - bcy
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        dx = 1
        dy = 0.3
      }
      const ox = (a.w + b.w) / 2 + OVERLAP_GAP - Math.abs(dx) + 1
      const oy = (a.h + b.h) / 2 + OVERLAP_GAP - Math.abs(dy) + 1
      if (ox < oy) posX += ((dx >= 0 ? ox : -ox) / CANVAS_W) * 100
      else posY += ((dy >= 0 ? oy : -oy) / CANVAS_H) * 100
    }
    posX = clampNum(posX, 6, 94)
    posY = clampNum(posY, 8, 92)
    if (!hit) break
  }
  return { posX, posY }
}

export function untangleMesas(mesas: MesaRecord[]): MesaRecord[] {
  const next = mesas.map((m) => ({ ...m }))
  for (let pass = 0; pass < 28; pass++) {
    let moved = false
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const a = mesaHitRect(next[i])
        const b = mesaHitRect(next[j])
        if (!aabbOverlap(a, b, OVERLAP_GAP)) continue
        moved = true
        const acx = a.x + a.w / 2
        const acy = a.y + a.h / 2
        const bcx = b.x + b.w / 2
        const bcy = b.y + b.h / 2
        let dx = acx - bcx
        let dy = acy - bcy
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          dx = (i + 1) * 3
          dy = (j + 1) * 2
        }
        const ox = (a.w + b.w) / 2 + OVERLAP_GAP - Math.abs(dx) + 2
        const oy = (a.h + b.h) / 2 + OVERLAP_GAP - Math.abs(dy) + 2
        const pushX = (ox < oy ? ox : ox * 0.2) / 2
        const pushY = (oy <= ox ? oy : oy * 0.2) / 2
        const sx = dx >= 0 ? 1 : -1
        const sy = dy >= 0 ? 1 : -1
        next[i] = {
          ...next[i],
          posX: clampNum(next[i].posX + (sx * pushX * 100) / CANVAS_W, 6, 94),
          posY: clampNum(next[i].posY + (sy * pushY * 100) / CANVAS_H, 8, 92),
        }
        next[j] = {
          ...next[j],
          posX: clampNum(next[j].posX - (sx * pushX * 100) / CANVAS_W, 6, 94),
          posY: clampNum(next[j].posY - (sy * pushY * 100) / CANVAS_H, 8, 92),
        }
      }
    }
    if (!moved) break
  }
  return next
}

export function clampTamanoAgainstOthers(
  mesa: MesaRecord,
  desired: number,
  others: MesaRecord[],
  min: number,
  max: number,
): number {
  const d = clampNum(desired, min, max)
  if (!overlapsOthers({ ...mesa, capacidad: d }, others)) return d
  let lo = min
  let hi = d
  const cur = clampNum(mesa.capacidad, min, max)
  if (!overlapsOthers({ ...mesa, capacidad: cur }, others)) {
    lo = Math.min(cur, d)
  }
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    if (overlapsOthers({ ...mesa, capacidad: mid }, others)) hi = mid
    else lo = mid
  }
  return lo
}
