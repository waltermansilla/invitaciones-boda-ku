import { NextResponse } from "next/server"
import { redeemCouponCode } from "@/lib/coupons/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON", code: "invalid" },
      { status: 400 },
    )
  }

  const result = await redeemCouponCode({
    code: typeof body.code === "string" ? body.code : "",
    claimToken: typeof body.claimToken === "string" ? body.claimToken : "",
    reservedName:
      typeof body.reservedName === "string" ? body.reservedName : "",
    invitationType:
      typeof body.invitationType === "string" ? body.invitationType : "",
    lang: body.lang === "en" ? "en" : "es",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
