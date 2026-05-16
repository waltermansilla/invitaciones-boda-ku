import {
    LANDING_PRICE_BOOK,
    type LandingPriceBook,
} from "@/lib/landing/landing-price-book";
import type { LandingCurrency, LandingLanguage } from "@/lib/landing/landing-public";

/** Montos por moneda (landing + configurador). */
export type ConfiguratorPrice = Record<LandingCurrency, number>;

export type LandingPricePair = {
    ars: number;
    usd: number;
    /** Solo se usa si `pricing.json` → `mxn.referenciaUSD` es `false`. */
    mxn?: number;
};

export function isLandingCurrency(value: string | null | undefined): value is LandingCurrency {
    return value === "ARS" || value === "USD" || value === "MXN";
}

function mxnFromUsd(usd: number, usdmxn: number): number {
    return Math.round(usd * usdmxn);
}

/** Resuelve el monto numérico según moneda y reglas MXN del price book. */
export function pickLandingAmount(
    pair: LandingPricePair,
    currency: LandingCurrency,
    book: LandingPriceBook,
): number {
    if (currency === "ARS") return pair.ars;
    if (currency === "USD") return pair.usd;

    const { referenciaUSD, usdmxn } = book.mxn;
    if (referenciaUSD) return mxnFromUsd(pair.usd, usdmxn);
    if (pair.mxn != null) return pair.mxn;
    return mxnFromUsd(pair.usd, usdmxn);
}

export function pairToConfiguratorPrice(
    pair: LandingPricePair,
    book: LandingPriceBook = LANDING_PRICE_BOOK,
): ConfiguratorPrice {
    return {
        ARS: pair.ars,
        USD: pair.usd,
        MXN: pickLandingAmount(pair, "MXN", book),
    };
}

/** Moneda del configurador: query de la landing o default por idioma. */
export function configuradorCurrencyFromSearch(
    curParam: string | null,
    uiLang: LandingLanguage,
): LandingCurrency {
    if (isLandingCurrency(curParam)) return curParam;
    return uiLang === "en" ? "USD" : "ARS";
}

export function computePanelExtraGuestsCost(
    extraGuests: number,
    stepGuests: number,
    stepPair: LandingPricePair,
    currency: LandingCurrency,
    book: LandingPriceBook = LANDING_PRICE_BOOK,
): number {
    const stepAmount = pickLandingAmount(stepPair, currency, book);
    return Math.round((extraGuests * stepAmount) / stepGuests);
}

export function formatLandingMoney(amount: number, currency: LandingCurrency): string {
    if (currency === "ARS") return `$${amount.toLocaleString("es-AR")}`;
    if (currency === "MXN") return `MXN ${amount.toLocaleString("es-MX")}`;
    return `USD ${amount.toLocaleString("en-US")}`;
}

export function formatExtraSectionParen(
    book: LandingPriceBook,
    language: LandingLanguage,
    currency: LandingCurrency,
): string {
    const n = pickLandingAmount(book.configurator.extraSection, currency, book);
    if (language === "en") {
        if (currency === "ARS") return `(+ARS ${n.toLocaleString("en-US")} per extra section)`;
        if (currency === "MXN") return `(+MXN ${n.toLocaleString("es-MX")} per extra section)`;
        return `(+USD ${n.toLocaleString("en-US")} per extra section)`;
    }
    if (currency === "ARS") return `(+$${n.toLocaleString("es-AR")} por sección extra)`;
    if (currency === "MXN") return `(+MXN ${n.toLocaleString("es-MX")} por sección extra)`;
    return `(+USD ${n.toLocaleString("en-US")} por sección extra)`;
}

export function formatSecondLangParen(
    book: LandingPriceBook,
    language: LandingLanguage,
    currency: LandingCurrency,
): string {
    const n = pickLandingAmount(book.configurator.secondLanguage, currency, book);
    if (language === "en") {
        if (currency === "ARS") return `(+ARS ${n.toLocaleString("en-US")})`;
        if (currency === "MXN") return `(+MXN ${n.toLocaleString("es-MX")})`;
        return `(+USD ${n.toLocaleString("en-US")})`;
    }
    if (currency === "ARS") return `(+$${n.toLocaleString("es-AR")})`;
    if (currency === "MXN") return `(+MXN ${n.toLocaleString("es-MX")})`;
    return `(+USD ${n.toLocaleString("en-US")})`;
}
