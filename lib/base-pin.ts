import type { EventConfig } from "@/lib/config-loader";

export const BASE_PIN_COOKIE_PREFIX = "mu_bp_";
export const BASE_PIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 días

export type BasePinConfig = {
    enabled: boolean;
    pin: string;
    baseToken: string;
};

function normalizePin(raw: unknown): string {
    if (typeof raw !== "string") return "";
    return raw.trim();
}

export function basePinConfigFromEvent(
    config: EventConfig | null | undefined,
): BasePinConfig | null {
    if (!config?.base?.enabled) return null;
    const baseToken =
        typeof config.base.token === "string" ? config.base.token.trim() : "";
    if (!/^[A-Za-z0-9]{8}$/.test(baseToken)) return null;

    const pin = normalizePin(config.base.pin);
    const pinEnabled = Boolean(config.base.pinEnabled);
    if (!pinEnabled || !/^\d{6}$/.test(pin)) return null;

    return { enabled: true, pin, baseToken };
}

export function basePinCookieName(baseToken: string): string {
    return `${BASE_PIN_COOKIE_PREFIX}${baseToken}`;
}

export function isBasePinUnlocked(
    cookieStore: { get: (name: string) => { value: string } | undefined },
    baseToken: string,
): boolean {
    const name = basePinCookieName(baseToken);
    return cookieStore.get(name)?.value === "1";
}

type WritableCookieStore = {
    set: (
        name: string,
        value: string,
        options: {
            httpOnly?: boolean;
            sameSite?: "lax" | "strict" | "none";
            path?: string;
            maxAge?: number;
            secure?: boolean;
        },
    ) => void;
    delete?: (name: string) => void;
};

export function setBasePinUnlockedCookie(
    cookieStore: WritableCookieStore,
    baseToken: string,
): void {
    cookieStore.set(basePinCookieName(baseToken), "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: BASE_PIN_COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
    });
}

export function clearBasePinCookie(
    cookieStore: WritableCookieStore,
    baseToken: string,
): void {
    const name = basePinCookieName(baseToken);
    if (cookieStore.delete) {
        cookieStore.delete(name);
        return;
    }
    cookieStore.set(name, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
    });
}

export function verifyBasePin(
    config: EventConfig | null | undefined,
    candidate: string,
): BasePinConfig | null {
    const pinCfg = basePinConfigFromEvent(config);
    if (!pinCfg) return null;
    const pin = normalizePin(candidate);
    if (!/^\d{6}$/.test(pin)) return null;
    if (pin !== pinCfg.pin) return null;
    return pinCfg;
}
