"use client";

type MetaPixelEventParams = Record<string, string | number | boolean>;

/** Campos admitidos para coincidencia avanzada manual (el píxel aplica SHA-256 en el navegador). */
export type MetaAdvancedMatchingUserData = Partial<{
    em: string;
    ph: string;
    fn: string;
    ln: string;
    ct: string;
    st: string;
    zp: string;
    country: string;
    external_id: string;
}>;

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

/**
 * Actualiza coincidencia avanzada tras `fbq('init', pixelId)` inicial.
 * Meta permite llamar de nuevo `fbq('init', mismoPixelId, userData)` con los mismos datos nuevos.
 * Solo pasa datos reales del usuario (no valores de ejemplo).
 */
export function updateMetaPixelAdvancedMatching(
    userData: MetaAdvancedMatchingUserData,
): void {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!pixelId) return;

    const cleaned = Object.fromEntries(
        Object.entries(userData).filter(
            ([, v]) => v != null && String(v).trim() !== "",
        ),
    ) as MetaAdvancedMatchingUserData;

    if (Object.keys(cleaned).length === 0) return;
    window.fbq("init", pixelId, cleaned);
}

export function trackMetaPageView(): void {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
}

export function trackMetaEvent(
    eventName: string,
    params?: MetaPixelEventParams,
    eventId?: string,
): void {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    const options = eventId ? { eventID: eventId } : undefined;
    if (params) {
        if (options) {
            window.fbq("track", eventName, params, options);
            return;
        }
        window.fbq("track", eventName, params);
        return;
    }
    if (options) {
        window.fbq("track", eventName, undefined, options);
        return;
    }
    window.fbq("track", eventName);
}
