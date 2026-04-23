"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
    Banknote,
    BarChart3,
    Check,
    ChevronDown,
    ChevronRight,
    Globe2,
    Heart,
    Inbox,
    Languages,
    LayoutDashboard,
    Leaf,
    Link as LinkIcon,
    MailCheck,
    MapPin,
    Palette,
    RefreshCw,
    Scale,
    Snowflake,
    Smartphone,
    Sparkles,
    Star,
    UserCheck,
    Users,
    Utensils,
    X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
    Fragment,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import {
    LandingHeader,
    type LandingLocale,
} from "@/components/landing/landing-header-home";
import { eventTypeLabelFromFolderTipo } from "@/lib/client-helpers-shared";
import { trackMetaEvent } from "@/lib/meta-pixel";
import FooterSection from "@/components/wedding/footer-section";
import pricingData from "@/data/landing/pricing.json";

/** sessionStorage: posición vertical al abrir /configurador (restaurar al volver). */
const MU_LANDING_RETURN_SCROLL_KEY = "mu-landing-return-scroll";

/* ─── Icon registry ─── */
const ICON_MAP: Record<string, LucideIcon> = {
    palette: Palette,
    mailCheck: MailCheck,
    users: Users,
    mapPin: MapPin,
    languages: Languages,
    banknote: Banknote,
    layoutDashboard: LayoutDashboard,
    smartphone: Smartphone,
    refreshCw: RefreshCw,
    sparkles: Sparkles,
    inbox: Inbox,
    link: LinkIcon,
    userCheck: UserCheck,
    utensils: Utensils,
    barChart: BarChart3,
};

function TdyIcon({
    name,
    size = 18,
    color,
    className,
}: {
    name: string;
    size?: number;
    color?: string;
    className?: string;
}) {
    const I = ICON_MAP[name] ?? Sparkles;
    return (
        <I
            size={size}
            strokeWidth={1.75}
            className={className}
            style={color ? { color } : undefined}
            aria-hidden
        />
    );
}

/* ─── Theme types ─── */
export interface LandingTheme {
    background: string;
    foreground: string;
    cardBg: string;
    cardBorder: string;
    footerBg: string;
    footerText: string;
    surfaceAlt: string;
    typography: {
        headingFont: string;
        bodyFont: string;
        priceFont: string;
        priceLetterSpacing: string;
    };
    text: {
        heading: string;
        body: string;
        muted: string;
        caption: string;
        highlight: string;
        link: string;
        linkUnderline?: boolean;
        inverse: string;
    };
    buttons: {
        primaryBg: string;
        primaryText: string;
        primaryHoverBg: string;
        secondaryBorder: string;
        secondaryText: string;
        secondaryBg: string;
        secondaryHoverBg: string;
        demoBg: string;
        demoText: string;
        demoOverlayBorder: string;
        demoOverlayText: string;
        floatingBg: string;
        floatingText: string;
        floatingSubtext: string;
        floatingBorderRadius: string;
        floatingBoxShadow: string;
    };
    comparativa: {
        paperCardOpacity: number;
        paperTotalStrike: string;
        digitalCardBg: string;
        digitalCardBorder: string;
        digitalBadgeBg: string;
        digitalBadgeText: string;
        savingsColor: string;
        digitalBulletIconBg: string;
        digitalBulletIconColor: string;
        tableHeaderBg: string;
        tablePaperCircleBg: string;
        tablePaperIcon: string;
        tableDigitalCircleBg: string;
        tableDigitalIcon: string;
    };
    accents: {
        star: string;
        softGold: string;
        success: string;
        iconMuted: string;
    };
}

interface CtaButton {
    text: string;
    type: "whatsapp" | "anchor" | "link";
    message?: string;
    anchor?: string;
    url?: string;
    newTab?: boolean;
}

export type LandingPostEstilosSectionId =
    | "panel"
    | "idiomas"
    | "servicio"
    | "proceso"
    | "faq";

export interface LandingData {
    theme: LandingTheme;
    /** Orden y apariencia post-carrusel Estilos; si falta, se usa el orden clásico (idiomas → proceso → panel → planes → FAQ). */
    pageLayout?: {
        heroSectionId?: string;
        reviewsTopSimple?: boolean;
        postEstilosSections?: {
            id: LandingPostEstilosSectionId;
            surface: "default" | "alt";
        }[];
        /** Valor del query `from` en enlaces a /configurador (p. ej. home). */
        configuradorFromQuery?: string;
    };
    /** Barra superior estilo landing + anclas; si falta, no se renderiza */
    header?: {
        brand: string;
        nav: { label: string; anchor: string }[];
        cta?: { label: string; anchor: string };
    };
    floatingCta?: {
        enabled: boolean;
        line1: string;
        line1Usd?: string;
        line2: string;
        anchor: string;
        /** id del elemento (sin #) que al entrar en vista oculta el botón; por defecto se usa el anchor sin # */
        hideWhenSectionId?: string;
        /** múltiples ids del elemento (sin #) que al entrar en vista ocultan el botón */
        hideWhenSectionIds?: string[];
    };
    whatsapp: { number: string; defaultMessage: string };
    ctaButtons: Record<string, CtaButton>;
    sections: {
        hero: {
            enabled: boolean;
            /** @deprecated No se usa en el hero. */
            languagesBadge?: string;
            title: { line1: string; line2: string; rotatingWords?: string[] };
            subtitle: string;
            /** Texto pequeño con icono, justo encima del bloque de opiniones (p. ej. dos idiomas). */
            languagesHint?: string;
            reviews?: {
                enabled: boolean;
                rating: string;
                count: number;
                source: string;
                linkText: string;
                url: string;
            };
        };
        incluye: {
            id?: string;
            title: string;
            subtitle: string;
            listStyle?: {
                fontSizePx?: number;
                gapPx?: number;
                iconSize?: number;
            };
            imageSrc: string;
            /** Misma carpeta que el video por defecto (`primerframe.png`). Si se define, reemplaza esa ruta. */
            videoPosterSrc?: string;
            imageAlt: string;
            items: { text: string; icon: string }[] | string[];
        };
        comparativa: {
            id?: string;
            title: string;
            lead: string;
            /** Encabezados de la tabla papel vs digital (por idioma) */
            tableHeaders?: { feature: string; paper: string; digital: string };
            paper: {
                title: string;
                guestHint: string;
                lines: { label: string; value: string }[];
                totalLabel: string;
                totalValue: string;
                totalValueUsd?: string;
            };
            digital: {
                title: string;
                badge: string;
                savingsLine: string;
                bullets:
                    | { text: string; subtext?: string; icon: string }[]
                    | string[];
                fromLabel: string;
                fromPrice: string;
                fromPriceUsd?: string;
                footnote: string;
            };
            tableTitle: string;
            tableRows: { feature: string; paper: string; digital: string }[];
            ecoNote: string;
        };
        estilos: {
            id?: string;
            eyebrow: string;
            title: string;
            subtitle: string;
            demoButtonText: string;
            noStylePrompt: string;
            noStyleCta: string;
            noStyleWhatsappMessage: string;
            noStyleConfirmMessage?: string;
            items: {
                image?: string;
                videoSrc?: string;
                titulo: string;
                descripcion: string;
                href: string;
            }[];
        };
        idiomas: {
            title: string;
            subtitle: string;
            globeImageSrc?: string;
            languages: { code: string; name: string }[];
            bullets: string[];
            missingLanguageTitle?: string;
            missingLanguageSubtitle?: string;
        };
        proceso: {
            enabled: boolean;
            /** Ancla para el menú (ej. #proceso) */
            id?: string;
            title: string;
            steps: {
                number: string;
                title: string;
                description: string;
                icon?: string;
            }[];
        };
        panel: {
            eyebrow: string;
            title: string;
            subtitle: string;
            panelUrlLabel: string;
            imageSrc: string;
            imageAlt: string;
            /** Píxeles reales del archivo (evita recorte con next/image width/height). */
            imageWidth?: number;
            imageHeight?: number;
            stats: { value: string; label: string }[];
            guestListTitle: string;
            guestListTotal: string;
            sampleGuests: { name: string; note: string }[];
            features: { title: string; subtitle: string; icon?: string }[];
        };
        servicio: {
            enabled: boolean;
            title: string;
            subtitle: string;
            showPrices: boolean;
            notice?: string;
            /** Bloque opcional bajo las tarjetas de planes (enlace ancla, p. ej. a #muestras). */
            modelsLinkPrompt?: string;
            modelsLinkCta?: string;
            modelsLinkAnchor?: string;
            planes: {
                name: string;
                ctaButton: string;
                badge: string | null;
                price: string;
                priceUsd?: string;
                description: string;
                features: string[];
            }[];
            sharedFeatures: { title: string; items: string[] };
        };
        faq: {
            enabled: boolean;
            id?: string;
            title: string;
            subtitle?: string;
            /** Título sobre el CTA principal al pie del FAQ (layout compacto / JSON). */
            footerCtaTitle?: string;
            items: { question: string; answer: string }[];
        };
    };
}

const THEME_DEFAULTS: Partial<LandingTheme> = {
    typography: {
        headingFont: "'Playfair Display', Georgia, serif",
        bodyFont: "ui-sans-serif, system-ui, sans-serif",
        priceFont:
            'var(--font-landing-price), "Cormorant Garamond", Georgia, serif',
        priceLetterSpacing: "-0.03em",
    },
    text: {
        heading: "#1C1B19",
        body: "#2C2A26",
        muted: "#5E5A54",
        caption: "#7A756D",
        highlight: "#1C1B19",
        link: "#1C1B19",
        inverse: "#FDFBF7",
    },
    buttons: {
        primaryBg: "#1A1917",
        primaryText: "#FFFCF8",
        primaryHoverBg: "#2E2C28",
        secondaryBorder: "#1A1917",
        secondaryText: "#1A1917",
        secondaryBg: "#FFFCF8",
        secondaryHoverBg: "#F3EEE6",
        demoBg: "#1C1B19",
        demoText: "#FDFBF7",
        demoOverlayBorder: "rgba(255,252,248,0.55)",
        demoOverlayText: "rgba(255,252,248,0.95)",
        floatingBg: "#1A1917",
        floatingText: "#FFFCF8",
        floatingSubtext: "rgba(255,252,248,0.78)",
        floatingBorderRadius: "9999px",
        floatingBoxShadow:
            "0 2px 6px rgba(26, 25, 23, 0.06), 0 6px 18px rgba(26, 25, 23, 0.09)",
    },
    comparativa: {
        paperCardOpacity: 0.55,
        paperTotalStrike: "#C62828",
        digitalCardBg: "#EDE6DC",
        digitalCardBorder: "#7A6554",
        digitalBadgeBg: "#1A1917",
        digitalBadgeText: "#FFFCF8",
        savingsColor: "#5C4D3F",
        digitalBulletIconBg: "#D9CFC2",
        digitalBulletIconColor: "#4A3F35",
        tableHeaderBg: "#F3EEE6",
        tablePaperCircleBg: "#FFEBEE",
        tablePaperIcon: "#B71C1C",
        tableDigitalCircleBg: "#E8F5E9",
        tableDigitalIcon: "#1B5E20",
    },
    accents: {
        star: "#D4A017",
        softGold: "#B8956A",
        success: "#2F5F3A",
        iconMuted: "#8A847A",
    },
};

function priceTypeStyle(theme: LandingTheme): React.CSSProperties {
    return {
        fontFamily: theme.typography.priceFont,
        letterSpacing: theme.typography.priceLetterSpacing,
        fontVariantNumeric: "lining-nums tabular-nums",
    };
}

function formatArs(amount: number, locale: LandingLocale): string {
    if (locale === "en") return `ARS ${amount.toLocaleString("en-US")}`;
    return `$${amount.toLocaleString("es-AR")}`;
}

function formatUsd(
    amount: number,
    locale: LandingLocale,
    variant: "USD" | "US$" = "USD",
): string {
    const n = Math.ceil(amount);
    const unit = variant === "US$" ? "US$" : "USD";
    return `≈ ${unit} ${n.toLocaleString("en-US")}`;
}

function formatUsdMain(amount: number): string {
    return `USD ${Math.ceil(amount).toLocaleString("en-US")}`;
}

function toUsdPerItem(ars: number): number {
    return Math.ceil(ars / pricingData.usdArs);
}

function replaceDeliveryWindowTokens(
    value: string,
    locale: LandingLocale,
): string {
    const min = pricingData.deliveryWindow.minBusinessDays;
    const max = pricingData.deliveryWindow.maxBusinessDays;
    const deliveryRangeEs = `${min} a ${max} días hábiles`;
    const deliveryRangeEn = `${min}\u2013${max} business days`;
    return value
        .replace(/\{\{deliveryRangeEs\}\}/g, deliveryRangeEs)
        .replace(/\{\{deliveryRangeEn\}\}/g, deliveryRangeEn)
        .replace(
            /\{\{deliveryRange\}\}/g,
            locale === "en" ? deliveryRangeEn : deliveryRangeEs,
        );
}

function applyDeliveryWindowTokens<T>(input: T, locale: LandingLocale): T {
    if (typeof input === "string") {
        return replaceDeliveryWindowTokens(input, locale) as T;
    }
    if (Array.isArray(input)) {
        return input.map((item) =>
            applyDeliveryWindowTokens(item, locale),
        ) as T;
    }
    if (input && typeof input === "object") {
        const out: Record<string, unknown> = {};
        Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
            out[k] = applyDeliveryWindowTokens(v, locale);
        });
        return out as T;
    }
    return input;
}

function applyPricingToLandingData(
    raw: LandingData,
    locale: LandingLocale,
): LandingData {
    const premiumArs = pricingData.plans.premium;
    const disenoUnicoArs = pricingData.plans.disenoUnico;
    const premiumUsd = toUsdPerItem(premiumArs);
    const disenoUnicoUsd = toUsdPerItem(disenoUnicoArs);
    const secondLangArs = pricingData.configurator.secondLanguage;
    const secondLangLabel =
        locale === "en"
            ? `+$${secondLangArs.toLocaleString("en-US")}`
            : `+$${secondLangArs.toLocaleString("es-AR")}`;

    const paperLines = [
        pricingData.landing.paper.design,
        pricingData.landing.paper.printing130,
        pricingData.landing.paper.envelopesAndSeals,
        pricingData.landing.paper.postalShipping,
    ];
    const paperTotalArs = paperLines.reduce((sum, v) => sum + v, 0);
    const paperTotalUsd = paperLines.reduce(
        (sum, ars) => sum + toUsdPerItem(ars),
        0,
    );
    const savingsArs = Math.max(0, paperTotalArs - premiumArs);
    const savingsUsd = Math.max(0, paperTotalUsd - premiumUsd);

    const paperLineLabelsEs = [
        "Diseño",
        "Impresión (130 u.)",
        "Sobres y sellos",
        "Envío postal",
    ];
    const paperLineLabelsEn = [
        "Design",
        "Printing (130 pcs)",
        "Envelopes & seals",
        "Postal shipping",
    ];
    const paperLineLabels =
        locale === "en" ? paperLineLabelsEn : paperLineLabelsEs;
    const usdVariant = locale === "en" ? "US$" : "USD";

    const next = applyDeliveryWindowTokens(
        structuredClone(raw) as LandingData,
        locale,
    );

    Object.values(next.ctaButtons).forEach((btn) => {
        if (btn.type !== "link" || !btn.url?.startsWith("/configurador"))
            return;
        const [path, query = ""] = btn.url.split("?");
        const params = new URLSearchParams(query);
        params.set("lang", locale);
        btn.url = `${path}?${params.toString()}`;
    });

    if (next.floatingCta) {
        next.floatingCta.line1 =
            locale === "en"
                ? `Start here from ${formatUsdMain(premiumUsd)}`
                : `Empezá aquí desde ${formatArs(premiumArs, locale)}`;
    }

    if (locale === "en") {
        next.sections.comparativa.paper.lines = paperLineLabels.map(
            (label, i) => ({
                label,
                value: formatUsdMain(toUsdPerItem(paperLines[i] ?? 0)),
            }),
        );
        next.sections.comparativa.paper.totalValue =
            formatUsdMain(paperTotalUsd);
        next.sections.comparativa.paper.totalValueUsd = `≈ ${formatArs(paperTotalArs, locale)}`;
    } else {
        next.sections.comparativa.paper.lines = paperLineLabels.map(
            (label, i) => ({
                label,
                value: formatArs(paperLines[i] ?? 0, locale),
            }),
        );
        next.sections.comparativa.paper.totalValue = formatArs(
            paperTotalArs,
            locale,
        );
        next.sections.comparativa.paper.totalValueUsd = formatUsd(
            paperTotalUsd,
            locale,
            usdVariant,
        );
    }
    if (locale === "en") {
        next.sections.comparativa.digital.fromPrice = formatUsdMain(premiumUsd);
        next.sections.comparativa.digital.fromPriceUsd = formatArs(
            premiumArs,
            locale,
        );
    } else {
        next.sections.comparativa.digital.fromPrice = formatArs(
            premiumArs,
            locale,
        );
        next.sections.comparativa.digital.fromPriceUsd = formatUsd(
            premiumUsd,
            locale,
            usdVariant,
        );
    }
    next.sections.comparativa.digital.savingsLine =
        locale === "en"
            ? `Save approx. ${formatUsdMain(savingsUsd)} compared to paper`
            : `Ahorrá aprox. ${formatArs(savingsArs, locale)} frente al papel`;

    const premiumPlan = next.sections.servicio.planes.find((p) =>
        p.name.toLowerCase().includes("premium"),
    );
    const uniquePlan = next.sections.servicio.planes.find(
        (p) =>
            p.name.toLowerCase().includes("diseño") ||
            p.name.toLowerCase().includes("unique"),
    );
    if (premiumPlan) {
        if (locale === "en") {
            premiumPlan.price = formatUsdMain(premiumUsd);
            premiumPlan.priceUsd = formatArs(premiumArs, locale);
        } else {
            premiumPlan.price = formatArs(premiumArs, locale);
            premiumPlan.priceUsd = formatUsd(premiumUsd, locale, "USD");
        }
        premiumPlan.features = premiumPlan.features.map((f) => {
            if (locale === "en") {
                if (f.toLowerCase().includes("extra section")) {
                    return f.replace(
                        /\(\+ARS [\d,]+ per extra section\)|\(\+\$[\d,]+ per extra section\)/,
                        `(+ARS ${pricingData.configurator.extraSection.toLocaleString("en-US")} per extra section)`,
                    );
                }
                if (f.toLowerCase().includes("second language")) {
                    return f.replace(
                        /\(\+ARS [\d,]+\)|\(\+\$[\d,]+\)/,
                        `(+ARS ${secondLangArs.toLocaleString("en-US")})`,
                    );
                }
                return f;
            }
            if (f.toLowerCase().includes("sección extra")) {
                return f.replace(
                    /\(\+\$[\d.]+ por sección extra\)/,
                    `(+$${pricingData.configurator.extraSection.toLocaleString("es-AR")} por sección extra)`,
                );
            }
            if (f.toLowerCase().includes("2do idioma")) {
                return f.replace(/\(\+\$[\d.]+\)/, `(${secondLangLabel})`);
            }
            return f;
        });
    }
    if (uniquePlan) {
        if (locale === "en") {
            uniquePlan.price = formatUsdMain(disenoUnicoUsd);
            uniquePlan.priceUsd = formatArs(disenoUnicoArs, locale);
        } else {
            uniquePlan.price = formatArs(disenoUnicoArs, locale);
            uniquePlan.priceUsd = formatUsd(disenoUnicoUsd, locale, "USD");
        }
    }

    return next;
}

function mergeTheme(t: LandingData["theme"]): LandingTheme {
    const base = t as LandingTheme;
    return {
        ...base,
        typography: {
            ...THEME_DEFAULTS.typography!,
            ...(base.typography ?? {}),
        },
        text: { ...THEME_DEFAULTS.text!, ...(base.text ?? {}) },
        buttons: { ...THEME_DEFAULTS.buttons!, ...(base.buttons ?? {}) },
        comparativa: {
            ...THEME_DEFAULTS.comparativa!,
            ...(base.comparativa ?? {}),
        },
        accents: { ...THEME_DEFAULTS.accents!, ...(base.accents ?? {}) },
    };
}

/**
 * Transiciones de la landing: velocidad, distancia, curva, IntersectionObserver y CTA flotante.
 * Los delays escalonados por bloque (números en `blockRevealStyle(..., N)`) siguen en cada sección.
 */
const LANDING_MOTION = {
    /** Curva usada en casi todas las transiciones (opacity + transform) */
    ease: "cubic-bezier(0.34, 1.2, 0.64, 1)",

    /** Bloques al scroll y hero al cargar (`blockRevealStyle`) */
    blockReveal: {
        /** Cuánto baja el contenido antes de animar (px) */
        translateY: 24,
        durationOpacity: "0.62s",
        durationTransform: "0.74s",
    },

    /** Cuándo una sección pasa a `revealed` y empiezan los bloques */
    sectionInView: {
        /** 0–1: fracción del elemento que debe intersectar */
        threshold: 0.05,
        /**
         * Márgenes del root (viewport). Ej. `-15%` abajo = ignorás el 15% inferior;
         * el disparo ocurre cuando el bloque está más arriba en pantalla.
         */
        rootMargin: "0px 0px -15% 0px",
    },

    /** Carrusel “Estilos”: base para `blockRevealStyle(revealed, ms)` */
    estilosCarousel: {
        firstCardDelayMs: 175,
        stepBetweenCardsMs: 65,
        footerAfterCardsExtraMs: 50,
    },

    /** CTA fijo abajo: animación y cuándo se oculta al ver #planes */
    floatingCta: {
        /**
         * Distancia al borde inferior: `max(piso, env(safe-area) - tuck)`.
         * - piso: nunca pegado al borde en desktop / sin inset.
         * - tuck: baja el botón en iPhone (antes quedaba todo el inset “entero”).
         */
        bottomFloorPx: 5,
        bottomInsetTuckPx: 12,
        hideSection: {
            threshold: 0.12,
            rootMargin: "0px 0px -48px 0px",
        },
        /** Suma bajo el 100% del alto del botón al estar oculto */
        hiddenExtraPx: 28,
        hiddenScale: 0.94,
        blurPx: 10,
        durationTransform: "0.88s",
        durationOpacity: "0.72s",
        durationFilter: "0.52s",
        filterEasing: "ease-out",
        /** Retraso de opacity del pill respecto al movimiento (al aparecer) */
        delayOpacity: "0.05s",
        line1: {
            translateY: 12,
            durationOpacity: "0.64s",
            durationTransform: "0.7s",
            delay: "0.12s",
        },
        line2: {
            translateY: 10,
            durationOpacity: "0.64s",
            durationTransform: "0.7s",
            delay: "0.22s",
        },
    },
} as const;

function blockRevealStyle(
    revealed: boolean,
    delayMs: number,
): React.CSSProperties {
    const b = LANDING_MOTION.blockReveal;
    const e = LANDING_MOTION.ease;
    return {
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : `translateY(${b.translateY}px)`,
        transitionProperty: "opacity, transform",
        transitionDuration: `${b.durationOpacity}, ${b.durationTransform}`,
        transitionTimingFunction: `${e}, ${e}`,
        transitionDelay: revealed ? `${delayMs}ms, ${delayMs}ms` : "0ms, 0ms",
    };
}

function StaggerText({
    text,
    revealed,
    baseDelayMs = 0,
    wordStepMs = 22,
    className,
    style,
}: {
    text: string;
    revealed: boolean;
    baseDelayMs?: number;
    wordStepMs?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    const words = text.split(" ");
    return (
        <span className={className} style={style}>
            {words.map((word, i) => {
                const d = baseDelayMs + i * wordStepMs;
                return (
                    <span
                        key={`${word}-${i}`}
                        className="inline-block"
                        style={{
                            ...blockRevealStyle(revealed, d),
                            willChange: "transform, opacity",
                        }}
                    >
                        {word}
                        {i < words.length - 1 ? "\u00a0" : ""}
                    </span>
                );
            })}
        </span>
    );
}

function useSectionReveal(
    threshold: number = LANDING_MOTION.sectionInView.threshold,
    rootMargin: string = LANDING_MOTION.sectionInView.rootMargin,
) {
    const revealRef = useRef<HTMLDivElement>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const el = revealRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setRevealed(true);
                    obs.disconnect();
                }
            },
            { threshold, rootMargin },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold, rootMargin]);

    return { revealRef, revealed };
}

function CtaLink({
    btn,
    waNumber,
    trackingEvent,
    trackingSource,
    className,
    style,
}: {
    btn: CtaButton;
    waNumber: string;
    trackingEvent?: "InitiateCheckout" | "Lead";
    trackingSource?: string;
    className: string;
    style: React.CSSProperties;
}) {
    const readCookie = (name: string) => {
        if (typeof document === "undefined") return undefined;
        const match = document.cookie.match(
            new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`),
        );
        return match ? decodeURIComponent(match[1]) : undefined;
    };

    const generateEventId = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    };

    const sendLeadToCapi = async (eventId: string) => {
        try {
            await fetch("/api/meta/capi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventName: "Lead",
                    eventId,
                    source: trackingSource || "unknown",
                    ctaText: btn.text,
                    eventSourceUrl: window.location.href,
                    fbp: readCookie("_fbp"),
                    fbc: readCookie("_fbc"),
                }),
                keepalive: true,
            });
        } catch {
            // Non-blocking: browser Pixel remains the primary signal.
        }
    };

    const handleTracking = () => {
        if (!trackingEvent) return;
        const eventId = trackingEvent === "Lead" ? generateEventId() : undefined;
        trackMetaEvent(
            trackingEvent,
            {
                source: trackingSource || "unknown",
                cta_text: btn.text,
            },
            eventId,
        );
        if (trackingEvent === "Lead" && eventId) {
            void sendLeadToCapi(eventId);
        }
    };

    const handleTrackingAndReturnEventId = () => {
        if (!trackingEvent) return undefined;
        const eventId = trackingEvent === "Lead" ? generateEventId() : undefined;
        trackMetaEvent(
            trackingEvent,
            {
                source: trackingSource || "unknown",
                cta_text: btn.text,
            },
            eventId,
        );
        if (trackingEvent === "Lead" && eventId) {
            void sendLeadToCapi(eventId);
        }
        return eventId;
    };

    if (btn.type === "whatsapp") {
        const msg = btn.message || "";
        const href = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleTracking}
                className={className}
                style={style}
            >
                {btn.text}
            </a>
        );
    }
    if (btn.type === "anchor") {
        return (
            <a
                href={btn.anchor || "#"}
                onClick={(event) => {
                    handleTracking();
                    handleLocalAnchorClick(event, btn.anchor || "#");
                }}
                className={className}
                style={style}
            >
                {btn.text}
            </a>
        );
    }
    return (
        <a
            href={btn.url || "#"}
            target={btn.newTab ? "_blank" : undefined}
            rel={btn.newTab ? "noopener noreferrer" : undefined}
            onClick={(event) => {
                // On same-tab navigation, give Meta Pixel a brief window to send the event.
                if (
                    trackingEvent &&
                    btn.url &&
                    !btn.newTab &&
                    !btn.url.startsWith("#")
                ) {
                    event.preventDefault();
                    handleTrackingAndReturnEventId();
                    window.setTimeout(() => {
                        window.location.href = btn.url || "#";
                    }, 120);
                    return;
                }
                handleTracking();
            }}
            className={className}
            style={style}
        >
            {btn.text}
        </a>
    );
}

function waHref(number: string, message: string) {
    return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

function handleLocalAnchorClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    anchor: string,
) {
    if (!anchor.startsWith("#")) return;
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
}

function heroPremiumPriceLine(locale: LandingLocale): string {
    const premiumArs = pricingData.plans.premium;
    if (locale === "en") {
        return `from USD ${Math.ceil(premiumArs / pricingData.usdArs).toLocaleString("en-US")}`;
    }
    return `desde $${premiumArs.toLocaleString("es-AR")}`;
}

/** Primary pill (label + desde/from price) en hero compacto y tras el carrusel de estilos. */
function Landing2PrimaryPill({
    primary,
    theme,
    locale,
    waNumber,
    trackingSource = "hero",
}: {
    primary?: CtaButton;
    theme: LandingTheme;
    locale: LandingLocale;
    waNumber: string;
    trackingSource?: string;
}) {
    const label =
        primary?.text ??
        (locale === "en" ? "Create my invitation" : "Crear mi invitación");
    const priceLine = heroPremiumPriceLine(locale);
    const className =
        "inline-flex min-h-[56px] w-full flex-col items-center justify-center rounded-full px-6 py-3 text-[15px] font-semibold shadow-[0_10px_30px_rgba(120,98,72,0.18)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[0_12px_34px_rgba(120,98,72,0.24)] active:scale-[0.99]";
    const style: React.CSSProperties = {
        background: theme.buttons.floatingBg,
        color: theme.buttons.floatingText,
        textDecoration: "none",
    };

    const p = primary;
    if (!p || p.type === "anchor") {
        const href = p?.anchor ?? "#planes";
        return (
            <a
                href={href}
                onClick={(event) => {
                    trackMetaEvent("InitiateCheckout", {
                        source: trackingSource,
                        step: "crear_invitacion",
                    });
                    handleLocalAnchorClick(event, href);
                }}
                className={className}
                style={style}
            >
                <span>{label}</span>
                <span className="mt-0.5 text-[11px] font-medium opacity-90">
                    {priceLine}
                </span>
            </a>
        );
    }
    if (p.type === "whatsapp") {
        const href = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(p.message || "")}`;
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                    trackMetaEvent("InitiateCheckout", {
                        source: trackingSource,
                        step: "crear_invitacion",
                    })
                }
                className={className}
                style={style}
            >
                <span>{label}</span>
                <span className="mt-0.5 text-[11px] font-medium opacity-90">
                    {priceLine}
                </span>
            </a>
        );
    }
    return (
        <a
            href={p.url || "#"}
            target={p.newTab ? "_blank" : undefined}
            rel={p.newTab ? "noopener noreferrer" : undefined}
            onClick={() =>
                trackMetaEvent("InitiateCheckout", {
                    source: trackingSource,
                    step: "crear_invitacion",
                })
            }
            className={className}
            style={style}
        >
            <span>{label}</span>
            <span className="mt-0.5 text-[11px] font-medium opacity-90">
                {priceLine}
            </span>
        </a>
    );
}

function LandingFooter({ theme }: { theme: LandingTheme }) {
    return (
        <div
            style={
                {
                    "--primary": theme.footerBg,
                    "--primary-foreground": theme.footerText,
                } as React.CSSProperties
            }
        >
            <FooterSection />
        </div>
    );
}

function FloatingCta({
    data,
    theme,
}: {
    data: NonNullable<LandingData["floatingCta"]>;
    theme: LandingTheme;
}) {
    const [hiddenBySection, setHiddenBySection] = useState(false);
    /** Ocultar de forma definitiva al haber scrolleado por debajo de #planes (FAQ, footer, etc.). */
    const [pastPlanes, setPastPlanes] = useState(false);
    const [slideIn, setSlideIn] = useState(false);
    const b = theme.buttons;

    const sectionIds = useMemo(() => {
        const normalized = (value?: string) => value?.replace(/^#/, "").trim();
        const idsFromArray = (data.hideWhenSectionIds ?? [])
            .map((id) => normalized(id))
            .filter((id): id is string => Boolean(id));
        const idFromSingle = normalized(data.hideWhenSectionId);
        const idFromAnchor = data.anchor?.startsWith("#")
            ? normalized(data.anchor)
            : undefined;
        const merged = [
            ...idsFromArray,
            idFromSingle,
            idFromAnchor,
            "planes",
        ].filter((id): id is string => Boolean(id));
        return Array.from(new Set(merged));
    }, [data.anchor, data.hideWhenSectionId, data.hideWhenSectionIds]);

    useEffect(() => {
        if (!data.enabled) return;
        const els = sectionIds
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => Boolean(el));
        if (!els.length) return;
        const hideIo = LANDING_MOTION.floatingCta.hideSection;
        const visibility = new Map<string, boolean>();
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const id = (entry.target as HTMLElement).id;
                    visibility.set(id, entry.isIntersecting);
                });
                const shouldHide = Array.from(visibility.values()).some(
                    Boolean,
                );
                setHiddenBySection(shouldHide);
            },
            { threshold: hideIo.threshold, rootMargin: hideIo.rootMargin },
        );
        els.forEach((el) => {
            visibility.set(el.id, false);
            obs.observe(el);
        });
        return () => obs.disconnect();
    }, [data.enabled, sectionIds]);

    useEffect(() => {
        if (!data.enabled) return;
        const planes = document.getElementById("planes");
        if (!planes) return;
        const updatePastPlanes = () => {
            const rect = planes.getBoundingClientRect();
            setPastPlanes(rect.bottom < 0);
        };
        updatePastPlanes();
        window.addEventListener("scroll", updatePastPlanes, { passive: true });
        window.addEventListener("resize", updatePastPlanes);
        return () => {
            window.removeEventListener("scroll", updatePastPlanes);
            window.removeEventListener("resize", updatePastPlanes);
        };
    }, [data.enabled]);

    useEffect(() => {
        if (!data.enabled) {
            setSlideIn(false);
            return;
        }
        if (hiddenBySection || pastPlanes) {
            setSlideIn(false);
            return;
        }
        let raf1 = 0;
        let raf2 = 0;
        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setSlideIn(true));
        });
        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
        };
    }, [data.enabled, hiddenBySection, pastPlanes]);

    if (!data.enabled) return null;

    const r = b.floatingBorderRadius;
    const fc = LANDING_MOTION.floatingCta;
    const e = LANDING_MOTION.ease;
    const l1 = fc.line1;
    const l2 = fc.line2;
    const anchorTargetId = data.anchor?.startsWith("#")
        ? data.anchor.replace(/^#/, "")
        : undefined;

    return (
        <div
            className="pointer-events-none fixed z-50 box-border max-w-full px-2.5"
            style={{
                left: "50%",
                bottom: `max(${fc.bottomFloorPx}px, calc(env(safe-area-inset-bottom, 0px) - ${fc.bottomInsetTuckPx}px))`,
                width: "min(calc(100vw - 1.25rem), 42rem)",
                transform: "translateX(-50%)",
            }}
        >
            <div className="w-full overflow-hidden" style={{ borderRadius: r }}>
                <a
                    href={data.anchor}
                    onClick={(event) => {
                        trackMetaEvent("InitiateCheckout", {
                            source: "floating",
                            step: "crear_invitacion",
                        });
                        if (!anchorTargetId) return;
                        const target = document.getElementById(anchorTargetId);
                        if (!target) return;
                        event.preventDefault();
                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                        const cleanUrl = `${window.location.pathname}${window.location.search}`;
                        window.history.replaceState(null, "", cleanUrl);
                    }}
                    className="pointer-events-auto relative block w-full px-5 py-3.5 text-center hover:brightness-110 active:brightness-95 sm:px-7 sm:py-4"
                    style={{
                        background: b.floatingBg,
                        color: b.floatingText,
                        borderRadius: r,
                        boxShadow: b.floatingBoxShadow,
                        transform: slideIn
                            ? "translateY(0) scale(1)"
                            : `translateY(calc(100% + ${fc.hiddenExtraPx}px)) scale(${fc.hiddenScale})`,
                        opacity: slideIn ? 1 : 0,
                        filter: slideIn ? "blur(0px)" : `blur(${fc.blurPx}px)`,
                        transitionProperty: "transform, opacity, filter",
                        transitionDuration: `${fc.durationTransform}, ${fc.durationOpacity}, ${fc.durationFilter}`,
                        transitionTimingFunction: `${e}, ${e}, ${fc.filterEasing}`,
                        transitionDelay: slideIn
                            ? `0s, ${fc.delayOpacity}, 0s`
                            : "0s, 0s, 0s",
                        WebkitBackfaceVisibility: "hidden",
                        willChange: slideIn
                            ? "auto"
                            : "transform, opacity, filter",
                    }}
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                        style={{ borderRadius: r }}
                    >
                        <Snowflake
                            className="landing-fab-star--a absolute"
                            size={14}
                            strokeWidth={1.8}
                            style={{
                                left: "8%",
                                top: "16%",
                                color: b.floatingText,
                                opacity: 0.92,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--b absolute"
                            size={10}
                            strokeWidth={2.15}
                            style={{
                                right: "10%",
                                top: "22%",
                                color: b.floatingText,
                                opacity: 0.78,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--c absolute"
                            size={9}
                            strokeWidth={2.1}
                            style={{
                                left: "22%",
                                bottom: "14%",
                                color: b.floatingText,
                                opacity: 0.72,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--d absolute"
                            size={13}
                            strokeWidth={1.9}
                            style={{
                                right: "18%",
                                bottom: "18%",
                                color: b.floatingText,
                                opacity: 0.88,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--a absolute"
                            size={8}
                            strokeWidth={2.2}
                            style={{
                                left: "36%",
                                top: "12%",
                                color: b.floatingText,
                                opacity: 0.66,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--b absolute"
                            size={11}
                            strokeWidth={1.85}
                            style={{
                                right: "34%",
                                top: "15%",
                                color: b.floatingText,
                                opacity: 0.74,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--c absolute"
                            size={7}
                            strokeWidth={2.25}
                            style={{
                                left: "14%",
                                bottom: "28%",
                                color: b.floatingText,
                                opacity: 0.62,
                            }}
                        />
                        <Snowflake
                            className="landing-fab-star--d absolute"
                            size={9}
                            strokeWidth={2.1}
                            style={{
                                right: "8%",
                                bottom: "30%",
                                color: b.floatingText,
                                opacity: 0.7,
                            }}
                        />
                    </span>
                    <span className="relative z-[1] block">
                        <span
                            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[15px] font-bold leading-tight sm:text-base"
                            style={{
                                opacity: slideIn ? 1 : 0,
                                transform: slideIn
                                    ? "translateY(0)"
                                    : `translateY(${l1.translateY}px)`,
                                transitionProperty: "opacity, transform",
                                transitionDuration: `${l1.durationOpacity}, ${l1.durationTransform}`,
                                transitionTimingFunction: `${e}, ${e}`,
                                transitionDelay: slideIn
                                    ? `${l1.delay}, ${l1.delay}`
                                    : "0s, 0s",
                            }}
                        >
                            <span>{data.line1}</span>
                        </span>
                        <span
                            className="mt-2 block text-[11px] font-medium leading-snug sm:text-xs"
                            style={{
                                color: b.floatingSubtext,
                                opacity: slideIn ? 1 : 0,
                                transform: slideIn
                                    ? "translateY(0)"
                                    : `translateY(${l2.translateY}px)`,
                                transitionProperty: "opacity, transform",
                                transitionDuration: `${l2.durationOpacity}, ${l2.durationTransform}`,
                                transitionTimingFunction: `${e}, ${e}`,
                                transitionDelay: slideIn
                                    ? `${l2.delay}, ${l2.delay}`
                                    : "0s, 0s",
                            }}
                        >
                            {data.line2}
                        </span>
                    </span>
                </a>
            </div>
        </div>
    );
}

function usePrefersReducedMotion() {
    const [reduce, setReduce] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduce(mq.matches);
        const fn = () => setReduce(mq.matches);
        mq.addEventListener("change", fn);
        return () => mq.removeEventListener("change", fn);
    }, []);
    return reduce;
}

/** Hero: Lora (--font-landing-hero), escala responsive */
const HERO_TITLE_LINE_CLASS =
    "block max-w-4xl text-pretty font-normal leading-[1.08] tracking-[-0.02em] text-[1.85rem] sm:text-[1.95rem] md:text-[2.2rem] lg:text-[2.65rem]";

/** Línea rotativa: inclinación suave (oblicua ~9°), menos marcada que italic de la fuente */
const HERO_ROTATING_LINE_CLASS = `${HERO_TITLE_LINE_CLASS} [font-style:oblique_9deg]`;

const HERO_STAGGER_MS = 22;
const HERO_LETTER_MS = 380;
const HERO_HOLD_MS = 1500;
const HERO_MOMENTO_EXTRA_HOLD_MS = 1000;

function heroStaggerTotal(charCount: number) {
    return Math.max(0, charCount - 1) * HERO_STAGGER_MS + HERO_LETTER_MS + 48;
}

function heroHoldMsForPhrase(phrase: string) {
    const normalized = phrase
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    return normalized.includes("momento unico")
        ? HERO_HOLD_MS + HERO_MOMENTO_EXTRA_HOLD_MS
        : HERO_HOLD_MS;
}

function HeroStaggerPhrase({
    phrases,
    color,
}: {
    phrases: string[];
    color: string;
}) {
    const reduceMotion = usePrefersReducedMotion();
    const safe = phrases.filter((p) => p.length > 0);
    const wordsKey = safe.join("|");
    const listRef = useRef(safe);
    listRef.current = safe;
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
    const [outTick, setOutTick] = useState(0);
    const [inTick, setInTick] = useState(0);

    useEffect(() => {
        setIndex(0);
        setPhase("idle");
        setOutTick(0);
        setInTick(0);
    }, [wordsKey]);

    useLayoutEffect(() => {
        if (phase !== "out") {
            setOutTick(0);
            return;
        }
        setOutTick(0);
        const id = requestAnimationFrame(() => {
            setOutTick(1);
        });
        return () => cancelAnimationFrame(id);
    }, [phase, index]);

    useLayoutEffect(() => {
        if (phase !== "in") {
            setInTick(0);
            return;
        }
        setInTick(0);
        const id = requestAnimationFrame(() => {
            setInTick(1);
        });
        return () => cancelAnimationFrame(id);
    }, [phase, index]);

    useEffect(() => {
        const list = listRef.current;
        if (reduceMotion || list.length <= 1) return;
        if (phase !== "idle") return;
        const currentPhrase = list[index] ?? "";
        const t = window.setTimeout(
            () => setPhase("out"),
            heroHoldMsForPhrase(currentPhrase),
        );
        return () => clearTimeout(t);
    }, [phase, reduceMotion, wordsKey, index]);

    useEffect(() => {
        const list = listRef.current;
        if (reduceMotion || list.length <= 1) return;
        if (phase !== "out" || outTick !== 1) return;
        const phrase = list[index];
        const t = window.setTimeout(() => {
            setIndex((i) => (i + 1) % list.length);
            setPhase("in");
        }, heroStaggerTotal(phrase.length));
        return () => clearTimeout(t);
    }, [phase, outTick, index, reduceMotion, wordsKey]);

    useEffect(() => {
        const list = listRef.current;
        if (reduceMotion || list.length <= 1) return;
        if (phase !== "in" || inTick !== 1) return;
        const phrase = list[index];
        const t = window.setTimeout(
            () => setPhase("idle"),
            heroStaggerTotal(phrase.length),
        );
        return () => clearTimeout(t);
    }, [phase, inTick, index, reduceMotion, wordsKey]);

    if (safe.length === 0) return null;

    const phrase = safe[index] ?? "";
    const chars = [...phrase];

    if (reduceMotion || safe.length === 1) {
        return (
            <span className={HERO_ROTATING_LINE_CLASS} style={{ color }}>
                {safe[0]}
            </span>
        );
    }

    const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";

    return (
        <span
            className={`${HERO_ROTATING_LINE_CLASS} motion-reduce:transition-none`}
            aria-live="polite"
        >
            {chars.map((ch, i) => {
                const isSpace = ch === " ";
                const delay = i * HERO_STAGGER_MS;
                let opacity = 1;
                let transform = "translateY(0)";
                let transitionProperty = "none";
                let transitionDuration = "0ms";
                let transitionTimingFunction = "ease";

                if (phase === "out") {
                    if (outTick === 0) {
                        opacity = 1;
                        transform = "translateY(0)";
                    } else {
                        opacity = 0;
                        transform = "translateY(-0.2em)";
                        transitionProperty = "opacity, transform";
                        transitionDuration = `${HERO_LETTER_MS}ms, ${HERO_LETTER_MS}ms`;
                        transitionTimingFunction = `${ease}, ${ease}`;
                    }
                } else if (phase === "in") {
                    if (inTick === 0) {
                        opacity = 0;
                        transform = "translateY(0.32em)";
                    } else {
                        opacity = 1;
                        transform = "translateY(0)";
                        transitionProperty = "opacity, transform";
                        transitionDuration = `${HERO_LETTER_MS}ms, ${HERO_LETTER_MS}ms`;
                        transitionTimingFunction = `${ease}, ${ease}`;
                    }
                }

                const noStaggerDelay =
                    phase === "idle" ||
                    (phase === "out" && outTick === 0) ||
                    (phase === "in" && inTick === 0);
                const transitionDelay = noStaggerDelay ? "0ms" : `${delay}ms`;

                return (
                    <span
                        key={`${wordsKey}-${index}-${i}`}
                        className="inline-block"
                        style={{
                            color,
                            opacity,
                            transform,
                            transitionProperty,
                            transitionDuration,
                            transitionTimingFunction,
                            transitionDelay,
                        }}
                    >
                        {isSpace ? "\u00a0" : ch}
                    </span>
                );
            })}
        </span>
    );
}

function HeroTdy({
    data,
    theme,
    buttons,
    waNumber,
    locale,
    reviewsTopSimple = false,
    heroSectionId,
}: {
    data: LandingData["sections"]["hero"];
    theme: LandingTheme;
    buttons: Record<string, CtaButton>;
    waNumber: string;
    locale: LandingLocale;
    reviewsTopSimple?: boolean;
    heroSectionId?: string;
}) {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        setLoaded(true);
    }, []);
    const primary = buttons.heroPrimary;
    const secondary = buttons.heroSecondary;
    const tx = theme.text;
    const rev = data.reviews;
    const rotating = (data.title.rotatingWords ?? []).filter(
        (w) => w.length > 0,
    );
    const hint = data.languagesHint?.trim();
    const heroLangLabel = locale === "en" ? "Multilingual" : "Multilingüe";
    const secondaryLabel = locale === "en" ? "View models" : "Ver modelos";

    return (
        <section
            id={heroSectionId}
            className="flex min-h-svh flex-col px-5 pt-10 pb-10 md:px-8 md:pb-12"
            style={{
                background: theme.background,
                fontFamily: theme.typography.bodyFont,
                color: tx.body,
            }}
        >
            <div
                className={`mx-auto flex w-full max-w-6xl flex-1 flex-col ${
                    reviewsTopSimple
                        ? "justify-start pt-2 md:justify-center md:pt-0"
                        : "justify-center"
                }`}
            >
                {reviewsTopSimple && rev?.enabled ? (
                    rev.url ? (
                        <a
                            href={rev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mx-auto mb-8 mt-0 inline-flex items-center gap-2 text-sm"
                            style={{
                                color: tx.muted,
                                ...blockRevealStyle(loaded, 20),
                                textDecoration: "none",
                            }}
                        >
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill="#E4B63D"
                                        strokeWidth={0}
                                        style={{ color: "#E4B63D" }}
                                    />
                                ))}
                            </div>
                            <span className="font-semibold tabular-nums">
                                {rev.rating}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                                {rev.linkText}
                                <ChevronRight size={13} aria-hidden />
                            </span>
                        </a>
                    ) : (
                        <div
                            className="mx-auto mb-8 mt-0 inline-flex items-center gap-2 text-sm"
                            style={{
                                color: tx.muted,
                                ...blockRevealStyle(loaded, 20),
                            }}
                        >
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill="#E4B63D"
                                        strokeWidth={0}
                                        style={{ color: "#E4B63D" }}
                                    />
                                ))}
                            </div>
                            <span className="font-semibold tabular-nums">
                                {rev.rating}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                {rev.linkText}
                            </span>
                        </div>
                    )
                ) : null}
                {reviewsTopSimple && hint ? (
                    <div
                        className="mx-auto mb-7 -mt-7 inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.04em]"
                        style={{
                            color: `${tx.muted}B8`,
                            ...blockRevealStyle(loaded, 30),
                        }}
                    >
                        <Languages
                            size={12}
                            strokeWidth={1.7}
                            style={{ color: `${tx.muted}B8` }}
                            aria-hidden
                        />
                        <span>{heroLangLabel}</span>
                    </div>
                ) : null}
                <h1
                    className={`text-pretty ${reviewsTopSimple ? "mx-auto mt-7 max-w-4xl text-center" : "max-w-4xl text-left"}`}
                    style={{
                        fontFamily: "var(--font-landing-hero), Georgia, serif",
                        color: tx.heading,
                        ...blockRevealStyle(loaded, 0),
                    }}
                >
                    <span
                        className={`${HERO_TITLE_LINE_CLASS} mt-0`}
                        style={{ color: tx.heading }}
                    >
                        {data.title.line1}
                    </span>
                    <span
                        className={`${HERO_TITLE_LINE_CLASS} mt-1.5`}
                        style={{ color: tx.heading }}
                    >
                        {data.title.line2}
                    </span>
                    {rotating.length > 0 ? (
                        <span className="mt-1.5 block min-h-[1.05em]">
                            <HeroStaggerPhrase
                                phrases={rotating}
                                color={theme.accents.softGold}
                            />
                        </span>
                    ) : null}
                </h1>
                <p
                    className={`mt-6 text-pretty text-base leading-relaxed md:text-lg ${reviewsTopSimple ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"}`}
                    style={{ color: tx.muted, ...blockRevealStyle(loaded, 60) }}
                >
                    <StaggerText
                        text={data.subtitle}
                        revealed={loaded}
                        baseDelayMs={75}
                        wordStepMs={24}
                    />
                </p>

                {!reviewsTopSimple && hint && rev?.enabled ? (
                    <div
                        className="mt-8 flex w-full max-w-3xl items-center justify-between gap-3"
                        style={blockRevealStyle(loaded, 95)}
                    >
                        <div className="flex items-center gap-2">
                            <Languages
                                size={16}
                                strokeWidth={1.65}
                                className="shrink-0 opacity-80"
                                style={{ color: theme.accents.softGold }}
                                aria-hidden
                            />
                            <p
                                className="text-left text-[11px] font-medium leading-snug tracking-wide md:text-xs"
                                style={{ color: tx.muted }}
                            >
                                <StaggerText
                                    text={hint}
                                    revealed={loaded}
                                    baseDelayMs={105}
                                    wordStepMs={18}
                                />
                            </p>
                        </div>
                        <span
                            className="shrink-0 text-[10px] font-semibold tracking-[0.14em] md:text-[11px]"
                            style={{ color: theme.accents.softGold }}
                            aria-label={
                                locale === "en"
                                    ? "Available languages: Spanish and English"
                                    : "Idiomas disponibles: español e inglés"
                            }
                        >
                            ES · EN · PT · FR · +
                        </span>
                    </div>
                ) : null}

                {!reviewsTopSimple && rev?.enabled ? (
                    rev.url ? (
                        <a
                            href={rev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mx-auto flex w-fit items-stretch rounded-full border pl-4 pr-5 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-transform duration-200 hover:scale-[1.01] ${hint ? "mt-6" : "mt-8"}`}
                            style={{
                                borderColor: "rgba(184, 149, 106, 0.24)",
                                background:
                                    "linear-gradient(180deg, #FDF9F1 0%, #FAF3E8 100%)",
                                boxShadow:
                                    "0 0 0 1px rgba(184,149,106,0.05) inset, 0 5px 14px rgba(120,98,72,0.10), 0 1px 0 rgba(255,255,255,0.5) inset",
                                textDecoration: "none",
                                ...blockRevealStyle(loaded, hint ? 125 : 120),
                            }}
                        >
                            <div
                                className="flex items-center gap-1.5 pr-3"
                                aria-label={`${rev.rating} de 5 estrellas`}
                            >
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            fill="#E4B63D"
                                            strokeWidth={0}
                                            style={{ color: "#E4B63D" }}
                                        />
                                    ))}
                                </div>
                                <span
                                    className="text-sm font-semibold tabular-nums"
                                    style={{ color: "#6E5A45" }}
                                >
                                    {rev.rating}
                                </span>
                            </div>
                            <div
                                className="flex flex-col justify-center border-l pl-3 text-left"
                                style={{ borderColor: theme.cardBorder }}
                            >
                                <span
                                    className="text-[13px] font-bold leading-tight md:text-[14px]"
                                    style={{ color: "#6E5A45" }}
                                >
                                    {locale === "en"
                                        ? "Happy clients"
                                        : "Clientes felices"}
                                </span>
                                <span
                                    className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-normal leading-tight md:text-xs"
                                    style={{
                                        color: "#6E5A45",
                                        textDecoration: "none",
                                        opacity: 0.86,
                                    }}
                                >
                                    {rev.linkText}
                                    <ChevronRight size={14} aria-hidden />
                                </span>
                            </div>
                        </a>
                    ) : (
                        <div
                            className={`mx-auto flex w-fit items-stretch rounded-full border pl-4 pr-5 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.02)] ${hint ? "mt-6" : "mt-8"}`}
                            style={{
                                borderColor: "rgba(184, 149, 106, 0.24)",
                                background:
                                    "linear-gradient(180deg, #FDF9F1 0%, #FAF3E8 100%)",
                                boxShadow:
                                    "0 0 0 1px rgba(184,149,106,0.05) inset, 0 5px 14px rgba(120,98,72,0.10), 0 1px 0 rgba(255,255,255,0.5) inset",
                                ...blockRevealStyle(loaded, hint ? 125 : 120),
                            }}
                        >
                            <div
                                className="flex items-center gap-1.5 pr-3"
                                aria-label={`${rev.rating} de 5 estrellas`}
                            >
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            fill="#E4B63D"
                                            strokeWidth={0}
                                            style={{ color: "#E4B63D" }}
                                        />
                                    ))}
                                </div>
                                <span
                                    className="text-sm font-semibold tabular-nums"
                                    style={{ color: "#6E5A45" }}
                                >
                                    {rev.rating}
                                </span>
                            </div>
                            <div
                                className="flex flex-col justify-center border-l pl-3 text-left"
                                style={{ borderColor: theme.cardBorder }}
                            >
                                <span
                                    className="text-[13px] font-bold leading-tight md:text-[14px]"
                                    style={{ color: "#6E5A45" }}
                                >
                                    {locale === "en"
                                        ? "Happy clients"
                                        : "Clientes felices"}
                                </span>
                                <span
                                    className="mt-0.5 text-[11px] font-normal leading-tight md:text-xs"
                                    style={{ color: "#6E5A45", opacity: 0.76 }}
                                >
                                    {rev.source}
                                </span>
                            </div>
                        </div>
                    )
                ) : null}

                {reviewsTopSimple ? (
                    <div
                        className={`mx-auto flex w-full max-w-[280px] flex-col items-stretch gap-2.5 sm:max-w-md ${rev?.enabled ? (hint ? "mt-9" : "mt-9") : hint ? "mt-11" : "mt-11"}`}
                        style={blockRevealStyle(
                            loaded,
                            rev?.enabled
                                ? hint
                                    ? 195
                                    : 190
                                : hint
                                  ? 150
                                  : 120,
                        )}
                    >
                        <Landing2PrimaryPill
                            primary={primary}
                            theme={theme}
                            locale={locale}
                            waNumber={waNumber}
                        />
                        <a
                            href={secondary?.anchor ?? "#muestras"}
                            onClick={(event) =>
                                handleLocalAnchorClick(
                                    event,
                                    secondary?.anchor ?? "#muestras",
                                )
                            }
                            className="inline-flex min-h-[56px] items-center justify-center rounded-full border px-6 py-3 text-[15px] font-semibold shadow-sm transition-colors duration-200 hover:brightness-[0.98]"
                            style={{
                                borderColor: theme.buttons.floatingBg,
                                color: theme.buttons.floatingBg,
                                background: "transparent",
                                textDecoration: "none",
                            }}
                        >
                            {secondaryLabel}
                        </a>
                        <a
                            href="#incluye"
                            onClick={(event) =>
                                handleLocalAnchorClick(event, "#incluye")
                            }
                            className="mx-auto mt-7 inline-flex items-center justify-center animate-bounce"
                            style={{
                                color: `${tx.muted}B8`,
                                textDecoration: "none",
                            }}
                            aria-label={
                                locale === "en"
                                    ? "Scroll down"
                                    : "Deslizar hacia abajo"
                            }
                        >
                            <ChevronDown size={26} aria-hidden />
                        </a>
                    </div>
                ) : (
                    <div
                        className={`flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center ${rev?.enabled ? (hint ? "mt-6" : "mt-8") : hint ? "mt-10" : "mt-10"}`}
                        style={blockRevealStyle(
                            loaded,
                            rev?.enabled
                                ? hint
                                    ? 195
                                    : 190
                                : hint
                                  ? 150
                                  : 120,
                        )}
                    >
                        {primary && (
                            <CtaLink
                                btn={primary}
                                waNumber={waNumber}
                                trackingEvent="InitiateCheckout"
                                trackingSource="hero"
                                className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-10 py-3 text-[15px] font-semibold shadow-[0_10px_30px_rgba(120,98,72,0.18)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[0_12px_34px_rgba(120,98,72,0.24)] active:scale-[0.99]"
                                style={{
                                    background: "#7A5F45",
                                    color: "#FFF9F2",
                                }}
                            />
                        )}
                        {secondary && (
                            <CtaLink
                                btn={secondary}
                                waNumber={waNumber}
                                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border px-10 py-3 text-[15px] font-semibold shadow-sm transition-colors duration-200 hover:brightness-[0.98]"
                                style={{
                                    borderColor: "#7A5F45",
                                    color: "#7A5F45",
                                    background: "#F8F1E6",
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

function isVideoMediaSrc(src: string): boolean {
    return /\.(mp4|webm|mov)(\?.*)?$/i.test(src.trim());
}

/** Misma carpeta que el video: `primerframe.png` (p. ej. video en …/videos/a.mov → …/videos/primerframe.png). */
function incluyePrimerFrameSrc(videoSrc: string): string {
    const t = videoSrc.trim();
    const i = t.lastIndexOf("/");
    const dir = i >= 0 ? t.slice(0, i + 1) : "/landing/media/videos/";
    return `${dir}primerframe.png`;
}

/** Pausa, lleva a t≈0 y ejecuta `then` tras `seeked` (o fallback si el seek no dispara). */
function whenVideoAtStartThen(v: HTMLVideoElement, then: () => void): void {
    v.pause();
    let finished = false;
    const done = () => {
        if (finished) return;
        finished = true;
        then();
    };
    const onSeeked = () => {
        v.removeEventListener("seeked", onSeeked);
        done();
    };
    v.addEventListener("seeked", onSeeked, { once: true });
    try {
        const before = v.currentTime;
        v.currentTime = 0;
        if (Math.abs(before) < 0.001 && !v.seeking) {
            v.removeEventListener("seeked", onSeeked);
            queueMicrotask(done);
            return;
        }
    } catch {
        v.removeEventListener("seeked", onSeeked);
        done();
        return;
    }
    window.setTimeout(() => {
        if (finished) return;
        if (!v.seeking) {
            v.removeEventListener("seeked", onSeeked);
            done();
        }
    }, 120);
}

/** Fracción del área del elemento que está dentro del viewport (similar a IntersectionObserver). */
function visibleAreaRatio(el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return 0;
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const x1 = Math.max(rect.left, 0);
    const y1 = Math.max(rect.top, 0);
    const x2 = Math.min(rect.right, vw);
    const y2 = Math.min(rect.bottom, vh);
    const iw = Math.max(0, x2 - x1);
    const ih = Math.max(0, y2 - y1);
    return (iw * ih) / (w * h);
}

function IncluyeSection({
    data,
    theme,
}: {
    data: LandingData["sections"]["incluye"];
    theme: LandingTheme;
}) {
    const mediaSrc = data.imageSrc?.trim() ?? "";
    const showVideo = Boolean(mediaSrc && isVideoMediaSrc(mediaSrc));
    const ioReveal = LANDING_MOTION.sectionInView;
    /**
     * Con video: el root de intersección se alarga un viewport hacia abajo para que, al cargar,
     * el bloque ya se considere visible (título/lista sin esperar scroll). Sin video: igual que el resto.
     */
    const { revealRef, revealed } = useSectionReveal(
        showVideo ? 0 : ioReveal.threshold,
        showVideo ? "0px 0px 100% 0px" : ioReveal.rootMargin,
    );
    const ls = data.listStyle ?? {};
    const fontSize = ls.fontSizePx ?? 13;
    const gap = ls.gapPx ?? 8;
    const iconSize = ls.iconSize ?? 18;
    const tx = theme.text;

    const items: { text: string; icon: string }[] = data.items.map((it) =>
        typeof it === "string" ? { text: it, icon: "sparkles" } : it,
    );
    const incluyeVideoRef = useRef<HTMLVideoElement>(null);
    const incluyeVisibleRatioRef = useRef(0);
    const incluyePrevVisibleRatioRef = useRef(0);
    const incluyeClampedToStartRef = useRef(false);
    const [incluyeDomReady, setIncluyeDomReady] = useState(false);
    const [incluyeMainVideoHasData, setIncluyeMainVideoHasData] =
        useState(false);
    const [incluyePosterDismissed, setIncluyePosterDismissed] = useState(false);
    const posterSrc = showVideo
        ? data.videoPosterSrc?.trim() || incluyePrimerFrameSrc(mediaSrc)
        : "";

    useLayoutEffect(() => {
        setIncluyeDomReady(true);
    }, []);

    useEffect(() => {
        setIncluyeMainVideoHasData(false);
        setIncluyePosterDismissed(false);
    }, [showVideo, mediaSrc]);

    /** Preload en <head> lo antes posible (misma URL que el <video>). */
    useLayoutEffect(() => {
        if (!showVideo || !mediaSrc) return;
        const id = "preload-incluye-landing-video";
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "preload";
        link.href = mediaSrc;
        link.as = "video";
        link.setAttribute("fetchpriority", "high");
        document.head.appendChild(link);
        return () => {
            document.getElementById(id)?.remove();
        };
    }, [showVideo, mediaSrc]);

    const incluyeVideoMime = /\.mov(\?|$)/i.test(mediaSrc)
        ? "video/quicktime"
        : "video/mp4";
    const showIncluyePrimePortal =
        showVideo &&
        incluyeDomReady &&
        !incluyeMainVideoHasData &&
        Boolean(mediaSrc);

    useEffect(() => {
        if (!showVideo) return;
        incluyeClampedToStartRef.current = false;
        incluyePrevVisibleRatioRef.current = 0;
        const video = incluyeVideoRef.current;
        if (!video) return;

        video.setAttribute("fetchpriority", "high");
        video.setAttribute("loading", "eager");
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.playsInline = true;

        /** Reproducir si al menos la mitad del área del video es visible; pausar si baja de eso. */
        const PLAY_WHEN_VISIBLE = 0.5;

        const applyVisibilityRatio = (ratio: number) => {
            const v = incluyeVideoRef.current;
            if (!v) return;
            const prev = incluyePrevVisibleRatioRef.current;
            incluyePrevVisibleRatioRef.current = ratio;
            incluyeVisibleRatioRef.current = ratio;

            if (ratio >= PLAY_WHEN_VISIBLE) {
                if (prev < PLAY_WHEN_VISIBLE) {
                    whenVideoAtStartThen(v, () => {
                        void v.play().catch(() => {});
                    });
                } else if (v.paused) {
                    void v.play().catch(() => {});
                }
            } else {
                v.pause();
            }
        };

        const measureAndSync = () => {
            const v = incluyeVideoRef.current;
            if (!v) return;
            applyVisibilityRatio(visibleAreaRatio(v));
        };

        const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;
                applyVisibilityRatio(entry.intersectionRatio);
            },
            { threshold: thresholds },
        );
        io.observe(video);

        const onScrollOrResize = () => {
            requestAnimationFrame(measureAndSync);
        };

        const onVideoReady = () => {
            requestAnimationFrame(measureAndSync);
        };

        const onLoadedMetadata = () => {
            whenVideoAtStartThen(video, () => {
                incluyeClampedToStartRef.current = true;
                onVideoReady();
            });
        };

        const onLoadedData = () => {
            setIncluyeMainVideoHasData(true);
            if (incluyeClampedToStartRef.current) {
                onVideoReady();
                return;
            }
            whenVideoAtStartThen(video, () => {
                incluyeClampedToStartRef.current = true;
                onVideoReady();
            });
        };

        const onPlaying = () => {
            setIncluyePosterDismissed(true);
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("loadeddata", onLoadedData);
        video.addEventListener("canplay", onVideoReady);
        video.addEventListener("playing", onPlaying);

        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize);

        requestAnimationFrame(() => {
            const records = io.takeRecords();
            if (records[0]) {
                applyVisibilityRatio(records[0].intersectionRatio);
            } else {
                measureAndSync();
            }
        });

        return () => {
            io.disconnect();
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("canplay", onVideoReady);
            video.removeEventListener("playing", onPlaying);
            window.removeEventListener("scroll", onScrollOrResize);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, [showVideo, mediaSrc]);

    return (
        <section
            id={data.id || "incluye"}
            className={`scroll-mt-24 px-5 pb-20 md:px-8 md:pb-28 ${
                showVideo
                    ? "-mt-[clamp(2.25rem,11vh,7.5rem)] relative z-10"
                    : ""
            }`}
            style={{ background: theme.background }}
        >
            {showIncluyePrimePortal
                ? createPortal(
                      <video
                          key={`incluye-prime-${mediaSrc}`}
                          ref={(node) => {
                              node?.setAttribute("loading", "eager");
                              node?.setAttribute("fetchpriority", "high");
                          }}
                          muted
                          playsInline
                          preload="auto"
                          tabIndex={-1}
                          aria-hidden
                          className="pointer-events-none"
                          style={{
                              position: "fixed",
                              left: 0,
                              top: 0,
                              width: "min(200px, 25vw)",
                              height: "min(356px, 45vw)",
                              opacity: 0.03,
                              zIndex: -10,
                              overflow: "hidden",
                          }}
                      >
                          <source src={mediaSrc} type={incluyeVideoMime} />
                      </video>,
                      document.body,
                  )
                : null}
            <div ref={revealRef} className="mx-auto max-w-6xl">
                {showVideo ? (
                    <div className="relative mx-auto -mt-2 flex justify-center pt-1 md:-mt-3 md:pt-2">
                        <div
                            className="relative inline-flex max-w-full overflow-hidden rounded-2xl"
                            style={{ background: theme.background }}
                        >
                            <div className="relative aspect-[9/16] h-auto w-[min(88vw,300px)] max-h-[min(70vh,520px)] max-w-full sm:w-[min(86vw,360px)] md:w-[min(84vw,480px)]">
                                <video
                                    ref={incluyeVideoRef}
                                    className="absolute inset-0 z-0 h-full w-full object-contain"
                                    muted
                                    playsInline
                                    loop
                                    preload="auto"
                                    aria-label={data.imageAlt}
                                >
                                    <source
                                        src={mediaSrc}
                                        type={incluyeVideoMime}
                                    />
                                </video>
                                {posterSrc ? (
                                    <div
                                        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl"
                                        style={
                                            incluyePosterDismissed
                                                ? {
                                                      ...blockRevealStyle(
                                                          revealed,
                                                          0,
                                                      ),
                                                      opacity: 0,
                                                      transitionProperty:
                                                          "opacity, transform",
                                                      transitionDuration:
                                                          "0.38s, 0s",
                                                      transitionTimingFunction:
                                                          "ease-out, ease-out",
                                                  }
                                                : blockRevealStyle(revealed, 0)
                                        }
                                        aria-hidden
                                    >
                                        <Image
                                            src={posterSrc}
                                            alt=""
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 90vw, 480px"
                                            priority
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="relative mx-auto mt-4 aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border shadow-sm md:mt-6"
                        style={{
                            borderColor: theme.cardBorder,
                            background: theme.cardBg,
                            ...blockRevealStyle(revealed, 0),
                        }}
                    >
                        {mediaSrc ? (
                            <Image
                                src={mediaSrc}
                                alt={data.imageAlt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1200px) 100vw, 900px"
                            />
                        ) : (
                            <div
                                className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center"
                                style={{ color: tx.muted }}
                            >
                                <Sparkles
                                    size={32}
                                    strokeWidth={1.25}
                                    className="opacity-40"
                                />
                                <span className="text-sm">
                                    Agregá la imagen o video en
                                </span>
                                <code className="rounded-md bg-black/[0.05] px-2 py-1 text-xs">
                                    sections.incluye.imageSrc
                                </code>
                            </div>
                        )}
                    </div>
                )}

                <div className="mx-auto mt-10 max-w-3xl">
                    <div
                        className="mb-3 flex items-center justify-center"
                        style={blockRevealStyle(revealed, 65)}
                    >
                        <h2
                            className="text-center text-xl font-semibold tracking-tight md:text-2xl"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                                color: tx.heading,
                            }}
                        >
                            <StaggerText
                                text={data.title}
                                revealed={revealed}
                                baseDelayMs={80}
                                wordStepMs={24}
                            />
                        </h2>
                    </div>
                    <p
                        className="mb-5 text-center text-sm leading-relaxed md:text-[15px]"
                        style={{
                            color: tx.muted,
                            ...blockRevealStyle(revealed, 95),
                        }}
                    >
                        <StaggerText
                            text={data.subtitle}
                            revealed={revealed}
                            baseDelayMs={110}
                            wordStepMs={20}
                        />
                    </p>
                    <ul className="flex flex-col px-2 sm:px-0" style={{ gap }}>
                        {items.map((item, i) => (
                            <li
                                key={item.text}
                                className="flex gap-3.5 py-0.5"
                                style={{
                                    fontSize,
                                    lineHeight: 1.45,
                                    color: tx.body,
                                    ...blockRevealStyle(revealed, 135 + i * 42),
                                }}
                            >
                                <span className="mt-0.5 shrink-0 opacity-80">
                                    <TdyIcon
                                        name={item.icon}
                                        size={iconSize}
                                        color={theme.accents.iconMuted}
                                    />
                                </span>
                                <span>{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function ComparativaSection({
    data,
    theme,
}: {
    data: LandingData["sections"]["comparativa"];
    theme: LandingTheme;
}) {
    const { revealRef, revealed } = useSectionReveal();
    const c = theme.comparativa;
    const tx = theme.text;
    const th = data.tableHeaders ?? {
        feature: "Función",
        paper: "Papel",
        digital: "Digital",
    };
    const bullets: { text: string; subtext?: string; icon: string }[] =
        data.digital.bullets.map((b) =>
            typeof b === "string"
                ? { text: b, subtext: "", icon: "sparkles" }
                : b,
        );

    return (
        <section
            id={data.id ?? "comparativa"}
            className="px-5 py-20 md:px-8 md:py-28"
            style={{ background: theme.background }}
        >
            <div ref={revealRef} className="mx-auto max-w-6xl">
                <div
                    className="mb-4 flex justify-center"
                    style={blockRevealStyle(revealed, 0)}
                >
                    <Scale
                        size={26}
                        strokeWidth={1.25}
                        style={{ color: theme.accents.softGold }}
                        aria-hidden
                    />
                </div>
                <h2
                    className="text-center text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                    style={{
                        fontFamily: theme.typography.headingFont,
                        color: tx.heading,
                        ...blockRevealStyle(revealed, 50),
                    }}
                >
                    <StaggerText
                        text={data.title}
                        revealed={revealed}
                        baseDelayMs={55}
                        wordStepMs={22}
                    />
                </h2>
                <p
                    className="mx-auto mt-5 max-w-3xl text-center text-base leading-relaxed"
                    style={{
                        color: tx.muted,
                        ...blockRevealStyle(revealed, 100),
                    }}
                >
                    <StaggerText
                        text={data.lead}
                        revealed={revealed}
                        baseDelayMs={105}
                        wordStepMs={18}
                    />
                </p>
                <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
                    <div
                        className="rounded-2xl border p-8 shadow-sm md:p-10"
                        style={{
                            borderColor: theme.cardBorder,
                            background: theme.cardBg,
                            filter: "saturate(0.82)",
                            ...blockRevealStyle(revealed, 155),
                            opacity: c.paperCardOpacity,
                        }}
                    >
                        <div
                            className="rounded-xl px-4 py-3 text-center"
                            style={{ background: "rgba(26,25,23,0.04)" }}
                        >
                            <div
                                className="mb-2 flex justify-center"
                                style={blockRevealStyle(revealed, 172)}
                            >
                                <Inbox
                                    size={32}
                                    strokeWidth={1.6}
                                    style={{ color: tx.muted, opacity: 0.82 }}
                                    aria-hidden
                                />
                            </div>
                            <h3
                                className="text-xl md:text-2xl"
                                style={{
                                    fontFamily: theme.typography.headingFont,
                                    color: tx.heading,
                                }}
                            >
                                <StaggerText
                                    text={data.paper.title}
                                    revealed={revealed}
                                    baseDelayMs={160}
                                    wordStepMs={20}
                                />
                            </h3>
                            <p
                                className="mt-2 text-sm"
                                style={{ color: tx.muted }}
                            >
                                <StaggerText
                                    text={data.paper.guestHint}
                                    revealed={revealed}
                                    baseDelayMs={182}
                                    wordStepMs={14}
                                />
                            </p>
                        </div>
                        <ul className="mt-8 space-y-4">
                            {data.paper.lines.map((line) => (
                                <li
                                    key={line.label}
                                    className="flex justify-between gap-4 border-b pb-4 text-sm last:border-0"
                                    style={{ borderColor: theme.cardBorder }}
                                >
                                    <span style={{ color: tx.muted }}>
                                        {line.label}
                                    </span>
                                    <span
                                        className="font-medium tabular-nums"
                                        style={{ color: tx.body }}
                                    >
                                        {line.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div
                            className="mt-8 flex flex-row items-center justify-between gap-4 border-t pt-6"
                            style={{ borderColor: theme.cardBorder }}
                        >
                            <span
                                className="min-w-0 font-medium"
                                style={{ color: tx.heading }}
                            >
                                <StaggerText
                                    text={data.paper.totalLabel}
                                    revealed={revealed}
                                    baseDelayMs={240}
                                    wordStepMs={16}
                                />
                            </span>
                            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                                <span
                                    className="text-xl font-semibold tabular-nums line-through [text-decoration-thickness:1px]"
                                    style={{ color: c.paperTotalStrike }}
                                >
                                    {data.paper.totalValue}
                                </span>
                                {data.paper.totalValueUsd ? (
                                    <span
                                        className="text-sm font-semibold tabular-nums line-through [text-decoration-thickness:1px]"
                                        style={{ color: c.paperTotalStrike }}
                                    >
                                        {data.paper.totalValueUsd}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div
                        className="relative rounded-2xl border-2 p-8 shadow-lg md:p-10"
                        style={{
                            borderColor: c.digitalCardBorder,
                            background: c.digitalCardBg,
                            ...blockRevealStyle(revealed, 220),
                        }}
                    >
                        <div
                            className="rounded-xl px-4 py-3 text-center"
                            style={{ background: "rgba(122,101,84,0.08)" }}
                        >
                            <div
                                className="mb-2 flex justify-center"
                                style={blockRevealStyle(revealed, 232)}
                            >
                                <Smartphone
                                    size={32}
                                    strokeWidth={1.6}
                                    style={{
                                        color: theme.accents.softGold,
                                        opacity: 0.92,
                                    }}
                                    aria-hidden
                                />
                            </div>
                            <h3
                                className="text-xl md:text-2xl"
                                style={{
                                    fontFamily: theme.typography.headingFont,
                                    color: tx.heading,
                                }}
                            >
                                <StaggerText
                                    text={data.digital.title}
                                    revealed={revealed}
                                    baseDelayMs={225}
                                    wordStepMs={20}
                                />
                            </h3>
                            <p
                                className="mt-2 text-sm"
                                style={{ color: tx.muted }}
                            >
                                <StaggerText
                                    text={data.digital.badge}
                                    revealed={revealed}
                                    baseDelayMs={236}
                                    wordStepMs={14}
                                />
                            </p>
                        </div>
                        <p
                            className="mt-3 text-center text-sm font-medium"
                            style={{ color: c.savingsColor }}
                        >
                            <StaggerText
                                text={data.digital.savingsLine}
                                revealed={revealed}
                                baseDelayMs={248}
                                wordStepMs={14}
                            />
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:gap-x-8">
                            {bullets.slice(0, 4).map((b) => (
                                <div
                                    key={b.text}
                                    className="flex items-start gap-2.5"
                                >
                                    <span
                                        className="mt-0.5 inline-flex shrink-0 rounded-lg p-1.5"
                                        style={{
                                            background: c.digitalBulletIconBg,
                                        }}
                                    >
                                        <TdyIcon
                                            name={b.icon}
                                            size={16}
                                            color={c.digitalBulletIconColor}
                                        />
                                    </span>
                                    <span className="block">
                                        <span
                                            className="block text-[13px] font-semibold leading-snug"
                                            style={{ color: tx.body }}
                                        >
                                            <StaggerText
                                                text={b.text}
                                                revealed={revealed}
                                                baseDelayMs={270}
                                                wordStepMs={12}
                                            />
                                        </span>
                                        {b.subtext ? (
                                            <span
                                                className="mt-0.5 block text-[11px] leading-snug"
                                                style={{ color: tx.muted }}
                                            >
                                                <StaggerText
                                                    text={b.subtext}
                                                    revealed={revealed}
                                                    baseDelayMs={286}
                                                    wordStepMs={10}
                                                />
                                            </span>
                                        ) : null}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div
                            className="mt-10 border-t pt-6"
                            style={{ borderColor: c.digitalCardBorder }}
                        >
                            <div className="flex flex-row items-center justify-between gap-4">
                                <span
                                    className="min-w-0 text-sm font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: tx.muted }}
                                >
                                    <StaggerText
                                        text={data.digital.fromLabel}
                                        revealed={revealed}
                                        baseDelayMs={285}
                                        wordStepMs={14}
                                    />
                                </span>
                                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                                    <span
                                        className="text-3xl font-semibold tabular-nums sm:text-4xl"
                                        style={{
                                            ...priceTypeStyle(theme),
                                            color: tx.heading,
                                        }}
                                    >
                                        {data.digital.fromPrice}
                                    </span>
                                    {data.digital.fromPriceUsd ? (
                                        <span
                                            className="text-sm font-semibold tabular-nums"
                                            style={{
                                                ...priceTypeStyle(theme),
                                                color: c.savingsColor,
                                            }}
                                        >
                                            {data.digital.fromPriceUsd}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <p
                            className="mt-6 text-xs leading-relaxed"
                            style={{ color: tx.caption }}
                        >
                            <StaggerText
                                text={data.digital.footnote}
                                revealed={revealed}
                                baseDelayMs={310}
                                wordStepMs={10}
                            />
                        </p>
                    </div>
                </div>
                <div
                    className="mt-16 overflow-visible"
                    style={{
                        background: "transparent",
                        ...blockRevealStyle(revealed, 290),
                    }}
                >
                    <p
                        className="flex items-center justify-center gap-2 px-2 py-3 text-center text-lg font-semibold md:text-xl"
                        style={{
                            color: tx.heading,
                            fontFamily:
                                "var(--font-landing-hero), Georgia, serif",
                        }}
                    >
                        <StaggerText
                            text={data.tableTitle}
                            revealed={revealed}
                            baseDelayMs={294}
                            wordStepMs={16}
                        />
                    </p>
                    <div className="overflow-x-auto px-3 sm:px-5 md:px-7">
                        <table className="w-full min-w-[300px] text-left text-sm">
                            <thead>
                                <tr>
                                    <th
                                        className="px-5 py-3 text-left font-semibold"
                                        style={{ color: tx.heading }}
                                    >
                                        <StaggerText
                                            text={th.feature}
                                            revealed={revealed}
                                            baseDelayMs={302}
                                            wordStepMs={14}
                                        />
                                    </th>
                                    <th
                                        className="px-5 py-3 text-center font-semibold"
                                        style={{ color: tx.heading }}
                                    >
                                        <StaggerText
                                            text={th.paper}
                                            revealed={revealed}
                                            baseDelayMs={316}
                                            wordStepMs={14}
                                        />
                                    </th>
                                    <th
                                        className="px-5 py-3 text-center font-semibold"
                                        style={{ color: tx.heading }}
                                    >
                                        <StaggerText
                                            text={th.digital}
                                            revealed={revealed}
                                            baseDelayMs={330}
                                            wordStepMs={14}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tableRows.map((row, ri) => (
                                    <tr key={row.feature}>
                                        <td
                                            className="px-5 py-4"
                                            style={{
                                                color: tx.body,
                                                ...blockRevealStyle(
                                                    revealed,
                                                    320 + ri * 38,
                                                ),
                                            }}
                                        >
                                            <StaggerText
                                                text={row.feature}
                                                revealed={revealed}
                                                baseDelayMs={322 + ri * 38}
                                                wordStepMs={12}
                                            />
                                        </td>
                                        <td
                                            className="px-5 py-3"
                                            style={blockRevealStyle(
                                                revealed,
                                                334 + ri * 38,
                                            )}
                                        >
                                            <div className="flex justify-center">
                                                <span
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                                                    style={{
                                                        background:
                                                            c.tablePaperCircleBg,
                                                    }}
                                                >
                                                    <X
                                                        size={12}
                                                        strokeWidth={2.75}
                                                        style={{
                                                            color: c.tablePaperIcon,
                                                        }}
                                                        aria-hidden
                                                    />
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            className="px-5 py-3"
                                            style={blockRevealStyle(
                                                revealed,
                                                348 + ri * 38,
                                            )}
                                        >
                                            <div className="flex justify-center">
                                                <span
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                                                    style={{
                                                        background:
                                                            c.tableDigitalCircleBg,
                                                    }}
                                                >
                                                    <Check
                                                        size={12}
                                                        strokeWidth={2.75}
                                                        style={{
                                                            color: c.tableDigitalIcon,
                                                        }}
                                                        aria-hidden
                                                    />
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <p
                    className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 px-3 text-center text-sm sm:px-0"
                    style={{
                        color: tx.muted,
                        ...blockRevealStyle(revealed, 360),
                    }}
                >
                    <Leaf size={14} aria-hidden />
                    <StaggerText
                        text={data.ecoNote}
                        revealed={revealed}
                        baseDelayMs={362}
                        wordStepMs={11}
                    />
                </p>
            </div>
        </section>
    );
}

function CatalogMedia({
    image,
    videoSrc,
    alt,
    imageObjectFit = "cover",
}: {
    image?: string;
    videoSrc?: string;
    alt: string;
    /** `contain` muestra casi toda la captura (letterboxing); `cover` recorta a la tarjeta. */
    imageObjectFit?: "cover" | "contain";
}) {
    if (videoSrc) {
        return (
            <video
                className={`absolute inset-0 h-full w-full ${imageObjectFit === "contain" ? "object-contain" : "object-cover"}`}
                autoPlay
                muted
                loop
                playsInline
                poster={image || undefined}
                aria-label={alt}
            >
                <source src={videoSrc} type="video/mp4" />
            </video>
        );
    }
    if (image) {
        return (
            <Image
                src={image}
                alt={alt}
                fill
                className={
                    imageObjectFit === "contain"
                        ? "object-contain"
                        : "object-cover"
                }
                sizes="(max-width: 768px) 78vw, 288px"
            />
        );
    }
    return (
        <div
            className="absolute inset-0 bg-gradient-to-br from-stone-200/90 to-stone-400/50"
            aria-hidden
        />
    );
}

/** Segmento de tipo en href de muestra: `/m/{tipo}/...` */
type EstiloCatalogKind = string;

function estiloKindFromHref(
    href: string | undefined,
): EstiloCatalogKind | null {
    if (!href) return null;
    const m = href.trim().match(/^\/m\/([^/]+)(\/|$)/i);
    if (!m) return null;
    return m[1].toLowerCase();
}

function estiloItemsGroupedByKind(
    items: LandingData["sections"]["estilos"]["items"],
): {
    kind: EstiloCatalogKind;
    items: LandingData["sections"]["estilos"]["items"];
}[] {
    const out: {
        kind: EstiloCatalogKind;
        items: LandingData["sections"]["estilos"]["items"];
    }[] = [];
    const orphans: LandingData["sections"]["estilos"]["items"] = [];
    for (const it of items) {
        const k = estiloKindFromHref(it.href);
        if (!k) {
            orphans.push(it);
            continue;
        }
        const last = out[out.length - 1];
        if (last?.kind === k) {
            last.items.push(it);
        } else {
            out.push({ kind: k, items: [it] });
        }
    }
    if (orphans.length) {
        if (out[0]) out[0].items.unshift(...orphans);
        else if (orphans.length)
            out.push({ kind: "otros", items: [...orphans] });
    }
    return out;
}

function estiloCatalogGroupTitle(
    kind: EstiloCatalogKind,
    locale: LandingLocale,
): string {
    if (kind === "otros") {
        return locale === "en" ? "More samples" : "Más modelos";
    }
    if (locale === "en") {
        const en: Record<string, string> = {
            boda: "Weddings",
            xv: "XV",
            baby: "Baby shower",
            cumple: "Birthdays",
        };
        const k = kind.toLowerCase();
        if (en[k]) return en[k];
        return kind.charAt(0).toUpperCase() + kind.slice(1).replace(/-/g, " ");
    }
    if (kind === "boda") return "Bodas";
    if (kind === "xv") return "XV años";
    if (kind === "baby") return "Baby shower";
    return eventTypeLabelFromFolderTipo(kind);
}

function scrollToEstilosGrupo(kind: EstiloCatalogKind) {
    document
        .getElementById(`estilos-grupo-${kind}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function EstilosCarousel({
    data,
    theme,
    waNumber,
    locale = "es",
    endHeroPrimaryCta,
}: {
    data: LandingData["sections"]["estilos"];
    theme: LandingTheme;
    waNumber: string;
    locale?: LandingLocale;
    /** Mismo CTA principal que el hero (#planes + precio) debajo del carrusel (layout compacto). */
    endHeroPrimaryCta?: {
        locale: LandingLocale;
        primary?: CtaButton;
    };
}) {
    const { revealRef, revealed } = useSectionReveal();
    const tx = theme.text;
    const b = theme.buttons;
    const waNoStyle = waHref(waNumber, data.noStyleWhatsappMessage);
    const noStyleConfirmMessage =
        data.noStyleConfirmMessage ??
        (locale === "en"
            ? "You will be redirected to the designer's WhatsApp. Continue?"
            : "Serás redirigida al WhatsApp del diseñador. ¿Querés continuar?");
    const car = LANDING_MOTION.estilosCarousel;
    const cardBaseDelay = car.firstCardDelayMs;
    const kindGroups = useMemo(
        () => estiloItemsGroupedByKind(data.items),
        [data.items],
    );
    const showKindSplit = kindGroups.length > 1;

    const estilosCarouselRowClass =
        "flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-4 pt-2 md:gap-6 md:px-8 [scrollbar-width:thin] scroll-pl-5 scroll-pr-5";

    const renderEstiloCard = (
        item: LandingData["sections"]["estilos"]["items"][number],
        i: number,
    ) => {
        const cardClass =
            "group relative aspect-[9/16] w-[min(76vw,252px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-black/10 bg-[#121110] shadow-md sm:w-[min(72vw,268px)] md:w-[288px]";
        const inner = (
            <>
                <CatalogMedia
                    image={item.image}
                    videoSrc={item.videoSrc}
                    alt={item.titulo}
                    imageObjectFit="contain"
                />
                <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-black/15"
                    aria-hidden
                />
                <div
                    className="absolute right-3 top-3 rounded-full bg-black/30 p-2 backdrop-blur-sm"
                    aria-hidden
                >
                    <Sparkles size={17} className="text-white/95" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex flex-col p-6 pt-20 text-left">
                    <h3
                        className="text-2xl font-normal text-white"
                        style={{
                            fontFamily: theme.typography.headingFont,
                        }}
                    >
                        <StaggerText
                            text={item.titulo}
                            revealed={revealed}
                            baseDelayMs={
                                cardBaseDelay + i * car.stepBetweenCardsMs + 22
                            }
                            wordStepMs={18}
                        />
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/88">
                        <StaggerText
                            text={item.descripcion}
                            revealed={revealed}
                            baseDelayMs={
                                cardBaseDelay + i * car.stepBetweenCardsMs + 44
                            }
                            wordStepMs={10}
                        />
                    </p>
                    <span
                        className="pointer-events-none mt-4 inline-flex w-fit items-center gap-0.5 rounded-full border bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-[2px] md:text-[11px]"
                        style={{
                            borderColor: b.demoOverlayBorder,
                            color: b.demoOverlayText,
                        }}
                    >
                        {data.demoButtonText}
                        <ChevronRight
                            size={13}
                            strokeWidth={2}
                            className="opacity-90"
                            aria-hidden
                        />
                    </span>
                </div>
            </>
        );
        const cardStyle = {
            borderColor: theme.cardBorder,
            ...blockRevealStyle(
                revealed,
                cardBaseDelay + i * car.stepBetweenCardsMs,
            ),
        };
        if (item.href) {
            return (
                <a
                    key={item.titulo}
                    href={item.href}
                    className={cardClass}
                    style={cardStyle}
                >
                    {inner}
                </a>
            );
        }
        return (
            <div key={item.titulo} className={cardClass} style={cardStyle}>
                {inner}
            </div>
        );
    };

    return (
        <section
            id={data.id || "muestras"}
            className="px-0 py-20 md:py-28"
            style={{ background: theme.surfaceAlt }}
        >
            <div ref={revealRef}>
                <div className="mx-auto max-w-6xl px-5 md:px-8">
                    <p
                        className="text-center text-[11px] font-semibold uppercase tracking-[0.3em]"
                        style={{
                            color: theme.accents.softGold,
                            ...blockRevealStyle(revealed, 0),
                        }}
                    >
                        <StaggerText
                            text={data.eyebrow}
                            revealed={revealed}
                            baseDelayMs={0}
                            wordStepMs={24}
                        />
                    </p>
                    <h2
                        className="mt-3 text-center text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                        style={{
                            fontFamily: theme.typography.headingFont,
                            color: tx.heading,
                            ...blockRevealStyle(revealed, 55),
                        }}
                    >
                        <StaggerText
                            text={data.title}
                            revealed={revealed}
                            baseDelayMs={55}
                            wordStepMs={20}
                        />
                    </h2>
                    <p
                        className="mx-auto mt-4 max-w-2xl text-center text-base"
                        style={{
                            color: tx.muted,
                            ...blockRevealStyle(revealed, 105),
                        }}
                    >
                        <StaggerText
                            text={data.subtitle}
                            revealed={revealed}
                            baseDelayMs={108}
                            wordStepMs={14}
                        />
                    </p>
                </div>
                {showKindSplit ? (
                    <nav
                        className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-center gap-2 px-5 md:px-8"
                        aria-label={
                            locale === "en"
                                ? "Jump to a model category"
                                : "Ir a un tipo de modelo"
                        }
                    >
                        {kindGroups.map(({ kind }) => (
                            <button
                                key={kind}
                                type="button"
                                onClick={() => scrollToEstilosGrupo(kind)}
                                className="rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-[transform,box-shadow] duration-200 hover:shadow-md active:scale-[0.98]"
                                style={{
                                    borderColor: theme.cardBorder,
                                    color: tx.heading,
                                    background: theme.background,
                                }}
                            >
                                {estiloCatalogGroupTitle(kind, locale)}
                            </button>
                        ))}
                    </nav>
                ) : null}
                {showKindSplit ? (
                    <div className="mt-4 space-y-12 md:space-y-16">
                        {kindGroups.map((group, groupIndex) => {
                            const cardOffset = kindGroups
                                .slice(0, groupIndex)
                                .reduce((n, g) => n + g.items.length, 0);
                            return (
                                <div
                                    key={group.kind}
                                    id={`estilos-grupo-${group.kind}`}
                                    className="scroll-mt-28"
                                >
                                    <div className="mx-auto max-w-6xl px-5 md:px-8">
                                        <h3
                                            className="text-lg font-medium tracking-tight md:text-xl"
                                            style={{
                                                fontFamily:
                                                    theme.typography
                                                        .headingFont,
                                                color: tx.heading,
                                                ...blockRevealStyle(
                                                    revealed,
                                                    128 + groupIndex * 20,
                                                ),
                                            }}
                                        >
                                            {estiloCatalogGroupTitle(
                                                group.kind,
                                                locale,
                                            )}
                                        </h3>
                                    </div>
                                    <div
                                        className={`mt-4 ${estilosCarouselRowClass}`}
                                    >
                                        {group.items.map((item, li) =>
                                            renderEstiloCard(
                                                item,
                                                cardOffset + li,
                                            ),
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`mt-12 ${estilosCarouselRowClass}`}>
                        {data.items.map((item, i) => renderEstiloCard(item, i))}
                    </div>
                )}
                {endHeroPrimaryCta ? (
                    <div
                        className="mx-auto mt-12 flex w-full max-w-[280px] flex-col items-stretch sm:max-w-md"
                        style={blockRevealStyle(
                            revealed,
                            cardBaseDelay +
                                data.items.length * car.stepBetweenCardsMs +
                                car.footerAfterCardsExtraMs +
                                95,
                        )}
                    >
                        <Landing2PrimaryPill
                            primary={endHeroPrimaryCta.primary}
                            theme={theme}
                            locale={endHeroPrimaryCta.locale}
                            waNumber={waNumber}
                            trackingSource="muestras_mid"
                        />
                    </div>
                ) : null}
                <p
                    className="mt-10 px-5 text-center text-xs leading-relaxed md:px-8 md:text-[13px]"
                    style={{
                        color: tx.muted,
                        ...blockRevealStyle(
                            revealed,
                            cardBaseDelay +
                                data.items.length * car.stepBetweenCardsMs +
                                car.footerAfterCardsExtraMs,
                        ),
                    }}
                >
                    <StaggerText
                        text={data.noStylePrompt}
                        revealed={revealed}
                        baseDelayMs={
                            cardBaseDelay +
                            data.items.length * car.stepBetweenCardsMs +
                            car.footerAfterCardsExtraMs +
                            18
                        }
                        wordStepMs={10}
                    />{" "}
                    <a
                        href={waNoStyle}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => {
                            event.preventDefault();
                            const ok = window.confirm(noStyleConfirmMessage);
                            if (!ok) return;
                            window.open(
                                waNoStyle,
                                "_blank",
                                "noopener,noreferrer",
                            );
                        }}
                        className="font-semibold underline decoration-1 underline-offset-[3px]"
                        style={{ color: tx.link }}
                    >
                        <StaggerText
                            text={data.noStyleCta}
                            revealed={revealed}
                            baseDelayMs={
                                cardBaseDelay +
                                data.items.length * car.stepBetweenCardsMs +
                                car.footerAfterCardsExtraMs +
                                32
                            }
                            wordStepMs={12}
                        />
                    </a>
                </p>
            </div>
        </section>
    );
}

function IdiomasSection({
    data,
    theme,
}: {
    data: LandingData["sections"]["idiomas"];
    theme: LandingTheme;
}) {
    const { revealRef, revealed } = useSectionReveal();
    const tx = theme.text;

    return (
        <section
            className="px-5 py-20 md:px-8 md:py-28"
            style={{ background: theme.background }}
        >
            <div ref={revealRef} className="mx-auto max-w-3xl text-center">
                <div
                    className="mb-4 flex justify-center"
                    style={blockRevealStyle(revealed, 0)}
                >
                    <Languages
                        size={26}
                        strokeWidth={1.25}
                        style={{ color: theme.accents.softGold }}
                    />
                </div>
                <h2
                    className="text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                    style={{
                        fontFamily: theme.typography.headingFont,
                        color: tx.heading,
                        ...blockRevealStyle(revealed, 50),
                    }}
                >
                    <StaggerText
                        text={data.title}
                        revealed={revealed}
                        baseDelayMs={55}
                        wordStepMs={20}
                    />
                </h2>
                <p
                    className="mt-5 text-base leading-relaxed"
                    style={{
                        color: tx.muted,
                        ...blockRevealStyle(revealed, 100),
                    }}
                >
                    <StaggerText
                        text={data.subtitle}
                        revealed={revealed}
                        baseDelayMs={105}
                        wordStepMs={14}
                    />
                </p>
                <div
                    className="mt-8 flex items-center justify-center"
                    style={blockRevealStyle(revealed, 155)}
                >
                    <span
                        className="h-px w-20"
                        style={{ background: theme.cardBorder }}
                    />
                    <Globe2
                        size={18}
                        strokeWidth={1.8}
                        className="mx-3"
                        style={{ color: theme.accents.softGold }}
                        aria-hidden
                    />
                    <span
                        className="h-px w-20"
                        style={{ background: theme.cardBorder }}
                    />
                </div>
                <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-3 justify-items-center gap-2.5 sm:gap-3.5 md:gap-4">
                    {data.languages.map((lang, i) => (
                        <div
                            key={lang.code}
                            className="flex w-full max-w-[170px] flex-col items-center justify-center rounded-2xl border px-2.5 py-3 sm:max-w-[190px] sm:px-3.5 sm:py-3.5 md:max-w-[210px] md:px-4 md:py-4"
                            style={{
                                borderColor: theme.cardBorder,
                                background: "rgba(122, 106, 93, 0.09)",
                                ...blockRevealStyle(revealed, 215 + i * 58),
                            }}
                        >
                            <span
                                className="text-center text-[11px] font-medium leading-snug sm:text-xs md:text-sm"
                                style={{
                                    fontFamily: theme.typography.headingFont,
                                    color: tx.heading,
                                }}
                            >
                                <StaggerText
                                    text={lang.name}
                                    revealed={revealed}
                                    baseDelayMs={228 + i * 58}
                                    wordStepMs={16}
                                />
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mx-auto mt-12 max-w-2xl text-center">
                    <p
                        className="text-base font-semibold tracking-tight md:text-lg"
                        style={{
                            color: tx.heading,
                            ...blockRevealStyle(
                                revealed,
                                215 + data.languages.length * 58 + 40,
                            ),
                        }}
                    >
                        <StaggerText
                            text={
                                data.missingLanguageTitle ??
                                (tx.inverse
                                    ? "¿No ves tu idioma?"
                                    : "Don't see your language?")
                            }
                            revealed={revealed}
                            baseDelayMs={220 + data.languages.length * 58 + 45}
                            wordStepMs={14}
                        />
                    </p>
                    <p
                        className="mt-2 text-sm font-medium leading-relaxed md:text-base"
                        style={{
                            color: theme.accents.softGold,
                            ...blockRevealStyle(
                                revealed,
                                215 + data.languages.length * 58 + 78,
                            ),
                        }}
                    >
                        <StaggerText
                            text={
                                data.missingLanguageSubtitle ??
                                "Trabajamos con cualquier idioma del mundo"
                            }
                            revealed={revealed}
                            baseDelayMs={220 + data.languages.length * 58 + 82}
                            wordStepMs={12}
                        />
                    </p>
                </div>
            </div>
        </section>
    );
}

function ProcesoTdy({
    data,
    theme,
}: {
    data: LandingData["sections"]["proceso"];
    theme: LandingTheme;
}) {
    const { revealRef, revealed } = useSectionReveal();
    const tx = theme.text;
    if (!data.enabled) return null;
    return (
        <section
            id={data.id ?? "proceso"}
            className="px-5 py-20 md:px-8 md:py-28"
            style={{ background: theme.surfaceAlt }}
        >
            <div ref={revealRef} className="mx-auto max-w-5xl">
                <h2
                    className="mb-16 text-center text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                    style={{
                        fontFamily: theme.typography.headingFont,
                        color: tx.heading,
                        ...blockRevealStyle(revealed, 20),
                    }}
                >
                    <StaggerText
                        text={data.title}
                        revealed={revealed}
                        baseDelayMs={58}
                        wordStepMs={20}
                    />
                </h2>
                <div className="grid gap-12 md:grid-cols-3 md:gap-10">
                    {data.steps.map((step, i) => {
                        const b0 = 120 + i * 85;
                        return (
                            <div
                                key={step.number + step.title}
                                className="text-center md:text-left"
                            >
                                <div
                                    className="mb-4 flex justify-center md:justify-start"
                                    style={blockRevealStyle(revealed, b0)}
                                >
                                    <TdyIcon
                                        name={step.icon ?? "sparkles"}
                                        size={30}
                                        color={theme.accents.softGold}
                                    />
                                </div>
                                <h3
                                    className="text-xl font-normal"
                                    style={{
                                        fontFamily:
                                            theme.typography.headingFont,
                                        color: tx.heading,
                                        ...blockRevealStyle(revealed, b0 + 38),
                                    }}
                                >
                                    <StaggerText
                                        text={step.title}
                                        revealed={revealed}
                                        baseDelayMs={b0 + 42}
                                        wordStepMs={16}
                                    />
                                </h3>
                                <p
                                    className="mt-3 text-sm leading-relaxed"
                                    style={{
                                        color: tx.muted,
                                        ...blockRevealStyle(revealed, b0 + 72),
                                    }}
                                >
                                    <StaggerText
                                        text={step.description}
                                        revealed={revealed}
                                        baseDelayMs={b0 + 74}
                                        wordStepMs={10}
                                    />
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function PanelSection({
    data,
    theme,
}: {
    data: LandingData["sections"]["panel"];
    theme: LandingTheme;
}) {
    const { revealRef, revealed } = useSectionReveal();
    const tx = theme.text;
    return (
        <section
            className="px-5 py-20 md:px-8 md:py-28"
            style={{ background: theme.background }}
        >
            <div ref={revealRef} className="mx-auto max-w-6xl">
                <p
                    className="text-center text-[11px] font-semibold uppercase tracking-[0.3em]"
                    style={{
                        color: theme.accents.softGold,
                        ...blockRevealStyle(revealed, 0),
                    }}
                >
                    <StaggerText
                        text={data.eyebrow}
                        revealed={revealed}
                        baseDelayMs={0}
                        wordStepMs={22}
                    />
                </p>
                <h2
                    className="mt-3 text-center text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                    style={{
                        fontFamily: theme.typography.headingFont,
                        color: tx.heading,
                        ...blockRevealStyle(revealed, 50),
                    }}
                >
                    <StaggerText
                        text={data.title}
                        revealed={revealed}
                        baseDelayMs={52}
                        wordStepMs={20}
                    />
                </h2>
                <p
                    className="mx-auto mt-4 max-w-2xl text-center text-base"
                    style={{
                        color: tx.muted,
                        ...blockRevealStyle(revealed, 100),
                    }}
                >
                    <StaggerText
                        text={data.subtitle}
                        revealed={revealed}
                        baseDelayMs={104}
                        wordStepMs={14}
                    />
                </p>
                {data.imageSrc ? (
                    <div
                        className="relative mx-auto mt-10 flex justify-center"
                        style={blockRevealStyle(revealed, 195)}
                    >
                        <div
                            className="relative inline-flex max-w-full overflow-hidden rounded-2xl"
                            style={{ background: theme.background }}
                        >
                            <div className="relative aspect-[9/16] h-auto w-[min(88vw,300px)] max-h-[min(70vh,520px)] max-w-full sm:w-[min(86vw,360px)] md:w-[min(84vw,480px)]">
                                <Image
                                    src={data.imageSrc}
                                    alt={data.imageAlt}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 90vw, 480px"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border shadow-lg"
                        style={{
                            borderColor: theme.cardBorder,
                            background: theme.cardBg,
                            ...blockRevealStyle(revealed, 195),
                        }}
                    >
                        <div className="p-6 md:p-10">
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {data.stats.map((s) => (
                                    <div
                                        key={s.label}
                                        className="rounded-xl border p-4 text-center"
                                        style={{
                                            borderColor: theme.cardBorder,
                                            background: theme.surfaceAlt,
                                        }}
                                    >
                                        <p
                                            className="text-3xl font-normal tabular-nums"
                                            style={{
                                                fontFamily:
                                                    theme.typography
                                                        .headingFont,
                                                color: tx.heading,
                                            }}
                                        >
                                            {s.value}
                                        </p>
                                        <p
                                            className="mt-1 text-xs font-medium uppercase tracking-wider"
                                            style={{ color: tx.muted }}
                                        >
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div
                                className="mt-6 rounded-xl border p-4 md:p-6"
                                style={{ borderColor: theme.cardBorder }}
                            >
                                <div className="mb-4 flex justify-between text-sm">
                                    <span
                                        className="font-medium"
                                        style={{ color: tx.heading }}
                                    >
                                        {data.guestListTitle}
                                    </span>
                                    <span style={{ color: tx.muted }}>
                                        {data.guestListTotal}
                                    </span>
                                </div>
                                <ul className="space-y-2">
                                    {data.sampleGuests.map((g) => (
                                        <li
                                            key={g.name}
                                            className="flex justify-between rounded-lg border px-3 py-2 text-sm"
                                            style={{
                                                borderColor: theme.cardBorder,
                                            }}
                                        >
                                            <span style={{ color: tx.body }}>
                                                {g.name}
                                            </span>
                                            {g.note ? (
                                                <span
                                                    style={{ color: tx.muted }}
                                                >
                                                    {g.note}
                                                </span>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p
                                className="mt-4 text-center text-xs"
                                style={{ color: tx.caption }}
                            >
                                Screenshot:{" "}
                                <code className="rounded bg-black/[0.06] px-1">
                                    sections.panel.imageSrc
                                </code>
                            </p>
                        </div>
                    </div>
                )}
                <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-16">
                    {data.features.map((f, i) => (
                        <div
                            key={f.title}
                            style={blockRevealStyle(revealed, 265 + i * 72)}
                        >
                            <span
                                className="mb-3 inline-flex"
                                style={{ color: theme.accents.softGold }}
                            >
                                <TdyIcon
                                    name={f.icon ?? "barChart"}
                                    size={24}
                                    color={theme.accents.softGold}
                                />
                            </span>
                            <h3
                                className="mt-2 text-lg font-normal"
                                style={{
                                    fontFamily: theme.typography.headingFont,
                                    color: tx.heading,
                                }}
                            >
                                <StaggerText
                                    text={f.title}
                                    revealed={revealed}
                                    baseDelayMs={268 + i * 72}
                                    wordStepMs={16}
                                />
                            </h3>
                            <p
                                className="mt-2 text-sm leading-relaxed"
                                style={{ color: tx.muted }}
                            >
                                <StaggerText
                                    text={f.subtitle}
                                    revealed={revealed}
                                    baseDelayMs={286 + i * 72}
                                    wordStepMs={10}
                                />
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PlanesTdy({
    data,
    theme,
    buttons,
    waNumber,
    modelsLink,
}: {
    data: LandingData["sections"]["servicio"];
    theme: LandingTheme;
    buttons: Record<string, CtaButton>;
    waNumber: string;
    /** Texto + CTA bajo las tarjetas (JSON o fallback si `reviewsTopSimple`). */
    modelsLink?: { prompt: string; cta: string; anchor: string };
}) {
    const { revealRef, revealed } = useSectionReveal();
    const tx = theme.text;
    const b = theme.buttons;
    if (!data.enabled) return null;
    return (
        <section
            id="planes"
            className="px-5 py-20 md:px-8 md:py-28"
            style={{ background: theme.surfaceAlt }}
        >
            <div ref={revealRef} className="mx-auto max-w-5xl">
                <div
                    className="mb-4 flex justify-center"
                    style={blockRevealStyle(revealed, 0)}
                >
                    <Banknote
                        size={26}
                        strokeWidth={1.35}
                        style={{ color: theme.accents.softGold }}
                    />
                </div>
                <h2
                    className="text-center text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                    style={{
                        fontFamily: theme.typography.headingFont,
                        color: tx.heading,
                        ...blockRevealStyle(revealed, 50),
                    }}
                >
                    <StaggerText
                        text={data.title}
                        revealed={revealed}
                        baseDelayMs={52}
                        wordStepMs={20}
                    />
                </h2>
                <p
                    className="mx-auto mt-4 max-w-2xl text-center text-base"
                    style={{
                        color: tx.muted,
                        ...blockRevealStyle(revealed, 100),
                    }}
                >
                    <StaggerText
                        text={data.subtitle}
                        revealed={revealed}
                        baseDelayMs={104}
                        wordStepMs={14}
                    />
                </p>
                {data.notice && (
                    <p
                        className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed md:text-sm"
                        style={{
                            color: tx.caption,
                            ...blockRevealStyle(revealed, 145),
                        }}
                    >
                        <StaggerText
                            text={data.notice}
                            revealed={revealed}
                            baseDelayMs={148}
                            wordStepMs={10}
                        />
                    </p>
                )}
                <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch">
                    {data.planes.map((plan, i) => {
                        const isPremium =
                            plan.ctaButton === "planPremium" ||
                            plan.ctaButton === "plan-premium";
                        const isUniqueDesign =
                            plan.ctaButton === "planDisenoUnico" ||
                            plan.ctaButton === "planUniqueDesign" ||
                            plan.name.toLowerCase().includes("diseño") ||
                            plan.name.toLowerCase().includes("unique");
                        const ctaBtn = buttons[plan.ctaButton];
                        const leadSource = isPremium
                            ? "plan_premium"
                            : isUniqueDesign
                              ? "plan_diseno_unico"
                              : "plan_otro";
                        return (
                            <div
                                key={plan.name}
                                id={
                                    plan.ctaButton === "planPremium"
                                        ? "plan-premium"
                                        : undefined
                                }
                                className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-10 ${isPremium ? "lg:scale-[1.02] lg:shadow-lg" : ""}`}
                                style={{
                                    background: theme.cardBg,
                                    borderColor: isPremium
                                        ? theme.foreground
                                        : theme.cardBorder,
                                    ...blockRevealStyle(revealed, 195 + i * 75),
                                }}
                            >
                                {plan.badge && (
                                    <span
                                        className="absolute -top-3 left-8 rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-widest"
                                        style={{
                                            background: b.primaryBg,
                                            color: b.primaryText,
                                        }}
                                    >
                                        {plan.badge}
                                    </span>
                                )}
                                <h3
                                    className="text-2xl font-normal"
                                    style={{
                                        fontFamily:
                                            theme.typography.headingFont,
                                        color: tx.heading,
                                    }}
                                >
                                    <StaggerText
                                        text={plan.name}
                                        revealed={revealed}
                                        baseDelayMs={198 + i * 75}
                                        wordStepMs={16}
                                    />
                                </h3>
                                <p
                                    className="mt-2 text-sm leading-relaxed"
                                    style={{ color: tx.muted }}
                                >
                                    {hasBoldMarkers(plan.description) ? (
                                        <span>
                                            {renderTextWithBoldMarkers(
                                                plan.description,
                                            )}
                                        </span>
                                    ) : (
                                        <StaggerText
                                            text={plan.description}
                                            revealed={revealed}
                                            baseDelayMs={214 + i * 75}
                                            wordStepMs={10}
                                        />
                                    )}
                                </p>
                                {data.showPrices && (
                                    <p
                                        className="mt-6 flex flex-wrap items-baseline gap-x-2.5 text-3xl font-semibold sm:text-[2.5rem] lg:text-[2.65rem]"
                                        style={{
                                            ...priceTypeStyle(theme),
                                            color: tx.heading,
                                        }}
                                    >
                                        <span>{plan.price}</span>
                                        {plan.priceUsd ? (
                                            <span
                                                className="text-xl font-medium sm:text-2xl"
                                                style={{
                                                    ...priceTypeStyle(theme),
                                                    color: tx.muted,
                                                }}
                                            >
                                                · {plan.priceUsd}
                                            </span>
                                        ) : null}
                                    </p>
                                )}
                                {!isUniqueDesign ? (
                                    <ul className="mt-8 flex flex-col gap-3">
                                        {plan.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-start gap-3 text-sm"
                                                style={{ color: tx.body }}
                                            >
                                                <Check
                                                    size={16}
                                                    className="mt-0.5 shrink-0"
                                                    strokeWidth={2.2}
                                                    style={{
                                                        color: isPremium
                                                            ? theme.accents
                                                                  .softGold
                                                            : theme.accents
                                                                  .iconMuted,
                                                    }}
                                                />
                                                <span>
                                                    {hasBoldMarkers(f) ? (
                                                        <span>
                                                            {renderTextWithBoldMarkers(
                                                                f,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <StaggerText
                                                            text={f}
                                                            revealed={revealed}
                                                            baseDelayMs={
                                                                232 + i * 75
                                                            }
                                                            wordStepMs={9}
                                                        />
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                {ctaBtn && (
                                    <div
                                        className={
                                            isUniqueDesign ? "mt-8" : "mt-10"
                                        }
                                    >
                                        <CtaLink
                                            btn={ctaBtn}
                                            waNumber={waNumber}
                                            trackingEvent="Lead"
                                            trackingSource={leadSource}
                                            className="flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-medium transition-transform duration-200 hover:scale-[1.02]"
                                            style={
                                                isPremium
                                                    ? {
                                                          background:
                                                              b.primaryBg,
                                                          color: b.primaryText,
                                                      }
                                                    : {
                                                          border: `1.5px solid ${b.primaryBg}`,
                                                          color: b.secondaryText,
                                                          background:
                                                              "transparent",
                                                      }
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {modelsLink ? (
                    <div
                        className="mx-auto mt-16 max-w-xl text-center md:mt-20"
                        style={blockRevealStyle(
                            revealed,
                            195 + data.planes.length * 75 + 90,
                        )}
                    >
                        <p
                            className="text-base leading-relaxed md:text-[17px]"
                            style={{ color: tx.muted }}
                        >
                            {modelsLink.prompt}
                        </p>
                        <a
                            href={modelsLink.anchor}
                            onClick={(event) =>
                                handleLocalAnchorClick(event, modelsLink.anchor)
                            }
                            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full border px-8 py-2.5 text-[15px] font-semibold shadow-sm transition-colors duration-200 hover:brightness-[0.98]"
                            style={{
                                borderColor: b.primaryBg,
                                color: b.secondaryText,
                                background: "transparent",
                                textDecoration: "none",
                            }}
                        >
                            {modelsLink.cta}
                        </a>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

function FaqTdy({
    data,
    theme,
    heroCtaFooter,
}: {
    data: LandingData["sections"]["faq"];
    theme: LandingTheme;
    /** Título + mismo CTA principal que el hero al pie del FAQ (layout compacto). */
    heroCtaFooter?: {
        locale: LandingLocale;
        primary?: CtaButton;
        waNumber: string;
        footerTitle?: string;
    };
}) {
    const { revealRef, revealed } = useSectionReveal();
    const tx = theme.text;
    const [openIndex, setOpenIndex] = useState<number>(0);

    if (!data.enabled) return null;

    return (
        <section
            id={data.id || "faq"}
            className="px-5 py-20 md:px-8 md:py-28"
            style={{ background: theme.surfaceAlt }}
        >
            <div ref={revealRef} className="mx-auto max-w-3xl">
                <h2
                    className="text-center text-3xl font-normal tracking-tight md:text-4xl lg:text-[2.75rem]"
                    style={{
                        fontFamily: theme.typography.headingFont,
                        color: tx.heading,
                        ...blockRevealStyle(revealed, 40),
                    }}
                >
                    <StaggerText
                        text={data.title}
                        revealed={revealed}
                        baseDelayMs={44}
                        wordStepMs={20}
                    />
                </h2>
                {data.subtitle ? (
                    <p
                        className="mx-auto mt-4 max-w-2xl text-center text-base"
                        style={{
                            color: tx.muted,
                            ...blockRevealStyle(revealed, 88),
                        }}
                    >
                        <StaggerText
                            text={data.subtitle}
                            revealed={revealed}
                            baseDelayMs={92}
                            wordStepMs={12}
                        />
                    </p>
                ) : null}
                <div className="mt-12">
                    {data.items.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={`${item.question}-${i}`}
                                className="border-b"
                                style={{
                                    borderColor: theme.cardBorder,
                                    ...blockRevealStyle(revealed, 120 + i * 34),
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenIndex((prev) =>
                                            prev === i ? -1 : i,
                                        )
                                    }
                                    className="flex min-h-[60px] w-full items-center justify-between gap-4 py-4 text-left"
                                    aria-expanded={isOpen}
                                >
                                    <span
                                        className="text-sm font-semibold leading-relaxed md:text-[15px]"
                                        style={{ color: tx.heading }}
                                    >
                                        {item.question}
                                    </span>
                                    <span
                                        className="shrink-0 text-2xl font-light transition-transform duration-200"
                                        style={{
                                            color: tx.muted,
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                        }}
                                        aria-hidden
                                    >
                                        +
                                    </span>
                                </button>
                                <div
                                    className="overflow-hidden transition-[max-height,opacity] duration-300"
                                    style={{
                                        maxHeight: isOpen ? "260px" : "0px",
                                        opacity: isOpen ? 1 : 0,
                                    }}
                                >
                                    <p
                                        className="pb-5 pr-2 text-sm leading-relaxed md:text-[15px]"
                                        style={{ color: tx.muted }}
                                    >
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {heroCtaFooter ? (
                    <div
                        className="mt-16 md:mt-20"
                        style={blockRevealStyle(
                            revealed,
                            120 + data.items.length * 34 + 48,
                        )}
                    >
                        <h3
                            className="mx-auto max-w-xl text-center text-2xl font-normal leading-snug tracking-tight md:text-[1.65rem] md:leading-snug"
                            style={{
                                fontFamily: theme.typography.headingFont,
                                color: tx.heading,
                            }}
                        >
                            <StaggerText
                                text={
                                    heroCtaFooter.footerTitle?.trim() ||
                                    (heroCtaFooter.locale === "en"
                                        ? "Ready for the invitation you'll love to share?"
                                        : "¿Lista para la invitación que vas a amar compartir?")
                                }
                                revealed={revealed}
                                baseDelayMs={120 + data.items.length * 34 + 52}
                                wordStepMs={14}
                            />
                        </h3>
                        <div
                            className="mx-auto mt-7 flex w-full max-w-[280px] flex-col items-stretch sm:max-w-md"
                            style={blockRevealStyle(
                                revealed,
                                120 + data.items.length * 34 + 95,
                            )}
                        >
                            <Landing2PrimaryPill
                                primary={heroCtaFooter.primary}
                                theme={theme}
                                locale={heroCtaFooter.locale}
                                waNumber={heroCtaFooter.waNumber}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

function hasBoldMarkers(text: string): boolean {
    return /\*\*[^*]+\*\*/.test(text);
}

function renderTextWithBoldMarkers(text: string): ReactNode[] {
    return text
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(Boolean)
        .map((chunk, idx) => {
            if (chunk.startsWith("**") && chunk.endsWith("**")) {
                return <strong key={idx}>{chunk.slice(2, -2)}</strong>;
            }
            return <span key={idx}>{chunk}</span>;
        });
}

function renderLandingPostEstilosSection(
    row: {
        id: LandingPostEstilosSectionId;
        surface: "default" | "alt";
    },
    ctx: {
        sections: LandingData["sections"];
        theme: LandingTheme;
        themeAlt: LandingTheme;
        ctaButtons: Record<string, CtaButton>;
        wa: string;
        modelsLink?: { prompt: string; cta: string; anchor: string };
        compactHeroLayout: boolean;
        locale: LandingLocale;
        showLang: boolean;
    },
): ReactNode {
    const {
        sections,
        theme,
        themeAlt,
        ctaButtons,
        wa,
        modelsLink,
        compactHeroLayout,
        locale,
        showLang,
    } = ctx;
    const surfT = row.surface === "alt" ? themeAlt : theme;
    const loc = showLang ? locale : "es";
    switch (row.id) {
        case "panel":
            return <PanelSection data={sections.panel} theme={surfT} />;
        case "idiomas":
            return <IdiomasSection data={sections.idiomas} theme={surfT} />;
        case "servicio":
            return (
                <PlanesTdy
                    data={sections.servicio}
                    theme={surfT}
                    buttons={ctaButtons}
                    waNumber={wa}
                    modelsLink={modelsLink}
                />
            );
        case "proceso":
            return <ProcesoTdy data={sections.proceso} theme={surfT} />;
        case "faq":
            return (
                <FaqTdy
                    data={sections.faq}
                    theme={surfT}
                    heroCtaFooter={
                        compactHeroLayout
                            ? {
                                  locale: loc,
                                  primary: ctaButtons.heroPrimary,
                                  waNumber: wa,
                                  footerTitle: sections.faq.footerCtaTitle,
                              }
                            : undefined
                    }
                />
            );
        default:
            return null;
    }
}

export default function LandingPageHome({
    dataEs,
    dataEn,
    initialLocale = "es",
    /** Si true, lee `?lang=en|es` de la URL al montar (solo página raíz). */
    syncLocaleFromSearch = false,
}: {
    dataEs: LandingData;
    dataEn?: LandingData;
    initialLocale?: LandingLocale;
    syncLocaleFromSearch?: boolean;
}) {
    const [locale, setLocale] = useState<LandingLocale>(initialLocale);
    const baseData = locale === "en" && dataEn ? dataEn : dataEs;
    const data = useMemo(() => {
        const pricedData = applyPricingToLandingData(baseData, locale);
        const from = pricedData.pageLayout?.configuradorFromQuery;
        if (!from) return pricedData;

        const next = structuredClone(pricedData) as LandingData;
        Object.values(next.ctaButtons).forEach((btn) => {
            if (btn.type !== "link" || !btn.url?.startsWith("/configurador"))
                return;
            const [path, query = ""] = btn.url.split("?");
            const params = new URLSearchParams(query);
            params.set("from", from);
            btn.url = `${path}?${params.toString()}`;
        });
        return next;
    }, [baseData, locale]);
    const theme = useMemo(() => mergeTheme(baseData.theme), [baseData.theme]);
    const themeAlt = useMemo<LandingTheme>(
        () => ({
            ...theme,
            background: theme.surfaceAlt,
            surfaceAlt: theme.background,
        }),
        [theme],
    );
    const { whatsapp, ctaButtons, sections, floatingCta, header } = data;
    const wa = whatsapp.number;
    const showLang = Boolean(dataEn);
    const showHeader = Boolean(header);

    useEffect(() => {
        if (!syncLocaleFromSearch) return;
        const lang = new URLSearchParams(window.location.search).get("lang");
        setLocale(lang === "en" ? "en" : "es");
    }, [syncLocaleFromSearch]);

    useEffect(() => {
        document.documentElement.lang = locale === "en" ? "en" : "es";
    }, [locale]);

    useEffect(() => {
        const onClickCapture = (e: MouseEvent) => {
            const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
            if (!a) return;
            const href = a.getAttribute("href");
            if (!href?.startsWith("/configurador")) return;
            try {
                sessionStorage.setItem(
                    MU_LANDING_RETURN_SCROLL_KEY,
                    String(window.scrollY),
                );
            } catch {
                /* private mode / quota */
            }
        };
        document.addEventListener("click", onClickCapture, true);
        return () =>
            document.removeEventListener("click", onClickCapture, true);
    }, []);

    useLayoutEffect(() => {
        if (typeof window === "undefined") return;
        if (syncLocaleFromSearch) {
            const urlLang =
                new URLSearchParams(window.location.search).get("lang") === "en"
                    ? "en"
                    : "es";
            if (locale !== urlLang) return;
        }

        let raw: string | null = null;
        try {
            raw = sessionStorage.getItem(MU_LANDING_RETURN_SCROLL_KEY);
        } catch {
            return;
        }
        if (raw === null) return;
        try {
            sessionStorage.removeItem(MU_LANDING_RETURN_SCROLL_KEY);
        } catch {
            /* */
        }
        const top = Number.parseInt(raw, 10);
        if (!Number.isFinite(top) || top < 0) return;

        const apply = () => window.scrollTo(0, top);
        apply();
        requestAnimationFrame(() => {
            apply();
            requestAnimationFrame(apply);
        });
        const t = window.setTimeout(apply, 220);
        return () => window.clearTimeout(t);
    }, [locale, syncLocaleFromSearch]);

    const pageLayout = data.pageLayout;
    const compactHeroLayout = Boolean(pageLayout?.reviewsTopSimple);
    const heroSectionId = pageLayout?.heroSectionId;
    const floatingCtaForMode = useMemo(() => {
        if (!floatingCta) return floatingCta;
        if (!compactHeroLayout) {
            return {
                ...floatingCta,
                anchor: "#plan-premium",
            };
        }
        return {
            ...floatingCta,
            anchor: "#plan-premium",
            hideWhenSectionIds: [heroSectionId ?? "", "planes"],
        };
    }, [floatingCta, compactHeroLayout, heroSectionId]);

    const modelsLink = useMemo(() => {
        const s = sections.servicio;
        const loc = showLang ? locale : "es";
        if (s.modelsLinkPrompt && s.modelsLinkCta) {
            return {
                prompt: s.modelsLinkPrompt,
                cta: s.modelsLinkCta,
                anchor: s.modelsLinkAnchor?.trim() || "#muestras",
            };
        }
        if (compactHeroLayout) {
            return {
                prompt:
                    loc === "en"
                        ? "Want to see the designs we've already made?"
                        : "¿Querés ver los modelos que ya diseñamos?",
                cta: loc === "en" ? "View models" : "Ver modelos",
                anchor: "#muestras",
            };
        }
        return undefined;
    }, [sections.servicio, compactHeroLayout, locale, showLang]);

    const postEstilosRows = pageLayout?.postEstilosSections;

    const fabScrollGap = floatingCtaForMode?.enabled
        ? "calc(5.75rem + env(safe-area-inset-bottom, 0px))"
        : undefined;

    return (
        <main
            className="flow-root antialiased"
            style={{
                background: theme.background,
                color: theme.text.body,
                fontFamily: theme.typography.bodyFont,
            }}
        >
            {showHeader && header ? (
                <LandingHeader
                    theme={theme}
                    brand={header.brand}
                    nav={header.nav}
                    cta={header.cta}
                    locale={showLang ? locale : "es"}
                    onLocaleChange={setLocale}
                    languageToggle={showLang}
                />
            ) : null}
            {sections.hero.enabled && (
                <HeroTdy
                    data={sections.hero}
                    theme={theme}
                    buttons={ctaButtons}
                    waNumber={wa}
                    locale={showLang ? locale : "es"}
                    reviewsTopSimple={compactHeroLayout}
                    heroSectionId={heroSectionId}
                />
            )}
            <IncluyeSection data={sections.incluye} theme={theme} />
            <ComparativaSection data={sections.comparativa} theme={theme} />
            <EstilosCarousel
                data={sections.estilos}
                theme={theme}
                waNumber={wa}
                locale={showLang ? locale : "es"}
                endHeroPrimaryCta={
                    compactHeroLayout
                        ? {
                              locale: showLang ? locale : "es",
                              primary: ctaButtons.heroPrimary,
                          }
                        : undefined
                }
            />
            {postEstilosRows?.length ? (
                <>
                    {postEstilosRows.map((row, i) => (
                        <Fragment key={`post-estilos-${i}-${row.id}`}>
                            {renderLandingPostEstilosSection(row, {
                                sections,
                                theme,
                                themeAlt,
                                ctaButtons,
                                wa,
                                modelsLink,
                                compactHeroLayout,
                                locale,
                                showLang,
                            })}
                        </Fragment>
                    ))}
                </>
            ) : (
                <>
                    <IdiomasSection data={sections.idiomas} theme={theme} />
                    <ProcesoTdy data={sections.proceso} theme={theme} />
                    <PanelSection data={sections.panel} theme={theme} />
                    <PlanesTdy
                        data={sections.servicio}
                        theme={theme}
                        buttons={ctaButtons}
                        waNumber={wa}
                    />
                    <FaqTdy data={sections.faq} theme={themeAlt} />
                </>
            )}
            <div style={{ marginBottom: fabScrollGap }}>
                <LandingFooter theme={theme} />
            </div>
            {floatingCtaForMode ? (
                <FloatingCta data={floatingCtaForMode} theme={theme} />
            ) : null}
        </main>
    );
}
