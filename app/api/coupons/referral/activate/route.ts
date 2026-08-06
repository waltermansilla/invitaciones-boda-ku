import { NextResponse } from "next/server"
import {
  activateOrGetReferralCoupon,
  REFERRAL_DEFAULT_DISCOUNT,
  REFERRAL_DEFAULT_VALIDITY_DAYS,
} from "@/lib/referrals/activate"
import { buildReferralCodePrefix } from "@/lib/referrals/prefix"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  panelId?: string
  guestCodigo?: string
  codePrefix?: string
  brideName?: string
  groomName?: string
  quinceaneraName?: string
  eventLabel?: string
  discountPercent?: number
  validityDays?: number
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    )
  }

  const panelId = body.panelId?.trim() || ""
  const guestCodigo = body.guestCodigo?.trim() || ""
  if (!panelId || !guestCodigo) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Faltan datos del invitado. Abrí la invitación con tu link personal.",
        code: "missing_guest",
      },
      { status: 400 },
    )
  }

  const codePrefix =
    body.codePrefix?.trim() ||
    buildReferralCodePrefix({
      codePrefix: body.codePrefix,
      brideName: body.brideName,
      groomName: body.groomName,
      quinceaneraName: body.quinceaneraName,
    })

  if (!codePrefix) {
    return NextResponse.json(
      { ok: false, error: "No se pudo armar el prefijo del cupón.", code: "prefix" },
      { status: 400 },
    )
  }

  try {
    const result = await activateOrGetReferralCoupon({
      panelId,
      guestCodigo,
      codePrefix,
      eventLabel: body.eventLabel,
      discountPercent: body.discountPercent ?? REFERRAL_DEFAULT_DISCOUNT,
      validityDays: body.validityDays ?? REFERRAL_DEFAULT_VALIDITY_DAYS,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo activar el cupón."
    console.error("[coupons/referral/activate]", err)
    const status =
      message.includes("link personal") || message.includes("Panel no")
        ? 400
        : 500
    return NextResponse.json(
      { ok: false, error: message, code: "activate_failed" },
      { status },
    )
  }
}
