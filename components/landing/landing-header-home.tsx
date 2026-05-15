"use client";

import { ChevronDown, Languages } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { LandingTheme } from "@/components/landing/landing-page-home";
import type {
    LandingCurrency,
    LandingLanguage,
} from "@/lib/landing/landing-public";

function handleHeaderAnchorClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    anchor: string,
    afterNavigate?: () => void,
) {
    if (!anchor.startsWith("#")) {
        afterNavigate?.();
        return;
    }
    event.preventDefault();
    const targetId = anchor.slice(1);
    if (!targetId) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
        const target = document.getElementById(targetId);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanUrl);
    afterNavigate?.();
}

function NavLinks({
    nav,
    tx,
    onNavigate,
    className,
}: {
    nav: { label: string; anchor: string }[];
    tx: LandingTheme["text"];
    onNavigate?: () => void;
    className?: string;
}) {
    return (
        <>
            {nav.map((item) => (
                <a
                    key={item.anchor + item.label}
                    href={item.anchor}
                    onClick={(event) =>
                        handleHeaderAnchorClick(event, item.anchor, onNavigate)
                    }
                    className={className}
                    style={{ color: tx.muted, opacity: 0.92 }}
                >
                    {item.label}
                </a>
            ))}
        </>
    );
}

const CURRENCIES: LandingCurrency[] = ["ARS", "USD"];

function languageHrefWithCurrency(
    path: "/" | "/en",
    currency: LandingCurrency,
    withCurrencyQuery: boolean,
): string {
    if (!withCurrencyQuery) return path;
    const q = new URLSearchParams();
    q.set("currency", currency);
    return `${path}?${q.toString()}`;
}

/** Tamaño fijo en px (no hereda el cuerpo de la landing). */
const HEADER_SELECTOR_TEXT: React.CSSProperties = {
    fontSize: "10px",
    lineHeight: 1,
    fontWeight: 600,
};

/** Botón moneda: texto e ícono centrados en altura. */
const HEADER_CURRENCY_ROW =
    "inline-flex h-5 shrink-0 items-center justify-center gap-0.5 rounded-full border border-solid p-px";

/**
 * Carril ES|EN: hijos a altura completa del interior; `p-[2px]` deja leve aire
 * respecto al borde; la pastilla activa (marrón) estira con el segmento.
 */
const LANGUAGE_TRACK_ROW =
    "inline-flex h-5 shrink-0 items-stretch gap-0.5 rounded-full border border-solid p-[2px]";

function LanguageToggle({
    theme,
    tx,
    language,
    currency,
    syncCurrencyFromSearch,
}: {
    theme: LandingTheme;
    tx: LandingTheme["text"];
    language: LandingLanguage;
    currency: LandingCurrency;
    syncCurrencyFromSearch: boolean;
}) {
    const esHref = languageHrefWithCurrency("/", currency, syncCurrencyFromSearch);
    const enHref = languageHrefWithCurrency(
        "/en",
        currency,
        syncCurrencyFromSearch,
    );
    const seg = (active: boolean) =>
        ({
            fontFamily: theme.typography.bodyFont,
            color: active ? theme.background : tx.muted,
            background: active ? theme.accents.softGold : "transparent",
        }) as React.CSSProperties;

    const aria =
        language === "es" ? "Idioma de la web" : "Site language";

    /** Segmentos a altura del carril; texto centrado en el segmento. */
    const segmentClass =
        "flex min-h-0 min-w-[1.05rem] flex-1 items-center justify-center rounded-full px-1 uppercase tracking-tight transition-[color,background] duration-200 sm:min-w-[1.15rem] sm:px-1";

    return (
        <div className="inline-flex h-5 shrink-0 items-center gap-0.5 sm:gap-1">
            <Languages
                className="pointer-events-none h-2.5 w-2.5 shrink-0"
                style={{ color: theme.accents.softGold }}
                strokeWidth={2}
                aria-hidden
            />
            <div
                className={LANGUAGE_TRACK_ROW}
                role="group"
                aria-label={aria}
                style={{
                    borderColor: theme.cardBorder,
                    background: theme.cardBg,
                    fontFamily: theme.typography.bodyFont,
                }}
            >
                {language === "es" ? (
                    <span
                        className={segmentClass}
                        style={{ ...HEADER_SELECTOR_TEXT, ...seg(true) }}
                        aria-current="page"
                    >
                        ES
                    </span>
                ) : (
                    <a
                        href={esHref}
                        className={`${segmentClass} no-underline`}
                        style={{ ...HEADER_SELECTOR_TEXT, ...seg(false) }}
                        aria-label="Sitio en español"
                    >
                        ES
                    </a>
                )}
                {language === "en" ? (
                    <span
                        className={segmentClass}
                        style={{ ...HEADER_SELECTOR_TEXT, ...seg(true) }}
                        aria-current="page"
                    >
                        EN
                    </span>
                ) : (
                    <a
                        href={enHref}
                        className={`${segmentClass} no-underline`}
                        style={{ ...HEADER_SELECTOR_TEXT, ...seg(false) }}
                        aria-label="Sitio en inglés"
                    >
                        EN
                    </a>
                )}
            </div>
        </div>
    );
}

function CurrencyToggle({
    theme,
    tx,
    currency,
    onCurrencyChange,
    language,
}: {
    theme: LandingTheme;
    tx: LandingTheme["text"];
    currency: LandingCurrency;
    onCurrencyChange: (c: LandingCurrency) => void;
    language: LandingLanguage;
}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onPointer = (e: PointerEvent) => {
            const el = wrapRef.current;
            const t = e.target as Node | null;
            if (el && t && !el.contains(t)) setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("pointerdown", onPointer, true);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("pointerdown", onPointer, true);
        };
    }, [open]);

    const triggerLabel =
        language === "es"
            ? `Moneda: ${currency}. Tocá para cambiar`
            : `Currency: ${currency}. Click or tap to change`;
    const listLabel =
        language === "es" ? "Elegir moneda" : "Choose currency";
    const listId = useId();

    return (
        <div ref={wrapRef} className="relative flex items-center">
            <button
                type="button"
                className={`${HEADER_CURRENCY_ROW} px-1 uppercase tracking-tight transition-[color,background,box-shadow] duration-200 sm:px-1.5`}
                style={{
                    fontFamily: theme.typography.bodyFont,
                    borderColor: theme.cardBorder,
                    background: theme.cardBg,
                    color: tx.muted,
                    ...HEADER_SELECTOR_TEXT,
                    boxShadow: open
                        ? `0 0 0 1px ${theme.accents.softGold}`
                        : undefined,
                }}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={listId}
                aria-label={triggerLabel}
                onClick={() => setOpen((o) => !o)}
            >
                <span
                    className="min-w-[1.4rem] text-center tabular-nums"
                    style={{ color: tx.heading, ...HEADER_SELECTOR_TEXT }}
                >
                    {currency}
                </span>
                <ChevronDown
                    className={`pointer-events-none h-2 w-2 shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    strokeWidth={2}
                    aria-hidden
                />
            </button>
            {open ? (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={listLabel}
                    className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[6.25rem] overflow-hidden rounded-xl border py-0.5 shadow-lg"
                    style={{
                        borderColor: theme.cardBorder,
                        background: theme.background,
                        fontFamily: theme.typography.bodyFont,
                    }}
                >
                    {CURRENCIES.filter((c) => c !== currency).map((c) => (
                        <li key={c} role="presentation">
                            <button
                                type="button"
                                role="option"
                                aria-selected={false}
                                className="flex w-full items-center px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 hover:bg-black/[0.06]"
                                style={{ color: tx.heading }}
                                onClick={() => {
                                    onCurrencyChange(c);
                                    setOpen(false);
                                }}
                            >
                                {c}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

export function LandingHeader({
    theme,
    brand,
    nav,
    cta,
    language,
    currency,
    onCurrencyChange,
    syncCurrencyFromSearch = false,
    brandHref = "/",
}: {
    theme: LandingTheme;
    brand: string;
    nav: { label: string; anchor: string }[];
    cta?: { label: string; anchor: string };
    language: LandingLanguage;
    currency: LandingCurrency;
    onCurrencyChange: (c: LandingCurrency) => void;
    syncCurrencyFromSearch?: boolean;
    brandHref?: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuId = useId();
    const tx = theme.text;

    useEffect(() => {
        if (menuOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);
    const menuLabel = language === "es" ? "Abrir menú" : "Open menu";
    const menuLabelClose = language === "es" ? "Cerrar menú" : "Close menu";
    return (
        <header
            className="sticky top-0 z-[45] flex items-center border-b border-solid backdrop-blur-md"
            style={{
                backgroundColor: `${theme.background}e6`,
                borderBottomColor: theme.cardBorder,
            }}
        >
            <div
                className="mx-auto flex w-full max-w-6xl flex-col px-5 md:px-8"
                style={{
                    paddingTop: "max(0.45rem, env(safe-area-inset-top, 0px))",
                    paddingBottom:
                        "max(0.35rem, env(safe-area-inset-bottom, 0px))",
                }}
            >
                <div className="flex items-center justify-between gap-3">
                    <a
                        href={brandHref}
                        className="inline-flex shrink-0 items-center text-base font-normal leading-none tracking-tight transition-opacity hover:opacity-80 md:text-lg"
                        style={{
                            fontFamily: theme.typography.headingFont,
                            color: tx.heading,
                        }}
                        onClick={closeMenu}
                    >
                        {brand}
                    </a>

                    <nav
                        className="hidden flex-1 flex-wrap content-center items-center justify-center gap-x-6 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] md:flex lg:text-[11px]"
                        aria-label={
                            language === "es" ? "Principal" : "Main"
                        }
                    >
                        <NavLinks
                            nav={nav}
                            tx={tx}
                            className="transition-colors duration-200 hover:opacity-100"
                        />
                    </nav>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <LanguageToggle
                            theme={theme}
                            tx={tx}
                            language={language}
                            currency={currency}
                            syncCurrencyFromSearch={syncCurrencyFromSearch}
                        />
                        <CurrencyToggle
                            theme={theme}
                            tx={tx}
                            currency={currency}
                            onCurrencyChange={onCurrencyChange}
                            language={language}
                        />
                        {cta ? (
                            <a
                                href={cta.anchor}
                                onClick={(event) =>
                                    handleHeaderAnchorClick(event, cta.anchor)
                                }
                                className="hidden rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-[background,color,transform] duration-200 hover:scale-[1.02] md:inline-flex md:px-4 md:py-2 md:text-[11px]"
                                style={{
                                    borderColor: theme.foreground,
                                    color: theme.foreground,
                                    background: theme.background,
                                }}
                            >
                                {cta.label}
                            </a>
                        ) : null}

                        <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center md:hidden"
                            aria-expanded={menuOpen}
                            aria-controls={menuId}
                            aria-label={menuOpen ? menuLabelClose : menuLabel}
                            onClick={() => setMenuOpen((o) => !o)}
                        >
                            <span className="relative block h-2 w-[22px]">
                                <span
                                    className="absolute left-0 top-0 block h-0.5 w-full rounded-full transition-transform duration-300 ease-out motion-reduce:duration-75"
                                    style={{
                                        backgroundColor: tx.heading,
                                        transformOrigin: "50% 50%",
                                        transform: menuOpen
                                            ? "translateY(3px) rotate(45deg)"
                                            : "translateY(0) rotate(0deg)",
                                    }}
                                />
                                <span
                                    className="absolute bottom-0 left-0 block h-0.5 w-full rounded-full transition-transform duration-300 ease-out motion-reduce:duration-75"
                                    style={{
                                        backgroundColor: tx.heading,
                                        transformOrigin: "50% 50%",
                                        transform: menuOpen
                                            ? "translateY(-3px) rotate(-45deg)"
                                            : "translateY(0) rotate(0deg)",
                                    }}
                                />
                            </span>
                        </button>
                    </div>
                </div>

                <div
                    id={menuId}
                    className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none md:hidden"
                    style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr" }}
                    aria-hidden={!menuOpen}
                >
                    <div
                        className={`min-h-0 overflow-hidden ${menuOpen ? "" : "pointer-events-none"}`}
                    >
                        <div
                            className="border-t pt-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
                            style={{
                                borderColor: theme.cardBorder,
                                opacity: menuOpen ? 1 : 0,
                                transform: menuOpen
                                    ? "translateY(0)"
                                    : "translateY(-8px)",
                            }}
                        >
                            <nav
                                className="flex flex-col gap-1 pb-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
                                aria-label={
                                    language === "es" ? "Principal" : "Main"
                                }
                            >
                                <NavLinks
                                    nav={nav}
                                    tx={tx}
                                    onNavigate={closeMenu}
                                    className="rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-black/[0.04]"
                                />
                            </nav>
                            {cta ? (
                                <a
                                    href={cta.anchor}
                                    onClick={(event) =>
                                        handleHeaderAnchorClick(
                                            event,
                                            cta.anchor,
                                            closeMenu,
                                        )
                                    }
                                    className="mb-3 mt-1 block rounded-full border px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition-[transform,opacity] duration-200 active:scale-[0.99]"
                                    style={{
                                        borderColor: theme.foreground,
                                        color: theme.foreground,
                                        background: theme.background,
                                        opacity: menuOpen ? 1 : 0,
                                    }}
                                >
                                    {cta.label}
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
