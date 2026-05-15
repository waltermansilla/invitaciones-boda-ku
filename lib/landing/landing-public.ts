/** Idioma fijo por ruta: `/` = español, `/en` = inglés. */
export type LandingLanguage = "es" | "en";

/** Moneda elegida en la landing (independiente del idioma). */
export type LandingCurrency = "ARS" | "USD";

/** `?currency=` en la URL (para hidratar igual en servidor y cliente). */
export function landingCurrencyFromSearchParam(
    value: string | string[] | undefined,
): LandingCurrency | undefined {
    const v = Array.isArray(value) ? value[0] : value;
    if (v === "USD" || v === "ARS") return v;
    return undefined;
}
