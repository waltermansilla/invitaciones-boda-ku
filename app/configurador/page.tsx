"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Baby,
    Check,
    ChevronDown,
    ChevronRight,
    Disc3,
    Gift,
    Globe2,
    Heart,
    Image as ImageLucide,
    Languages,
    Mail,
    MapPin,
    Music,
    Shirt,
    Sparkles,
    Star,
    Timer,
    Users,
    Wallet,
} from "lucide-react";
import landingTdyData from "@/data/landing-tdy.json";
import pricingData from "@/data/pricing.json";
import {
    EXTRA_SECTION_PRICE,
    PRESET_LANGUAGES,
    SECOND_LANGUAGE_PRICE,
    SECTION_LABEL_EN,
    getEventLabels,
    getExtraDetailById,
    getExtrasForLang,
    getUiStrings,
} from "./strings";

type Currency = "ARS" | "USD";
type PlanKey = "premium" | "diseno-unico";
type EventTypeSelection = EventType | "";
type EventType =
    | "boda"
    | "xv"
    | "cumpleanos"
    | "baby-shower"
    | "corporativo"
    | "otro";

type Price = { ARS: number; USD: number };

const USD_ARS = pricingData.usdArs;
const toPrice = (ars: number): Price => ({
    ARS: ars,
    USD: Math.ceil(ars / USD_ARS),
});

interface SectionOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    price: Price;
    isAdder?: boolean;
}

const PLAN_BASE: Record<PlanKey, Price> = {
    premium: toPrice(pricingData.plans.premium),
    "diseno-unico": toPrice(pricingData.plans.disenoUnico),
};

const FREE_SECTIONS = 4;

const INCLUDED_EXTRAS_BY_PLAN: Record<PlanKey, string[]> = {
    premium: [],
    "diseno-unico": ["panel"],
};

const SECTION_OPTIONS: SectionOption[] = [
    {
        id: "mapa",
        label: "Mapa y cómo llegar",
        icon: <MapPin size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "dress",
        label: "Dress code",
        icon: <Shirt size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "itinerario",
        label: "Itinerario",
        icon: <Timer size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "regalos",
        label: "Regalos / Alias",
        icon: <Gift size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "tarjeta",
        label: "Valor de tarjeta",
        icon: <Wallet size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "album",
        label: "Álbum Drive (fotos)",
        icon: <Users size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "musica",
        label: "Música en la invitación",
        icon: <Music size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "playlist",
        label: "Playlist colaborativa Spotify",
        icon: <Disc3 size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "historia",
        label: "Nuestra historia",
        icon: <Heart size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "trivia",
        label: "Trivia interactiva",
        icon: <Star size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "fotos10",
        label: "Hasta 10 fotos",
        icon: <ImageLucide size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "faq",
        label: "Preguntas frecuentes",
        icon: <HelpIcon />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "alojamiento",
        label: "Alojamientos",
        icon: <MapPin size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
    {
        id: "adultos",
        label: "Niños y cuidados",
        icon: <Baby size={15} />,
        price: EXTRA_SECTION_PRICE,
    },
];

const OTHER_SECTION_ADDER_BASE = {
    id: "otro",
    icon: <Sparkles size={15} />,
    price: EXTRA_SECTION_PRICE,
    isAdder: true,
} as const;

/** Same padding both sides: max of 1rem and both safe-area insets (avoids L/R mismatch). */
const PAGE_GUTTER =
    "px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))]";
const BLOCK_GAP = "gap-4 sm:gap-3";

/** Pastilla de precio / estado sobre el borde superior (mismo criterio que secciones). */
const LINE_BADGE_CLASS =
    "pointer-events-none absolute left-1/2 top-0 z-[1] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-[#FDFBF7] px-2 py-0.5 text-[10px] font-semibold leading-none text-[#7A5F45] shadow-sm";
const LINE_BADGE_BORDER = { borderColor: "#C4A990" } as const;

const BTN_UNSELECTED = {
    borderColor: "#D9CFC3",
    background: "transparent",
} as const;
const BTN_SELECTED = {
    borderColor: "#7A5F45",
    background: "rgba(122,95,69,0.12)",
} as const;

function HelpIcon() {
    return (
        <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-current text-[10px] font-bold">
            ?
        </span>
    );
}

function formatMoney(amount: number, currency: Currency) {
    if (currency === "ARS") return `$${amount.toLocaleString("es-AR")}`;
    return `$${amount.toLocaleString("en-US")}`;
}

function WhatsAppHref(number: string, message: string) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function ConfiguradorPageContent() {
    const params = useSearchParams();
    const uiLang = params.get("lang") === "en" ? "en" : "es";
    const closeHref = `/?lang=${uiLang}`;
    const rawPlan = params.get("plan");
    const plan: PlanKey =
        rawPlan === "diseno-unico" ? "diseno-unico" : "premium";
    const curParam = params.get("currency");
    const currencyDefault: Currency =
        curParam === "USD"
            ? "USD"
            : curParam === "ARS"
              ? "ARS"
              : uiLang === "en"
                ? "USD"
                : "ARS";
    const start = params.get("start");

    const [currency, setCurrency] = useState<Currency>(currencyDefault);
    const [eventType, setEventType] = useState<EventTypeSelection>("");
    const [eventOther, setEventOther] = useState("");
    const [styleSelected, setStyleSelected] = useState<string>("");
    const [sections, setSections] = useState<string[]>([]);
    const [sectionOther, setSectionOther] = useState("");
    const [customSections, setCustomSections] = useState<
        Array<{ id: string; label: string }>
    >([]);
    const [isAddingOther, setIsAddingOther] = useState(false);
    const [customLanguageInput, setCustomLanguageInput] = useState("");
    const [customLanguageOptions, setCustomLanguageOptions] = useState<
        string[]
    >([]);
    const [secondLanguage, setSecondLanguage] = useState("");
    const [openExtraInfoId, setOpenExtraInfoId] = useState<string | null>(null);
    const [extras, setExtras] = useState<string[]>(
        INCLUDED_EXTRAS_BY_PLAN[plan],
    );
    const [name1, setName1] = useState("");
    const [name2, setName2] = useState("");
    const [email, setEmail] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [seccionesInfoOpen, setSeccionesInfoOpen] = useState(false);
    const [seccionesMinErrorShown, setSeccionesMinErrorShown] =
        useState(false);

    const styleItems = landingTdyData.sections.estilos.items ?? [];
    const waNumber = landingTdyData.whatsapp.number;

    const steps: readonly string[] =
        plan === "diseno-unico"
            ? (["idioma", "extras", "datos"] as const)
            : ([
                  "evento",
                  "estilo",
                  "secciones",
                  "idioma",
                  "extras",
                  "datos",
              ] as const);
    const initialStep = useMemo(() => {
        if (start && steps.includes(start)) return steps.indexOf(start);
        return 0;
    }, [start, steps]);
    const [stepIdx, setStepIdx] = useState(initialStep);

    useEffect(() => {
        document.documentElement.lang = uiLang;
    }, [uiLang]);

    const t = useMemo(() => getUiStrings(uiLang), [uiLang]);
    const extrasList = useMemo(() => getExtrasForLang(uiLang), [uiLang]);
    const extraDetails = useMemo(() => getExtraDetailById(uiLang), [uiLang]);
    const eventLabelMap = useMemo(() => getEventLabels(uiLang), [uiLang]);

    const selectedExtras = extrasList.filter((e) => extras.includes(e.id));
    const sectionOptions = useMemo<SectionOption[]>(
        () => [
            ...SECTION_OPTIONS.map((s) => ({
                ...s,
                label:
                    uiLang === "en"
                        ? (SECTION_LABEL_EN[s.id] ?? s.label)
                        : s.label,
            })),
            ...customSections.map((c) => ({
                id: c.id,
                label: c.label,
                icon: <Sparkles size={15} />,
                price: EXTRA_SECTION_PRICE,
            })),
            {
                ...OTHER_SECTION_ADDER_BASE,
                label: uiLang === "en" ? SECTION_LABEL_EN.otro : "Otro",
            },
        ],
        [uiLang, customSections],
    );
    const sectionLabelById = useMemo(
        () =>
            new Map<string, string>([
                ...SECTION_OPTIONS.map((s) =>
                    [
                        s.id,
                        uiLang === "en"
                            ? (SECTION_LABEL_EN[s.id] ?? s.label)
                            : s.label,
                    ] as const,
                ),
                ...customSections.map((c) => [c.id, c.label] as const),
            ]),
        [customSections, uiLang],
    );
    const selectedSectionLabels = useMemo(
        () => sections.map((id) => sectionLabelById.get(id) ?? id),
        [sections, sectionLabelById],
    );
    const languageOptions = useMemo(
        () => [...PRESET_LANGUAGES[uiLang], ...customLanguageOptions],
        [uiLang, customLanguageOptions],
    );
    const paidSectionsCount = Math.max(0, sections.length - FREE_SECTIONS);
    const paidSectionIds = sections.slice(FREE_SECTIONS);
    const sectionsCost =
        plan === "diseno-unico"
            ? 0
            : paidSectionsCount * EXTRA_SECTION_PRICE[currency];
    const secondLanguageCost =
        plan === "diseno-unico"
            ? 0
            : secondLanguage
              ? SECOND_LANGUAGE_PRICE[currency]
              : 0;
    const includedExtraIds = INCLUDED_EXTRAS_BY_PLAN[plan];
    const extrasCost = selectedExtras
        .filter((e) => !includedExtraIds.includes(e.id))
        .reduce((acc, e) => acc + e.price[currency], 0);
    const base = PLAN_BASE[plan][currency];
    const total = base + sectionsCost + secondLanguageCost + extrasCost;
    const downPayment = Math.round(total * 0.5);

    const planLabel =
        plan === "premium" ? t.planPremium : t.planUnique;
    const summary = [
        t.summaryHi(planLabel),
        "",
        `${t.currency}: ${currency}`,
        `${t.total}: ${formatMoney(total, currency)}`,
        `${t.deposit50}: ${formatMoney(downPayment, currency)}`,
        "",
        plan === "premium"
            ? `${t.event}: ${eventType ? `${eventLabelMap[eventType]}${eventType === "otro" && eventOther ? ` (${eventOther})` : ""}` : t.tbd}`
            : null,
        plan === "premium"
            ? `${t.style}: ${styleSelected || t.tbd}`
            : null,
        plan === "premium"
            ? `${t.sections} (${sections.length}): ${sections.length ? selectedSectionLabels.join(", ") : t.tbd}`
            : null,
        `${t.primaryLang}: ${t.spanish}`,
        `${t.secondLang}: ${secondLanguage || t.none}`,
        `${t.extrasLine}: ${selectedExtras.length ? selectedExtras.map((e) => e.label).join(", ") : t.noneExtras}${plan === "diseno-unico" ? t.uniqueExtrasNote : ""}`,
        "",
        `${t.name1Line}: ${name1 || "-"}`,
        `${t.name2Line}: ${name2 || "-"}`,
        `${t.emailLine}: ${email || "-"}`,
        `${t.eventDateLine}: ${eventDate || "-"}`,
    ]
        .filter(Boolean)
        .join("\n");

    const hasValidEmail = useMemo(() => {
        const v = email.trim();
        return v.length > 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }, [email]);

    const MIN_SECTION_BLOCKS = 3;

    const canContinue = useMemo(() => {
        const step = steps[stepIdx];
        if (step === "evento")
            return (
                Boolean(eventType) &&
                (eventType !== "otro" || eventOther.trim().length > 2)
            );
        if (step === "estilo") return Boolean(styleSelected);
        if (step === "secciones") return true;
        if (step === "datos")
            return (
                name1.trim().length > 1 &&
                Boolean(eventDate) &&
                hasValidEmail
            );
        return true;
    }, [
        steps,
        stepIdx,
        eventType,
        eventOther,
        styleSelected,
        name1,
        hasValidEmail,
        eventDate,
    ]);

    const isLastStep = stepIdx === steps.length - 1;

    const step = steps[stepIdx];

    useEffect(() => {
        if (sections.length >= MIN_SECTION_BLOCKS) {
            setSeccionesMinErrorShown(false);
        }
    }, [sections.length]);

    useEffect(() => {
        if (step !== "secciones") {
            setSeccionesMinErrorShown(false);
        }
    }, [step]);

    return (
        <main className="min-h-svh bg-[#FDFBF7] text-[#3F332B]">
            <header className="sticky top-0 z-20 border-b bg-[#FDFBF7]/95 backdrop-blur">
                <div
                    className={`mx-auto grid max-w-3xl grid-cols-3 items-center gap-2 py-3 ${PAGE_GUTTER}`}
                >
                    <Link
                        href={closeHref}
                        className="justify-self-start text-sm font-medium text-[#6A5C52]"
                    >
                        {t.headerClose}
                    </Link>
                    <div className="justify-self-center text-center text-sm font-semibold">
                        {plan === "premium" ? t.planPremium : t.planUnique}
                    </div>
                    <div className="justify-self-end text-right text-[15px] font-bold tabular-nums leading-tight tracking-tight text-[#4A3729] sm:text-base">
                        {formatMoney(total, currency)}
                    </div>
                </div>
                <div
                    className={`mx-auto grid w-full max-w-3xl min-w-0 gap-1.5 pb-3 sm:gap-2 ${PAGE_GUTTER}`}
                    style={{
                        gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                    }}
                >
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className="h-2 min-w-0 rounded-full sm:h-1.5"
                            style={{
                                background:
                                    i <= stepIdx ? "#7A5F45" : "#E8E0D7",
                            }}
                        />
                    ))}
                </div>
            </header>

            <section
                className={`mx-auto max-w-3xl scroll-pb-[calc(16rem+env(safe-area-inset-bottom,0px))] pb-[calc(17rem+env(safe-area-inset-bottom,0px))] pt-6 ${PAGE_GUTTER}`}
            >
                {step === "evento" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            ¿Qué evento es?
                        </h2>
                        <div
                            className={`mt-5 grid grid-cols-2 sm:grid-cols-3 ${BLOCK_GAP}`}
                        >
                            {(Object.keys(eventLabelMap) as EventType[]).map(
                                (ev) => (
                                    <button
                                        key={ev}
                                        type="button"
                                        onClick={() => setEventType(ev)}
                                        className="rounded-xl border px-3 py-3 text-sm font-medium"
                                        style={{
                                            borderColor:
                                                eventType === ev
                                                    ? "#7A5F45"
                                                    : "#DCCFC0",
                                            background:
                                                eventType === ev
                                                    ? "#F3EBDD"
                                                    : "#FFF",
                                        }}
                                    >
                                        {eventLabelMap[ev]}
                                    </button>
                                ),
                            )}
                        </div>
                        {eventType === "otro" ? (
                            <textarea
                                value={eventOther}
                                onChange={(e) => setEventOther(e.target.value)}
                                placeholder={t.eventOtherPh}
                                className="mt-4 w-full rounded-xl border px-3 py-3 text-sm outline-none"
                                style={{
                                    borderColor: "#DCCFC0",
                                    background: "#FFF",
                                }}
                            />
                        ) : null}
                    </>
                ) : null}

                {step === "estilo" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.styleTitle}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#6A5C52]">
                            {t.styleBodyBefore}{" "}
                            <span className="font-medium text-[#5A4A3F]">
                                {t.styleBodyRef}
                            </span>{" "}
                            {t.styleBodyAfter}
                        </p>
                        <div className={`mt-5 grid grid-cols-2 ${BLOCK_GAP}`}>
                            {styleItems.map((item) => {
                                const selected = styleSelected === item.titulo;
                                return (
                                    <button
                                        key={item.titulo}
                                        type="button"
                                        onClick={() =>
                                            setStyleSelected(item.titulo)
                                        }
                                        className="relative overflow-hidden rounded-2xl border text-left"
                                        style={{
                                            borderColor: selected
                                                ? "#7A5F45"
                                                : "#DCCFC0",
                                            background: "#FFF",
                                        }}
                                    >
                                        <div className="relative aspect-[4/5] w-full bg-[#EFE8DF]">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.titulo}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : null}
                                            <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-xs text-white">
                                                {item.titulo}
                                            </span>
                                            {item.href ? (
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className="absolute right-2 top-2 rounded-full border bg-white/90 px-2 py-1 text-[11px] font-medium"
                                                    style={{
                                                        borderColor: "#DCCFC0",
                                                    }}
                                                >
                                                    {t.styleView}
                                                </a>
                                            ) : null}
                                        </div>
                                        {selected ? (
                                            <span className="absolute right-2 bottom-2 rounded-full bg-[#7A5F45] p-1 text-white">
                                                <Check size={12} />
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : null}

                {step === "secciones" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.seccionesTitle}
                        </h2>
                        {plan === "premium" ? (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-[#D9CFC3] bg-transparent">
                                <button
                                    type="button"
                                    id="secciones-info-trigger"
                                    aria-expanded={seccionesInfoOpen}
                                    aria-controls="secciones-info-panel"
                                    onClick={() =>
                                        setSeccionesInfoOpen((o) => !o)
                                    }
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(122,95,69,0.06)] active:bg-[rgba(122,95,69,0.09)]"
                                >
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold leading-snug text-[#4A3A2F]">
                                            {t.incluyeTitle}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-snug text-[#7A6A5D]">
                                            {seccionesInfoOpen
                                                ? t.incluyeOpen
                                                : t.incluyeClosed}
                                        </span>
                                    </span>
                                    <ChevronDown
                                        size={22}
                                        className={`shrink-0 text-[#7A5F45] transition-transform duration-200 ${seccionesInfoOpen ? "rotate-180" : ""}`}
                                        aria-hidden
                                    />
                                </button>
                                <div
                                    className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                                    style={{
                                        gridTemplateRows: seccionesInfoOpen
                                            ? "1fr"
                                            : "0fr",
                                    }}
                                >
                                    <div
                                        id="secciones-info-panel"
                                        role="region"
                                        aria-labelledby="secciones-info-trigger"
                                        className="min-h-0 overflow-hidden"
                                    >
                                        <div className="border-t border-[#E8DFD4] px-4 pb-3.5 pt-1">
                                            <p className="text-sm leading-relaxed text-[#6A5C52]">
                                                {t.incluyeP1Before}{" "}
                                                <span className="text-[#5A4A3F]">
                                                    {t.incluyeP1Bold}
                                                </span>
                                                {t.incluyeP1After}
                                            </p>
                                            <p className="mt-3 text-sm leading-relaxed text-[#6A5C52]">
                                                {t.incluyeP2Before}{" "}
                                                <span className="font-semibold text-[#5A4A3F]">
                                                    {t.incluyeP2Free}
                                                </span>{" "}
                                                {t.incluyeP2Mid}{" "}
                                                <span className="font-semibold text-[#5A4A3F]">
                                                    {t.incluyeP2From5}
                                                </span>{" "}
                                                {t.incluyeP2After}{" "}
                                                {formatMoney(
                                                    EXTRA_SECTION_PRICE[
                                                        currency
                                                    ],
                                                    currency,
                                                )}{" "}
                                                {t.incluyeP2Each}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        {plan === "premium" ? (
                            <p className="mt-3 text-xs font-medium tabular-nums text-[#7A5F45]">
                                {FREE_SECTIONS} {t.seccionesCountFoot}{" "}
                                {`+${formatMoney(EXTRA_SECTION_PRICE[currency], currency)}`}
                                {t.perBlock}
                            </p>
                        ) : null}
                        <p
                            className={`text-base font-semibold text-[#3F332B] ${plan === "premium" ? "mt-3" : "mt-2"}`}
                        >
                            {sections.length}/{FREE_SECTIONS}{" "}
                            <span className="font-medium text-[#2F7E56]">
                                {paidSectionsCount > 0
                                    ? `(+${formatMoney(sectionsCost, currency)})`
                                    : t.sinExtras}
                            </span>
                        </p>
                        {seccionesMinErrorShown &&
                        sections.length < MIN_SECTION_BLOCKS ? (
                            <p
                                className="mt-2 text-sm font-semibold text-[#B71C1C]"
                                role="alert"
                            >
                                {t.seccionesMinThree}
                            </p>
                        ) : null}
                        <div className="mt-4 grid w-full min-w-0 grid-cols-4 gap-x-4 gap-y-7 pt-3 sm:gap-x-3 sm:gap-y-5 sm:pt-2">
                            {sectionOptions.map((s) => {
                                const on = sections.includes(s.id);
                                const isPaid =
                                    !s.isAdder && on && paidSectionIds.includes(s.id);
                                const isOtroOpen = s.isAdder && isAddingOther;

                                const priceBadge = isPaid ? (
                                    <span
                                        className="pointer-events-none absolute left-1/2 top-0 z-[1] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-[#FDFBF7] px-2 py-0.5 text-[10px] font-semibold leading-none text-[#7A5F45] shadow-sm"
                                        style={{
                                            borderColor: "#C4A990",
                                        }}
                                    >
                                        +
                                        {formatMoney(
                                            s.price[currency],
                                            currency,
                                        )}
                                    </span>
                                ) : null;

                                const tileButton = (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (s.isAdder) {
                                                setIsAddingOther((prev) => !prev);
                                                return;
                                            }
                                            setSections((prev) =>
                                                on
                                                    ? prev.filter(
                                                          (x) => x !== s.id,
                                                      )
                                                    : [...prev, s.id],
                                            );
                                        }}
                                        className={`relative flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center transition-[border-color,background-color] duration-150 ${
                                            (on || isOtroOpen)
                                                ? "border-[1.5px]"
                                                : "border border-[#D9CFC3]"
                                        }`}
                                        style={{
                                            borderColor: (on || isOtroOpen)
                                                ? "#7A5F45"
                                                : "#D9CFC3",
                                            background: (on || isOtroOpen)
                                                ? "rgba(122,95,69,0.12)"
                                                : "transparent",
                                        }}
                                    >
                                        {on || isOtroOpen ? (
                                            <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7A5F45] text-white">
                                                <Check size={10} />
                                            </span>
                                        ) : null}
                                        <span className="inline-flex shrink-0 items-center justify-center text-[#6E5A45] [&_svg]:shrink-0">
                                            {s.icon}
                                        </span>
                                        <span className="line-clamp-3 w-full break-words text-[11px] font-medium leading-tight text-[#4A3A2F]">
                                            {s.label}
                                        </span>
                                    </button>
                                );

                                if (isOtroOpen) {
                                    return (
                                        <div
                                            key={s.id}
                                            className="col-span-4 grid min-h-0 min-w-0 gap-x-4 sm:gap-x-3 [grid-template-columns:subgrid]"
                                        >
                                            <div className="relative col-span-1 min-h-0 min-w-0">
                                                {priceBadge}
                                                <div className="aspect-square w-full">{tileButton}</div>
                                            </div>
                                            <div className="col-span-3 flex min-h-0 min-w-0 items-start">
                                                <div className="flex h-1/2 min-h-[44px] w-full gap-2">
                                                    <textarea
                                                        value={sectionOther}
                                                        onChange={(e) =>
                                                            setSectionOther(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={t.seccionOtroPh}
                                                        aria-label={t.seccionOtroAria}
                                                        className="h-full min-h-0 flex-1 resize-none overflow-auto rounded-2xl border px-2 py-2 text-[13px] leading-snug outline-none sm:px-3 sm:py-3 sm:text-sm"
                                                        style={{
                                                            borderColor:
                                                                "#DCCFC0",
                                                            background: "#FFF",
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const label =
                                                                sectionOther.trim();
                                                            if (!label) return;
                                                            const id = `otro-${Date.now()}`;
                                                            setCustomSections(
                                                                (prev) => [
                                                                    ...prev,
                                                                    { id, label },
                                                                ],
                                                            );
                                                            setSections(
                                                                (prev) => [
                                                                    ...prev,
                                                                    id,
                                                                ],
                                                            );
                                                            setSectionOther("");
                                                            setIsAddingOther(
                                                                false,
                                                            );
                                                        }}
                                                        className="shrink-0 rounded-2xl border px-3 text-xs font-semibold"
                                                        style={{
                                                            borderColor:
                                                                "#7A5F45",
                                                            background:
                                                                "rgba(122,95,69,0.12)",
                                                            color: "#5A4A3F",
                                                        }}
                                                    >
                                                        OK
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={s.id}
                                        className="relative min-w-0"
                                    >
                                        {priceBadge}
                                        {tileButton}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : null}

                {step === "idioma" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.idiomaTitle}
                        </h2>
                        <p className="mt-2 text-sm text-[#6A5C52]">
                            {t.idiomaLead}
                        </p>
                        <div className="relative mt-4 rounded-2xl border-[1.5px] border-[#7A5F45] bg-[rgba(122,95,69,0.12)] px-4 py-3">
                            <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7A5F45] text-white">
                                <Check size={10} />
                            </span>
                            <div className="flex items-center justify-center gap-2 text-center text-sm font-medium text-[#4A3A2F]">
                                <Languages
                                    size={16}
                                    className="shrink-0 text-[#6E5A45]"
                                />
                                {t.idiomaDefault}
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 pt-2 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-5">
                            {languageOptions.map((lang) => {
                                const on = secondLanguage === lang;
                                const showPricePill = on && plan === "premium";
                                const showIncludedPill =
                                    on && plan === "diseno-unico";
                                return (
                                    <div
                                        key={lang}
                                        className="relative min-w-0"
                                    >
                                        {showPricePill ? (
                                            <span
                                                className={LINE_BADGE_CLASS}
                                                style={LINE_BADGE_BORDER}
                                            >
                                                +
                                                {formatMoney(
                                                    SECOND_LANGUAGE_PRICE[
                                                        currency
                                                    ],
                                                    currency,
                                                )}
                                            </span>
                                        ) : null}
                                        {showIncludedPill ? (
                                            <span
                                                className={LINE_BADGE_CLASS}
                                                style={LINE_BADGE_BORDER}
                                            >
                                                {t.included}
                                            </span>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSecondLanguage((prev) =>
                                                    prev === lang ? "" : lang,
                                                )
                                            }
                                            className={`relative flex w-full items-center justify-center rounded-2xl px-3 py-2.5 text-center text-sm font-medium transition-[border-color,background-color] duration-150 ${
                                                on
                                                    ? "border-[1.5px]"
                                                    : "border border-[#D9CFC3]"
                                            }`}
                                            style={{
                                                borderColor: on
                                                    ? BTN_SELECTED.borderColor
                                                    : BTN_UNSELECTED.borderColor,
                                                background: on
                                                    ? BTN_SELECTED.background
                                                    : BTN_UNSELECTED.background,
                                            }}
                                        >
                                            {on ? (
                                                <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7A5F45] text-white">
                                                    <Check size={10} />
                                                </span>
                                            ) : null}
                                            {lang}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 rounded-2xl border border-[#D9CFC3] bg-transparent px-3 py-2.5">
                            <p className="text-xs font-medium text-[#5A4A3F]">
                                {t.noLanguage}
                            </p>
                            <div className="mt-1.5 flex gap-2">
                                <input
                                    value={customLanguageInput}
                                    onChange={(e) =>
                                        setCustomLanguageInput(
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t.typeLanguage}
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                    style={{
                                        borderColor: "#DCCFC0",
                                        background: "#FFF",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const value =
                                            customLanguageInput.trim();
                                        if (!value) return;
                                        const all = [
                                            ...PRESET_LANGUAGES[uiLang],
                                            ...customLanguageOptions,
                                        ];
                                        const exists = all.some(
                                            (lang) =>
                                                lang.toLowerCase() ===
                                                value.toLowerCase(),
                                        );
                                        if (!exists) {
                                            setCustomLanguageOptions((prev) => [
                                                ...prev,
                                                value,
                                            ]);
                                        }
                                        setSecondLanguage(value);
                                        setCustomLanguageInput("");
                                    }}
                                    className="shrink-0 rounded-xl border px-3 text-xs font-semibold"
                                    style={{
                                        borderColor: "#7A5F45",
                                        background: "rgba(122,95,69,0.12)",
                                        color: "#5A4A3F",
                                    }}
                                >
                                    {t.addBtn}
                                </button>
                            </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#7A5F45]">
                            {plan === "diseno-unico"
                                ? t.secondLangUnique
                                : `${t.secondLangPremiumPrefix} +${formatMoney(SECOND_LANGUAGE_PRICE[currency], currency)}`}
                        </p>
                    </>
                ) : null}

                {step === "extras" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.extrasTitle}
                        </h2>
                        <div className="mt-4 space-y-4 pt-1">
                            {extrasList.map((ex) => {
                                const on = extras.includes(ex.id);
                                const locked =
                                    INCLUDED_EXTRAS_BY_PLAN[plan].includes(
                                        ex.id,
                                    );
                                const info = extraDetails[ex.id];
                                const infoOpen = openExtraInfoId === ex.id;
                                return (
                                    <div
                                        key={ex.id}
                                        className="relative min-w-0"
                                    >
                                        {on && !locked ? (
                                            <span
                                                className={LINE_BADGE_CLASS}
                                                style={LINE_BADGE_BORDER}
                                            >
                                                +
                                                {formatMoney(
                                                    ex.price[currency],
                                                    currency,
                                                )}
                                            </span>
                                        ) : null}
                                        {on && locked ? (
                                            <span
                                                className={LINE_BADGE_CLASS}
                                                style={LINE_BADGE_BORDER}
                                            >
                                                {t.included}
                                            </span>
                                        ) : null}
                                        <button
                                            type="button"
                                            disabled={locked}
                                            onClick={() =>
                                                setExtras((prev) =>
                                                    on
                                                        ? prev.filter(
                                                              (x) =>
                                                                  x !== ex.id,
                                                          )
                                                        : [...prev, ex.id],
                                                )
                                            }
                                            className={`relative flex w-full flex-col gap-0.5 rounded-2xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 disabled:cursor-default ${
                                                on
                                                    ? "border-[1.5px]"
                                                    : "border border-[#D9CFC3]"
                                            }`}
                                            style={{
                                                borderColor: on
                                                    ? BTN_SELECTED.borderColor
                                                    : BTN_UNSELECTED.borderColor,
                                                background: on
                                                    ? BTN_SELECTED.background
                                                    : BTN_UNSELECTED.background,
                                                opacity: locked ? 0.78 : 1,
                                            }}
                                        >
                                            {on ? (
                                                <span className="absolute right-3 top-3 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7A5F45] text-white">
                                                    <Check size={10} />
                                                </span>
                                            ) : null}
                                            <div className="flex items-start justify-between gap-3 pr-7">
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-semibold text-[#4A3A2F]">
                                                        {ex.label}
                                                    </span>
                                                    <span className="block text-xs text-[#6A5C52]">
                                                        {ex.subtitle}
                                                    </span>
                                                </span>
                                                {!on && !locked ? (
                                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[#7A5F45]">
                                                        +
                                                        {formatMoney(
                                                            ex.price[currency],
                                                            currency,
                                                        )}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                        {info ? (
                                            <div className="mt-1 px-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenExtraInfoId(
                                                            (prev) =>
                                                                prev === ex.id
                                                                    ? null
                                                                    : ex.id,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A5F45]"
                                                >
                                                    {infoOpen
                                                        ? t.ocultarDetalle
                                                        : t.verDetalle}
                                                    <ChevronDown
                                                        size={14}
                                                        className={`transition-transform duration-200 ${infoOpen ? "rotate-180" : ""}`}
                                                        aria-hidden
                                                    />
                                                </button>
                                                {infoOpen ? (
                                                    <p className="mt-1 text-[11px] leading-relaxed text-[#6A5C52]">
                                                        <span className="font-medium text-[#5A4A3F]">
                                                            {info.summary}:
                                                        </span>{" "}
                                                        {info.body}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : null}

                {step === "datos" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.datosTitle}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#6A5C52]">
                            {t.datosIntro}
                        </p>
                        <div
                            className="mt-4 rounded-2xl border p-4 sm:p-5"
                            style={{
                                borderColor: "#DCCFC0",
                                background: "linear-gradient(180deg, #FFFFFF 0%, #FCF8F2 100%)",
                            }}
                        >
                            <div
                                className={`grid grid-cols-1 sm:grid-cols-2 ${BLOCK_GAP}`}
                            >
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                        {t.name1}
                                    </span>
                                    <input
                                        value={name1}
                                        onChange={(e) => setName1(e.target.value)}
                                        placeholder={t.name1Ph}
                                        className="w-full rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
                                        style={{
                                            borderColor: "#DCCFC0",
                                            background: "#FFF",
                                        }}
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                        {t.name2}
                                    </span>
                                    <input
                                        value={name2}
                                        onChange={(e) => setName2(e.target.value)}
                                        placeholder={t.name2Ph}
                                        className="w-full rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
                                        style={{
                                            borderColor: "#DCCFC0",
                                            background: "#FFF",
                                        }}
                                    />
                                </label>
                            </div>
                            <label className="mt-3 block min-w-0">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                    {t.email}
                                </span>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.emailPh}
                                    type="email"
                                    className="w-full rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
                                    style={{
                                        borderColor:
                                            email.length === 0 || hasValidEmail
                                                ? "#DCCFC0"
                                                : "#C86C6C",
                                        background: "#FFF",
                                    }}
                                />
                                {email.length > 0 && !hasValidEmail ? (
                                    <span className="mt-1.5 block text-[11px] text-[#B85C5C]">
                                        {t.emailInvalid}
                                    </span>
                                ) : null}
                            </label>
                            <label className="mt-3 block min-w-0">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                    {t.dateLabel}
                                </span>
                                <div
                                    className="relative w-full overflow-hidden rounded-xl border"
                                    style={{ borderColor: "#DCCFC0", background: "#FFF" }}
                                >
                                    {!eventDate ? (
                                        <span className="pointer-events-none absolute left-3 right-10 top-1/2 z-[1] -translate-y-1/2 truncate text-sm text-[#7A6A5D]">
                                            {t.datePlaceholder}
                                        </span>
                                    ) : null}
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        onClick={(e) => {
                                            const input = e.currentTarget as HTMLInputElement & {
                                                showPicker?: () => void;
                                            };
                                            input.showPicker?.();
                                        }}
                                        aria-label={t.dateAria}
                                        className="block w-full min-w-0 max-w-full rounded-xl border border-transparent px-3 py-3 pr-10 text-sm outline-none transition-colors focus:border-transparent"
                                        style={{
                                            background: "transparent",
                                            color: eventDate ? "#3F332B" : "transparent",
                                        }}
                                    />
                                </div>
                                <span className="mt-1.5 block text-[11px] text-[#7A6A5D]">
                                    {t.dateHelp}
                                </span>
                            </label>
                        </div>
                    </>
                ) : null}
            </section>

            <footer
                className={`fixed inset-x-0 bottom-0 z-30 border-t bg-[#FDFBF7]/98 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur ${PAGE_GUTTER}`}
            >
                <div className="mx-auto max-w-3xl">
                    <div className="mb-3 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrency("ARS")}
                            className="rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{
                                borderColor:
                                    currency === "ARS" ? "#7A5F45" : "#DCCFC0",
                                background:
                                    currency === "ARS" ? "#F3EBDD" : "#FFF",
                            }}
                        >
                            ARS
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrency("USD")}
                            className="rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{
                                borderColor:
                                    currency === "USD" ? "#7A5F45" : "#DCCFC0",
                                background:
                                    currency === "USD" ? "#F3EBDD" : "#FFF",
                            }}
                        >
                            USD
                        </button>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() =>
                                setStepIdx((s) => Math.max(0, s - 1))
                            }
                            className="text-sm font-medium text-[#6A5C52]"
                            disabled={stepIdx === 0}
                            style={{ opacity: stepIdx === 0 ? 0.45 : 1 }}
                        >
                            {t.back}
                        </button>
                        {!isLastStep ? (
                            <button
                                type="button"
                                onClick={() => {
                                    const cur = steps[stepIdx];
                                    if (
                                        cur === "secciones" &&
                                        sections.length < MIN_SECTION_BLOCKS
                                    ) {
                                        setSeccionesMinErrorShown(true);
                                        return;
                                    }
                                    setStepIdx((s) =>
                                        Math.min(steps.length - 1, s + 1),
                                    );
                                }}
                                disabled={!canContinue}
                                className="inline-flex items-center gap-1 rounded-full bg-[#7A5F45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-45"
                            >
                                {t.next} <ChevronRight size={16} />
                            </button>
                        ) : (
                            <a
                                href={WhatsAppHref(waNumber, summary)}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white ${canContinue ? "" : "pointer-events-none opacity-45"}`}
                                style={{ background: "#7A5F45" }}
                            >
                                {t.goWhatsapp} <ChevronRight size={16} />
                            </a>
                        )}
                    </div>
                    <a
                        href={
                            isLastStep && canContinue
                                ? WhatsAppHref(waNumber, summary)
                                : undefined
                        }
                        target="_blank"
                        rel="noreferrer"
                        className={`flex w-full items-center justify-center rounded-2xl py-3 text-base font-semibold text-white ${isLastStep && canContinue ? "" : "pointer-events-none opacity-75"}`}
                        style={{ background: "#7A5F45" }}
                    >
                        {t.totalDeposit(formatMoney(total, currency))}
                    </a>
                    <p className="mt-2 text-center text-[11px] text-[#7A6A5D]">
                        {t.footerNote}
                    </p>
                </div>
            </footer>
        </main>
    );
}

export default function ConfiguradorPage() {
    return (
        <Suspense fallback={null}>
            <ConfiguradorPageContent />
        </Suspense>
    );
}
