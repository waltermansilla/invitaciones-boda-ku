"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
    LANDING_PRICE_BOOK,
    type LandingPriceBook,
} from "@/lib/landing/landing-price-book";
import type {
    LandingCurrency,
    LandingLanguage,
} from "@/lib/landing/landing-public";

export type LandingPricingContextValue = {
    language: LandingLanguage;
    currency: LandingCurrency;
    setCurrency: (c: LandingCurrency) => void;
    priceBook: LandingPriceBook;
};

const LandingPricingContext = createContext<LandingPricingContextValue>({
    language: "es",
    currency: "ARS",
    setCurrency: () => {},
    priceBook: LANDING_PRICE_BOOK,
});

export function LandingPricingProvider({
    value,
    children,
}: {
    value: LandingPricingContextValue;
    children: ReactNode;
}) {
    return (
        <LandingPricingContext.Provider value={value}>
            {children}
        </LandingPricingContext.Provider>
    );
}

export function useLandingPricing(): LandingPricingContextValue {
    return useContext(LandingPricingContext);
}
