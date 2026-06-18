import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    findConfigByBaseToken,
    findConfigByPanelId,
} from "@/lib/config-loader";
import {
    basePinConfigFromEvent,
    isBasePinUnlocked,
} from "@/lib/base-pin";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const baseToken = (searchParams.get("baseToken") || "").trim();
    const panelId = (searchParams.get("panelId") || "").trim();

    let config = baseToken ? findConfigByBaseToken(baseToken) : null;
    if (!config && panelId) {
        config = findConfigByPanelId(panelId);
    }
    if (!config) {
        return NextResponse.json({ required: false, unlocked: true });
    }

    const pinCfg = basePinConfigFromEvent(config);
    if (!pinCfg) {
        return NextResponse.json({ required: false, unlocked: true });
    }

    const cookieStore = await cookies();
    const unlocked = isBasePinUnlocked(cookieStore, pinCfg.baseToken);

    return NextResponse.json({
        required: true,
        unlocked,
        baseToken: pinCfg.baseToken,
    });
}
