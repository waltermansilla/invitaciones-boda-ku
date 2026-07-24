"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Suspense,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Baby,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Disc3,
    Gift,
    Globe2,
    Heart,
    Image as ImageLucide,
    Languages,
    List,
    Mail,
    MapPin,
    Music,
    Pointer,
    Shirt,
    Sparkles,
    Star,
    Timer,
    Utensils,
    Users,
    Wallet,
} from "lucide-react";
import landingHomeData from "@/data/landing/landing-2.json";
import landingHomeDataEn from "@/data/landing/landing-2.en.json";
import configuradorEs from "@/data/landing/configurador-es.json";
import pricingData from "@/data/landing/pricing.json";
import {
    configuradorCurrencyFromSearch,
    formatLandingMoney,
    isPanelGuestTier,
    panelCostForGuestTier,
    pickPanelTierPrice,
    PANEL_GUEST_TIERS,
    pairToConfiguratorPrice,
    type ConfiguratorPrice,
} from "@/lib/landing/landing-pricing";
import type { LandingCurrency } from "@/lib/landing/landing-public";
import {
    EXTRA_SECTION_PRICE,
    PRESET_LANGUAGES,
    SECOND_LANGUAGE_PRICE,
    SECTION_LABEL_EN,
    getEventLabels,
    getExtraDetailById,
    getExtrasForLang,
    getSectionDetailById,
    getUiStrings,
} from "./strings";
import { trackGaEvent } from "@/lib/google-analytics";
import {
    MU_CONFIG_FROM_LANDING_KEY,
    MU_LANDING_RETURN_SCROLL_KEY,
} from "@/lib/configurador-return-nav";
import {
    trackMetaEvent,
    updateMetaPixelAdvancedMatching,
} from "@/lib/meta-pixel";
import { applyCouponDiscount } from "@/lib/coupons/logic";
import { getOrCreateCouponClaimToken } from "@/lib/coupons/claim-token";
import {
    clearCouponAttemptFailures,
    getCouponAttemptGate,
    recordCouponAttemptFailure,
} from "@/lib/coupons/attempt-limit";
import type { AppliedCouponInfo } from "@/lib/coupons/types";

type PlanKey = "premium" | "diseno-unico";
type EventTypeSelection = EventType | "";
type EventType =
    | "boda"
    | "xv"
    | "cumpleanos"
    | "baby-shower"
    | "corporativo"
    | "otro";

interface SectionOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    price: ConfiguratorPrice;
    isAdder?: boolean;
}

const PLAN_BASE: Record<PlanKey, ConfiguratorPrice> = {
    premium: pairToConfiguratorPrice(pricingData.plans.premium),
    "diseno-unico": pairToConfiguratorPrice(pricingData.plans.disenoUnico),
};

const FREE_SECTIONS = 5;
const SECTION_LONG_PRESS_MS = 600;

const INCLUDED_EXTRAS_BY_PLAN: Record<PlanKey, string[]> = {
    premium: [],
    "diseno-unico": ["bienvenida", "panel"],
};

/** Diseño único: 1ª pantalla = primeros N extras; 2ª = los N siguientes (mismo N). */
const DESIGN_UNIQUE_EXTRAS_STEP_COUNT = 2;

const CONFIG_PROGRESS_FILL = "#7A5F45";
const CONFIG_PROGRESS_TRACK = "#E8E0D7";

/** Una cápsula de barra de progreso: `fill` entre 0 y 1 permite mitad en extras (diseño único). */
function ConfigProgressCapsule({ fill }: { fill: number }) {
    if (fill >= 1 - 1e-6) {
        return (
            <span
                className="h-2 min-h-[6px] min-w-0 rounded-full sm:h-1.5"
                style={{ background: CONFIG_PROGRESS_FILL }}
                aria-hidden
            />
        );
    }
    if (fill <= 0) {
        return (
            <span
                className="h-2 min-h-[6px] min-w-0 rounded-full sm:h-1.5"
                style={{ background: CONFIG_PROGRESS_TRACK }}
                aria-hidden
            />
        );
    }
    return (
        <span
            className="relative h-2 min-h-[6px] min-w-0 overflow-hidden rounded-full sm:h-1.5"
            style={{ background: CONFIG_PROGRESS_TRACK }}
            aria-hidden
        >
            <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{
                    width: `${Math.round(fill * 100)}%`,
                    background: CONFIG_PROGRESS_FILL,
                }}
            />
        </span>
    );
}

function HelpIcon() {
    return (
        <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-current text-[10px] font-bold">
            ?
        </span>
    );
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
    mapa: <MapPin size={15} />,
    countdown: <Timer size={15} />,
    dress: <Shirt size={15} />,
    itinerario: <List size={15} />,
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
    dietas: <Utensils size={15} />,
};

const SECTION_OPTIONS: SectionOption[] = configuradorEs.sectionOrder.map(
    (id) => {
        const meta =
            configuradorEs.sections[id as keyof typeof configuradorEs.sections];
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
const DEFAULT_SELECTED_SECTION_IDS = [
    REQUIRED_SECTION_ID,
    "countdown",
] as const;
const NON_REMOVABLE_SECTION_IDS = new Set<string>(DEFAULT_SELECTED_SECTION_IDS);
const PANEL_INCLUDED_GUESTS = 150;
const PANEL_MAX_GUESTS = 1000;
const PANEL_GUEST_PRESETS = PANEL_GUEST_TIERS;

type SectionInfoMedia =
    | {
          kind: "image";
          src: string;
          altEs: string;
          altEn: string;
      }
    | {
          kind: "video";
          src: string;
          altEs: string;
          altEn: string;
      };

const SECTION_INFO_MEDIA: Record<string, SectionInfoMedia[]> = {
    mapa: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/ubicacion.jpeg",
            altEs: "Ejemplo de ubicación y mapa",
            altEn: "Location and map example",
        },
    ],
    countdown: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/cuenta-regr.jpeg",
            altEs: "Ejemplo de cuenta regresiva",
            altEn: "Countdown example",
        },
    ],
    itinerario: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/itinerario.jpeg",
            altEs: "Ejemplo de itinerario",
            altEn: "Itinerary example",
        },
    ],
    regalos: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/regalos.jpeg",
            altEs: "Ejemplo de sección de regalos",
            altEn: "Gifts section example",
        },
    ],
    tarjeta: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/tarjeta.jpeg",
            altEs: "Ejemplo de valor de tarjeta",
            altEn: "Entrance fee section example",
        },
    ],
    album: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/drive-fotos.jpeg",
            altEs: "Ejemplo de álbum de fotos",
            altEn: "Photo album example",
        },
    ],
    playlist: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/playlist.jpeg",
            altEs: "Ejemplo de playlist colaborativa",
            altEn: "Collaborative playlist example",
        },
    ],
    trivia: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/trivia.jpeg",
            altEs: "Ejemplo de trivia interactiva",
            altEn: "Interactive trivia example",
        },
    ],
    adultos: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/ninos.jpeg",
            altEs: "Ejemplo de sección niños y cuidados",
            altEn: "Kids and care section example",
        },
    ],
    dress: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/dress-code.jpeg",
            altEs: "Ejemplo de dress code",
            altEn: "Dress code example",
        },
    ],
    historia: [
        {
            kind: "video",
            src: "/landing/media/images/configurador/secciones/historia.mp4",
            altEs: "Ejemplo de nuestra historia",
            altEn: "Our story section example",
        },
    ],
    dietas: [
        {
            kind: "image",
            src: "/landing/media/images/configurador/secciones/rsvp.jpeg",
            altEs: "Ejemplo de RSVP, dietas y mensajes",
            altEn: "RSVP, dietary needs and messages example",
        },
    ],
};

const RSVP_WITHOUT_IMAGE = {
    src: "/landing/media/images/configurador/secciones/asistencia-sin-rsvp.jpeg",
    altEs: "Confirmación de asistencia sencilla, sin RSVP completo",
    altEn: "Simple attendance confirmation without full RSVP",
};

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

/** `*fragmento*` en textos de extraDetails → negrita (pares de un solo asterisco). */
function renderTextWithBoldMarkers(
    text: string,
    plainClassName?: string,
    strongClassName = "font-semibold text-[#5A4A3F]",
): ReactNode {
    const parts = text.split("*");
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <strong key={i} className={strongClassName}>
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
        src: "/landing/media/images/overlay-bienvenida.png",
        width: 575,
        height: 1024,
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

/** Segunda imagen del paso Panel: invitación con nombre del invitado. */
const PANEL_NAMED_INVITE_IMAGE = {
    src: "/landing/media/images/panel-invitacion-nombre.jpg",
    width: 600,
    height: 1024,
    altEs: "Invitación personalizada con el nombre del invitado",
    altEn: "Personalized invitation with the guest’s name",
} as const;

/** Tercera imagen del paso Panel: detalle de familia / integrantes. */
const PANEL_FAMILY_DETAIL_IMAGE = {
    src: "/landing/media/images/panel-familia-detalle.jpg",
    width: 824,
    height: 1024,
    altEs: "Detalle de familia e integrantes en el panel",
    altEn: "Family and members detail in the guest dashboard",
} as const;

/** Cuarta: descarga de resumen PDF (header + tabla, apiladas). */
const PANEL_PDF_HEADER_IMAGE = {
    src: "/landing/media/images/panel-pdf-header.jpg",
    width: 868,
    height: 501,
    altEs: "Botón para descargar el resumen PDF del panel",
    altEn: "Button to download the guest panel PDF summary",
} as const;

const PANEL_PDF_TABLE_IMAGE = {
    src: "/landing/media/images/panel-pdf-tabla.jpg",
    width: 1024,
    height: 499,
    altEs: "Ejemplo de resumen PDF con lista de invitados",
    altEn: "Example PDF summary with the guest list",
} as const;

const PANEL_STEP_IMG_FRAME = {
    width: 162,
    height: 270,
    border: "1px solid #E1D7C9",
    boxShadow: "0 1px 2px rgba(63, 51, 43, 0.06)",
} as const;

/** Padding mínimo entre cada texto y la imagen del otro. */
const PANEL_TEXT_TO_IMG_GAP = 42;

const PANEL_WITHOUT_WHATSAPP_IMAGE = {
    src: "/landing/media/images/panel-sin-panel-whatsapp.jpg",
    width: 1024,
    height: 889,
    altEs: "Ejemplo de confirmación de asistencia por WhatsApp",
    altEn: "Example of an RSVP confirmation via WhatsApp",
} as const;

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
    "countdown",
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
    const router = useRouter();
    const params = useSearchParams();
    const uiLang = params.get("lang") === "en" ? "en" : "es";
    const closeLandingPath = uiLang === "en" ? "/en" : "/";
    const rawPlan = params.get("plan");
    const plan: PlanKey =
        rawPlan === "diseno-unico" ? "diseno-unico" : "premium";
    /** Moneda fijada por la landing vía `?currency=ARS|USD|MXN`; sin query, EN→USD y ES→ARS. */
    const currency: LandingCurrency = configuradorCurrencyFromSearch(
        params.get("currency"),
        uiLang,
    );
    const start = params.get("start");

    const closeHref = useMemo(() => {
        const q = new URLSearchParams();
        q.set("currency", currency);
        return `${closeLandingPath}?${q.toString()}`;
    }, [closeLandingPath, currency]);
    const [eventType, setEventType] = useState<EventTypeSelection>("");
    const [eventOther, setEventOther] = useState("");
    const [styleSelected, setStyleSelected] = useState<string>("");
    const [sections, setSections] = useState<string[]>([
        ...DEFAULT_SELECTED_SECTION_IDS,
    ]);
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
    const [panelChoice, setPanelChoice] = useState<"include" | "skip" | null>(
        plan === "diseno-unico" ? "include" : null,
    );
    const [panelCapacityAnswer, setPanelCapacityAnswer] = useState<
        "yes" | "more" | null
    >(plan === "diseno-unico" ? "yes" : null);
    const [name1, setName1] = useState("");
    const [name2, setName2] = useState("");
    const [email, setEmail] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] =
        useState<AppliedCouponInfo | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponBusy, setCouponBusy] = useState(false);
    const [couponLocked, setCouponLocked] = useState(false);
    const [redeemBusy, setRedeemBusy] = useState(false);
    const [couponsEnabled, setCouponsEnabled] = useState(false);
    const [seccionesInfoOpen, setSeccionesInfoOpen] = useState(false);
    const [seccionesMinErrorShown, setSeccionesMinErrorShown] = useState(false);
    const [sectionInfoId, setSectionInfoId] = useState<string | null>(null);
    const [rsvpWithoutInfoOpen, setRsvpWithoutInfoOpen] = useState(false);
    const [sectionPressingId, setSectionPressingId] = useState<string | null>(
        null,
    );
    const [panelSkipModalOpen, setPanelSkipModalOpen] = useState(false);
    const [panelWithoutInfoOpen, setPanelWithoutInfoOpen] = useState(false);
    const sectionInfoVideoRef = useRef<HTMLVideoElement | null>(null);
    const sectionPressTimer = useRef<number | null>(null);
    const sectionLongPressDone = useRef(false);
    const panelImg1TextRef = useRef<HTMLDivElement>(null);
    const panelImg2TextRef = useRef<HTMLDivElement>(null);
    /** Margen de la fila 2: negativo = solape; positivo = aire extra bajo el texto 1. */
    const [panelImg2RowMargin, setPanelImg2RowMargin] = useState(0);
    const [designBrief, setDesignBrief] = useState("");
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
            ? ([
                  "evento",
                  "estilo",
                  "secciones",
                  "panel",
                  "idioma",
                  "extras",
                  "extras2",
                  "briefing",
                  "datos",
              ] as const)
            : ([
                  "evento",
                  "estilo",
                  "secciones",
                  "panel",
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
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch("/api/coupons/enabled", {
                    cache: "no-store",
                });
                const data = (await res.json()) as {
                    ok?: boolean;
                    enabled?: boolean;
                };
                if (cancelled) return;
                const on = Boolean(data.ok && data.enabled);
                setCouponsEnabled(on);
                if (!on) {
                    setAppliedCoupon(null);
                    setCouponError(null);
                    setCouponLocked(false);
                }
            } catch {
                if (!cancelled) setCouponsEnabled(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

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

    useEffect(() => {
        if (!sectionInfoId) {
            setRsvpWithoutInfoOpen(false);
            return;
        }
        const video = sectionInfoVideoRef.current;
        if (!video) return;
        video.muted = true;
        video.defaultMuted = true;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                /* Autoplay may be blocked; muted+playsInline usually works. */
            });
        }
    }, [sectionInfoId]);

    const t = useMemo(() => getUiStrings(uiLang), [uiLang]);

    useEffect(() => {
        if (params.get("resetCouponLock") === "1") {
            clearCouponAttemptFailures();
            setCouponLocked(false);
            setCouponError(null);
            const next = new URLSearchParams(params.toString());
            next.delete("resetCouponLock");
            const qs = next.toString();
            router.replace(qs ? `/configurador?${qs}` : "/configurador");
            return;
        }
        const gate = getCouponAttemptGate();
        setCouponLocked(gate.locked);
        if (gate.locked) {
            setCouponError(t.couponLocked);
        }
    }, [t.couponLocked, params, router]);

    const tWa = useMemo(() => getUiStrings("es"), []);
    const styleNoneOptionLabel =
        uiLang === "en"
            ? "None represents what I am looking for"
            : configuradorEs.misc.styleNoneOption;
    const extrasList = useMemo(() => getExtrasForLang(uiLang), [uiLang]);
    const extrasListWa = useMemo(() => getExtrasForLang("es"), []);
    const extraDetails = useMemo(() => getExtraDetailById(uiLang), [uiLang]);
    const sectionDetails = useMemo(
        () => getSectionDetailById(uiLang),
        [uiLang],
    );
    const sectionInfoDetail = sectionInfoId
        ? sectionDetails[sectionInfoId]
        : null;

    const clearSectionPressTimer = () => {
        if (sectionPressTimer.current != null) {
            window.clearTimeout(sectionPressTimer.current);
            sectionPressTimer.current = null;
        }
    };

    const clearSectionPress = () => {
        clearSectionPressTimer();
        setSectionPressingId(null);
    };

    useEffect(() => {
        return () => clearSectionPressTimer();
    }, []);
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
    const secondLanguageCost = secondLanguage
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
    const panelGuestTier = isPanelGuestTier(clampedPanelGuests)
        ? clampedPanelGuests
        : PANEL_INCLUDED_GUESTS;
    const panelTierPrice = pickPanelTierPrice(panelGuestTier, currency);
    const panelBaseTierPrice = pickPanelTierPrice(
        PANEL_INCLUDED_GUESTS,
        currency,
    );
    const panelSelected = extras.includes("panel");
    const panelIncludedByPlan = includedExtraIds.includes("panel");
    const panelCost = panelSelected
        ? panelCostForGuestTier(panelGuestTier, currency, {
              planIncludesPanelBase: panelIncludedByPlan,
          })
        : 0;
    const extrasCost =
        panelCost +
        selectedExtras
            .filter((e) => e.id !== "panel")
            .filter((e) => !includedExtraIds.includes(e.id))
            .reduce((acc, e) => acc + e.price[currency], 0);
    const base = PLAN_BASE[plan][currency];
    const total = base + sectionsCost + secondLanguageCost + extrasCost;
    const discountedTotal = appliedCoupon
        ? applyCouponDiscount(total, appliedCoupon.discountPercent)
        : total;
    const downPayment = Math.round(discountedTotal * 0.5);

    const planLabel = plan === "premium" ? t.planPremium : t.planUnique;
    const planLabelWa = plan === "premium" ? tWa.planPremium : tWa.planUnique;
    const waEx = configuradorEs.waExtras;
    const styleLabelForWa = useMemo(() => {
        if (!styleSelected.trim()) return "";
        if (styleSelected === styleNoneOptionLabel) {
            return configuradorEs.misc.styleNoneOption;
        }
        return styleSelected;
    }, [styleSelected, styleNoneOptionLabel]);

    /** Segundo idioma en el mensaje WhatsApp siempre como etiqueta ES (preset alineados por índice con EN). */
    const secondLanguageLabelWa = useMemo(() => {
        if (!secondLanguage.trim()) return tWa.none;
        const presetEn = PRESET_LANGUAGES.en;
        const idx = presetEn.indexOf(secondLanguage);
        if (idx !== -1 && PRESET_LANGUAGES.es[idx])
            return PRESET_LANGUAGES.es[idx];
        return secondLanguage;
    }, [secondLanguage, tWa.none]);

    const selectedExtraLabelsWa = selectedExtras.map((e) => {
        const match = extrasListWa.find((x) => x.id === e.id);
        const label = match?.label ?? e.label;
        if (e.id !== "panel") return label;
        const panelLine = waEx.panelLine
            .replace(/\{\{label\}\}/g, label)
            .replace(/\{\{guests\}\}/g, String(panelGuestTier))
            .replace(
                /\{\{price\}\}/g,
                formatLandingMoney(panelTierPrice, currency),
            );
        return panelLine;
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
        if (designBrief.trim()) query.set("designBrief", designBrief.trim());
        return query.toString();
    }, [name1, name2, eventDate, designBrief]);
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
        `- ${tWa.event}: ${eventType ? `${eventLabelMapWa[eventType]}${eventType === "otro" && eventOther ? ` (${eventOther})` : ""}` : tWa.tbd}`,
        `- ${tWa.style}: ${styleSelected || tWa.tbd}`,
        `- ${tWa.sections} (${sections.length}):`,
        ...(sections.length
            ? selectedSectionLabelsWa.map((label) => `  - ${label}`)
            : [`  - ${tWa.tbd}`]),
        "",
        wah.headingLanguages,
        `- ${tWa.primaryLang}: ${tWa.spanish}`,
        `- ${tWa.secondLang}: ${secondLanguageLabelWa}`,
        "",
        wah.headingExtras,
        ...(selectedExtraLabelsWa.length
            ? selectedExtraLabelsWa.map((label) => `  - ${label}`)
            : [`  - ${tWa.noneExtras}`]),
        ...(plan === "diseno-unico" ? [`  - ${tWa.uniqueExtrasNote}`] : []),
        "",
        wah.headingCreativeBrief,
        `- ${tWa.creativeBriefLine}: ${designBrief.trim() || "-"}`,
        "",
        wah.headingContact,
        `- ${isBoda ? wah.name1Boda : wah.nameSolo}: ${name1 || "-"}`,
        ...(isBoda ? [`- ${wah.name2Boda}: ${name2 || "-"}`] : []),
        `- ${tWa.emailLine}: ${email || "-"}`,
        `- ${tWa.eventDateLine}: ${eventDate || "-"}`,
        "",
        wah.headingBudget,
        `- ${tWa.currency}: ${currency}`,
        ...(appliedCoupon
            ? [
                  `- ${tWa.couponWaLine}: ${appliedCoupon.code} (−${appliedCoupon.discountPercent}%)`,
                  `- ${tWa.totalBeforeDiscount}: ${formatLandingMoney(total, currency)}`,
              ]
            : []),
        `- *${tWa.total}: ${formatLandingMoney(discountedTotal, currency)}*`,
        `- *${tWa.deposit50}: ${formatLandingMoney(downPayment, currency)}*`,
        "",
        wah.headingComplete,
        detailsUrl,
    ].join("\n");

    const hasValidEmail = useMemo(() => {
        const v = email.trim();
        return v.length > 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }, [email]);

    useEffect(() => {
        if (!hasValidEmail) return;
        updateMetaPixelAdvancedMatching({
            em: email.trim().toLowerCase(),
        });
    }, [hasValidEmail, email]);

    const MIN_SECTION_BLOCKS = FREE_SECTIONS;

    const canContinue = useMemo(() => {
        const step = steps[stepIdx];
        if (step === "evento")
            return (
                Boolean(eventType) &&
                (eventType !== "otro" || eventOther.trim().length > 2)
            );
        if (step === "estilo") return Boolean(styleSelected);
        if (step === "secciones") return true;
        if (step === "panel") {
            if (panelIncludedByPlan || panelChoice === "include") {
                return (
                    panelCapacityAnswer === "yes" ||
                    panelCapacityAnswer === "more"
                );
            }
            return panelChoice === "skip";
        }
        if (step === "briefing")
            return plan === "diseno-unico"
                ? designBrief.trim().length >= 10
                : true;
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
        panelChoice,
        panelCapacityAnswer,
        panelIncludedByPlan,
        designBrief,
        plan,
        name1,
        name2,
        isBoda,
        hasValidEmail,
        eventDate,
    ]);

    const isLastStep = stepIdx === steps.length - 1;

    const handleApplyCoupon = async () => {
        const code = couponInput.trim();
        if (!code || couponBusy) return;

        const gate = getCouponAttemptGate();
        if (gate.locked) {
            setCouponLocked(true);
            setCouponError(t.couponLocked);
            return;
        }

        setCouponBusy(true);
        setCouponError(null);
        try {
            const claimToken = getOrCreateCouponClaimToken();
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    claimToken,
                    lang: uiLang,
                }),
            });
            const data = (await res.json()) as {
                ok: boolean;
                error?: string;
                coupon?: AppliedCouponInfo;
            };
            if (!data.ok || !data.coupon) {
                setAppliedCoupon(null);
                const after = recordCouponAttemptFailure();
                if (after.locked) {
                    setCouponLocked(true);
                    setCouponError(t.couponLocked);
                } else {
                    setCouponError(data.error || t.couponRedeemError);
                }
                return;
            }
            clearCouponAttemptFailures();
            setCouponLocked(false);
            setAppliedCoupon(data.coupon);
            setCouponInput(data.coupon.code);
            setCouponError(null);
        } catch {
            setAppliedCoupon(null);
            setCouponError(t.couponRedeemError);
        } finally {
            setCouponBusy(false);
        }
    };

    const handleSenar = async () => {
        if (!canContinue || redeemBusy) return;
        setRedeemBusy(true);
        setCouponError(null);
        try {
            if (appliedCoupon) {
                const claimToken = getOrCreateCouponClaimToken();
                const reservedName = isBoda
                    ? `${name1.trim()} & ${name2.trim()}`
                    : name1.trim();
                const res = await fetch("/api/coupons/redeem", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: appliedCoupon.code,
                        claimToken,
                        reservedName,
                        invitationType: eventType || "",
                        lang: uiLang,
                    }),
                });
                const data = (await res.json()) as {
                    ok: boolean;
                    error?: string;
                };
                if (!data.ok) {
                    setCouponError(data.error || t.couponRedeemError);
                    setAppliedCoupon(null);
                    return;
                }
            }

            trackMetaEvent("Purchase", {
                source: "configurador",
                step: "senar_50",
                plan,
                currency,
                value: discountedTotal,
                ...(appliedCoupon ? { coupon: appliedCoupon.code } : {}),
            });
            trackGaEvent("purchase", {
                source: "configurador",
                button_name: "SEÑAR",
                step: "senar_50",
                plan,
                currency,
                value: discountedTotal,
                ...(appliedCoupon ? { coupon: appliedCoupon.code } : {}),
            });
            window.open(
                WhatsAppHref(waNumber, summary),
                "_blank",
                "noopener,noreferrer",
            );
        } catch {
            if (appliedCoupon) {
                setCouponError(t.couponRedeemError);
            }
        } finally {
            setRedeemBusy(false);
        }
    };

    const step = steps[stepIdx];

    useLayoutEffect(() => {
        if (step !== "panel") return;
        const t1 = panelImg1TextRef.current;
        const t2 = panelImg2TextRef.current;
        if (!t1 || !t2) return;

        const measure = () => {
            const gap = PANEL_TEXT_TO_IMG_GAP;
            const imgH = PANEL_STEP_IMG_FRAME.height;
            const h1 = Math.ceil(t1.getBoundingClientRect().height);
            const h2 = Math.ceil(t2.getBoundingClientRect().height);
            if (h1 <= 0 || h2 <= 0) return;
            const row1Height = Math.max(imgH, h1);
            // 1) img2 ≥ 42px bajo el texto 1
            // 2) texto 2 ≥ 42px bajo el final de img1 (items-end → img2Top ≥ h2 + 42)
            const desiredImg2Top = Math.max(h1 + gap, h2 + gap);
            setPanelImg2RowMargin(desiredImg2Top - row1Height);
        };

        measure();
        const raf1 = requestAnimationFrame(() => {
            measure();
            requestAnimationFrame(measure);
        });
        const ro = new ResizeObserver(() => measure());
        ro.observe(t1);
        ro.observe(t2);
        return () => {
            cancelAnimationFrame(raf1);
            ro.disconnect();
        };
    }, [
        step,
        uiLang,
        t.panelImg1Summary,
        t.panelImg1Body,
        t.panelImg2Summary,
        t.panelImg2Body,
    ]);

    const extrasWithoutPanel = useMemo(
        () => extrasList.filter((e) => e.id !== "panel"),
        [extrasList],
    );

    const extrasToRender = useMemo(() => {
        if (step !== "extras" && step !== "extras2") return [];
        if (plan !== "diseno-unico") return extrasWithoutPanel;
        return step === "extras"
            ? extrasWithoutPanel.slice(0, DESIGN_UNIQUE_EXTRAS_STEP_COUNT)
            : extrasWithoutPanel.slice(
                  DESIGN_UNIQUE_EXTRAS_STEP_COUNT,
                  DESIGN_UNIQUE_EXTRAS_STEP_COUNT * 2,
              );
    }, [plan, step, extrasWithoutPanel]);

    const extrasStepTitle =
        plan === "diseno-unico" && step === "extras2"
            ? t.extrasTitlePart2
            : plan === "diseno-unico" && step === "extras"
              ? t.extrasTitlePart1
              : t.extrasTitle;

    /** Barra de progreso: no incluye briefing ni datos (se completa en extras). */
    const progressSegmentFills = useMemo(() => {
        const fills: number[] = [];
        for (let i = 0; i < steps.length; i++) {
            const id = steps[i];
            if (id === "extras2" || id === "briefing" || id === "datos") {
                continue;
            }
            if (id === "extras" && plan === "diseno-unico") {
                if (stepIdx < i) fills.push(0);
                else if (stepIdx === i) fills.push(0.5);
                else fills.push(1);
                continue;
            }
            fills.push(stepIdx >= i ? 1 : 0);
        }
        return fills;
    }, [plan, stepIdx, steps]);

    const includePanelExtra = () => {
        setExtras((prev) =>
            prev.includes("panel") ? prev : [...prev, "panel"],
        );
    };

    const excludePanelExtra = () => {
        if (INCLUDED_EXTRAS_BY_PLAN[plan].includes("panel")) return;
        setExtras((prev) => prev.filter((x) => x !== "panel"));
    };

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
            cur === "panel" &&
            plan === "premium" &&
            !extras.includes("panel") &&
            panelChoice !== "skip"
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
        if (step !== "extras" && step !== "extras2") {
            setOpenExtraInfoId(null);
        }
    }, [step]);

    useEffect(() => {
        setSections((prev) =>
            DEFAULT_SELECTED_SECTION_IDS.reduce<string[]>(
                (acc, sectionId) =>
                    acc.includes(sectionId) ? acc : [sectionId, ...acc],
                prev,
            ),
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
                        onClick={(event) => {
                            if (
                                event.button !== 0 ||
                                event.metaKey ||
                                event.ctrlKey ||
                                event.shiftKey ||
                                event.altKey
                            ) {
                                return;
                            }
                            event.preventDefault();
                            try {
                                if (typeof window !== "undefined") {
                                    const fromLanding =
                                        sessionStorage.getItem(
                                            MU_CONFIG_FROM_LANDING_KEY,
                                        ) === "1";
                                    const hasReturnScroll =
                                        sessionStorage.getItem(
                                            MU_LANDING_RETURN_SCROLL_KEY,
                                        ) !== null;
                                    if (fromLanding || hasReturnScroll) {
                                        sessionStorage.removeItem(
                                            MU_CONFIG_FROM_LANDING_KEY,
                                        );
                                        router.back();
                                        return;
                                    }
                                }
                            } catch {
                                /* */
                            }
                            router.push(closeHref);
                        }}
                    >
                        {t.headerClose}
                    </Link>
                    <div className="justify-self-center text-center text-sm font-semibold">
                        {plan === "premium" ? t.planPremium : t.planUnique}
                    </div>
                    <div className="justify-self-end text-right text-[15px] font-bold tabular-nums leading-tight tracking-tight text-[#4A3729] sm:text-base">
                        {formatLandingMoney(total, currency)}
                    </div>
                </div>
                <div
                    className={`mx-auto grid w-full max-w-3xl min-w-0 gap-1.5 pb-3 sm:gap-2 ${PAGE_GUTTER}`}
                    style={{
                        gridTemplateColumns: `repeat(${progressSegmentFills.length}, minmax(0, 1fr))`,
                    }}
                >
                    {progressSegmentFills.map((fill, idx) => (
                        <ConfigProgressCapsule key={idx} fill={fill} />
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
                        <div className={`mt-5 grid grid-cols-2 ${BLOCK_GAP}`}>
                            {styleItems.map((item) => {
                                const selected = styleSelected === item.titulo;
                                const { tipo, detalle } =
                                    splitEstiloDescripcion(
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
                        {plan === "diseno-unico" ? (
                            <p className="mt-3 text-xs font-medium leading-snug text-[#7A5F45]">
                                {t.seccionesPremiumCompareNote.replace(
                                    /\{\{precioPorBloque\}\}/g,
                                    `${formatLandingMoney(EXTRA_SECTION_PRICE[currency], currency)}${t.perBlock}`,
                                )}
                            </p>
                        ) : null}
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
                                                {t.incluyeP2Each}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        {plan === "premium" ? (
                            <>
                                <p className="mt-3 text-xs font-medium tabular-nums text-[#7A5F45]">
                                    {FREE_SECTIONS} {t.seccionesCountFoot}{" "}
                                    {`+${formatLandingMoney(EXTRA_SECTION_PRICE[currency], currency)}`}
                                    {t.perBlock}
                                </p>
                                <p className="text-base font-semibold text-[#3F332B] mt-0.5">
                                    {sections.length}/{FREE_SECTIONS}{" "}
                                    <span className="font-medium text-[#2F7E56]">
                                        {paidSectionsCount > 0
                                            ? `(+${formatLandingMoney(sectionsCost, currency)})`
                                            : t.sinExtras}
                                    </span>
                                </p>
                                <p className="mt-1.5 text-xs leading-snug text-[#6A5C52]">
                                    {t.seccionesTopNote}
                                </p>
                            </>
                        ) : (
                            <p className="mt-3 text-sm tabular-nums text-[#6A5C52]">
                                {t.seccionesSoloConteo.replace(
                                    /\{\{count\}\}/g,
                                    String(sections.length),
                                )}
                            </p>
                        )}
                        {seccionesMinErrorShown &&
                        sections.length < MIN_SECTION_BLOCKS ? (
                            <p
                                className="mt-2 text-sm font-semibold text-[#B71C1C]"
                                role="alert"
                            >
                                {t.seccionesMinThree}
                            </p>
                        ) : null}
                        <p className="mt-5 text-center text-[13px] leading-snug text-[#8A735C]">
                            {t.seccionInfoHint.split("*").map((part, i) =>
                                i % 2 === 1 ? (
                                    <strong
                                        key={i}
                                        className="font-semibold text-[#5A4A3F]"
                                    >
                                        <Pointer
                                            size={14}
                                            strokeWidth={2.25}
                                            aria-hidden
                                            className="mr-1 inline size-3.5"
                                            style={{
                                                verticalAlign: "-0.125em",
                                            }}
                                        />
                                        {part}
                                    </strong>
                                ) : (
                                    <span key={i}>{part}</span>
                                ),
                            )}
                        </p>
                        <div className="mt-2.5 grid w-full min-w-0 grid-cols-4 gap-x-4 gap-y-5 pt-3 sm:gap-x-3 sm:gap-y-4 sm:pt-2">
                            {sectionOptions.map((s) => {
                                const on = sections.includes(s.id);
                                const isRequiredSection =
                                    NON_REMOVABLE_SECTION_IDS.has(s.id);
                                const tileShowsSectionSurcharge =
                                    plan === "premium" &&
                                    !s.isAdder &&
                                    on &&
                                    paidSectionIds.includes(s.id);
                                const isOtroOpen = s.isAdder && isAddingOther;

                                const priceBadge = tileShowsSectionSurcharge ? (
                                    <span
                                        className="pointer-events-none absolute left-1/2 top-0 z-[1] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-[#FDFBF7] px-2 py-0.5 text-[10px] font-semibold leading-none text-[#7A5F45] shadow-sm"
                                        style={{
                                            borderColor: "#C4A990",
                                        }}
                                    >
                                        +
                                        {formatLandingMoney(
                                            s.price[currency],
                                            currency,
                                        )}
                                    </span>
                                ) : null;

                                const isPressing = sectionPressingId === s.id;
                                const tileButton = (
                                    <button
                                        type="button"
                                        onContextMenu={(e) =>
                                            e.preventDefault()
                                        }
                                        onPointerDown={() => {
                                            sectionLongPressDone.current = false;
                                            clearSectionPressTimer();
                                            setSectionPressingId(s.id);
                                            sectionPressTimer.current =
                                                window.setTimeout(() => {
                                                    const infoKey =
                                                        sectionDetails[s.id]
                                                            ? s.id
                                                            : s.id.startsWith(
                                                                    "otro",
                                                                )
                                                              ? "otro"
                                                              : null;
                                                    setSectionPressingId(null);
                                                    if (!infoKey) return;
                                                    sectionLongPressDone.current = true;
                                                    setSectionInfoId(infoKey);
                                                    if (
                                                        typeof navigator !==
                                                            "undefined" &&
                                                        "vibrate" in navigator
                                                    ) {
                                                        try {
                                                            navigator.vibrate(
                                                                12,
                                                            );
                                                        } catch {
                                                            // ignore
                                                        }
                                                    }
                                                }, SECTION_LONG_PRESS_MS);
                                        }}
                                        onPointerUp={() => clearSectionPress()}
                                        onPointerLeave={() =>
                                            clearSectionPress()
                                        }
                                        onPointerCancel={() =>
                                            clearSectionPress()
                                        }
                                        onClick={() => {
                                            if (sectionLongPressDone.current) {
                                                sectionLongPressDone.current = false;
                                                return;
                                            }
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
                                        className={`relative flex aspect-square w-full min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center transition-[border-color,background-color] duration-150 ${
                                            on || isOtroOpen
                                                ? "border-[1.5px]"
                                                : "border border-[#D9CFC3]"
                                        } ${isPressing ? "animate-section-long-press" : ""}`}
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
                                            ...(isPressing
                                                ? {
                                                      animationDuration: `${SECTION_LONG_PRESS_MS}ms`,
                                                  }
                                                : {}),
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

                {step === "panel" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.panelTitle}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#6A5C52]">
                            {t.panelLead}
                        </p>

                        <div className="relative mt-5">
                            <div className="relative z-[1] flex flex-row items-start gap-3">
                                <div
                                    className="shrink-0 overflow-hidden rounded-lg"
                                    style={PANEL_STEP_IMG_FRAME}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={EXTRA_VER_DETALLE_IMAGE.panel.src}
                                        alt={
                                            uiLang === "en"
                                                ? EXTRA_VER_DETALLE_IMAGE.panel
                                                      .altEn
                                                : EXTRA_VER_DETALLE_IMAGE.panel
                                                      .altEs
                                        }
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "top",
                                        }}
                                        decoding="async"
                                    />
                                </div>
                                <div
                                    ref={panelImg1TextRef}
                                    className="relative z-[3] min-w-0 flex-1 break-words pt-1"
                                >
                                    <p className="text-[13px] font-semibold leading-snug text-[#5A4A3F]">
                                        {t.panelImg1Summary}
                                    </p>
                                    {t.panelImg1Body ? (
                                        <p className="mt-1 text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs">
                                            {t.panelImg1Body}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div
                                className="relative z-[2] flex flex-row items-end gap-3"
                                style={{
                                    marginTop: panelImg2RowMargin,
                                    minHeight: PANEL_STEP_IMG_FRAME.height,
                                }}
                            >
                                <div
                                    ref={panelImg2TextRef}
                                    className="min-w-0 flex-1 break-words text-right"
                                >
                                    <p className="text-[13px] font-semibold leading-snug text-[#5A4A3F]">
                                        {t.panelImg2Summary}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs">
                                        {t.panelImg2Body}
                                    </p>
                                </div>
                                <div
                                    className="shrink-0 overflow-hidden rounded-lg"
                                    style={PANEL_STEP_IMG_FRAME}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={PANEL_NAMED_INVITE_IMAGE.src}
                                        alt={
                                            uiLang === "en"
                                                ? PANEL_NAMED_INVITE_IMAGE.altEn
                                                : PANEL_NAMED_INVITE_IMAGE.altEs
                                        }
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "top",
                                        }}
                                        decoding="async"
                                    />
                                </div>
                            </div>

                            <div className="relative z-[3] mt-8 flex flex-row items-start gap-3">
                                <div
                                    className="shrink-0 overflow-hidden rounded-lg"
                                    style={{
                                        width: 220,
                                        height: Math.round(
                                            (220 *
                                                PANEL_FAMILY_DETAIL_IMAGE.height) /
                                                PANEL_FAMILY_DETAIL_IMAGE.width,
                                        ),
                                        border: PANEL_STEP_IMG_FRAME.border,
                                        boxShadow:
                                            PANEL_STEP_IMG_FRAME.boxShadow,
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={PANEL_FAMILY_DETAIL_IMAGE.src}
                                        alt={
                                            uiLang === "en"
                                                ? PANEL_FAMILY_DETAIL_IMAGE.altEn
                                                : PANEL_FAMILY_DETAIL_IMAGE.altEs
                                        }
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center",
                                            transform: "scale(1.1)",
                                        }}
                                        decoding="async"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 pt-1">
                                    <p className="text-[13px] font-semibold leading-snug text-[#5A4A3F]">
                                        {t.panelImg3Summary}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs">
                                        {t.panelImg3Body}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-[3] mt-8 flex flex-col items-center gap-3">
                                <p className="max-w-md text-center text-[13px] font-semibold leading-snug text-[#5A4A3F]">
                                    {t.panelImg4Summary}
                                </p>
                                <div className="flex w-full max-w-[360px] flex-col items-center gap-2">
                                    <div
                                        className="w-[78%] overflow-hidden rounded-lg"
                                        style={{
                                            border: PANEL_STEP_IMG_FRAME.border,
                                            boxShadow:
                                                PANEL_STEP_IMG_FRAME.boxShadow,
                                            // Mismo ancho; menos alto → recorte arriba/abajo
                                            aspectRatio: "868 / 370",
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={PANEL_PDF_HEADER_IMAGE.src}
                                            alt={
                                                uiLang === "en"
                                                    ? PANEL_PDF_HEADER_IMAGE.altEn
                                                    : PANEL_PDF_HEADER_IMAGE.altEs
                                            }
                                            width={PANEL_PDF_HEADER_IMAGE.width}
                                            height={
                                                PANEL_PDF_HEADER_IMAGE.height
                                            }
                                            className="block h-full w-full object-cover object-center"
                                            decoding="async"
                                        />
                                    </div>
                                    <div
                                        className="w-full overflow-hidden rounded-lg"
                                        style={{
                                            border: PANEL_STEP_IMG_FRAME.border,
                                            boxShadow:
                                                PANEL_STEP_IMG_FRAME.boxShadow,
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={PANEL_PDF_TABLE_IMAGE.src}
                                            alt={
                                                uiLang === "en"
                                                    ? PANEL_PDF_TABLE_IMAGE.altEn
                                                    : PANEL_PDF_TABLE_IMAGE.altEs
                                            }
                                            width={PANEL_PDF_TABLE_IMAGE.width}
                                            height={
                                                PANEL_PDF_TABLE_IMAGE.height
                                            }
                                            className="block h-auto w-full"
                                            decoding="async"
                                        />
                                    </div>
                                </div>
                                <p className="max-w-md text-center text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs">
                                    {t.panelImg4Body}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#E7DFD4] bg-[#FCF8F2] p-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setPanelWithoutInfoOpen((prev) => !prev)
                                }
                                className="inline-flex w-full max-w-full items-center gap-1.5 text-left text-sm font-medium text-[#7A5F45]"
                                aria-expanded={panelWithoutInfoOpen}
                            >
                                <span className="min-w-0 flex-1">
                                    {t.panelWithoutTitle}
                                </span>
                                <ChevronDown
                                    size={18}
                                    className={`shrink-0 transition-transform duration-200 ${
                                        panelWithoutInfoOpen ? "rotate-180" : ""
                                    }`}
                                    aria-hidden
                                />
                            </button>
                            {panelWithoutInfoOpen ? (
                                <div className="mt-3 space-y-3">
                                    <p className="text-sm leading-relaxed text-[#6A5C52]">
                                        {t.panelWithoutLead}
                                    </p>
                                    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#6A5C52]">
                                        {t.panelWithoutPoints.map((line, i) => (
                                            <li key={i}>{line}</li>
                                        ))}
                                    </ul>
                                    <div
                                        className="mx-auto overflow-hidden rounded-lg"
                                        style={{
                                            width: "min(100%, 280px)",
                                            border: "1px solid #E1D7C9",
                                            boxShadow:
                                                "0 1px 2px rgba(63, 51, 43, 0.06)",
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={
                                                PANEL_WITHOUT_WHATSAPP_IMAGE.src
                                            }
                                            alt={
                                                uiLang === "en"
                                                    ? PANEL_WITHOUT_WHATSAPP_IMAGE.altEn
                                                    : PANEL_WITHOUT_WHATSAPP_IMAGE.altEs
                                            }
                                            width={
                                                PANEL_WITHOUT_WHATSAPP_IMAGE.width
                                            }
                                            height={
                                                PANEL_WITHOUT_WHATSAPP_IMAGE.height
                                            }
                                            className="block h-auto w-full"
                                            decoding="async"
                                        />
                                    </div>
                                    <p className="text-sm leading-relaxed text-[#6A5C52]">
                                        {t.panelWithoutReassure}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#E7DFD4] bg-[#FCF8F2] p-4">
                            {panelIncludedByPlan ? (
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A5F45]">
                                    {t.panelIncludedInPlan}
                                </p>
                            ) : (
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-stretch sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPanelChoice("skip");
                                            setPanelCapacityAnswer(null);
                                            setPanelGuests(
                                                PANEL_INCLUDED_GUESTS,
                                            );
                                            excludePanelExtra();
                                        }}
                                        className={`inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-1 ${
                                            panelChoice === "skip"
                                                ? "border-[#7A5F45] bg-[#F3EBDD] text-[#4A3A2F]"
                                                : "border-[#DCCFC0] bg-white text-[#5A4A3F] hover:bg-[#FCF8F2]"
                                        }`}
                                    >
                                        {panelSkipModalCopy.btnContinue}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPanelChoice("include");
                                            setPanelGuests(
                                                PANEL_INCLUDED_GUESTS,
                                            );
                                            setPanelCapacityAnswer(null);
                                            includePanelExtra();
                                        }}
                                        className={`inline-flex flex-col items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity sm:flex-1 ${
                                            panelChoice === "include"
                                                ? "bg-[#5C4633] opacity-100"
                                                : "bg-[#7A5F45] hover:opacity-95"
                                        }`}
                                    >
                                        <span>{panelSkipModalCopy.btnAdd}</span>
                                        <span className="text-[10px] font-medium leading-tight opacity-90">
                                            {uiLang === "en" ? "for " : "por "}
                                            {formatLandingMoney(
                                                extrasList.find(
                                                    (e) => e.id === "panel",
                                                )?.price[currency] ?? 0,
                                                currency,
                                            )}
                                        </span>
                                    </button>
                                </div>
                            )}

                            {panelChoice === "include" ||
                            panelIncludedByPlan ? (
                                <div
                                    className={
                                        panelIncludedByPlan ? "" : "mt-4"
                                    }
                                >
                                    <p className="text-sm leading-relaxed text-[#6A5C52]">
                                        {renderTextWithBoldMarkers(
                                            t.panelCapacityIntro.replace(
                                                /\{\{n\}\}/g,
                                                String(PANEL_INCLUDED_GUESTS),
                                            ),
                                        )}
                                    </p>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPanelCapacityAnswer("yes");
                                                setPanelGuests(
                                                    PANEL_INCLUDED_GUESTS,
                                                );
                                                includePanelExtra();
                                            }}
                                            className="rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors"
                                            style={{
                                                borderColor:
                                                    panelCapacityAnswer ===
                                                    "yes"
                                                        ? "#7A5F45"
                                                        : "#DCCFC0",
                                                background:
                                                    panelCapacityAnswer ===
                                                    "yes"
                                                        ? "#F3EBDD"
                                                        : "#FFF",
                                                color: "#4A3A2F",
                                            }}
                                        >
                                            {t.panelCapacityYes}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPanelCapacityAnswer("more");
                                                setPanelGuests(
                                                    PANEL_INCLUDED_GUESTS,
                                                );
                                                includePanelExtra();
                                            }}
                                            className="rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors"
                                            style={{
                                                borderColor:
                                                    panelCapacityAnswer ===
                                                    "more"
                                                        ? "#7A5F45"
                                                        : "#DCCFC0",
                                                background:
                                                    panelCapacityAnswer ===
                                                    "more"
                                                        ? "#F3EBDD"
                                                        : "#FFF",
                                                color: "#4A3A2F",
                                            }}
                                        >
                                            {t.panelCapacityMore}
                                        </button>
                                    </div>

                                    {panelCapacityAnswer === "more" ? (
                                        <div className="mt-3 grid grid-cols-1 gap-2">
                                            {PANEL_GUEST_PRESETS.map(
                                                (guestCount) => {
                                                    const selected =
                                                        panelSelected &&
                                                        clampedPanelGuests ===
                                                            guestCount;
                                                    const tierPrice =
                                                        pickPanelTierPrice(
                                                            guestCount,
                                                            currency,
                                                        );
                                                    const priceLabel =
                                                        guestCount ===
                                                        PANEL_INCLUDED_GUESTS
                                                            ? panelIncludedByPlan
                                                                ? t.included
                                                                : formatLandingMoney(
                                                                      tierPrice,
                                                                      currency,
                                                                  )
                                                            : `+ ${formatLandingMoney(
                                                                  Math.max(
                                                                      0,
                                                                      tierPrice -
                                                                          panelBaseTierPrice,
                                                                  ),
                                                                  currency,
                                                              )}`;
                                                    return (
                                                        <button
                                                            key={guestCount}
                                                            type="button"
                                                            onClick={() => {
                                                                setPanelGuests(
                                                                    guestCount,
                                                                );
                                                                includePanelExtra();
                                                            }}
                                                            className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors"
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
                                                            <span className="text-sm font-semibold">
                                                                {uiLang === "en"
                                                                    ? `Up to ${guestCount}`
                                                                    : configuradorEs.panelUi.hastaPreset.replace(
                                                                          /\{\{n\}\}/g,
                                                                          String(
                                                                              guestCount,
                                                                          ),
                                                                      )}
                                                            </span>
                                                            <span className="text-sm font-semibold tabular-nums text-[#7A5F45]">
                                                                {priceLabel}
                                                            </span>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    ) : null}

                                    {panelSelected &&
                                    (panelCapacityAnswer === "yes" ||
                                        panelCapacityAnswer === "more") ? (
                                        <p className="mt-3 rounded-lg bg-[#F3EBDD] px-3 py-2 text-sm font-bold text-[#4A3A2F]">
                                            {panelCost <= 0
                                                ? t.panelIncludedInPlan
                                                : uiLang === "en"
                                                  ? `Panel total: ${formatLandingMoney(panelCost, currency)}`
                                                  : configuradorEs.panelUi.panelTotal.replace(
                                                        /\{\{total\}\}/g,
                                                        formatLandingMoney(
                                                            panelCost,
                                                            currency,
                                                        ),
                                                    )}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
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
                                const showSecondLangPricePill =
                                    on && SECOND_LANGUAGE_PRICE[currency] > 0;
                                return (
                                    <div
                                        key={lang}
                                        className="relative min-w-0"
                                    >
                                        {showSecondLangPricePill ? (
                                            <span
                                                className={LINE_BADGE_CLASS}
                                                style={LINE_BADGE_BORDER}
                                            >
                                                +
                                                {formatLandingMoney(
                                                    SECOND_LANGUAGE_PRICE[
                                                        currency
                                                    ],
                                                    currency,
                                                )}
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
                            {`${t.secondLangPremiumPrefix} +${formatLandingMoney(SECOND_LANGUAGE_PRICE[currency], currency)}`}
                        </p>
                    </>
                ) : null}

                {step === "extras" || step === "extras2" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {extrasStepTitle}
                        </h2>
                        <div className="mt-4 space-y-4 pt-1">
                            {extrasToRender.map((ex) => {
                                const on = extras.includes(ex.id);
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
                                                {formatLandingMoney(
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
                                                    <span className="block text-sm font-semibold leading-tight text-[#4A3A2F]">
                                                        {ex.label}
                                                    </span>
                                                    <span className="block text-xs leading-tight text-[#6A5C52]">
                                                        {ex.subtitle}
                                                    </span>
                                                </span>
                                                {!on && !locked ? (
                                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[#7A5F45]">
                                                        +
                                                        {formatLandingMoney(
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

                {step === "briefing" ? (
                    <>
                        <h2
                            className="text-3xl font-normal"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {t.briefingTitle}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#6A5C52]">
                            {t.briefingLead}
                        </p>
                        <label className="mt-4 block">
                            <textarea
                                value={designBrief}
                                onChange={(e) => setDesignBrief(e.target.value)}
                                placeholder={t.briefingPlaceholder}
                                rows={7}
                                className="w-full rounded-2xl border px-3 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-[#7A5F45]"
                                style={{
                                    borderColor: "#DCCFC0",
                                    background: "#FFF",
                                }}
                            />
                        </label>
                        <p className="mt-2 text-xs text-[#7A6A5D]">
                            {t.briefingHint}
                        </p>
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
                            {couponsEnabled ? (
                                <div className="mt-4 border-t border-[#E8DFD4] pt-4">
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                        {t.couponLabel}
                                    </span>
                                    <p className="mb-2 text-[11px] leading-snug text-[#7A6A5D]">
                                        {t.couponHint}
                                    </p>
                                    {appliedCoupon ? (
                                        <>
                                            <div className="flex gap-2">
                                                <input
                                                    value={appliedCoupon.code}
                                                    readOnly
                                                    tabIndex={-1}
                                                    className="min-w-0 flex-1 cursor-default rounded-xl border px-3 py-3 text-sm outline-none"
                                                    style={{
                                                        borderColor: "#B7D9C0",
                                                        background: "#F1F8F2",
                                                        color: "#6A8A72",
                                                        opacity: 0.85,
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAppliedCoupon(null);
                                                        setCouponError(null);
                                                        setCouponInput("");
                                                    }}
                                                    className="shrink-0 rounded-xl border border-[#B7D9C0] bg-[#F1F8F2] px-3.5 py-3 text-sm font-semibold text-[#3F7A4F]"
                                                >
                                                    {t.couponRemove}
                                                </button>
                                            </div>
                                            <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#2F6B3A]">
                                                <Check
                                                    size={16}
                                                    strokeWidth={2.5}
                                                    className="shrink-0 text-[#2F6B3A]"
                                                    aria-hidden
                                                />
                                                {t.couponApplied.replace(
                                                    /\{\{pct\}\}/g,
                                                    String(
                                                        appliedCoupon.discountPercent,
                                                    ),
                                                )}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                value={couponInput}
                                                onChange={(e) => {
                                                    setCouponInput(
                                                        e.target.value,
                                                    );
                                                    if (
                                                        couponError &&
                                                        !couponLocked
                                                    )
                                                        setCouponError(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        void handleApplyCoupon();
                                                    }
                                                }}
                                                placeholder=""
                                                autoCapitalize="characters"
                                                autoCorrect="off"
                                                spellCheck={false}
                                                disabled={couponLocked}
                                                className="min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45] disabled:opacity-55"
                                                style={{
                                                    borderColor: couponError
                                                        ? "#C86C6C"
                                                        : "#DCCFC0",
                                                    background: "#FFF",
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleApplyCoupon()
                                                }
                                                disabled={
                                                    couponBusy ||
                                                    couponLocked ||
                                                    !couponInput.trim()
                                                }
                                                className="shrink-0 rounded-xl bg-[#7A5F45] px-3.5 py-3 text-sm font-semibold text-white disabled:opacity-45"
                                            >
                                                {couponBusy
                                                    ? t.couponApplying
                                                    : t.couponApply}
                                            </button>
                                        </div>
                                    )}
                                    {couponError ? (
                                        couponLocked ? (
                                            <p className="mt-1.5 text-[11px] leading-snug text-[#B85C5C]">
                                                {t.couponLocked}{" "}
                                                <a
                                                    href={WhatsAppHref(
                                                        waNumber,
                                                        uiLang === "en"
                                                            ? "Hi! I have a problem with a coupon in the configurator."
                                                            : "Hola! Tengo un problema con un cupón en el configurador.",
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-[#B85C5C] no-underline"
                                                >
                                                    {t.couponLockedContact}
                                                </a>
                                            </p>
                                        ) : (
                                            <span className="mt-1.5 block text-[11px] text-[#B85C5C]">
                                                {couponError}
                                            </span>
                                        )
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </>
                ) : null}
            </section>

            <footer
                className={`fixed inset-x-0 bottom-0 z-30 border-t bg-[#FDFBF7]/98 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur ${PAGE_GUTTER}`}
            >
                <div className="mx-auto max-w-3xl">
                    <div className="mb-1 flex items-center justify-between gap-3">
                        <p
                            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A6A5D]"
                            title={
                                uiLang === "en"
                                    ? "Currency was set on the landing page."
                                    : "La moneda la elegiste en la landing."
                            }
                        >
                            {t.currency}: {currency}
                        </p>
                        <p
                            className={`text-right text-base font-bold sm:text-[17px] ${
                                appliedCoupon
                                    ? "inline-flex items-baseline justify-end gap-1.5"
                                    : ""
                            }`}
                        >
                            {appliedCoupon ? (
                                <>
                                    <span className="text-sm font-medium text-[#9A8A7A] line-through">
                                        {formatLandingMoney(total, currency)}
                                    </span>
                                    <span>
                                        <span className="text-[#4A3729]">
                                            {t.total}:{" "}
                                        </span>
                                        <span
                                            className="font-bold"
                                            style={{ color: "#5B9A6A" }}
                                        >
                                            {formatLandingMoney(
                                                discountedTotal,
                                                currency,
                                            )}
                                        </span>
                                    </span>
                                </>
                            ) : (
                                <span className="text-[#4A3729]">
                                    {t.total}:{" "}
                                    {formatLandingMoney(total, currency)}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() =>
                                setStepIdx((s) => Math.max(0, s - 1))
                            }
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#6A5C52]"
                            disabled={stepIdx === 0}
                            style={{ opacity: stepIdx === 0 ? 0.45 : 1 }}
                        >
                            <ChevronLeft size={14} />
                            {t.back}
                        </button>
                        {!isLastStep ? (
                            <button
                                type="button"
                                onClick={handleFooterNextClick}
                                disabled={!canContinue}
                                className="inline-flex items-center gap-0.5 rounded-full bg-[#7A5F45] pl-4 pr-2 py-1.5 text-sm font-semibold text-white disabled:opacity-45"
                            >
                                {t.next} <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void handleSenar()}
                                disabled={!canContinue || redeemBusy}
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
                                    setPanelChoice("include");
                                    setPanelCapacityAnswer("yes");
                                    setPanelGuests(PANEL_INCLUDED_GUESTS);
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

            {sectionInfoDetail ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="section-info-modal-title"
                    className="animate-modal-backdrop-in fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
                    onClick={() => {
                        setSectionInfoId(null);
                        setRsvpWithoutInfoOpen(false);
                    }}
                >
                    <div
                        className="animate-modal-content-in max-h-[min(92dvh,880px)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E7DFD4] bg-[#FDFBF7] p-5 shadow-xl sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="section-info-modal-title"
                            className="text-center text-xl font-normal leading-snug text-[#4A3A2F]"
                            style={{
                                fontFamily:
                                    "var(--font-landing-hero), Georgia, serif",
                            }}
                        >
                            {sectionInfoId === "historia"
                                ? getBaseSectionLabel(
                                      "historia",
                                      uiLang === "en",
                                  )
                                : sectionInfoDetail.title}
                        </h2>
                        {sectionInfoId &&
                        SECTION_INFO_MEDIA[sectionInfoId]?.length ? (
                            <div className="mt-4 space-y-3">
                                {SECTION_INFO_MEDIA[sectionInfoId].map(
                                    (media, idx) => (
                                        <div
                                            key={`${media.kind}-${media.src}-${idx}`}
                                            className="mx-auto max-w-[20rem] select-none overflow-hidden rounded-xl border border-[#E1D7C9] [-webkit-touch-callout:none]"
                                            onContextMenu={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            {media.kind === "video" ? (
                                                <video
                                                    ref={
                                                        idx === 0
                                                            ? sectionInfoVideoRef
                                                            : undefined
                                                    }
                                                    src={media.src}
                                                    className="pointer-events-none block h-auto w-full select-none [-webkit-touch-callout:none]"
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    disablePictureInPicture
                                                    controls={false}
                                                    controlsList="nodownload nofullscreen noremoteplayback"
                                                    disableRemotePlayback
                                                    preload="metadata"
                                                    draggable={false}
                                                    onContextMenu={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    aria-label={
                                                        uiLang === "en"
                                                            ? media.altEn
                                                            : media.altEs
                                                    }
                                                />
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={media.src}
                                                    alt={
                                                        uiLang === "en"
                                                            ? media.altEn
                                                            : media.altEs
                                                    }
                                                    className="pointer-events-none block h-auto w-full select-none [-webkit-touch-callout:none]"
                                                    decoding="async"
                                                    draggable={false}
                                                    onContextMenu={(e) =>
                                                        e.preventDefault()
                                                    }
                                                />
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : null}
                        <p className="mt-3 text-sm leading-relaxed text-[#6A5C52]">
                            {renderTextWithBoldMarkers(sectionInfoDetail.body)}
                        </p>
                        {sectionInfoId === "dietas" ? (
                            <div className="mt-4 rounded-2xl border border-[#E7DFD4] bg-[#FCF8F2] p-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRsvpWithoutInfoOpen((prev) => !prev)
                                    }
                                    className="inline-flex w-full max-w-full items-center gap-1.5 text-left text-sm font-medium text-[#7A5F45]"
                                    aria-expanded={rsvpWithoutInfoOpen}
                                >
                                    <span className="min-w-0 flex-1">
                                        {t.rsvpWithoutTitle}
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 transition-transform duration-200 ${
                                            rsvpWithoutInfoOpen
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                        aria-hidden
                                    />
                                </button>
                                {rsvpWithoutInfoOpen ? (
                                    <div className="mt-3 space-y-3">
                                        <p className="text-sm leading-relaxed text-[#6A5C52]">
                                            {t.rsvpWithoutLead}
                                        </p>
                                        <div
                                            className="mx-auto select-none overflow-hidden rounded-lg [-webkit-touch-callout:none]"
                                            style={{
                                                width: "min(100%, 280px)",
                                                border: "1px solid #E1D7C9",
                                                boxShadow:
                                                    "0 1px 2px rgba(63, 51, 43, 0.06)",
                                            }}
                                            onContextMenu={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={RSVP_WITHOUT_IMAGE.src}
                                                alt={
                                                    uiLang === "en"
                                                        ? RSVP_WITHOUT_IMAGE.altEn
                                                        : RSVP_WITHOUT_IMAGE.altEs
                                                }
                                                className="pointer-events-none block h-auto w-full select-none [-webkit-touch-callout:none]"
                                                decoding="async"
                                                draggable={false}
                                                onContextMenu={(e) =>
                                                    e.preventDefault()
                                                }
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => {
                                setSectionInfoId(null);
                                setRsvpWithoutInfoOpen(false);
                            }}
                            className="mt-5 w-full rounded-full bg-[#7A5F45] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                        >
                            {t.seccionInfoClose}
                        </button>
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
