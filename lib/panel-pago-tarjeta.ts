/**
 * Reglas para decidir si el panel muestra el "pago tarjeta" (botón + filtro).
 *
 * Prioridad:
 *  1) Si `rsvpPanel.pagoTarjeta` está definido (true/false), manda ese valor
 *     sin importar si la sección `giftCard` existe o no en la invitación.
 *  2) Si NO está definido, depende de que la invitación tenga la sección
 *     `giftCard` habilitada (`type: "giftCard"` y `enabled !== false`).
 */

/** True si en el array de secciones hay una `giftCard` habilitada (enabled !== false). */
export function giftCardSectionEnabledInSections(sections: unknown): boolean {
  if (!Array.isArray(sections)) return false
  return sections.some((s) => {
    if (!s || typeof s !== "object") return false
    const sec = s as { type?: unknown; enabled?: unknown }
    return sec.type === "giftCard" && sec.enabled !== false
  })
}

/**
 * Decide si el panel debe mostrar el pago tarjeta.
 * @param explicit valor de `rsvpPanel.pagoTarjeta` (o undefined si no está)
 * @param sections secciones de la invitación (ya mergeadas por variante)
 */
export function panelPagoTarjetaEnabled(
  explicit: unknown,
  sections: unknown,
): boolean {
  if (typeof explicit === "boolean") return explicit
  return giftCardSectionEnabledInSections(sections)
}
