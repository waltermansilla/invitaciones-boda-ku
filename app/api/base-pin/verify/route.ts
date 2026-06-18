import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    findConfigByBaseToken,
    findConfigByPanelId,
} from "@/lib/config-loader";
import {
    setBasePinUnlockedCookie,
    verifyBasePin,
} from "@/lib/base-pin";

export async function POST(request: Request) {
    let body: { pin?: string; baseToken?: string; panelId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    const baseToken =
        typeof body.baseToken === "string" ? body.baseToken.trim() : "";
    const panelId =
        typeof body.panelId === "string" ? body.panelId.trim() : "";

    let config = baseToken ? findConfigByBaseToken(baseToken) : null;
    if (!config && panelId) {
        config = findConfigByPanelId(panelId);
    }
    if (!config) {
        return NextResponse.json({ ok: false }, { status: 404 });
    }

    const verified = verifyBasePin(config, pin);
    if (!verified) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const cookieStore = await cookies();
    setBasePinUnlockedCookie(cookieStore, verified.baseToken);

    return NextResponse.json({ ok: true });
}
