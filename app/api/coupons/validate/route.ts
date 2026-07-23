import { NextResponse } from "next/server"
import { validateCouponCode } from "@/lib/coupons/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: { code?: string; claimToken?: string; lang?: "es" | "en" }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON", code: "invalid" },
      { status: 400 },
    )
  }

  const result = await validateCouponCode({
    code: typeof body.code === "string" ? body.code : "",
    claimToken: typeof body.claimToken === "string" ? body.claimToken : null,
    lang: body.lang === "en" ? "en" : "es",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
