import type { ClientConfig } from "@/lib/get-client-config";
import { extraGoogleFontStylesheetHrefs } from "@/lib/section-text-style";

/**
 * Si el overlay de bienvenida usa otra fuente que el tema, devuelve el href de
 * Google Fonts para cargarla (el layout solo incluye theme.font hoy).
 *
 * @deprecated Preferí `extraGoogleFontStylesheetHrefs` (cubre overlay + tipografías de sección).
 */
export function overlayNameStyleFontHref(
    config: ClientConfig,
    themeFontFamily: string,
): string | null {
    return extraGoogleFontStylesheetHrefs(config, themeFontFamily)[0] ?? null;
}
