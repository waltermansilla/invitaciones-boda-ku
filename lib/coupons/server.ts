import { createServiceClient } from "@/lib/supabase/service"
import {
  couponPublicError,
  isCouponExpired,
  isUnlimitedCategory,
  normalizeCouponCode,
  toAppliedCouponInfo,
} from "@/lib/coupons/logic"
import { resolveCategoryMeta } from "@/lib/coupons/types"
import type {
  CouponRedeemErr,
  CouponRedeemOk,
  CouponValidateErr,
  CouponValidateOk,
  CuponRow,
} from "@/lib/coupons/types"

type Lang = "es" | "en"

async function loadCupon(codigoNormalized: string): Promise<CuponRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .eq("codigo", codigoNormalized)
    .maybeSingle()
  if (error) throw error
  return (data as CuponRow | null) ?? null
}

function canReuse(
  cupon: CuponRow,
  claimToken: string | null | undefined,
): boolean {
  if (!cupon.usado) return false
  if (!claimToken || !cupon.usado_device) return false
  return cupon.usado_device === claimToken
}

export async function validateCouponCode(opts: {
  code: string
  claimToken?: string | null
  lang?: Lang
}): Promise<CouponValidateOk | CouponValidateErr> {
  const lang = opts.lang ?? "es"
  const normalized = normalizeCouponCode(opts.code)
  if (!normalized) {
    return {
      ok: false,
      error: couponPublicError("missing", lang),
      code: "missing",
    }
  }

  try {
    const cupon = await loadCupon(normalized)
    if (!cupon) {
      return {
        ok: false,
        error: couponPublicError("not_found", lang),
        code: "not_found",
      }
    }
    if (!cupon.activo) {
      return {
        ok: false,
        error: couponPublicError("inactive", lang),
        code: "inactive",
      }
    }
    if (isCouponExpired(cupon.valido_hasta)) {
      return {
        ok: false,
        error: couponPublicError("expired", lang),
        code: "expired",
      }
    }

    // Uso libre: no se bloquea por "usado"
    if (isUnlimitedCategory(cupon.categoria)) {
      return {
        ok: true,
        coupon: toAppliedCouponInfo(cupon),
        reused: false,
      }
    }

    if (cupon.usado) {
      if (canReuse(cupon, opts.claimToken)) {
        return {
          ok: true,
          coupon: toAppliedCouponInfo(cupon),
          reused: true,
        }
      }
      return {
        ok: false,
        error: couponPublicError("used", lang),
        code: "used",
      }
    }
    return {
      ok: true,
      coupon: toAppliedCouponInfo(cupon),
      reused: false,
    }
  } catch (err) {
    console.error("[coupons/validate]", err)
    return {
      ok: false,
      error: couponPublicError("server", lang),
      code: "server",
    }
  }
}

export type RedeemPayload = {
  code: string
  claimToken: string
  reservedName: string
  invitationType: string
  lang?: Lang
}

export async function redeemCouponCode(
  opts: RedeemPayload,
): Promise<CouponRedeemOk | CouponRedeemErr> {
  const lang = opts.lang ?? "es"
  const normalized = normalizeCouponCode(opts.code)
  const claimToken = opts.claimToken?.trim()

  if (!normalized) {
    return {
      ok: false,
      error: couponPublicError("missing", lang),
      code: "missing",
    }
  }
  if (!claimToken) {
    return {
      ok: false,
      error: couponPublicError("invalid", lang),
      code: "invalid",
    }
  }

  try {
    const cupon = await loadCupon(normalized)
    if (!cupon) {
      return {
        ok: false,
        error: couponPublicError("not_found", lang),
        code: "not_found",
      }
    }
    if (!cupon.activo) {
      return {
        ok: false,
        error: couponPublicError("inactive", lang),
        code: "inactive",
      }
    }
    if (isCouponExpired(cupon.valido_hasta)) {
      return {
        ok: false,
        error: couponPublicError("expired", lang),
        code: "expired",
      }
    }

    const supabase = createServiceClient()

    // Uso libre: no se quema; solo registramos último uso para el panel
    if (isUnlimitedCategory(cupon.categoria)) {
      const { error } = await supabase
        .from("cupones")
        .update({
          usado: false,
          usado_at: new Date().toISOString(),
          usado_device: claimToken,
          usado_nombre: opts.reservedName.trim() || null,
          usado_tipo_evento: opts.invitationType || null,
        })
        .eq("id", cupon.id)
      if (error) throw error
      return {
        ok: true,
        coupon: toAppliedCouponInfo(cupon),
        reused: false,
      }
    }

    const redemption = {
      usado: true,
      usado_at: new Date().toISOString(),
      usado_device: claimToken,
      usado_nombre: opts.reservedName.trim() || null,
      usado_tipo_evento: opts.invitationType || null,
    }

    if (cupon.usado) {
      if (!canReuse(cupon, claimToken)) {
        return {
          ok: false,
          error: couponPublicError("used", lang),
          code: "used",
        }
      }
      const { error } = await supabase
        .from("cupones")
        .update(redemption)
        .eq("id", cupon.id)
        .eq("usado_device", claimToken)
      if (error) throw error
      return {
        ok: true,
        coupon: toAppliedCouponInfo(cupon),
        reused: true,
      }
    }

    const { data: updated, error } = await supabase
      .from("cupones")
      .update(redemption)
      .eq("id", cupon.id)
      .eq("usado", false)
      .select("id")
      .maybeSingle()

    if (error) throw error
    if (!updated) {
      return {
        ok: false,
        error: couponPublicError("used", lang),
        code: "used",
      }
    }

    return {
      ok: true,
      coupon: toAppliedCouponInfo(cupon),
      reused: false,
    }
  } catch (err) {
    console.error("[coupons/redeem]", err)
    return {
      ok: false,
      error: couponPublicError("server", lang),
      code: "server",
    }
  }
}

export async function listCouponsAdmin() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .order("codigo", { ascending: true })
  if (error) throw error

  let coupons = (data ?? []) as CuponRow[]
  // Referidos: sin duplicados y orden de activación (más reciente primero)
  const { dedupeReferralCouponsForAdmin } = await import(
    "@/lib/referrals/activate"
  )
  coupons = dedupeReferralCouponsForAdmin(coupons)
  coupons = [...coupons].sort((a, b) => {
    if (a.categoria === "referido" && b.categoria === "referido") {
      // Primero por cliente, luego por activación
      const la = (a.evento_label || a.panel_id || "").toString()
      const lb = (b.evento_label || b.panel_id || "").toString()
      const byLabel = la.localeCompare(lb, "es")
      if (byLabel !== 0) return byLabel
      const ta =
        (a.activado_at && Date.parse(a.activado_at)) ||
        (a.created_at && Date.parse(a.created_at)) ||
        0
      const tb =
        (b.activado_at && Date.parse(b.activado_at)) ||
        (b.created_at && Date.parse(b.created_at)) ||
        0
      if (ta !== tb) return tb - ta
    }
    return a.codigo.localeCompare(b.codigo, "es")
  })
  const categoryIds = [...new Set(coupons.map((c) => c.categoria))]
  const categories = categoryIds.map((id) => {
    const meta = resolveCategoryMeta(id)
    return {
      id: meta.id,
      label: meta.label,
      description: meta.description,
      usageMode: meta.usageMode,
    }
  })

  // Incluir categorías conocidas vacías (p.ej. libre / referidos)
  for (const id of ["unico", "libre", "referido"] as const) {
    if (!categories.some((c) => c.id === id)) {
      const meta = resolveCategoryMeta(id)
      categories.push({
        id: meta.id,
        label: meta.label,
        description: meta.description,
        usageMode: meta.usageMode,
      })
    }
  }

  const { listSeriesMessages } = await import("@/lib/coupons/series-message")
  const { listSeriesOrders, sortCategoriesByOrder } = await import(
    "@/lib/coupons/series-order"
  )
  const seriesMessages = await listSeriesMessages()
  const seriesOrders = await listSeriesOrders()
  const sortedCategories = sortCategoriesByOrder(categories, seriesOrders)

  return { categories: sortedCategories, coupons, seriesMessages }
}
