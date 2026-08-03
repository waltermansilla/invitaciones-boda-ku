import type { CSSProperties } from "react";
import type { ClientConfig } from "@/lib/get-client-config";

/**
 * Tipografía opcional por bloque de texto en una sección.
 * Todo es opcional: si no se setea, se mantiene el look/CSS actual.
 *
 * Campos:
 * - font: nombre exacto de Google Fonts (ej. "Cormorant Garamond")
 * - sizePx: tamaño en px
 * - weight: peso (ej. 300, "600")
 * - letterSpacing: número = px; string con unidad (ej. "0.12em");
 *   o presets "none" | "normal" | "wide" (igual que overlay.nameStyle)
 * - uppercase: false = quita mayúsculas forzadas (títulos con clase uppercase);
 *   true = fuerza mayúsculas. Si no se setea, queda el default del componente.
 * - textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
 *   (si está, tiene prioridad sobre `uppercase`)
 * - enabled: false = desactiva este bloque de estilo sin borrarlo (default true)
 *
 * En el JSON de cada sección va como hermano de type/id/data:
 *   "style": {
 *     "enabled": true,
 *     "title": { "font": "...", "sizePx": 28, "uppercase": false, "enabled": true },
 *     "value": { "sizePx": 25, "weight": 400 }
 *   }
 * También: "style": false desactiva todo el style de la sección.
 * Las claves dentro de `style` son el nombre real de la parte (igual que en
 * blocks/data: title, value, paragraphs, address, …).
 */
export type SectionTextStyle = {
    font?: string;
    sizePx?: number;
    weight?: string | number;
    letterSpacing?: string | number;
    /** false = respeta minúsculas del texto (anula uppercase del CSS). */
    uppercase?: boolean;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    /** false = ignora este estilo (útil para apagar sin borrar el JSON). */
    enabled?: boolean;
};

/** Mapa parte → tipografía, hermano de type/id/data en la sección. */
export type SectionStyleMap = Record<string, SectionTextStyle>;

const LETTER_SPACING_PRESETS: Record<string, string> = {
    none: "0",
    normal: "0.1em",
    wide: "0.2em",
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseLetterSpacing(raw: unknown): string | undefined {
    if (typeof raw === "number" && Number.isFinite(raw)) return `${raw}px`;
    if (typeof raw !== "string") return undefined;
    const t = raw.trim();
    if (!t) return undefined;
    const preset = LETTER_SPACING_PRESETS[t.toLowerCase()];
    if (preset !== undefined) return preset;
    return t;
}

/** Normaliza un objeto crudo del JSON a SectionTextStyle (o null si vacío/inválido). */
export function parseSectionTextStyle(raw: unknown): SectionTextStyle | null {
    if (!isRecord(raw)) return null;
    // Apagar esta parte sin borrar el resto de campos.
    if (raw.enabled === false) return null;

    const out: SectionTextStyle = {};

    if (typeof raw.font === "string" && raw.font.trim()) {
        out.font = raw.font.trim();
    }

    if (typeof raw.sizePx === "number" && Number.isFinite(raw.sizePx) && raw.sizePx > 0) {
        out.sizePx = raw.sizePx;
    }

    if (typeof raw.weight === "number" && Number.isFinite(raw.weight)) {
        out.weight = raw.weight;
    } else if (typeof raw.weight === "string" && raw.weight.trim()) {
        out.weight = raw.weight.trim();
    }

    const ls = parseLetterSpacing(raw.letterSpacing);
    if (ls !== undefined) out.letterSpacing = ls;

    if (typeof raw.uppercase === "boolean") {
        out.uppercase = raw.uppercase;
    }

    if (typeof raw.textTransform === "string") {
        const tt = raw.textTransform.trim().toLowerCase();
        if (
            tt === "none" ||
            tt === "uppercase" ||
            tt === "lowercase" ||
            tt === "capitalize"
        ) {
            out.textTransform = tt;
        }
    }

    // Compat overlay-like: lowercase: true ⇒ no forzar mayúsculas
    if (out.textTransform === undefined && raw.lowercase === true) {
        out.uppercase = false;
    }

    if (
        out.font === undefined &&
        out.sizePx === undefined &&
        out.weight === undefined &&
        out.letterSpacing === undefined &&
        out.uppercase === undefined &&
        out.textTransform === undefined
    ) {
        return null;
    }
    return out;
}

/** CSS inline a partir de SectionTextStyle. No pisa propiedades no definidas. */
export function sectionTextStyleToCss(
    style: SectionTextStyle | null | undefined,
): CSSProperties | undefined {
    if (!style) return undefined;
    const css: CSSProperties = {};
    if (style.font) {
        css.fontFamily = `'${style.font}', ui-sans-serif, system-ui, sans-serif`;
    }
    if (typeof style.sizePx === "number") {
        css.fontSize = `${style.sizePx}px`;
    }
    if (style.weight !== undefined && style.weight !== "") {
        css.fontWeight = style.weight as CSSProperties["fontWeight"];
    }
    if (typeof style.letterSpacing === "string" && style.letterSpacing) {
        css.letterSpacing = style.letterSpacing;
    } else if (typeof style.letterSpacing === "number") {
        css.letterSpacing = `${style.letterSpacing}px`;
    }
    if (style.textTransform) {
        css.textTransform = style.textTransform;
    } else if (style.uppercase === false) {
        css.textTransform = "none";
    } else if (style.uppercase === true) {
        css.textTransform = "uppercase";
    }
    return Object.keys(css).length ? css : undefined;
}

/** Normaliza el objeto `style` hermano de type/id/data. */
export function parseSectionStyleMap(raw: unknown): SectionStyleMap | null {
    // "style": false → apaga todos los estilos de la sección (sin borrar el resto del JSON).
    if (raw === false) return null;
    if (raw === true) return null;
    if (!isRecord(raw)) return null;
    // "style": { "enabled": false, "title": { … } } → igual, ignora las partes.
    if (raw.enabled === false) return null;

    const out: SectionStyleMap = {};
    for (const [part, value] of Object.entries(raw)) {
        if (
            part === "enabled" ||
            part.startsWith("//") ||
            part.startsWith("_")
        ) {
            continue;
        }
        const parsed = parseSectionTextStyle(value);
        if (parsed) out[part] = parsed;
    }
    return Object.keys(out).length ? out : null;
}

/** Tipografía de una parte (`title`, `body`, …) dentro de `section.style`. */
export function getSectionPartTextStyle(
    styleMap: SectionStyleMap | null | undefined,
    part: string,
): SectionTextStyle | null {
    if (!styleMap) return null;
    return styleMap[part] ?? null;
}

function normalizeFontName(name: string): string {
    return name.trim().replace(/^['"]|['"]$/g, "");
}

function fontsEqual(a: string, b: string): boolean {
    return (
        normalizeFontName(a).localeCompare(normalizeFontName(b), undefined, {
            sensitivity: "accent",
        }) === 0
    );
}

function pushFont(set: Set<string>, themeFont: string, font?: string) {
    const raw = font?.trim();
    if (!raw) return;
    if (fontsEqual(raw, themeFont)) return;
    set.add(normalizeFontName(raw));
}

function collectFontsFromTextStyle(
    set: Set<string>,
    themeFont: string,
    raw: unknown,
) {
    const parsed = parseSectionTextStyle(raw);
    if (parsed?.font) pushFont(set, themeFont, parsed.font);
}

/**
 * Recorre el config y junta Google Fonts extras (distintas al theme)
 * usadas en overlay.nameStyle y en `section.style` (partes tipográficas).
 */
export function collectExtraSectionFontFamilies(
    config: ClientConfig,
    themeFontFamily: string,
): string[] {
    const themeFont = normalizeFontName(themeFontFamily) || "Cormorant Garamond";
    const set = new Set<string>();

    const overlay = config.overlay as
        | { enabled?: boolean; nameStyle?: { font?: string } }
        | undefined;
    if (overlay?.enabled) {
        pushFont(set, themeFont, overlay.nameStyle?.font);
    }

    const sections = Array.isArray(config.sections) ? config.sections : [];
    for (const section of sections) {
        if (!isRecord(section)) continue;
        const styleMap = parseSectionStyleMap(section.style);
        if (styleMap) {
            for (const partStyle of Object.values(styleMap)) {
                if (partStyle.font) pushFont(set, themeFont, partStyle.font);
            }
        }
        // Compat: titleStyle/bodyStyle antiguos dentro de data (si alguien los dejó).
        const data = section.data;
        if (!isRecord(data)) continue;
        collectFontsFromTextStyle(set, themeFont, data.titleStyle);
        collectFontsFromTextStyle(set, themeFont, data.bodyStyle);
    }

    return [...set];
}

/** Un href de Google Fonts por familia. */
export function googleFontStylesheetHref(family: string): string {
    const encoded = normalizeFontName(family).replace(/ /g, "+");
    return `https://fonts.googleapis.com/css2?family=${encoded}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
}

/**
 * Hrefs extra a cargar en el layout (overlay + tipografías de sección).
 */
export function extraGoogleFontStylesheetHrefs(
    config: ClientConfig,
    themeFontFamily: string,
): string[] {
    return collectExtraSectionFontFamilies(config, themeFontFamily).map(
        googleFontStylesheetHref,
    );
}
