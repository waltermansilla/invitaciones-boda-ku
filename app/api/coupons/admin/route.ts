import { NextResponse } from "next/server"
import {
  addNextUniqueInCategory,
  createLibreCoupon,
  createUniqueSeries,
  deleteCouponById,
  deleteSeries,
  markCouponSentById,
  markCouponUsedById,
  resetAllCoupons,
  resetCouponById,
  resetCouponsByCategory,
  setSeriesActive,
  updateSeries,
} from "@/lib/coupons/admin"
import { listCouponsAdmin } from "@/lib/coupons/server"
import { setSeriesMessage } from "@/lib/coupons/series-message"
import { setSeriesOrder } from "@/lib/coupons/series-order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await listCouponsAdmin()
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    console.error("[coupons/admin GET]", err)
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "No se pudo cargar el listado de cupones.",
      },
      { status: 500 },
    )
  }
}

type AdminActionBody = {
  action?: string
  id?: string
  categoria?: string
  categoryLabel?: string
  prefix?: string
  start?: number
  step?: number
  count?: number
  discountPercent?: number
  expiresOn?: string
  code?: string
  reservedName?: string
  invitationType?: string
  activo?: boolean
  mensajeEmail?: string
  email?: string
  usageMode?: string
  orderedIds?: string[]
}

export async function POST(req: Request) {
  let body: AdminActionBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    )
  }

  const action = body.action?.trim()
  if (!action) {
    return NextResponse.json(
      { ok: false, error: "Falta action." },
      { status: 400 },
    )
  }

  try {
    switch (action) {
      case "reset_one": {
        if (!body.id) throw new Error("Falta id del cupón.")
        const coupon = await resetCouponById(body.id)
        return NextResponse.json({ ok: true, coupon })
      }
      case "reset_category": {
        if (!body.categoria) throw new Error("Falta categoría.")
        const result = await resetCouponsByCategory(body.categoria)
        return NextResponse.json({ ok: true, ...result })
      }
      case "reset_all": {
        const result = await resetAllCoupons()
        return NextResponse.json({ ok: true, ...result })
      }
      case "delete_one": {
        if (!body.id) throw new Error("Falta id del cupón.")
        const deleted = await deleteCouponById(body.id)
        return NextResponse.json({ ok: true, deleted })
      }
      case "mark_used": {
        if (!body.id) throw new Error("Falta id del cupón.")
        const coupon = await markCouponUsedById(body.id, {
          reservedName:
            typeof body.reservedName === "string" ? body.reservedName : undefined,
          invitationType:
            typeof body.invitationType === "string"
              ? body.invitationType
              : undefined,
        })
        return NextResponse.json({ ok: true, coupon })
      }
      case "mark_sent": {
        if (!body.id) throw new Error("Falta id del cupón.")
        const coupon = await markCouponSentById(
          body.id,
          typeof body.email === "string" ? body.email : null,
        )
        return NextResponse.json({ ok: true, coupon })
      }
      case "update_series": {
        if (!body.categoria) throw new Error("Falta categoría.")
        const result = await updateSeries({
          categoria: body.categoria,
          discountPercent: Number(body.discountPercent),
          expiresOn: String(body.expiresOn ?? ""),
        })
        return NextResponse.json({ ok: true, ...result })
      }
      case "set_series_active": {
        if (!body.categoria) throw new Error("Falta categoría.")
        if (typeof body.activo !== "boolean") {
          throw new Error("Falta activo (true/false).")
        }
        const result = await setSeriesActive(body.categoria, body.activo)
        return NextResponse.json({ ok: true, ...result })
      }
      case "delete_series": {
        if (!body.categoria) throw new Error("Falta categoría.")
        const result = await deleteSeries(body.categoria)
        return NextResponse.json({ ok: true, ...result })
      }
      case "create_unique_series": {
        const result = await createUniqueSeries({
          categoria: body.categoria,
          categoryLabel: body.categoryLabel,
          prefix: String(body.prefix ?? ""),
          start: Number(body.start),
          step: Number(body.step),
          count: Number(body.count),
          discountPercent: Number(body.discountPercent),
          expiresOn: String(body.expiresOn ?? ""),
        })
        return NextResponse.json({ ok: true, ...result })
      }
      case "add_next": {
        if (!body.categoria) throw new Error("Falta categoría.")
        const result = await addNextUniqueInCategory(
          body.categoria,
          body.count === undefined ? 1 : Number(body.count),
        )
        return NextResponse.json({ ok: true, ...result })
      }
      case "create_libre": {
        const result = await createLibreCoupon({
          categoria: body.categoria,
          categoryLabel: body.categoryLabel,
          code: String(body.code ?? ""),
          discountPercent: Number(body.discountPercent),
          expiresOn: String(body.expiresOn ?? ""),
        })
        return NextResponse.json({ ok: true, ...result })
      }
      case "set_series_message": {
        if (!body.categoria) throw new Error("Falta categoría.")
        if (typeof body.mensajeEmail !== "string") {
          throw new Error("Falta mensajeEmail.")
        }
        const result = await setSeriesMessage(
          body.categoria,
          body.mensajeEmail,
        )
        return NextResponse.json({ ok: true, ...result })
      }
      case "reorder_series": {
        const mode = body.usageMode?.trim()
        if (mode !== "single_use" && mode !== "unlimited") {
          throw new Error("usageMode debe ser single_use o unlimited.")
        }
        if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
          throw new Error("Falta orderedIds.")
        }
        const result = await setSeriesOrder(
          mode,
          body.orderedIds.map(String),
        )
        return NextResponse.json({ ok: true, ...result })
      }
      default:
        return NextResponse.json(
          { ok: false, error: `Acción desconocida: ${action}` },
          { status: 400 },
        )
    }
  } catch (err) {
    console.error("[coupons/admin POST]", action, err)
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Error en la operación.",
      },
      { status: 400 },
    )
  }
}
