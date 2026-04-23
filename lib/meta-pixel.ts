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
