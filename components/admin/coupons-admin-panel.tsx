"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react"
import type { CuponRow } from "@/lib/coupons/types"
import {
  generatePrefixedSeries,
  inferSeriesFromCodes,
  normalizeCouponCode,
  COUPON_BATCH_MAX,
} from "@/lib/coupons/logic"
import { composeCouponEmailBody, fillCouponMessage } from "@/lib/coupons/message"
import configuradorEs from "@/data/landing/configurador-es.json"

type CategoryInfo = {
  id: string
  label: string
  description: string
  usageMode: string
}

type AdminResponse = {
  ok: boolean
  error?: string
  categories?: CategoryInfo[]
  coupons?: CuponRow[]
  seriesMessages?: Record<string, string>
}

type ConfirmState = {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  run: () => Promise<void>
}

type CreateMode = "unique" | "libre"
type FilterMode = "all" | "available" | "used"

const EVENT_LABELS = configuradorEs.eventLabels as Record<string, string>

function formatUsedAt(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return iso
  }
}

function formatExpires(iso: string | null): string {
  if (!iso) return "Sin vencimiento"
  try {
    const [y, m, d] = iso.split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function eventLabel(tipo: string | null): string {
  if (!tipo) return ""
  return EVENT_LABELS[tipo] ?? tipo
}

function shortCategoryLabel(label: string): string {
  return label.replace(/^Único\s*·\s*/i, "").replace(/^Uso libre\s*·\s*/i, "")
}

/** Evita dejar body con overflow:hidden al cerrar sheets apilados. */
let sheetScrollLockCount = 0
const COUPONS_SCROLL_KEY = "mu-coupons-admin-scroll-y"

function lockBodyScroll() {
  sheetScrollLockCount += 1
  if (sheetScrollLockCount === 1) {
    document.body.style.overflow = "hidden"
    document.body.style.overflowX = "hidden"
  }
}

function unlockBodyScroll() {
  sheetScrollLockCount = Math.max(0, sheetScrollLockCount - 1)
  if (sheetScrollLockCount === 0) {
    document.body.style.overflow = ""
    document.body.style.overflowX = ""
  }
}

function readSavedScrollY(): number | null {
  try {
    const raw = sessionStorage.getItem(COUPONS_SCROLL_KEY)
    if (raw == null || raw === "") return null
    const y = Number(raw)
    return Number.isFinite(y) && y >= 0 ? y : null
  } catch {
    return null
  }
}

function saveScrollY() {
  try {
    const y = window.scrollY || document.documentElement.scrollTop || 0
    sessionStorage.setItem(COUPONS_SCROLL_KEY, String(Math.round(y)))
  } catch {
    // ignore
  }
}

function Sheet({
  open,
  onClose,
  title,
  children,
  zClass = "z-[10050]",
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  zClass?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return () => {
      unlockBodyScroll()
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className={`fixed inset-0 flex flex-col justify-end overflow-x-hidden sm:items-center sm:justify-center sm:p-6 ${zClass}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1C140E]/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[92dvh] w-full max-w-full flex-col overflow-x-hidden rounded-t-[1.75rem] bg-[#FAF7F2] shadow-2xl sm:max-w-lg sm:rounded-[1.75rem]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#D8CBB8] sm:hidden" />
        <div className="flex min-w-0 items-center justify-between gap-3 px-5 pb-2 pt-4 sm:pt-5">
          <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight text-[#2F261F]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFE7DB] text-[#5A4638]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
          <div className="max-w-full min-w-0 overflow-x-hidden">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function CouponsAdminPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{
    type: "ok" | "err"
    text: string
  } | null>(null)
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [coupons, setCoupons] = useState<CuponRow[]>([])
  const [seriesMessages, setSeriesMessages] = useState<Record<string, string>>(
    {},
  )
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>("all")
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showEditSeries, setShowEditSeries] = useState(false)
  const [showEditMessage, setShowEditMessage] = useState(false)
  const [editMessage, setEditMessage] = useState("")
  const [sendCoupon, setSendCoupon] = useState<CuponRow | null>(null)
  const [sendEmail, setSendEmail] = useState("")
  const [manualSendCoupon, setManualSendCoupon] = useState<CuponRow | null>(
    null,
  )
  const [manualSendName, setManualSendName] = useState("")
  const sendPressTimer = useRef<number | null>(null)
  const sendLongPressDone = useRef(false)
  const [createMode, setCreateMode] = useState<CreateMode>("unique")
  const [rowMenuId, setRowMenuId] = useState<string | null>(null)

  const [uLabel, setULabel] = useState("Formulario insights")
  const [uUseExisting, setUUseExisting] = useState(true)
  const [uPrefix, setUPrefix] = useState("BODA")
  const [uStart, setUStart] = useState(1250)
  const [uStep, setUStep] = useState(10)
  const [uCount, setUCount] = useState(10)
  const [uDiscount, setUDiscount] = useState(30)
  const [uExpires, setUExpires] = useState("2026-08-05")

  const [lLabel, setLLabel] = useState("")
  const [lCode, setLCode] = useState("")
  const [lDiscount, setLDiscount] = useState(15)
  const [lExpires, setLExpires] = useState("2026-08-05")
  const [addCount, setAddCount] = useState(1)
  const [editDiscount, setEditDiscount] = useState(30)
  const [editExpires, setEditExpires] = useState("2026-08-05")
  const [editSeriesDirty, setEditSeriesDirty] = useState(false)
  const [editMessageBaseline, setEditMessageBaseline] = useState<string | null>(
    null,
  )
  const [editMessageDirty, setEditMessageDirty] = useState(false)
  const [sendEmailBaseline, setSendEmailBaseline] = useState<string | null>(
    null,
  )
  const [sendDirty, setSendDirty] = useState(false)
  const [createDirty, setCreateDirty] = useState(false)
  const [reorderMode, setReorderMode] = useState<
    "single_use" | "unlimited" | null
  >(null)
  const didRestoreScroll = useRef(false)
  const [scrollReady, setScrollReady] = useState(false)

  useEffect(() => {
    // Por si un sheet quedó a medias (HMR / crash): liberar scroll
    sheetScrollLockCount = 0
    document.body.style.overflow = ""
    document.body.style.overflowX = ""
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    const saved = readSavedScrollY()
    if (saved == null || saved <= 0) {
      setScrollReady(true)
    }

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        saveScrollY()
        ticking = false
      })
    }
    const onLeave = () => saveScrollY()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pagehide", onLeave)
    window.addEventListener("beforeunload", onLeave)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pagehide", onLeave)
      window.removeEventListener("beforeunload", onLeave)
    }
  }, [])

  useEffect(() => {
    if (loading || didRestoreScroll.current) return
    const y = readSavedScrollY()
    if (y == null || y <= 0) {
      didRestoreScroll.current = true
      setScrollReady(true)
      return
    }

    let cancelled = false
    const html = document.documentElement
    const prevBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = "auto"

    const finish = () => {
      if (cancelled) return
      html.style.scrollBehavior = prevBehavior
      didRestoreScroll.current = true
      setScrollReady(true)
    }

    const restore = () => {
      if (cancelled) return
      window.scrollTo({ top: y, left: 0, behavior: "instant" })
      if (
        window.scrollY + 8 < y &&
        document.documentElement.scrollHeight < y + window.innerHeight
      ) {
        window.setTimeout(restore, 50)
        return
      }
      finish()
    }

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore)
    })
    return () => {
      cancelled = true
      html.style.scrollBehavior = prevBehavior
      window.cancelAnimationFrame(id)
    }
  }, [loading, coupons.length])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/coupons/admin", { cache: "no-store" })
      const data = (await res.json()) as AdminResponse
      if (!data.ok) {
        setError(data.error || "No se pudo cargar.")
        return
      }
      setCategories(data.categories ?? [])
      setCoupons(data.coupons ?? [])
      setSeriesMessages(data.seriesMessages ?? {})
      setActiveCategory((prev) => {
        const cats = data.categories ?? []
        const coup = data.coupons ?? []
        const hasCoupons = (id: string) =>
          coup.some((c) => c.categoria === id)
        if (prev && hasCoupons(prev)) return prev
        const withCoupons = cats.find((c) => hasCoupons(c.id))
        return withCoupons?.id ?? null
      })
    } catch {
      setError("No se pudo cargar el listado.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 3200)
    return () => window.clearTimeout(t)
  }, [flash])

  const runAction = useCallback(
    async (body: Record<string, unknown>, okMessage: string) => {
      setBusy(true)
      setFlash(null)
      try {
        const res = await fetch("/api/coupons/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = (await res.json()) as { ok: boolean; error?: string }
        if (!data.ok) {
          setFlash({ type: "err", text: data.error || "No se pudo completar." })
          return false
        }
        setFlash({ type: "ok", text: okMessage })
        setRowMenuId(null)
        await load()
        return true
      } catch {
        setFlash({ type: "err", text: "Error de red." })
        return false
      } finally {
        setBusy(false)
        setConfirm(null)
      }
    },
    [load],
  )

  const activeMeta = categories.find((c) => c.id === activeCategory)
  const isUnlimited = activeMeta?.usageMode === "unlimited"

  const inCategory = useMemo(() => {
    if (!activeCategory) return []
    return coupons.filter((c) => c.categoria === activeCategory)
  }, [coupons, activeCategory])

  const filtered = useMemo(() => {
    if (isUnlimited) return inCategory
    if (filter === "available") {
      return inCategory.filter((c) => !c.usado && c.activo)
    }
    if (filter === "used") return inCategory.filter((c) => c.usado)
    return inCategory
  }, [inCategory, filter, isUnlimited])

  const stats = useMemo(() => {
    const available = inCategory.filter((c) => !c.usado && c.activo).length
    const used = inCategory.filter((c) => c.usado).length
    return { total: inCategory.length, available, used }
  }, [inCategory])

  const seriesIsActive = useMemo(
    () =>
      inCategory.length > 0 && inCategory.every((c) => c.activo !== false),
    [inCategory],
  )

  const seriesHint = useMemo(
    () => inferSeriesFromCodes(inCategory.map((c) => c.codigo)),
    [inCategory],
  )

  const seriesSummary = useMemo(() => {
    if (inCategory.length === 0) return null
    const discounts = [
      ...new Set(inCategory.map((c) => Number(c.descuento_porcentaje))),
    ]
    const expires = [
      ...new Set(
        inCategory
          .map((c) => c.valido_hasta)
          .filter((v): v is string => Boolean(v)),
      ),
    ]
    return {
      discount: discounts[0] ?? 0,
      discountMixed: discounts.length > 1,
      expires: expires[0] ?? null,
      expiresMixed: expires.length > 1,
    }
  }, [inCategory])

  const uniquePreview = useMemo(
    () =>
      generatePrefixedSeries({
        prefix: uPrefix,
        start: Number(uStart),
        step: Number(uStep),
        count: Math.min(Number(uCount) || 0, 5),
      }),
    [uPrefix, uStart, uStep, uCount],
  )

  const categoryIsActive = useCallback(
    (categoriaId: string) => {
      const rows = coupons.filter((c) => c.categoria === categoriaId)
      return rows.length > 0 && rows.every((c) => c.activo !== false)
    },
    [coupons],
  )

  const categoryDiscount = useCallback(
    (categoriaId: string) => {
      const rows = coupons.filter((c) => c.categoria === categoriaId)
      if (rows.length === 0) return null
      const discounts = [
        ...new Set(rows.map((c) => Number(c.descuento_porcentaje))),
      ]
      if (discounts.length === 1) return discounts[0]
      return discounts[0] ?? null
    },
    [coupons],
  )

  const uniqueCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.usageMode === "single_use" &&
          coupons.some((x) => x.categoria === c.id),
      ),
    [categories, coupons],
  )
  const libreCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.usageMode === "unlimited" &&
          coupons.some((x) => x.categoria === c.id),
      ),
    [categories, coupons],
  )

  const moveSeries = useCallback(
    async (
      usageMode: "single_use" | "unlimited",
      list: CategoryInfo[],
      index: number,
      dir: -1 | 1,
    ) => {
      const next = index + dir
      if (next < 0 || next >= list.length || busy) return
      const orderedIds = list.map((c) => c.id)
      const tmp = orderedIds[index]
      orderedIds[index] = orderedIds[next]
      orderedIds[next] = tmp
      // Optimista: reordenar en memoria
      setCategories((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]))
        const moved = orderedIds
          .map((id) => byId.get(id))
          .filter((c): c is CategoryInfo => Boolean(c))
        const single =
          usageMode === "single_use"
            ? moved
            : prev.filter((c) => c.usageMode === "single_use")
        const unlimited =
          usageMode === "unlimited"
            ? moved
            : prev.filter((c) => c.usageMode === "unlimited")
        const other = prev.filter(
          (c) =>
            c.usageMode !== "single_use" && c.usageMode !== "unlimited",
        )
        return [...single, ...unlimited, ...other]
      })
      await runAction(
        { action: "reorder_series", usageMode, orderedIds },
        "Orden actualizado.",
      )
    },
    [busy, runAction],
  )

  const addPreview = useMemo(() => {
    if (!seriesHint) return []
    return generatePrefixedSeries({
      prefix: seriesHint.prefix,
      start: seriesHint.nextNum,
      step: seriesHint.step,
      count: Math.min(Math.max(1, Number(addCount) || 1), 5),
    })
  }, [seriesHint, addCount])

  const clampAddCount = (raw: number) => {
    if (!Number.isFinite(raw)) return 1
    return Math.min(COUPON_BATCH_MAX, Math.max(1, Math.floor(raw)))
  }

  const askConfirm = (state: ConfirmState) => {
    setRowMenuId(null)
    setConfirm(state)
  }

  const closeEditSeries = () => {
    setShowEditSeries(false)
    setEditSeriesDirty(false)
  }

  const closeEditMessage = () => {
    setShowEditMessage(false)
    setEditMessageDirty(false)
    setEditMessageBaseline(null)
  }

  const closeSend = () => {
    setSendCoupon(null)
    setSendEmail("")
    setSendEmailBaseline(null)
    setSendDirty(false)
  }

  const closeManualSend = () => {
    setManualSendCoupon(null)
    setManualSendName("")
  }

  const clearSendPressTimer = () => {
    if (sendPressTimer.current != null) {
      window.clearTimeout(sendPressTimer.current)
      sendPressTimer.current = null
    }
  }

  const openEmailSend = (c: CuponRow) => {
    const initial = c.enviado_email?.trim() || ""
    setSendEmail(initial)
    setSendEmailBaseline(initial)
    setSendDirty(false)
    setSendCoupon(c)
  }

  const openManualSend = (c: CuponRow) => {
    setManualSendName(c.enviado_email?.trim() || "")
    setManualSendCoupon(c)
  }

  const closeCreate = () => {
    setShowCreate(false)
    setCreateDirty(false)
  }

  const requestCloseEditSeries = () => {
    if (busy) return
    if (!editSeriesDirty) {
      closeEditSeries()
      return
    }
    askConfirm({
      title: "¿Descartar cambios?",
      body: "Si cerrás, se pierden los cambios.",
      confirmLabel: "Descartar",
      danger: true,
      run: async () => {
        closeEditSeries()
        setConfirm(null)
      },
    })
  }

  const requestCloseEditMessage = () => {
    if (busy) return
    if (!editMessageDirty) {
      closeEditMessage()
      return
    }
    askConfirm({
      title: "¿Descartar cambios?",
      body: "Si cerrás, se pierden los cambios.",
      confirmLabel: "Descartar",
      danger: true,
      run: async () => {
        closeEditMessage()
        setConfirm(null)
      },
    })
  }

  const requestCloseSend = () => {
    if (busy) return
    if (!sendDirty) {
      closeSend()
      return
    }
    askConfirm({
      title: "¿Descartar cambios?",
      body: "Si cerrás, se pierden los cambios.",
      confirmLabel: "Descartar",
      danger: true,
      run: async () => {
        closeSend()
        setConfirm(null)
      },
    })
  }

  const requestCloseCreate = () => {
    if (busy) return
    if (!createDirty) {
      closeCreate()
      return
    }
    askConfirm({
      title: "¿Descartar cambios?",
      body: "Si cerrás, se pierden los cambios.",
      confirmLabel: "Descartar",
      danger: true,
      run: async () => {
        closeCreate()
        setConfirm(null)
      },
    })
  }

  const field =
    "box-border w-full max-w-full min-w-0 rounded-2xl border-0 bg-[#F0E8DC] px-4 py-3.5 text-[16px] text-[#2F261F] outline-none ring-0 placeholder:text-[#A89480] focus:bg-[#EBE2D4]"

  const handleCreateUnique = async () => {
    const n = Math.min(COUPON_BATCH_MAX, Math.max(1, Math.floor(Number(uCount) || 1)))
    const payload: Record<string, unknown> = {
      action: "create_unique_series",
      prefix: uPrefix,
      start: Number(uStart),
      step: Number(uStep),
      count: n,
      discountPercent: Number(uDiscount),
      expiresOn: uExpires,
    }
    if (uUseExisting && activeCategory && !isUnlimited) {
      payload.categoria = activeCategory
    } else {
      payload.categoryLabel = uLabel
    }
    const ok = await runAction(payload, `Serie creada (${n}).`)
    if (ok) closeCreate()
  }

  const handleCreateLibre = async () => {
    const ok = await runAction(
      {
        action: "create_libre",
        code: lCode,
        discountPercent: Number(lDiscount),
        expiresOn: lExpires,
        categoryLabel: lLabel || undefined,
        categoria: lLabel.trim() ? undefined : "libre",
      },
      `${normalizeCouponCode(lCode)} listo.`,
    )
    if (ok) {
      closeCreate()
      setLCode("")
    }
  }

  const menuCoupon = rowMenuId
    ? coupons.find((c) => c.id === rowMenuId) ?? null
    : null

  return (
    <div
      className="relative pb-28"
      style={scrollReady ? undefined : { opacity: 0 }}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9A8168]">
            Admin
          </p>
          <h1 className="mt-1 text-[1.75rem] font-semibold leading-none tracking-tight text-[#2F261F]">
            Cupones
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || busy}
          className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6B5340] shadow-[0_1px_2px_rgba(47,38,31,0.06)] ring-1 ring-[#E8DFD2] disabled:opacity-40"
          aria-label="Actualizar"
        >
          <RefreshCw
            className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {flash ? (
        <div
          className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
            flash.type === "ok"
              ? "bg-[#E4F0E6] text-[#1F5C2E]"
              : "bg-[#F6E4E4] text-[#8F2F2F]"
          }`}
        >
          {flash.type === "ok" ? (
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          ) : null}
          {flash.text}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-[#F6E4E4] px-4 py-3 text-sm text-[#8F2F2F]">
          {error}
        </p>
      ) : null}

      {/* Series picker — agrupado por tipo */}
      <div className="mt-6 space-y-4">
        {uniqueCategories.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A8168]">
                Uso único
              </p>
              {uniqueCategories.length > 1 ? (
                <button
                  type="button"
                  aria-label={
                    reorderMode === "single_use"
                      ? "Listo con el orden"
                      : "Ordenar series"
                  }
                  aria-pressed={reorderMode === "single_use"}
                  onClick={() =>
                    setReorderMode((m) =>
                      m === "single_use" ? null : "single_use",
                    )
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#B5A290] active:bg-[#EFE7DB] active:text-[#7A6654]"
                >
                  {reorderMode === "single_use" ? (
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                </button>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#E8DFD2]">
              {uniqueCategories.map((cat, i) => {
                const selected = cat.id === activeCategory
                const rows = coupons.filter((c) => c.categoria === cat.id)
                const total = rows.length
                const available = rows.filter(
                  (c) => !c.usado && c.activo !== false,
                ).length
                const editingOrder = reorderMode === "single_use"
                return (
                  <div
                    key={cat.id}
                    className={`flex items-stretch ${
                      i > 0 ? "border-t border-[#EFE7DB]" : ""
                    } ${selected ? "bg-[#2F261F] text-[#FAF7F2]" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        setActiveCategory(cat.id)
                        setFilter("all")
                        e.currentTarget.blur()
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3.5 text-left outline-none transition-colors focus:outline-none focus-visible:outline-none ${
                        selected ? "" : "active:bg-[#F7F1E8]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold">
                          {shortCategoryLabel(cat.label)}
                        </span>
                        {categoryDiscount(cat.id) != null ? (
                          <span
                            className={`mt-0.5 block text-xs font-semibold tracking-wide ${selected ? "text-[#C4B09A]" : "text-[#9A8168]"}`}
                          >
                            {categoryDiscount(cat.id)}% OFF
                          </span>
                        ) : null}
                      </span>
                      <span className="tabular-nums text-sm font-semibold">
                        {categoryIsActive(cat.id) ? (
                          <>
                            <span
                              className={
                                selected ? "text-white/85" : "text-[#6B5340]"
                              }
                            >
                              {available}
                            </span>
                            <span
                              className={
                                selected ? "text-white/45" : "text-[#A89480]"
                              }
                            >
                              /{total}
                            </span>
                          </>
                        ) : (
                          <span
                            className={
                              selected ? "text-white/55" : "text-[#A89480]"
                            }
                          >
                            Off
                          </span>
                        )}
                      </span>
                    </button>
                    {editingOrder ? (
                      <div
                        className={`flex w-8 shrink-0 flex-col border-l ${
                          selected ? "border-white/15" : "border-[#EFE7DB]"
                        }`}
                      >
                        <button
                          type="button"
                          aria-label="Subir serie"
                          disabled={busy || i === 0}
                          onClick={() =>
                            void moveSeries(
                              "single_use",
                              uniqueCategories,
                              i,
                              -1,
                            )
                          }
                          className={`flex flex-1 items-center justify-center disabled:opacity-20 ${
                            selected
                              ? "text-[#C4B09A] active:bg-white/10"
                              : "text-[#B5A290] active:bg-[#F7F1E8]"
                          }`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar serie"
                          disabled={busy || i === uniqueCategories.length - 1}
                          onClick={() =>
                            void moveSeries(
                              "single_use",
                              uniqueCategories,
                              i,
                              1,
                            )
                          }
                          className={`flex flex-1 items-center justify-center border-t disabled:opacity-20 ${
                            selected
                              ? "border-white/15 text-[#C4B09A] active:bg-white/10"
                              : "border-[#EFE7DB] text-[#B5A290] active:bg-[#F7F1E8]"
                          }`}
                        >
                          <ChevronDown
                            className="h-3.5 w-3.5"
                            strokeWidth={2.25}
                          />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {libreCategories.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A8168]">
                Uso libre
              </p>
              {libreCategories.length > 1 ? (
                <button
                  type="button"
                  aria-label={
                    reorderMode === "unlimited"
                      ? "Listo con el orden"
                      : "Ordenar series"
                  }
                  aria-pressed={reorderMode === "unlimited"}
                  onClick={() =>
                    setReorderMode((m) =>
                      m === "unlimited" ? null : "unlimited",
                    )
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#B5A290] active:bg-[#EFE7DB] active:text-[#7A6654]"
                >
                  {reorderMode === "unlimited" ? (
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                </button>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#E8DFD2]">
              {libreCategories.map((cat, i) => {
                const selected = cat.id === activeCategory
                const count = coupons.filter(
                  (c) => c.categoria === cat.id,
                ).length
                const editingOrder = reorderMode === "unlimited"
                return (
                  <div
                    key={cat.id}
                    className={`flex items-stretch ${
                      i > 0 ? "border-t border-[#EFE7DB]" : ""
                    } ${selected ? "bg-[#2F261F] text-[#FAF7F2]" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        setActiveCategory(cat.id)
                        setFilter("all")
                        e.currentTarget.blur()
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3.5 text-left outline-none transition-colors focus:outline-none focus-visible:outline-none ${
                        selected ? "" : "active:bg-[#F7F1E8]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold">
                          {shortCategoryLabel(cat.label)}
                        </span>
                        {categoryDiscount(cat.id) != null ? (
                          <span
                            className={`mt-0.5 block text-xs font-semibold tracking-wide ${selected ? "text-[#C4B09A]" : "text-[#9A8168]"}`}
                          >
                            {categoryDiscount(cat.id)}% OFF
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`tabular-nums text-sm font-semibold ${selected ? "text-white/55" : "text-[#A89480]"}`}
                      >
                        {categoryIsActive(cat.id) ? count : "Off"}
                      </span>
                    </button>
                    {editingOrder ? (
                      <div
                        className={`flex w-8 shrink-0 flex-col border-l ${
                          selected ? "border-white/15" : "border-[#EFE7DB]"
                        }`}
                      >
                        <button
                          type="button"
                          aria-label="Subir serie"
                          disabled={busy || i === 0}
                          onClick={() =>
                            void moveSeries(
                              "unlimited",
                              libreCategories,
                              i,
                              -1,
                            )
                          }
                          className={`flex flex-1 items-center justify-center disabled:opacity-20 ${
                            selected
                              ? "text-[#C4B09A] active:bg-white/10"
                              : "text-[#B5A290] active:bg-[#F7F1E8]"
                          }`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar serie"
                          disabled={busy || i === libreCategories.length - 1}
                          onClick={() =>
                            void moveSeries(
                              "unlimited",
                              libreCategories,
                              i,
                              1,
                            )
                          }
                          className={`flex flex-1 items-center justify-center border-t disabled:opacity-20 ${
                            selected
                              ? "border-white/15 text-[#C4B09A] active:bg-white/10"
                              : "border-[#EFE7DB] text-[#B5A290] active:bg-[#F7F1E8]"
                          }`}
                        >
                          <ChevronDown
                            className="h-3.5 w-3.5"
                            strokeWidth={2.25}
                          />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Summary card */}
      {activeMeta && seriesSummary ? (
        <section
          className={`relative mt-5 overflow-hidden rounded-[1.5rem] text-[#FAF7F2] shadow-[0_12px_40px_rgba(47,38,31,0.18)] ${
            seriesIsActive ? "bg-[#2F261F]" : "bg-[#5A5048]"
          }`}
        >
          <button
            type="button"
            aria-label="Editar serie"
            onClick={() => {
              const nextDiscount = seriesSummary.discountMixed
                ? 30
                : seriesSummary.discount || 30
              const nextExpires =
                seriesSummary.expires ??
                new Date().toLocaleDateString("en-CA", {
                  timeZone: "America/Argentina/Buenos_Aires",
                })
              setEditDiscount(nextDiscount)
              setEditExpires(nextExpires)
              setEditSeriesDirty(false)
              setEditMessage(
                activeCategory
                  ? (seriesMessages[activeCategory] ?? "")
                  : "",
              )
              setShowEditSeries(true)
            }}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#FAF7F2] backdrop-blur-sm active:bg-white/20"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <div className="flex items-end justify-between gap-4 px-5 pb-1 pt-5">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C4B09A]">
                {isUnlimited ? "Uso libre" : "Uso único"}
                {!seriesIsActive ? " · Pausada" : ""}
              </p>
              <p className="mt-2 text-[2.75rem] font-semibold leading-none tracking-tight">
                {seriesSummary.discountMixed
                  ? "Varios"
                  : `${seriesSummary.discount}%`}
              </p>
              <p className="mt-1 text-sm text-[#C4B09A]">descuento</p>
            </div>
            <div className="shrink-0 pb-1 text-right text-sm text-[#C4B09A]">
              <p>Vence</p>
              <p className="mt-0.5 font-medium text-[#FAF7F2]">
                {seriesSummary.expiresMixed
                  ? "Varias fechas"
                  : formatExpires(seriesSummary.expires)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-px bg-[#3F342C]/80">
            <div
              className={`px-5 py-4 ${seriesIsActive ? "bg-[#2F261F]" : "bg-[#5A5048]"}`}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#C4B09A]">
                {isUnlimited ? "Códigos" : "Disponibles"}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {isUnlimited ? stats.total : stats.available}
              </p>
            </div>
            <div
              className={`px-5 py-4 ${seriesIsActive ? "bg-[#2F261F]" : "bg-[#5A5048]"}`}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#C4B09A]">
                {isUnlimited ? "Total" : "Usados"}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {isUnlimited ? stats.total : stats.used}
              </p>
            </div>
          </div>
          {!isUnlimited && seriesHint ? (
            <p className="border-t border-[#3F342C]/80 px-5 py-2.5 text-center text-[11px] font-medium tracking-wide text-[#C4B09A]">
              {seriesHint.firstCode} + {seriesHint.step}
            </p>
          ) : null}
        </section>
      ) : activeMeta ? (
        <section className="mt-5 rounded-[1.5rem] bg-white px-5 py-8 text-center ring-1 ring-[#E8DFD2]">
          <p className="text-sm text-[#8A735C]">Sin cupones en esta serie</p>
        </section>
      ) : null}

      {/* Filters */}
      {!isUnlimited && inCategory.length > 0 ? (
        <div className="mt-5 flex rounded-2xl bg-[#EFE7DB] p-1">
          {(
            [
              ["all", "Todos"],
              ["available", "Disponibles"],
              ["used", "Usados"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                filter === id
                  ? "bg-white text-[#2F261F] shadow-sm"
                  : "text-[#7A6654]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {/* List */}
      <ul className="mt-4 space-y-2.5">
        {loading && coupons.length === 0 ? (
          <li className="rounded-[1.25rem] bg-white px-5 py-10 text-center text-sm text-[#8A735C] ring-1 ring-[#E8DFD2]">
            Cargando…
          </li>
        ) : filtered.length === 0 ? (
          <li className="rounded-[1.25rem] bg-white px-5 py-10 text-center text-sm text-[#8A735C] ring-1 ring-[#E8DFD2]">
            Nada acá todavía
          </li>
        ) : (
          filtered.map((c) => {
            const used = c.usado
            const sent = Boolean(c.enviado)
            const usageBits = [
              eventLabel(c.usado_tipo_evento),
              c.usado_nombre,
              formatUsedAt(c.usado_at),
            ].filter(Boolean)

            return (
              <li
                key={c.id}
                className="flex items-stretch gap-0 overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#E8DFD2]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setRowMenuId((id) => (id === c.id ? null : c.id))
                  }
                  className="min-w-0 flex-1 px-4 py-3.5 text-left active:bg-[#F7F1E8]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[15px] font-semibold tracking-wide text-[#2F261F]">
                      {c.codigo}
                    </span>
                    {!isUnlimited ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                          used
                            ? "bg-[#F3E0E0] text-[#8F2F2F]"
                            : "bg-[#E4F0E6] text-[#1F5C2E]"
                        }`}
                      >
                        {used ? "Usado" : "Disponible"}
                      </span>
                    ) : null}
                  </div>
                  {usageBits.length > 0 ? (
                    <p className="mt-1 truncate text-[13px] text-[#8A735C]">
                      {usageBits.join(" · ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-[13px] text-[#B5A290]">
                      {isUnlimited ? "Sin usos" : "Sin reserva"}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={
                    sent
                      ? `Reenviar ${c.codigo} por mail. Mantener para marcar enviado`
                      : `Enviar ${c.codigo} por mail. Mantener para marcar enviado`
                  }
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    sendLongPressDone.current = false
                    clearSendPressTimer()
                    sendPressTimer.current = window.setTimeout(() => {
                      sendLongPressDone.current = true
                      openManualSend(c)
                      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                        try {
                          navigator.vibrate(12)
                        } catch {
                          // ignore
                        }
                      }
                    }, 1000)
                  }}
                  onPointerUp={() => clearSendPressTimer()}
                  onPointerLeave={() => clearSendPressTimer()}
                  onPointerCancel={() => clearSendPressTimer()}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (sendLongPressDone.current) {
                      sendLongPressDone.current = false
                      return
                    }
                    openEmailSend(c)
                  }}
                  className={`flex w-12 shrink-0 touch-manipulation items-center justify-center border-l select-none active:opacity-80 ${
                    sent
                      ? "border-[#C5DBF0] bg-[#DCEAF8] text-[#1E5A8A]"
                      : "border-[#EFE7DB] bg-transparent text-[#5A4638] active:bg-[#F7F1E8]"
                  }`}
                >
                  {sent ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Send className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </li>
            )
          })
        )}
      </ul>

      {/* Agregar siguientes — debajo del último */}
      {!isUnlimited && seriesHint && inCategory.length > 0 ? (
        <div className="mt-3 rounded-[1.25rem] bg-white p-4 ring-1 ring-[#E8DFD2]">
          <p className="text-sm font-semibold text-[#2F261F]">
            Agregar a la secuencia
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#8A735C]">
            Sigue {seriesHint.prefix}… de {seriesHint.step} en{" "}
            {seriesHint.step}. Máximo {COUPON_BATCH_MAX} por vez.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center rounded-2xl bg-[#F0E8DC]">
              <button
                type="button"
                aria-label="Menos"
                onClick={() => setAddCount((n) => clampAddCount(n - 1))}
                className="flex h-12 w-12 items-center justify-center text-xl font-medium text-[#5A4638]"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={COUPON_BATCH_MAX}
                value={addCount}
                onChange={(e) =>
                  setAddCount(clampAddCount(Number(e.target.value)))
                }
                className="h-12 w-14 bg-transparent text-center text-[16px] font-semibold tabular-nums text-[#2F261F] outline-none"
              />
              <button
                type="button"
                aria-label="Más"
                onClick={() => setAddCount((n) => clampAddCount(n + 1))}
                className="flex h-12 w-12 items-center justify-center text-xl font-medium text-[#5A4638]"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const n = clampAddCount(addCount)
                const from = seriesHint.nextCode
                const to =
                  generatePrefixedSeries({
                    prefix: seriesHint.prefix,
                    start: seriesHint.nextNum,
                    step: seriesHint.step,
                    count: n,
                  }).at(-1) ?? from
                askConfirm({
                  title: n === 1 ? "¿Agregar 1 cupón?" : `¿Agregar ${n} cupones?`,
                  body:
                    n === 1
                      ? `Se crea ${from} con el mismo % y vencimiento.`
                      : `Se crean ${from} … ${to} (salto ${seriesHint.step}).`,
                  confirmLabel: n === 1 ? "Agregar" : `Agregar ${n}`,
                  run: async () => {
                    await runAction(
                      {
                        action: "add_next",
                        categoria: activeCategory,
                        count: n,
                      },
                      n === 1
                        ? `${from} agregado.`
                        : `${n} cupones agregados (${from}…${to}).`,
                    )
                  },
                })
              }}
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#2F261F] text-sm font-semibold text-[#FAF7F2] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Agregar
            </button>
          </div>
          {addPreview.length > 0 ? (
            <p className="mt-2.5 font-mono text-[11px] text-[#9A8168]">
              {addPreview.join(" · ")}
              {clampAddCount(addCount) > addPreview.length ? " · …" : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() =>
          askConfirm({
            title: "Resetear todos",
            body: "Todos los cupones usados de todas las series vuelven a libres.",
            confirmLabel: "Resetear todos",
            danger: true,
            run: async () => {
              await runAction({ action: "reset_all" }, "Todo liberado.")
            },
          })
        }
        className="mt-6 w-full text-center text-xs text-[#B5A290]"
      >
        Resetear todos
      </button>

      {/* FAB */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-[#F3EBE0] via-[#F3EBE0]/95 to-transparent">
        <button
          type="button"
          onClick={() => {
            setCreateDirty(false)
            setShowCreate(true)
          }}
          className="pointer-events-auto inline-flex h-14 items-center gap-2 rounded-full bg-[#2F261F] px-6 text-base font-semibold text-[#FAF7F2] shadow-[0_10px_30px_rgba(47,38,31,0.35)] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Crear serie
        </button>
      </div>

      {/* Row actions sheet */}
      <Sheet
        open={Boolean(menuCoupon)}
        onClose={() => setRowMenuId(null)}
        title={menuCoupon?.codigo ?? "Cupón"}
      >
        {menuCoupon ? (
          <div className="space-y-2 pb-4 pt-2">
            {menuCoupon.enviado && menuCoupon.enviado_email ? (
              <div className="flex items-center justify-center gap-2.5 rounded-xl bg-[#F0E8DC] px-3 py-2.5">
                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  menuCoupon.enviado_email.trim(),
                ) ? (
                  <Mail
                    className="h-3.5 w-3.5 shrink-0 text-[#7A6654]"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : null}
                <p className="min-w-0 truncate text-[13px] text-[#5A4638]">
                  {menuCoupon.enviado_email}
                </p>
              </div>
            ) : menuCoupon.enviado ? (
              <div className="flex items-center justify-center gap-2.5 rounded-xl bg-[#F0E8DC] px-3 py-2.5">
                <Mail
                  className="h-3.5 w-3.5 shrink-0 text-[#7A6654]"
                  strokeWidth={2.25}
                  aria-label="Enviado"
                />
              </div>
            ) : null}
            {!isUnlimited && !menuCoupon.usado ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  askConfirm({
                    title: `¿Marcar ${menuCoupon.codigo} como usado?`,
                    body: "Quedará como usado (marcado desde el admin).",
                    confirmLabel: "Marcar usado",
                    run: async () => {
                      await runAction(
                        {
                          action: "mark_used",
                          id: menuCoupon.id,
                          reservedName: "Manual",
                        },
                        `${menuCoupon.codigo} marcado como usado.`,
                      )
                    },
                  })
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F0E6] text-[#1F5C2E]">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#2F261F]">
                    Marcar como usado
                  </span>
                  <span className="text-xs text-[#8A735C]">
                    Si lo reservaste por fuera
                  </span>
                </span>
              </button>
            ) : null}
            {!isUnlimited && (menuCoupon.usado || menuCoupon.enviado)
              ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  askConfirm({
                    title: `¿Resetear ${menuCoupon.codigo}?`,
                    body: menuCoupon.usado
                      ? "Vuelve a estar disponible y se borra el estado enviado."
                      : "Se borra el estado enviado (el avión vuelve a aparecer).",
                    confirmLabel: "Resetear",
                    danger: true,
                    run: async () => {
                      await runAction(
                        { action: "reset_one", id: menuCoupon.id },
                        `${menuCoupon.codigo} libre.`,
                      )
                    },
                  })
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFE7DB] text-[#5A4638]">
                  <RotateCcw className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#2F261F]">
                    Resetear
                  </span>
                  <span className="text-xs text-[#8A735C]">
                    {menuCoupon.usado
                      ? "Libre otra vez · sin enviado"
                      : "Quitar estado enviado"}
                  </span>
                </span>
              </button>
            ) : isUnlimited && menuCoupon.enviado ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  askConfirm({
                    title: `¿Resetear envío de ${menuCoupon.codigo}?`,
                    body: "Se borra el estado enviado (el avión vuelve a aparecer).",
                    confirmLabel: "Resetear",
                    danger: true,
                    run: async () => {
                      await runAction(
                        { action: "reset_one", id: menuCoupon.id },
                        `${menuCoupon.codigo}: envío borrado.`,
                      )
                    },
                  })
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFE7DB] text-[#5A4638]">
                  <RotateCcw className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#2F261F]">
                    Resetear
                  </span>
                  <span className="text-xs text-[#8A735C]">
                    Quitar estado enviado
                  </span>
                </span>
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                askConfirm({
                  title: `Eliminar ${menuCoupon.codigo}`,
                  body: "Se borra de la base. No se puede deshacer.",
                  confirmLabel: "Eliminar",
                  danger: true,
                  run: async () => {
                    await runAction(
                      { action: "delete_one", id: menuCoupon.id },
                      `${menuCoupon.codigo} eliminado.`,
                    )
                  },
                })
              }
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6E4E4] text-[#8F2F2F]">
                <Trash2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#8F2F2F]">
                  Eliminar
                </span>
                <span className="text-xs text-[#8A735C]">
                  Sacarlo de la lista
                </span>
              </span>
            </button>
          </div>
        ) : null}
      </Sheet>

      {/* Edit series sheet */}
      <Sheet
        open={showEditSeries}
        onClose={requestCloseEditSeries}
        title="Editar serie"
      >
        <div className="space-y-4 pb-6 pt-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#2F261F]">
              {seriesIsActive ? "Activa" : "Pausada"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={seriesIsActive}
              aria-label={
                seriesIsActive ? "Desactivar serie" : "Activar serie"
              }
              disabled={busy}
              onClick={() =>
                askConfirm({
                  title: seriesIsActive
                    ? "¿Desactivar esta serie?"
                    : "¿Activar esta serie?",
                  body: seriesIsActive
                    ? "Los cupones de esta serie dejan de valer en el configurador."
                    : "Los cupones de esta serie vuelven a valer en el configurador.",
                  confirmLabel: seriesIsActive ? "Desactivar" : "Activar",
                  danger: seriesIsActive,
                  run: async () => {
                    await runAction(
                      {
                        action: "set_series_active",
                        categoria: activeCategory,
                        activo: !seriesIsActive,
                      },
                      seriesIsActive
                        ? "Serie desactivada."
                        : "Serie activada.",
                    )
                  },
                })
              }
              style={{
                position: "relative",
                width: 52,
                height: 32,
                borderRadius: 999,
                backgroundColor: seriesIsActive ? "#5B9A6A" : "#C4B5A4",
                border: "none",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: seriesIsActive ? 23 : 3,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                Descuento %
              </p>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={editDiscount}
                onChange={(e) => {
                  setEditSeriesDirty(true)
                  setEditDiscount(
                    Math.min(100, Math.max(1, Number(e.target.value) || 1)),
                  )
                }}
                className={field}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                Vence
              </p>
              <input
                type="date"
                value={editExpires}
                onChange={(e) => {
                  setEditSeriesDirty(true)
                  setEditExpires(e.target.value)
                }}
                className={field}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={busy || !activeCategory || !editExpires}
            onClick={() =>
              void (async () => {
                const ok = await runAction(
                  {
                    action: "update_series",
                    categoria: activeCategory,
                    discountPercent: editDiscount,
                    expiresOn: editExpires,
                  },
                  "Serie actualizada.",
                )
                if (ok) closeEditSeries()
              })()
            }
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#2F261F] text-base font-semibold text-[#FAF7F2] disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>

          <button
            type="button"
            disabled={!activeCategory}
            onClick={() => {
              const initial = activeCategory
                ? (seriesMessages[activeCategory] ?? "")
                : ""
              setEditMessage(initial)
              setEditMessageBaseline(initial)
              setEditMessageDirty(false)
              setShowEditMessage(true)
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCEAF8] text-[#1E5A8A]">
              <Pencil className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#2F261F]">
                Editar mensaje
              </span>
              <span className="text-xs text-[#8A735C]">
                Texto del mail al enviar un cupón
              </span>
            </span>
          </button>

          <div className="space-y-2 border-t border-[#E8DFD2] pt-4">
            {!isUnlimited && stats.used > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  askConfirm({
                    title: "¿Resetear usados de la serie?",
                    body: `Se liberan ${stats.used} cupones usados.`,
                    confirmLabel: "Resetear usados",
                    danger: true,
                    run: async () => {
                      const ok = await runAction(
                        {
                          action: "reset_category",
                          categoria: activeCategory,
                        },
                        "Usados liberados.",
                      )
                      if (ok) closeEditSeries()
                    },
                  })
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFE7DB] text-[#5A4638]">
                  <RotateCcw className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#2F261F]">
                    Resetear usados
                  </span>
                  <span className="text-xs text-[#8A735C]">
                    {stats.used} vuelven a disponibles
                  </span>
                </span>
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy || !activeCategory}
              onClick={() =>
                askConfirm({
                  title: "¿Eliminar toda la serie?",
                  body: `Se borran los ${stats.total} cupones de “${activeMeta ? shortCategoryLabel(activeMeta.label) : "esta serie"}”. No se puede deshacer.`,
                  confirmLabel: `Eliminar ${stats.total}`,
                  danger: true,
                  run: async () => {
                    const ok = await runAction(
                      {
                        action: "delete_series",
                        categoria: activeCategory,
                      },
                      "Serie eliminada.",
                    )
                    if (ok) closeEditSeries()
                  },
                })
              }
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-[#E8DFD2]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6E4E4] text-[#8F2F2F]">
                <Trash2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#8F2F2F]">
                  Eliminar serie
                </span>
                <span className="text-xs text-[#8A735C]">
                  Borra todos los cupones
                </span>
              </span>
            </button>
          </div>
        </div>
      </Sheet>

      {/* Edit message sheet */}
      <Sheet
        open={showEditMessage}
        onClose={requestCloseEditMessage}
        title="Mensaje del mail"
      >
        <div className="space-y-3 pb-6 pt-1">
          <p className="text-xs leading-relaxed text-[#8A735C]">
            Placeholders: {"{{codigo}}"}, {"{{descuento}}"}, {"{{vence}}"}. Se
            reemplazan al enviar cada cupón.
          </p>
          <p className="text-xs leading-relaxed text-[#8A735C]">
            La firma al final es: “Atentamente, Walter de{" "}
            <em>Momento Único</em>”.
          </p>
          <textarea
            value={editMessage}
            onChange={(e) => {
              setEditMessage(e.target.value)
              setEditMessageDirty(true)
            }}
            rows={14}
            className="w-full resize-y rounded-2xl border-0 bg-[#F0E8DC] px-4 py-3 text-[15px] leading-relaxed text-[#2F261F] outline-none ring-1 ring-[#E0D4C4] focus:ring-2 focus:ring-[#C4A882]"
            placeholder="Escribí el mensaje que se envía con el cupón…"
          />
          <button
            type="button"
            disabled={busy || !activeCategory}
            onClick={() =>
              void (async () => {
                const ok = await runAction(
                  {
                    action: "set_series_message",
                    categoria: activeCategory,
                    mensajeEmail: editMessage,
                  },
                  "Mensaje guardado.",
                )
                if (ok) {
                  if (activeCategory) {
                    setSeriesMessages((prev) => ({
                      ...prev,
                      [activeCategory]: editMessage,
                    }))
                  }
                  closeEditMessage()
                }
              })()
            }
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#2F261F] text-base font-semibold text-[#FAF7F2] disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar mensaje"}
          </button>
        </div>
      </Sheet>

      {/* Send coupon by email */}
      <Sheet
        open={Boolean(sendCoupon)}
        onClose={requestCloseSend}
        title={
          sendCoupon ? `Enviar ${sendCoupon.codigo}` : "Enviar cupón"
        }
      >
        {sendCoupon ? (
          <div className="space-y-3 pb-6 pt-1">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                Destinatario
              </p>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={sendEmail}
                onChange={(e) => {
                  setSendEmail(e.target.value)
                  setSendDirty(true)
                }}
                placeholder="mail@ejemplo.com"
                className={field}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                Vista previa
              </p>
              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[#F0E8DC] px-4 py-3 text-[13px] leading-relaxed text-[#2F261F] ring-1 ring-[#E0D4C4]">
                {(() => {
                  const text = fillCouponMessage(
                    seriesMessages[sendCoupon.categoria] ?? "",
                    {
                      codigo: sendCoupon.codigo,
                      descuento: Number(sendCoupon.descuento_porcentaje) || 0,
                      vence: sendCoupon.valido_hasta,
                    },
                  ).trim()
                  if (!text) {
                    return (
                      <span className="text-[#8A735C]">
                        No hay mensaje en esta serie. Editá el mensaje desde la
                        serie.
                      </span>
                    )
                  }
                  return text
                })()}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8A735C]">
                La firma al final es: “Atentamente, Walter de{" "}
                <em>Momento Único</em>”.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void (async () => {
                  const to = sendEmail.trim()
                  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
                  if (!emailOk) {
                    setFlash({
                      type: "err",
                      text: "Ingresá un email válido.",
                    })
                    return
                  }
                  const pct =
                    Number(sendCoupon.descuento_porcentaje) || 0
                  const body = composeCouponEmailBody(
                    seriesMessages[sendCoupon.categoria] ?? "",
                    {
                      codigo: sendCoupon.codigo,
                      descuento: pct,
                      vence: sendCoupon.valido_hasta,
                    },
                  )
                  if (!body) {
                    setFlash({
                      type: "err",
                      text: "Esta serie no tiene mensaje. Editalo primero.",
                    })
                    return
                  }
                  const subject = `CUPÓN DE REGALO ${pct}% OFF`
                  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                  window.location.href = href
                  const ok = await runAction(
                    {
                      action: "mark_sent",
                      id: sendCoupon.id,
                      email: to.toLowerCase(),
                    },
                    `${sendCoupon.codigo} marcado como enviado.`,
                  )
                  if (ok) closeSend()
                })()
              }
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2F261F] text-base font-semibold text-[#FAF7F2] disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
              Enviar
            </button>
          </div>
        ) : null}
      </Sheet>

      {/* Marcar enviado manual (WhatsApp, etc.) */}
      <Sheet
        open={Boolean(manualSendCoupon)}
        onClose={() => !busy && closeManualSend()}
        title={
          manualSendCoupon
            ? `Marcar ${manualSendCoupon.codigo}`
            : "Marcar enviado"
        }
      >
        {manualSendCoupon ? (
          <div className="space-y-3 pb-6 pt-1">
            <p className="text-sm leading-relaxed text-[#7A6654]">
              Para cuando lo mandás por WhatsApp u otro medio. Queda como
              enviado con el nombre que indiques.
            </p>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                Nombre / a quién
              </p>
              <input
                type="text"
                value={manualSendName}
                onChange={(e) => setManualSendName(e.target.value)}
                placeholder="Ej. María · WhatsApp"
                className={field}
                autoFocus
              />
            </div>
            <button
              type="button"
              disabled={busy || !manualSendName.trim()}
              onClick={() =>
                void (async () => {
                  const name = manualSendName.trim()
                  if (!name) {
                    setFlash({
                      type: "err",
                      text: "Ingresá un nombre.",
                    })
                    return
                  }
                  const ok = await runAction(
                    {
                      action: "mark_sent",
                      id: manualSendCoupon.id,
                      email: name,
                    },
                    `${manualSendCoupon.codigo} marcado como enviado.`,
                  )
                  if (ok) closeManualSend()
                })()
              }
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2F261F] text-base font-semibold text-[#FAF7F2] disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Marcar como enviado
            </button>
          </div>
        ) : null}
      </Sheet>

      {/* Create sheet */}
      <Sheet
        open={showCreate}
        onClose={requestCloseCreate}
        title="Crear serie"
      >
        <div className="pb-6 pt-1">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EFE7DB] p-1">
            <button
              type="button"
              onClick={() => {
                if (createMode !== "unique") setCreateDirty(true)
                setCreateMode("unique")
              }}
              className={`rounded-xl py-3 text-sm font-semibold ${
                createMode === "unique"
                  ? "bg-white text-[#2F261F] shadow-sm"
                  : "text-[#7A6654]"
              }`}
            >
              Uso único
            </button>
            <button
              type="button"
              onClick={() => {
                if (createMode !== "libre") setCreateDirty(true)
                setCreateMode("libre")
              }}
              className={`rounded-xl py-3 text-sm font-semibold ${
                createMode === "libre"
                  ? "bg-white text-[#2F261F] shadow-sm"
                  : "text-[#7A6654]"
              }`}
            >
              Uso libre
            </button>
          </div>

          {createMode === "unique" ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-[#7A6654]">
                Palabra + número en secuencia. Un código = un cliente.
              </p>
              <label className="flex items-center gap-3 rounded-2xl bg-[#F0E8DC] px-4 py-3.5 text-sm text-[#2F261F]">
                <input
                  type="checkbox"
                  checked={uUseExisting}
                  onChange={(e) => {
                    setCreateDirty(true)
                    setUUseExisting(e.target.checked)
                  }}
                  className="h-4 w-4"
                />
                Sumar a la serie actual
              </label>
              {!uUseExisting || isUnlimited || !activeCategory ? (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Campaña
                  </p>
                  <input
                    value={uLabel}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setULabel(e.target.value)
                    }}
                    className={field}
                  />
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Palabra
                  </p>
                  <input
                    value={uPrefix}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setUPrefix(e.target.value.toUpperCase())
                    }}
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Nº inicial
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={uStart}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setUStart(Number(e.target.value))
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Salto
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={uStep}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setUStep(Number(e.target.value))
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Cantidad (máx. {COUPON_BATCH_MAX})
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={COUPON_BATCH_MAX}
                    value={uCount}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setUCount(
                        Math.min(
                          COUPON_BATCH_MAX,
                          Math.max(1, Math.floor(Number(e.target.value) || 1)),
                        ),
                      )
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Descuento %
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    value={uDiscount}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setUDiscount(Number(e.target.value))
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Vence
                  </p>
                  <input
                    type="date"
                    value={uExpires}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setUExpires(e.target.value)
                    }}
                    className={field}
                  />
                </div>
              </div>
              {uniquePreview.length > 0 ? (
                <p className="font-mono text-xs leading-relaxed text-[#9A8168]">
                  {uniquePreview.join("  ·  ")}
                  {Number(uCount) > uniquePreview.length ? "  ·  …" : ""}
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleCreateUnique()}
                className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-[#2F261F] text-base font-semibold text-[#FAF7F2] disabled:opacity-50"
              >
                {busy ? "Creando…" : "Crear serie"}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-[#7A6654]">
                Un código libre. Se usa hasta la fecha de vencimiento.
              </p>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                  Campaña (opcional)
                </p>
                <input
                  value={lLabel}
                  onChange={(e) => {
                    setCreateDirty(true)
                    setLLabel(e.target.value)
                  }}
                  className={field}
                  placeholder="Stories IG"
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                  Código
                </p>
                <input
                  value={lCode}
                  onChange={(e) => {
                    setCreateDirty(true)
                    setLCode(e.target.value)
                  }}
                  className={`${field} font-mono uppercase`}
                  placeholder="AMOR30"
                  autoCapitalize="characters"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Descuento %
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    value={lDiscount}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setLDiscount(Number(e.target.value))
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8168]">
                    Vence
                  </p>
                  <input
                    type="date"
                    value={lExpires}
                    onChange={(e) => {
                      setCreateDirty(true)
                      setLExpires(e.target.value)
                    }}
                    className={field}
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={busy || !lCode.trim()}
                onClick={() => void handleCreateLibre()}
                className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-[#2F261F] text-base font-semibold text-[#FAF7F2] disabled:opacity-50"
              >
                {busy ? "Creando…" : "Crear código"}
              </button>
            </div>
          )}
        </div>
      </Sheet>

      {/* Confirm sheet */}
      <Sheet
        open={Boolean(confirm)}
        onClose={() => !busy && setConfirm(null)}
        title={confirm?.title ?? "Confirmar"}
        zClass="z-[10100]"
      >
        {confirm ? (
          <div className="pb-6 pt-2">
            <p className="text-sm leading-relaxed text-[#7A6654]">
              {confirm.body}
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void confirm.run()
                }}
                className="flex h-14 items-center justify-center rounded-2xl text-base font-semibold text-white disabled:opacity-50"
                style={{
                  backgroundColor: confirm.danger ? "#8F2F2F" : "#2F261F",
                }}
              >
                {busy ? "Esperá…" : confirm.confirmLabel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setConfirm(null)
                }}
                className="flex h-12 items-center justify-center rounded-2xl text-sm font-medium text-[#7A6654] disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
