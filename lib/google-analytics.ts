"use client";

type GaEventParams = Record<string, string | number | boolean>;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

export function trackGaPageView(path: string): void {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
        page_path: path,
        page_location: window.location.href,
    });
}

export function trackGaEvent(
    eventName: string,
    params?: GaEventParams,
): void {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    if (params) {
        window.gtag("event", eventName, params);
        return;
    }
    window.gtag("event", eventName);
}
