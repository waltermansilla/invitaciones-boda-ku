import { NextResponse } from "next/server"
import { hasEnabledCouponField } from "@/lib/coupons/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Público: ¿mostrar el campo cupón en el configurador? */
export async function GET() {
  try {
    const enabled = await hasEnabledCouponField()
    return NextResponse.json({ ok: true, enabled })
  } catch (err) {
    console.error("[coupons/enabled]", err)
    return NextResponse.json(
      { ok: false, enabled: false, error: "No se pudo consultar." },
      { status: 500 },
    )
  }
}
