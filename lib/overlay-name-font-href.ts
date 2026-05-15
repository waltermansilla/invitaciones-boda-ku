import type { ClientConfig } from "@/lib/get-client-config";

/**
 * Si el overlay de bienvenida usa otra fuente que el tema, devuelve el href de
 * Google Fonts para cargarla (el layout solo incluye theme.font hoy).
 */
export function overlayNameStyleFontHref(
    config: ClientConfig,
    themeFontFamily: string,
): string | null {
    const overlay = config.overlay as
        | { enabled?: boolean; nameStyle?: { font?: string } }
        | undefined;
    if (!overlay?.enabled) return null;
    const raw = overlay.nameStyle?.font?.trim();
    if (!raw) return null;

    const themeNorm = themeFontFamily.trim().replace(/^['"]|['"]$/g, "");
    if (raw.localeCompare(themeNorm, undefined, { sensitivity: "accent" }) === 0)
        return null;

    const encoded = raw.replace(/ /g, "+");
    return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
}
