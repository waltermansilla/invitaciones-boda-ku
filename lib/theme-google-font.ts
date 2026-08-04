/**
 * Resuelve la tipografía base del body desde theme.font.
 *
 * Históricamente `weights` venía con comas ("300,400,500…"), formato inválido
 * para Google Fonts CSS2 → la fuente no cargaba y se veía system-ui.
 * Si convertimos comas a ";" de golpe, TODAS las invitaciones cambian de aspecto.
 *
 * Convención actual:
 * - pesos SOLO con coma (legacy) → no cargar Google Font de theme; body = system-ui
 * - pesos con ";" (o un solo peso) → cargar Google Font de verdad
 * - family system-ui / ui-sans-serif → stack de sistema
 */

export const THEME_SYSTEM_FONT_STACK =
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function isSystemFamilyName(family: string): boolean {
    const n = family.trim().toLowerCase();
    return (
        n === "system-ui" ||
        n === "ui-sans-serif" ||
        n === "sans-serif" ||
        n === "serif" ||
        n === "monospace" ||
        n === "-apple-system" ||
        n === "blinkmacsystemfont" ||
        n === "segoe ui" ||
        n === "system"
    );
}

/**
 * null = no pedir esa hoja CSS a Google (legacy o sistema).
 * string = pesos listos para css2 (`300;400;500`).
 */
function googleFontWeightsOrNull(raw: string): string | null {
    const s = String(raw ?? "").trim();
    if (!s) return "300;400;500;600;700";

    if (s.includes(";")) {
        const parts = s
            .split(/[,;]+/)
            .map((w) => w.trim())
            .filter(Boolean);
        return parts.length ? parts.join(";") : null;
    }

    // Solo comas: formato legacy que en la práctica nunca cargó → no autoload
    if (s.includes(",")) {
        return null;
    }

    // Un solo peso: "400"
    if (/^\d{3}$/.test(s)) return s;

    return null;
}

export type ThemeFontConfig = {
    font?:
        | string
        | {
              family?: string;
              weights?: string;
          };
};

export function resolveThemeBodyFont(theme: ThemeFontConfig): {
    /** Nombre de familia del JSON (para comparar extras / docs). */
    configuredFamily: string;
    /** true si hay que linkear Google Fonts para theme.font */
    loadGoogleFont: boolean;
    /** URL css2 o null */
    googleFontUrl: string | null;
    /** font-family completo para body / --font-* */
    cssFontFamily: string;
} {
    const configuredFamily =
        typeof theme.font === "string"
            ? theme.font
            : theme.font?.family || "Cormorant Garamond";

    const weightsRaw =
        typeof theme.font === "string"
            ? "300,400,500,600,700"
            : theme.font?.weights || "300,400,500,600,700";

    if (isSystemFamilyName(configuredFamily)) {
        return {
            configuredFamily,
            loadGoogleFont: false,
            googleFontUrl: null,
            cssFontFamily: THEME_SYSTEM_FONT_STACK,
        };
    }

    const fontWeights = googleFontWeightsOrNull(String(weightsRaw));

    if (!fontWeights) {
        // Legacy (pesos con comas): mismo aspecto de siempre = sistema
        return {
            configuredFamily,
            loadGoogleFont: false,
            googleFontUrl: null,
            cssFontFamily: THEME_SYSTEM_FONT_STACK,
        };
    }

    const encodedFamily = configuredFamily.replace(/ /g, "+");
    const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${fontWeights}&display=swap`;

    return {
        configuredFamily,
        loadGoogleFont: true,
        googleFontUrl,
        cssFontFamily: `'${configuredFamily}', ${THEME_SYSTEM_FONT_STACK}`,
    };
}
