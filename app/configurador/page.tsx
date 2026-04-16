"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Suspense,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
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
import landingHomeData from "@/data/landing/landing-2.json";
import landingHomeDataEn from "@/data/landing/landing-2.en.json";
import configuradorEs from "@/data/landing/configurador-es.json";
import pricingData from "@/data/landing/pricing.json";
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

function HelpIcon() {
    return (
        <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-current text-[10px] font-bold">
            ?
        </span>
    );
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
    mapa: <MapPin size={15} />,
    dress: <Shirt size={15} />,
    itinerario: <Timer size={15} />,
    regalos: <Gift size={15} />,
    tarjeta: <Wallet size={15} />,
    album: <Users size={15} />,
    musica: <Music size={15} />,
    playlist: <Disc3 size={15} />,
    historia: <Heart size={15} />,
    trivia: <Star size={15} />,
    fotos10: <ImageLucide size={15} />,
    faq: <HelpIcon />,
    alojamiento: <MapPin size={15} />,
    adultos: <Baby size={15} />,
};

const SECTION_OPTIONS: SectionOption[] = configuradorEs.sectionOrder.map(
    (id) => {
        const meta = configuradorEs.sections[
            id as keyof typeof configuradorEs.sections
        ];
        return {
            id,
            label: meta.label,
            icon: SECTION_ICONS[id] ?? <Sparkles size={15} />,
            price: EXTRA_SECTION_PRICE,
        };
    },
);

const OTHER_SECTION_ADDER_BASE = {
    id: "otro",
    icon: <Sparkles size={15} />,
    price: EXTRA_SECTION_PRICE,
    isAdder: true,
} as const;

const REQUIRED_SECTION_ID = "mapa";
const PANEL_INCLUDED_GUESTS = 150;
const PANEL_STEP_GUESTS = 100;
const PANEL_STEP_PRICE_ARS =
    pricingData.configurator.extras.panelPer100 ?? 9000;
const PANEL_MAX_GUESTS = 1000;
const PANEL_GUEST_PRESETS = [150, 250, 350, 500] as const;

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

function formatMoney(amount: number, currency: Currency) {
    if (currency === "ARS") return `$${amount.toLocaleString("es-AR")}`;
    return `$${amount.toLocaleString("en-US")}`;
}

/** `*fragmento*` en textos de extraDetails → negrita (pares de un solo asterisco). */
function renderTextWithBoldMarkers(
    text: string,
    plainClassName?: string,
): ReactNode {
    const parts = text.split("*");
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <strong key={i} className="font-medium text-[#5A4A3F]">
                {part}
            </strong>
        ) : (
            <span key={i} className={plainClassName}>
                {part}
            </span>
        ),
    );
}

/** Extras en “Ver detalle” con imagen a la izquierda (mismo layout que bienvenida). */
const EXTRA_VER_DETALLE_IMAGE: Record<
    string,
    {
        src: string;
        width: number;
        height: number;
        altEs: string;
        altEn: string;
        /** Marco fijo tipo móvil (~9:15), cover anclado arriba (el recorte cae abajo). */
        crop916Top?: boolean;
    }
> = {
    bienvenida: {
        src: "/landing/media/images/overlay-diseño.jpg",
        width: 1179,
        height: 1902,
        altEs: "Ejemplo de diseño de pantalla de bienvenida (overlay)",
        altEn: "Example of a custom welcome overlay layout",
    },
    panel: {
        src: "/landing/media/images/panel.PNG",
        width: 940,
        height: 1920,
        altEs: "Ejemplo del panel de invitados",
        altEn: "Example of the guest dashboard",
        crop916Top: true,
    },
};

function WhatsAppHref(number: string, message: string) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function toBase64Url(value: string) {
    const utf8 = encodeURIComponent(value).replace(
        /%([0-9A-F]{2})/g,
        (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)),
    );
    const base64 =
        typeof window !== "undefined"
            ? window.btoa(utf8)
            : Buffer.from(utf8, "binary").toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const DETAILS_SECTION_ORDER = [
    "mapa",
    "dress",
    "itinerario",
    "regalos",
    "tarjeta",
    "album",
    "musica",
    "playlist",
    "historia",
    "trivia",
    "fotos10",
    "faq",
    "alojamiento",
    "adultos",
] as const;

const EVENT_TYPE_CODE: Record<EventType | "", string> = {
    boda: "b",
    xv: "x",
    cumpleanos: "c",
    "baby-shower": "y",
    corporativo: "p",
    otro: "o",
    "": "n",
};

function usesOurStoryLabel(eventType: EventTypeSelection): boolean {
    return (
        eventType === "boda" ||
        eventType === "baby-shower" ||
        eventType === "corporativo"
    );
}

/** "Boda · …" → tipo + detalle (landing estilos). */
function splitEstiloDescripcion(desc: string | undefined): {
    tipo: string;
    detalle: string;
} {
    if (!desc) return { tipo: "", detalle: "" };
    const idx = desc.indexOf(" · ");
    if (idx === -1) return { tipo: "", detalle: desc.trim() };
    return {
        tipo: desc.slice(0, idx).trim(),
        detalle: desc.slice(idx + 3).trim(),
    };
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
    const [sections, setSections] = useState<string[]>([REQUIRED_SECTION_ID]);
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
    const [panelGuests, setPanelGuests] = useState<number>(
        PANEL_INCLUDED_GUESTS,
    );
    const [name1, setName1] = useState("");
    const [name2, setName2] = useState("");
    const [email, setEmail] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [seccionesInfoOpen, setSeccionesInfoOpen] = useState(false);
    const [seccionesMinErrorShown, setSeccionesMinErrorShown] = useState(false);
    const [panelSkipModalOpen, setPanelSkipModalOpen] = useState(false);
    const [detailsId] = useState(
        () =>
            `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    );

    const styleItems = useMemo(
        () =>
            (uiLang === "en" ? landingHomeDataEn : landingHomeData).sections
                .estilos.items ?? [],
        [uiLang],
    );
    const waNumber = landingHomeData.whatsapp.number;

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

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [stepIdx]);

    useEffect(() => {
        if (!panelSkipModalOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [panelSkipModalOpen]);

    const t = useMemo(() => getUiStrings(uiLang), [uiLang]);
    const tWa = useMemo(() => getUiStrings("es"), []);
    const styleNoneOptionLabel =
        uiLang === "en"
            ? "None represents what I am looking for"
            : configuradorEs.misc.styleNoneOption;
    const extrasList = useMemo(() => getExtrasForLang(uiLang), [uiLang]);
    const extrasListWa = useMemo(() => getExtrasForLang("es"), []);
    const extraDetails = useMemo(() => getExtraDetailById(uiLang), [uiLang]);
    const panelSkipModalCopy =
        configuradorEs.panelSkipModal[uiLang === "en" ? "en" : "es"];
    const eventLabelMap = useMemo(() => getEventLabels(uiLang), [uiLang]);
    const eventLabelMapWa = useMemo(() => getEventLabels("es"), []);
    const eventTypeDescriptions = useMemo(
        () =>
            configuradorEs.eventTypeDescriptions[
                uiLang === "en" ? "en" : "es"
            ] as Record<EventType, string>,
        [uiLang],
    );

    const selectedExtras = extrasList.filter((e) => extras.includes(e.id));
    const isBoda = eventType === "boda";
    const storyLabelEs = usesOurStoryLabel(eventType)
        ? configuradorEs.story.our
        : configuradorEs.story.my;
    const storyLabelEn = usesOurStoryLabel(eventType)
        ? "Our story"
        : "My story";
    const getBaseSectionLabel = (
        sectionId: string,
        useEnglish: boolean,
    ): string => {
        if (sectionId === "historia") {
            return useEnglish ? storyLabelEn : storyLabelEs;
        }
        const base = SECTION_OPTIONS.find((s) => s.id === sectionId);
        if (!base) return sectionId;
        return useEnglish
            ? (SECTION_LABEL_EN[sectionId] ?? base.label)
            : base.label;
    };
    const sectionOptions = useMemo<SectionOption[]>(
        () => [
            ...SECTION_OPTIONS.map((s) => ({
                ...s,
                label: getBaseSectionLabel(s.id, uiLang === "en"),
            })),
            ...customSections.map((c) => ({
                id: c.id,
                label: c.label,
                icon: <Sparkles size={15} />,
                price: EXTRA_SECTION_PRICE,
            })),
            {
                ...OTHER_SECTION_ADDER_BASE,
                label:
                    uiLang === "en"
                        ? SECTION_LABEL_EN.otro
                        : configuradorEs.misc.otroSection,
            },
        ],
        [uiLang, customSections, storyLabelEs, storyLabelEn],
    );
    const sectionLabelById = useMemo(
        () =>
            new Map<string, string>([
                ...SECTION_OPTIONS.map(
                    (s) =>
                        [
                            s.id,
                            getBaseSectionLabel(s.id, uiLang === "en"),
                        ] as const,
                ),
                ...customSections.map((c) => [c.id, c.label] as const),
            ]),
        [customSections, uiLang, storyLabelEs, storyLabelEn],
    );
    const selectedSectionLabels = useMemo(
        () => sections.map((id) => sectionLabelById.get(id) ?? id),
        [sections, sectionLabelById],
    );
    const sectionLabelByIdWa = useMemo(
        () =>
            new Map<string, string>([
                ...SECTION_OPTIONS.map(
                    (s) => [s.id, getBaseSectionLabel(s.id, false)] as const,
                ),
                ...customSections.map((c) => [c.id, c.label] as const),
            ]),
        [customSections, storyLabelEs],
    );
    const selectedSectionLabelsWa = useMemo(
        () => sections.map((id) => sectionLabelByIdWa.get(id) ?? id),
        [sections, sectionLabelByIdWa],
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
    const clampedPanelGuests = Math.max(
        PANEL_INCLUDED_GUESTS,
        Math.min(
            PANEL_MAX_GUESTS,
            Math.round(panelGuests || PANEL_INCLUDED_GUESTS),
        ),
    );
    const panelExtraGuests = Math.max(
        0,
        clampedPanelGuests - PANEL_INCLUDED_GUESTS,
    );
    const panelExtraGuestsCost = toPrice(
        Math.round(
            (panelExtraGuests * PANEL_STEP_PRICE_ARS) / PANEL_STEP_GUESTS,
        ),
    )[currency];
    const panelBasePrice =
        extrasList.find((e) => e.id === "panel")?.price[currency] ?? 0;
    const panelSelected = extras.includes("panel");
    const panelIncludedByPlan = includedExtraIds.includes("panel");
    const panelCost = panelSelected
        ? (panelIncludedByPlan ? 0 : panelBasePrice) + panelExtraGuestsCost
        : 0;
    const extrasCost =
        panelCost +
        selectedExtras
            .filter((e) => e.id !== "panel")
            .filter((e) => !includedExtraIds.includes(e.id))
            .reduce((acc, e) => acc + e.price[currency], 0);
    const base = PLAN_BASE[plan][currency];
    const total = base + sectionsCost + secondLanguageCost + extrasCost;
    const downPayment = Math.round(total * 0.5);

    const planLabel = plan === "premium" ? t.planPremium : t.planUnique;
    const planLabelWa = plan === "premium" ? tWa.planPremium : tWa.planUnique;
    const waEx = configuradorEs.waExtras;
    const selectedExtraLabelsWa = selectedExtras.map((e) => {
        const match = extrasListWa.find((x) => x.id === e.id);
        const label = match?.label ?? e.label;
        if (e.id !== "panel") return label;
        const panelLine = waEx.panelLine
            .replace(/\{\{label\}\}/g, label)
            .replace(/\{\{guests\}\}/g, String(clampedPanelGuests));
        if (panelExtraGuestsCost <= 0) return panelLine;
        return `${panelLine}${waEx.panelCapacitySuffix.replace(
            /\{\{price\}\}/g,
            formatMoney(panelExtraGuestsCost, currency),
        )}`;
    });
    const detailsToken = useMemo(() => {
        const selectedSet = new Set(sections);
        let mask = 0;
        DETAILS_SECTION_ORDER.forEach((sectionId, idx) => {
            if (selectedSet.has(sectionId)) {
                mask |= 1 << idx;
            }
        });
        const customSelectedLabels = customSections
            .filter((item) => selectedSet.has(item.id))
            .map((item) => item.label.trim())
            .filter(Boolean);
        const customEncoded = customSelectedLabels.length
            ? toBase64Url(JSON.stringify(customSelectedLabels))
            : "-";
        const compact = [
            "v1",
            EVENT_TYPE_CODE[eventType] ?? "n",
            eventOther.trim() ? toBase64Url(eventOther.trim()) : "-",
            mask.toString(36),
            customEncoded,
        ].join(".");
        return compact;
    }, [customSections, eventOther, eventType, sections]);
    const detailsPathId = detailsToken
        ? `${detailsId}.${detailsToken}`
        : detailsId;
    const detailsQuery = useMemo(() => {
        const query = new URLSearchParams();
        const n1 = name1.trim();
        const n2 = name2.trim();
        if (n1) query.set("name1", n1);
        if (n2) query.set("name2", n2);
        if (eventDate) query.set("eventDate", eventDate);
        return query.toString();
    }, [name1, name2, eventDate]);
    const detailsUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/detalles/${detailsPathId}${detailsQuery ? `?${detailsQuery}` : ""}`
            : `/detalles/${detailsPathId}${detailsQuery ? `?${detailsQuery}` : ""}`;
    const nf = configuradorEs.nameFields;
    const name1Label = isBoda ? nf.name1LabelBoda : nf.name1LabelDefault;
    const name1Placeholder = nf.name1Placeholder;
    const name2Label = nf.name2Label;
    const name2Placeholder = nf.name2Placeholder;
    const wah = configuradorEs.whatsapp;
    const summary = [
        tWa.summaryHi(planLabelWa),
        "",
        wah.headingConfig,
        ...(plan === "premium"
            ? [
                  `- ${tWa.event}: ${eventType ? `${eventLabelMapWa[eventType]}${eventType === "otro" && eventOther ? ` (${eventOther})` : ""}` : tWa.tbd}`,
                  `- ${tWa.style}: ${styleSelected || tWa.tbd}`,
                  `- ${tWa.sections} (${sections.length}):`,
                  ...(sections.length
                      ? selectedSectionLabelsWa.map((label) => `  - ${label}`)
                      : [`  - ${tWa.tbd}`]),
              ]
            : []),
        "",
        wah.headingLanguages,
        `- ${tWa.primaryLang}: ${tWa.spanish}`,
        `- ${tWa.secondLang}: ${secondLanguage || tWa.none}`,
        "",
        wah.headingExtras,
        ...(selectedExtraLabelsWa.length
            ? selectedExtraLabelsWa.map((label) => `  - ${label}`)
            : [`  - ${tWa.noneExtras}`]),
        ...(plan === "diseno-unico" ? [`  - ${tWa.uniqueExtrasNote}`] : []),
        "",
        wah.headingContact,
        `- ${isBoda ? wah.name1Boda : wah.nameSolo}: ${name1 || "-"}`,
        ...(isBoda ? [`- ${wah.name2Boda}: ${name2 || "-"}`] : []),
        `- ${tWa.emailLine}: ${email || "-"}`,
        `- ${tWa.eventDateLine}: ${eventDate || "-"}`,
        "",
        wah.headingBudget,
        `- ${tWa.currency}: ${currency}`,
        `- *${tWa.total}: ${formatMoney(total, currency)}*`,
        `- *${tWa.deposit50}: ${formatMoney(downPayment, currency)}*`,
        "",
        wah.headingComplete,
        detailsUrl,
    ].join("\n");

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
                (!isBoda || name2.trim().length > 1) &&
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
        name2,
        isBoda,
        hasValidEmail,
        eventDate,
    ]);

    const isLastStep = stepIdx === steps.length - 1;

    const step = steps[stepIdx];

    const advanceOneStep = () => {
        setStepIdx((s) => Math.min(steps.length - 1, s + 1));
    };

    const handleFooterNextClick = () => {
        const cur = steps[stepIdx];
        if (cur === "secciones" && sections.length < MIN_SECTION_BLOCKS) {
            setSeccionesMinErrorShown(true);
            return;
        }
        if (
            cur === "extras" &&
            plan === "premium" &&
            !extras.includes("panel")
        ) {
            setPanelSkipModalOpen(true);
            return;
        }
        advanceOneStep();
    };

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

    useEffect(() => {
        setSections((prev) =>
            prev.includes(REQUIRED_SECTION_ID)
                ? prev
                : [REQUIRED_SECTION_ID, ...prev],
        );
    }, []);

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
                            {t.eventTitle}
                        </h2>
                        <div className="mx-auto mt-5 flex w-full max-w-xl flex-col gap-2.5">
                            {(Object.keys(eventLabelMap) as EventType[]).map(
                                (ev) => (
                                    <button
                                        key={ev}
                                        type="button"
                                        onClick={() => setEventType(ev)}
                                        className="w-full rounded-xl border px-4 py-3.5 text-left transition-[border-color,background-color] duration-150"
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
                                        <span className="block text-sm font-semibold text-[#4A3A2F]">
                                            {eventLabelMap[ev]}
                                        </span>
                                        <span className="mt-1 block text-[11px] leading-snug text-[#8A7B6E]">
                                            {eventTypeDescriptions[ev]}
                                        </span>
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
                                const { tipo, detalle } = splitEstiloDescripcion(
                                    (
                                        item as {
                                            descripcion?: string;
                                        }
                                    ).descripcion,
                                );
                                return (
                                    <button
                                        key={item.titulo}
                                        type="button"
                                        onClick={() =>
                                            setStyleSelected(item.titulo)
                                        }
                                        className="relative flex flex-col overflow-hidden rounded-2xl border text-left"
                                        style={{
                                            borderColor: selected
                                                ? "#7A5F45"
                                                : "#DCCFC0",
                                            background: "#FFF",
                                        }}
                                    >
                                        <div className="relative aspect-[4/5] w-full shrink-0 bg-[#EFE8DF]">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.titulo}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : null}
                                            {item.href ? (
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className="absolute right-2 top-2 z-[1] rounded-full border bg-white/90 px-2 py-1 text-[11px] font-medium"
                                                    style={{
                                                        borderColor: "#DCCFC0",
                                                    }}
                                                >
                                                    {t.styleView}
                                                </a>
                                            ) : null}
                                            {selected ? (
                                                <span className="absolute bottom-2 right-2 z-[1] rounded-full bg-[#7A5F45] p-1 text-white shadow-sm">
                                                    <Check size={12} />
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex min-h-0 flex-1 flex-col border-t border-[#EFE8E4] px-1.5 py-1.5">
                                            {tipo ? (
                                                <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-[#7A5F45]">
                                                    {tipo}
                                                </span>
                                            ) : null}
                                            <span
                                                className={`line-clamp-2 text-xs font-semibold leading-tight text-[#4A3A2F] ${tipo ? "mt-0.5" : ""}`}
                                            >
                                                {item.titulo}
                                            </span>
                                            {detalle ? (
                                                <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-[#6A5C52]">
                                                    {detalle}
                                                </span>
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setStyleSelected(styleNoneOptionLabel)
                            }
                            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-colors"
                            style={{
                                borderColor:
                                    styleSelected === styleNoneOptionLabel
                                        ? "#7A5F45"
                                        : "#DCCFC0",
                                background:
                                    styleSelected === styleNoneOptionLabel
                                        ? "#F3EBDD"
                                        : "#FFF",
                                color: "#4A3A2F",
                            }}
                        >
                            {styleNoneOptionLabel}
                            <ChevronRight
                                size={16}
                                className="shrink-0"
                                aria-hidden
                            />
                        </button>
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
                                const isRequiredSection =
                                    s.id === REQUIRED_SECTION_ID;
                                const isPaid =
                                    !s.isAdder &&
                                    on &&
                                    paidSectionIds.includes(s.id);
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
                                                setIsAddingOther(
                                                    (prev) => !prev,
                                                );
                                                return;
                                            }
                                            if (isRequiredSection) return;
                                            setSections((prev) =>
                                                on
                                                    ? prev.filter(
                                                          (x) => x !== s.id,
                                                      )
                                                    : [...prev, s.id],
                                            );
                                        }}
                                        className={`relative flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center transition-[border-color,background-color] duration-150 ${
                                            on || isOtroOpen
                                                ? "border-[1.5px]"
                                                : "border border-[#D9CFC3]"
                                        }`}
                                        style={{
                                            borderColor:
                                                on || isOtroOpen
                                                    ? "#7A5F45"
                                                    : "#D9CFC3",
                                            background:
                                                on || isOtroOpen
                                                    ? "rgba(122,95,69,0.12)"
                                                    : "transparent",
                                            cursor: isRequiredSection
                                                ? "default"
                                                : "pointer",
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
                                                <div className="aspect-square w-full">
                                                    {tileButton}
                                                </div>
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
                                                        placeholder={
                                                            t.seccionOtroPh
                                                        }
                                                        aria-label={
                                                            t.seccionOtroAria
                                                        }
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
                                                                    {
                                                                        id,
                                                                        label,
                                                                    },
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
                                        setCustomLanguageInput(e.target.value)
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
                                const isPanel = ex.id === "panel";
                                const locked = INCLUDED_EXTRAS_BY_PLAN[
                                    plan
                                ].includes(ex.id);
                                const info = extraDetails[ex.id];
                                const infoOpen = openExtraInfoId === ex.id;
                                const verDetalleImg =
                                    EXTRA_VER_DETALLE_IMAGE[ex.id];
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
                                                    isPanel
                                                        ? ex.price[currency] +
                                                              panelExtraGuestsCost
                                                        : ex.price[currency],
                                                    currency,
                                                )}
                                            </span>
                                        ) : null}
                                        {on && locked ? (
                                            <span
                                                className={LINE_BADGE_CLASS}
                                                style={LINE_BADGE_BORDER}
                                            >
                                                {isPanel &&
                                                panelExtraGuestsCost > 0
                                                    ? `+${formatMoney(panelExtraGuestsCost, currency)}`
                                                    : t.included}
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
                                        {isPanel && on ? (
                                            <div className="mt-2 rounded-xl border border-[#E7DFD4] bg-[#FCF8F2] p-3">
                                                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A5F45]">
                                                    {uiLang === "en"
                                                        ? "Estimated guests for dashboard"
                                                        : configuradorEs.panelUi
                                                              .estimatedGuestsTitle}
                                                </span>
                                                <p className="mb-2 text-[11px] leading-relaxed text-[#6A5C52]">
                                                    {uiLang === "en"
                                                        ? `Includes up to ${PANEL_INCLUDED_GUESTS} guests. Then +${formatMoney(toPrice(PANEL_STEP_PRICE_ARS)[currency], currency)} every ${PANEL_STEP_GUESTS} extra guests.`
                                                        : configuradorEs.panelUi.includesLine
                                                              .replace(
                                                                  /\{\{included\}\}/g,
                                                                  String(
                                                                      PANEL_INCLUDED_GUESTS,
                                                                  ),
                                                              )
                                                              .replace(
                                                                  /\{\{stepPrice\}\}/g,
                                                                  formatMoney(
                                                                      toPrice(
                                                                          PANEL_STEP_PRICE_ARS,
                                                                      )[
                                                                          currency
                                                                      ],
                                                                      currency,
                                                                  ),
                                                              )
                                                              .replace(
                                                                  /\{\{stepGuests\}\}/g,
                                                                  String(
                                                                      PANEL_STEP_GUESTS,
                                                                  ),
                                                              )}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                    {PANEL_GUEST_PRESETS.map(
                                                        (guestCount) => {
                                                            const selected =
                                                                clampedPanelGuests ===
                                                                guestCount;
                                                            return (
                                                                <button
                                                                    key={
                                                                        guestCount
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPanelGuests(
                                                                            guestCount,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border px-2 py-2 text-sm font-semibold transition-colors"
                                                                    style={{
                                                                        borderColor:
                                                                            selected
                                                                                ? "#7A5F45"
                                                                                : "#DCCFC0",
                                                                        background:
                                                                            selected
                                                                                ? "#F3EBDD"
                                                                                : "#FFF",
                                                                        color: "#4A3A2F",
                                                                    }}
                                                                >
                                                                    {uiLang ===
                                                                    "en"
                                                                        ? `Up to ${guestCount}`
                                                                        : configuradorEs.panelUi.hastaPreset.replace(
                                                                              /\{\{n\}\}/g,
                                                                              String(
                                                                                  guestCount,
                                                                              ),
                                                                          )}
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                                <div className="mt-2 rounded-lg border border-[#E4DCD1] bg-white p-2 text-[11px] leading-relaxed text-[#6A5C52]">
                                                    <p className="mt-1 font-medium text-[#4A3A2F]">
                                                        {uiLang === "en"
                                                            ? `Capacity surcharge (${clampedPanelGuests}): ${formatMoney(panelExtraGuestsCost, currency)}`
                                                            : configuradorEs.panelUi.capacitySurcharge
                                                                  .replace(
                                                                      /\{\{guests\}\}/g,
                                                                      String(
                                                                          clampedPanelGuests,
                                                                      ),
                                                                  )
                                                                  .replace(
                                                                      /\{\{price\}\}/g,
                                                                      formatMoney(
                                                                          panelExtraGuestsCost,
                                                                          currency,
                                                                      ),
                                                                  )}
                                                    </p>
                                                    <p className="mt-1 rounded-md bg-[#F3EBDD] px-2 py-1 text-sm font-bold text-[#4A3A2F]">
                                                        {uiLang === "en"
                                                            ? `Panel total: ${formatMoney((locked ? 0 : ex.price[currency]) + panelExtraGuestsCost, currency)}`
                                                            : configuradorEs.panelUi.panelTotal.replace(
                                                                  /\{\{total\}\}/g,
                                                                  formatMoney(
                                                                      (locked
                                                                          ? 0
                                                                          : ex
                                                                                .price[
                                                                                currency
                                                                            ]) +
                                                                          panelExtraGuestsCost,
                                                                      currency,
                                                                  ),
                                                              )}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
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
                                                    className="ml-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#7A5F45] sm:text-[13px]"
                                                >
                                                    {infoOpen
                                                        ? t.ocultarDetalle
                                                        : t.verDetalle}
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transition-transform duration-200 ${infoOpen ? "rotate-180" : ""}`}
                                                        aria-hidden
                                                    />
                                                </button>
                                                {infoOpen ? (
                                                    verDetalleImg ? (
                                                        <article className="mt-2 flex flex-row gap-3 rounded-xl border border-[#E7DFD4] bg-[#FCF8F2] p-3 items-start">
                                                            <div
                                                                className={`w-[50%] min-w-[8rem] max-w-[20rem] shrink-0 overflow-hidden rounded-lg sm:w-72 ${
                                                                    verDetalleImg.crop916Top
                                                                        ? "relative aspect-[9/15]"
                                                                        : "border border-[#E1D7C9]"
                                                                }`}
                                                            >
                                                                {verDetalleImg.crop916Top ? (
                                                                    <Image
                                                                        src={
                                                                            verDetalleImg.src
                                                                        }
                                                                        alt={
                                                                            uiLang ===
                                                                            "en"
                                                                                ? verDetalleImg.altEn
                                                                                : verDetalleImg.altEs
                                                                        }
                                                                        fill
                                                                        className="object-cover object-top"
                                                                        sizes="(max-width: 640px) 50vw, 288px"
                                                                    />
                                                                ) : (
                                                                    <Image
                                                                        src={
                                                                            verDetalleImg.src
                                                                        }
                                                                        alt={
                                                                            uiLang ===
                                                                            "en"
                                                                                ? verDetalleImg.altEn
                                                                                : verDetalleImg.altEs
                                                                        }
                                                                        width={
                                                                            verDetalleImg.width
                                                                        }
                                                                        height={
                                                                            verDetalleImg.height
                                                                        }
                                                                        className="h-auto w-full"
                                                                        sizes="(max-width: 640px) 50vw, 288px"
                                                                    />
                                                                )}
                                                            </div>
                                                            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-[#6A5C52]">
                                                                <span className="text-[#5A4A3F]">
                                                                    {renderTextWithBoldMarkers(
                                                                        info.summary,
                                                                        "font-medium",
                                                                    )}
                                                                    :
                                                                </span>{" "}
                                                                {renderTextWithBoldMarkers(
                                                                    info.body,
                                                                )}
                                                            </p>
                                                        </article>
                                                    ) : (
                                                        <p className="mt-1 text-[11px] leading-relaxed text-[#6A5C52]">
                                                            <span className="text-[#5A4A3F]">
                                                                {renderTextWithBoldMarkers(
                                                                    info.summary,
                                                                    "font-medium",
                                                                )}
                                                                :
                                                            </span>{" "}
                                                            {renderTextWithBoldMarkers(
                                                                info.body,
                                                            )}
                                                        </p>
                                                    )
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
                                background:
                                    "linear-gradient(180deg, #FFFFFF 0%, #FCF8F2 100%)",
                            }}
                        >
                            <div
                                className={`grid grid-cols-1 sm:grid-cols-2 ${BLOCK_GAP}`}
                            >
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                        {name1Label}
                                    </span>
                                    <input
                                        value={name1}
                                        onChange={(e) =>
                                            setName1(e.target.value)
                                        }
                                        placeholder={name1Placeholder}
                                        className="w-full rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
                                        style={{
                                            borderColor: "#DCCFC0",
                                            background: "#FFF",
                                        }}
                                    />
                                </label>
                                {isBoda ? (
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                            {name2Label}
                                        </span>
                                        <input
                                            value={name2}
                                            onChange={(e) =>
                                                setName2(e.target.value)
                                            }
                                            placeholder={name2Placeholder}
                                            className="w-full rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
                                            style={{
                                                borderColor: "#DCCFC0",
                                                background: "#FFF",
                                            }}
                                        />
                                    </label>
                                ) : null}
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
                                    style={{
                                        borderColor: "#DCCFC0",
                                        background: "#FFF",
                                    }}
                                >
                                    {!eventDate ? (
                                        <span className="pointer-events-none absolute left-3 right-10 top-1/2 z-[1] -translate-y-1/2 truncate text-sm text-[#7A6A5D]">
                                            {t.datePlaceholder}
                                        </span>
                                    ) : null}
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) =>
                                            setEventDate(e.target.value)
                                        }
                                        onClick={(e) => {
                                            const input =
                                                e.currentTarget as HTMLInputElement & {
                                                    showPicker?: () => void;
                                                };
                                            input.showPicker?.();
                                        }}
                                        aria-label={t.dateAria}
                                        className="block w-full min-w-0 max-w-full rounded-xl border border-transparent px-3 py-3 pr-10 text-sm outline-none transition-colors focus:border-transparent"
                                        style={{
                                            background: "transparent",
                                            color: eventDate
                                                ? "#3F332B"
                                                : "transparent",
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
                className={`fixed inset-x-0 bottom-0 z-30 border-t bg-[#FDFBF7]/98 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur ${PAGE_GUTTER}`}
            >
                <div className="mx-auto max-w-3xl">
                    <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrency("ARS")}
                                className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{
                                    borderColor:
                                        currency === "ARS"
                                            ? "#7A5F45"
                                            : "#DCCFC0",
                                    background:
                                        currency === "ARS" ? "#F3EBDD" : "#FFF",
                                }}
                            >
                                ARS
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrency("USD")}
                                className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{
                                    borderColor:
                                        currency === "USD"
                                            ? "#7A5F45"
                                            : "#DCCFC0",
                                    background:
                                        currency === "USD" ? "#F3EBDD" : "#FFF",
                                }}
                            >
                                USD
                            </button>
                        </div>
                        <p className="text-base font-bold text-[#4A3729] sm:text-[17px]">
                            {t.total}: {formatMoney(total, currency)}
                        </p>
                    </div>
                    <div className="flex items-center justify-between">
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
                                onClick={handleFooterNextClick}
                                disabled={!canContinue}
                                className="inline-flex items-center gap-1 rounded-full bg-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-45"
                            >
                                {t.next} <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!canContinue) return;
                                    window.open(
                                        WhatsAppHref(waNumber, summary),
                                        "_blank",
                                        "noopener,noreferrer",
                                    );
                                }}
                                disabled={!canContinue}
                                className="inline-flex items-center gap-1 rounded-full bg-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-45"
                            >
                                {t.goWhatsapp} <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                    {isLastStep ? (
                        <p className="mt-0.5 text-center text-[10px] text-[#7A6A5D]">
                            {t.footerNote}
                        </p>
                    ) : null}
                </div>
            </footer>

            {panelSkipModalOpen ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="panel-skip-modal-title"
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
                    onClick={() => setPanelSkipModalOpen(false)}
                >
                    <div
                        className="max-h-[min(92dvh,880px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E7DFD4] bg-[#FDFBF7] p-4 shadow-xl sm:max-w-xl sm:p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="panel-skip-modal-title"
                            className="text-center text-lg font-normal leading-snug text-[#4A3A2F] sm:text-xl"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {panelSkipModalCopy.title}
                        </h2>
                        <p className="mt-2 text-center text-xs text-[#6A5C52] sm:text-sm">
                            {panelSkipModalCopy.lead}
                        </p>
                        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                            <div className="relative mx-auto aspect-[9/15] w-full max-w-[11rem] shrink-0 overflow-hidden rounded-lg sm:max-w-[12rem] md:mx-0">
                                <Image
                                    src={EXTRA_VER_DETALLE_IMAGE.panel.src}
                                    alt={panelSkipModalCopy.withTitle}
                                    fill
                                    className="object-cover object-top"
                                    sizes="(max-width: 768px) 44vw, 192px"
                                />
                            </div>
                            <div className="min-w-0 flex-1 space-y-4">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7A5F45]">
                                        {panelSkipModalCopy.withTitle}
                                    </h3>
                                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs">
                                        {panelSkipModalCopy.withPoints.map(
                                            (line, i) => (
                                                <li key={i}>{line}</li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7A5F45]">
                                        {panelSkipModalCopy.withoutTitle}
                                    </h3>
                                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs">
                                        {panelSkipModalCopy.withoutPoints.map(
                                            (line, i) => (
                                                <li key={i}>{line}</li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setPanelSkipModalOpen(false);
                                    advanceOneStep();
                                }}
                                className="rounded-full border border-[#DCCFC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#5A4A3F] transition-colors hover:bg-[#FCF8F2]"
                            >
                                {panelSkipModalCopy.btnContinue}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setExtras((prev) =>
                                        prev.includes("panel")
                                            ? prev
                                            : [...prev, "panel"],
                                    );
                                    setPanelSkipModalOpen(false);
                                }}
                                className="rounded-full bg-[#7A5F45] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                            >
                                {panelSkipModalCopy.btnAdd}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
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
