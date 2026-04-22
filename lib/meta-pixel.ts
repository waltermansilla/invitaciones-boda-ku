"use client";

type MetaPixelEventParams = Record<string, string | number | boolean>;

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

export function trackMetaPageView(): void {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
}

export function trackMetaEvent(
    eventName: string,
    params?: MetaPixelEventParams,
): void {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    if (params) {
        window.fbq("track", eventName, params);
        return;
    }
    window.fbq("track", eventName);
}
