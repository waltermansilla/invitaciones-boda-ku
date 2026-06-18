import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findConfigByBaseToken } from "@/lib/config-loader";
import {
    basePinConfigFromEvent,
    clearBasePinCookie,
    isBasePinUnlocked,
    setBasePinUnlockedCookie,
} from "@/lib/base-pin";

export async function POST(request: Request) {
    let body: { baseToken?: string; unlocked?: boolean };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const baseToken =
        typeof body.baseToken === "string" ? body.baseToken.trim() : "";
    if (!/^[A-Za-z0-9]{8}$/.test(baseToken)) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const config = findConfigByBaseToken(baseToken);
    if (!config) {
        return NextResponse.json({ ok: false }, { status: 404 });
    }

    const pinCfg = basePinConfigFromEvent(config);
    if (!pinCfg) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const cookieStore = await cookies();
    const wantUnlocked = Boolean(body.unlocked);

    if (wantUnlocked) {
        setBasePinUnlockedCookie(cookieStore, baseToken);
    } else {
        clearBasePinCookie(cookieStore, baseToken);
    }

    return NextResponse.json({
        ok: true,
        unlocked: wantUnlocked,
    });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const baseToken = (searchParams.get("baseToken") || "").trim();
    if (!/^[A-Za-z0-9]{8}$/.test(baseToken)) {
        return NextResponse.json({ unlocked: false });
    }

    const cookieStore = await cookies();
    return NextResponse.json({
        unlocked: isBasePinUnlocked(cookieStore, baseToken),
    });
}
