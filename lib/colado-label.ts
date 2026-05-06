/**
 * Etiquetas para invitados extra (`rsvpPanel.coladoLabel`).
 *
 * El plural **no** aplica reglas completas del español: a cada palabra (separada por espacios)
 * se le concatena `"s"` (*colado* → *colados*, *persona extra* → *personas extras*).
 * Falla si alguna palabra pluraliza con **-es** u otra forma en español real.
 */
/** Etiqueta por defecto para invitados extra (RSVP / panel). */
export const DEFAULT_COLADO_LABEL = "colado"

/** Normaliza la palabra singular desde JSON (`rsvpPanel.coladoLabel`). */
export function normalizeColadoSingular(raw: unknown): string {
    if (typeof raw !== "string") return DEFAULT_COLADO_LABEL
    const t = raw.trim()
    return t || DEFAULT_COLADO_LABEL
}

/** Plural ingenuo: cada token separado por espacios recibe `+"s"`. Ver comentario del módulo. */
export function coladoPlural(singular: string): string {
    const s = singular.trim() || DEFAULT_COLADO_LABEL
    const parts = s.split(/\s+/).filter(Boolean)
    return parts.map((w) => `${w}s`).join(" ")
}

export function coladoTitleSingular(singular: string): string {
    const s = normalizeColadoSingular(singular)
    return s.charAt(0).toUpperCase() + s.slice(1)
}

export function coladoTitlePlural(singular: string): string {
    const p = coladoPlural(normalizeColadoSingular(singular))
    return p.charAt(0).toUpperCase() + p.slice(1)
}
