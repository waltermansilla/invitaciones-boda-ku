"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
    ChevronDown,
    ChevronRight,
    CircleAlert,
    Trash2,
    CircleCheckBig,
} from "lucide-react";
import landingHomeData from "@/data/landing-2.json";

type EventType =
    | "boda"
    | "xv"
    | "cumpleanos"
    | "baby-shower"
    | "corporativo"
    | "otro"
    | "";

type CustomSection = { id: string; label: string };
type StepDefinition = { id: string; title: string };
type EventItem = { name: string; hour: string; address: string; maps: string };
type AliasItem = { alias: string; owner: string; bank: string; cbu: string };
type CardPrice = { amount: string; note: string };
type StoryStep = { title: string; message: string };
type TriviaItem = {
    question: string;
    options: string[];
    correctIndex: number | null;
    /** Texto tipo reveal de Anto & Walter (boda) o explicación post-respuesta (XV); opcional. */
    description: string;
    /** Panel desplegable para editar la descripción (no se persiste en borrador si no querés). */
    descriptionOpen?: boolean;
};
type FaqItem = { question: string; answer: string };
type StayItem = { place: string; maps: string };

const SECTION_LABELS: Record<string, string> = {
    mapa: "Mapa y como llegar",
    dress: "Dress code",
    itinerario: "Itinerario",
    regalos: "Regalos / Alias",
    tarjeta: "Valor tarjeta",
    album: "Album Drive fotos",
    musica: "Musica de fondo",
    playlist: "Playlist Spotify",
    historia: "Nuestra historia",
    trivia: "Trivia interactiva",
    fotos10: "Fotos (te compartimos album por chat)",
    faq: "Preguntas frecuentes",
    alojamiento: "Alojamientos",
    adultos: "Ninos y cuidados",
};

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

const CODE_TO_EVENT_TYPE: Record<string, EventType> = {
    b: "boda",
    x: "xv",
    c: "cumpleanos",
    y: "baby-shower",
    p: "corporativo",
    o: "otro",
    n: "",
};

const STEP_HELP_TEXT: Record<string, string> = {
    base: "Completa los datos principales tal como queres que aparezcan en la invitacion.",
    eventos:
        "Agrega los eventos con horario y direccion. Si activaste la seccion 'Mapa: cómo llegar' podes agregar el link de Google Maps para que tus invitados sepan cómo llegar.",
    dress: "Define el estilo de vestimenta para orientar a tus invitados.",
    itinerario:
        "Detalla el orden o cronograma del evento para que los invitados sepan como sera la noche.",
    regalos:
        "Carga alias y datos de transferencia. Solo alias es obligatorio; el resto es opcional.",
    tarjeta:
        "Agrega los valores sugeridos de tarjeta y, si queres, una aclaracion opcional.",
    album:
        "Pega el link de tu carpeta de Drive para que tus invitados puedan subir fotos.",
    musica:
        "Indica la cancion o link que queres usar como musica de fondo en la invitacion.",
    playlist:
        "Comparte la playlist colaborativa para que tus invitados agreguen canciones para el DJ.",
    historia:
        "Contanos una version breve de tu historia y nosotros te la armamos de forma emotiva. Si queres armarlo vos a tu manera, tocá 'Quiero detallar cada paso'.",
    trivia:
        "Crea al menos 3 preguntas con respuestas y marca la correcta en cada una. Maximo 5 preguntas.",
    faq: "Escribe preguntas frecuentes con su respuesta para evitar dudas repetidas.",
    alojamiento:
        "Comparte hasta 5 opciones de alojamiento para invitados que viajan desde otra ciudad.",
    adultos:
        "Aclara si hay politicas sobre ninos, cuidados o modalidad del evento.",
    resumen:
        "Revisa el estado de cada paso: verde completo, rojo pendiente. Solo cuando todo este en verde se habilita enviar.",
};

/** Mismos fondos que los circulos Check / X de la tabla "Ventajas que solo tiene lo digital" (theme.comparativa). */
const STEP_PILL_DONE_BG = "#E8F5E9";
const STEP_PILL_DONE_FG = "#1B5E20";
const STEP_PILL_TODO_BG = "#FFEBEE";
const STEP_PILL_TODO_FG = "#B71C1C";

/** Placeholders trivia boda (2 opciones) — mismos textos que `data/clientes/boda/anto-walter.json` truths. */
const TRIVIA_PLACEHOLDERS_BODA: { question: string; options: [string, string] }[] =
    [
        {
            question: "Quien dijo 'te amo' primero?",
            options: ["Anto", "Walter"],
        },
        {
            question:
                "Cual es nuestra comida favorita para acompañar con una peli?",
            options: ["Milanesas", "Pizza"],
        },
        {
            question: "Quién tarda mas en arreglarse?",
            options: ["Anto", "Walter"],
        },
        {
            question: "Cuál es la canción que identifica su historia de amor?",
            options: [
                "Universo Paralelo - Nahuel Pennisi",
                "Para Siempre - Benjamín Amadeo",
            ],
        },
        {
            question: "Quien cocina mejor?",
            options: ["Anto", "Walter"],
        },
        {
            question: "Quien maneja en los viajes largos?",
            options: ["Anto", "Walter"],
        },
    ];

/** Placeholders trivia 4 opciones — mismos textos que `data/clientes/xv/dasha.json` (XV y resto de tipos). */
const TRIVIA_PLACEHOLDERS_XV: {
    question: string;
    options: [string, string, string, string];
}[] = [
    {
        question: "¿Cuál es mi color favorito?",
        options: ["Rosa", "Turquesa", "Azul", "Violeta"],
    },
    {
        question: "¿Qué comida me gusta más?",
        options: ["Pizza", "Sushi", "Hamburguesa", "Pasta"],
    },
    {
        question: "¿De qué color es el vestido de mis XV?",
        options: ["Champagne", "Rosa", "Violeta", "Azul"],
    },
    {
        question: "¿Qué es más probable que haga en la fiesta?",
        options: [
            "Bailar toda la noche",
            "Comer todo el candy bar",
            "Sacarme mil fotos",
            "Todo lo anterior",
        ],
    },
    {
        question: "¿Qué me gusta hacer más?",
        options: [
            "Escuchar música",
            "Salir con amigos",
            "Ver series",
            "Dormir",
        ],
    },
];

/** revealText de `anto-walter.json` truths (mismo orden que las preguntas placeholder). */
const TRIVIA_DESCRIPTION_PLACEHOLDERS_BODA: string[] = [
    "Anto no pudo aguantar más y se lo dijo sólo unos días después de contarse lo que sentían. Walter se reía porque sentía que era demasiado pronto.",
    "Milanesas. Aunque si hay cervecita o vino tinto, cualquier cosa les viene bien.",
    "Walter. Tarda 80 años, se toma todo su tiempo. ¡Y que no lo atrase el remolino del cabello!",
    "Universo Paralelo. Refleja lo que sentían el uno por el otro cuando eran amigos.",
    "Walter una vez quemo agua hirviendo. No pregunten como, pero paso. (Se le derritio la pava)",
    "Walter maneja y Anto va de DJ, copiloto y encargada de snacks. Un equipo imbatible.",
];

/** Estilo reveal para modal trivia (XV); Dasha tiene explanation vacío en JSON. */
const TRIVIA_DESCRIPTION_PLACEHOLDERS_XV: string[] = [
    "Ej: Siempre voy de turquesa: accesorios, uñas y detalles con ese tono.",
    "Ej: Me encanta compartir sushi los viernes con mis amigas.",
    "Ej: Elegí champagne para que combine con las luces del salón.",
    "Ej: En mis XV quiero bailar desde la entrada hasta el final.",
    "Ej: Amo salir con amigos y sumar planes espontáneos.",
];

function triviaQuestionPlaceholder(
    eventType: EventType,
    questionIndex: number,
): string {
    if (eventType === "boda") {
        return (
            TRIVIA_PLACEHOLDERS_BODA[
                questionIndex % TRIVIA_PLACEHOLDERS_BODA.length
            ]?.question ?? "Escribi tu pregunta"
        );
    }
    return (
        TRIVIA_PLACEHOLDERS_XV[questionIndex % TRIVIA_PLACEHOLDERS_XV.length]
            ?.question ?? "Escribi tu pregunta"
    );
}

function triviaOptionPlaceholder(
    eventType: EventType,
    questionIndex: number,
    optionIndex: number,
): string {
    if (eventType === "boda") {
        const row =
            TRIVIA_PLACEHOLDERS_BODA[
                questionIndex % TRIVIA_PLACEHOLDERS_BODA.length
            ];
        return (
            row?.options[optionIndex] ?? `Opción ${optionIndex + 1}`
        );
    }
    const row =
        TRIVIA_PLACEHOLDERS_XV[
            questionIndex % TRIVIA_PLACEHOLDERS_XV.length
        ];
    return row?.options[optionIndex] ?? `Opción ${optionIndex + 1}`;
}

function triviaDescriptionPlaceholder(
    eventType: EventType,
    questionIndex: number,
): string {
    if (eventType === "boda") {
        return (
            TRIVIA_DESCRIPTION_PLACEHOLDERS_BODA[
                questionIndex % TRIVIA_DESCRIPTION_PLACEHOLDERS_BODA.length
            ] ?? "Texto que se muestra al elegir la respuesta correcta."
        );
    }
    return (
        TRIVIA_DESCRIPTION_PLACEHOLDERS_XV[
            questionIndex % TRIVIA_DESCRIPTION_PLACEHOLDERS_XV.length
        ] ?? "Texto que se muestra al responder (opcional)."
    );
}

function isTriviaQuestionCardComplete(
    item: TriviaItem,
    optCount: number,
): boolean {
    if (!item.question.trim()) return false;
    const opts = Array.from({ length: optCount }, (_, i) => item.options[i] || "");
    if (!opts.every((o) => o.trim().length > 0)) return false;
    if (item.correctIndex === null) return false;
    return true;
}

function normalizeTriviaItem(
    raw: Partial<TriviaItem> & { options?: string[] },
    optCount: number,
): TriviaItem {
    const description =
        typeof raw.description === "string" ? raw.description : "";
    return {
        question: typeof raw.question === "string" ? raw.question : "",
        options: Array.from({ length: optCount }, (_, i) =>
            Array.isArray(raw.options) ? raw.options[i] ?? "" : "",
        ),
        correctIndex:
            raw.correctIndex === null || typeof raw.correctIndex === "number"
                ? raw.correctIndex
                : null,
        description,
        descriptionOpen:
            Boolean(raw.descriptionOpen) || description.trim().length > 0,
    };
}

function eventRowHasContent(e: EventItem): boolean {
    return (
        e.name.trim().length > 0 ||
        e.hour.trim().length > 0 ||
        e.address.trim().length > 0 ||
        e.maps.trim().length > 0
    );
}

function aliasRowHasContent(a: AliasItem): boolean {
    return [a.alias, a.owner, a.bank, a.cbu].some((s) => s.trim().length > 0);
}

function cardPriceHasContent(c: CardPrice): boolean {
    return c.amount.trim().length > 0 || c.note.trim().length > 0;
}

function storyStepHasContent(s: StoryStep): boolean {
    return s.title.trim().length > 0 || s.message.trim().length > 0;
}

function triviaItemHasContent(t: TriviaItem): boolean {
    if (t.question.trim().length > 0) return true;
    if (t.correctIndex !== null) return true;
    return t.options.some((o) => o.trim().length > 0);
}

function faqRowHasContent(f: FaqItem): boolean {
    return f.question.trim().length > 0 || f.answer.trim().length > 0;
}

function stayRowHasContent(s: StayItem): boolean {
    return s.place.trim().length > 0 || s.maps.trim().length > 0;
}

function pruneTriviaItems(prev: TriviaItem[], optCount: number): TriviaItem[] {
    const kept = prev.filter(triviaItemHasContent);
    let out = kept;
    while (out.length < 3) {
        out = [
            ...out,
            {
                question: "",
                options: Array.from({ length: optCount }, () => ""),
                correctIndex: null,
                description: "",
                descriptionOpen: false,
            },
        ];
    }
    return out.map((t) => ({
        question: t.question,
        correctIndex: t.correctIndex,
        options: Array.from({ length: optCount }, (_, i) => t.options[i] ?? ""),
        description:
            typeof t.description === "string" ? t.description : "",
        descriptionOpen: false,
    }));
}

function parseCustomSections(raw: string | null): CustomSection[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (item) =>
                    item &&
                    typeof item.id === "string" &&
                    typeof item.label === "string",
            )
            .map((item) => ({ id: item.id, label: item.label }));
    } catch {
        return [];
    }
}

function fromBase64Url(value: string) {
    try {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(
            normalized.length + ((4 - (normalized.length % 4)) % 4),
            "=",
        );
        const binary =
            typeof window !== "undefined"
                ? window.atob(padded)
                : Buffer.from(padded, "base64").toString("binary");
        const encoded = Array.from(binary)
            .map((char) =>
                `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
            )
            .join("");
        return decodeURIComponent(encoded);
    } catch {
        return "";
    }
}

function waHref(number: string, message: string) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-[#DCCFC0] bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
            />
        </label>
    );
}

function Textarea({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                {label}
            </span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full rounded-xl border border-[#DCCFC0] bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
            />
        </label>
    );
}

export default function DetallesPage() {
    const routeParams = useParams<{ id: string }>();
    const search = useSearchParams();
    const rawRouteId = routeParams?.id ?? "";
    const [realId, ...tokenParts] = rawRouteId.split(".");
    const encodedConfig = tokenParts.join(".");
    const decodedConfig = useMemo(() => {
        if (!encodedConfig) return null;

        if (encodedConfig.startsWith("v1.")) {
            const [, eventCode, eventOtherCode, maskCode, customCode] =
                encodedConfig.split(".");
            const mask = Number.parseInt(maskCode || "0", 36);
            const sections = DETAILS_SECTION_ORDER.filter(
                (_, idx) => (mask & (1 << idx)) !== 0,
            );
            let customLabels: string[] = [];
            if (customCode && customCode !== "-") {
                try {
                    const decodedCustom = JSON.parse(fromBase64Url(customCode));
                    if (Array.isArray(decodedCustom)) {
                        customLabels = decodedCustom.filter(
                            (item) => typeof item === "string" && item.trim(),
                        );
                    }
                } catch {
                    customLabels = [];
                }
            }
            const customSections = customLabels.map((label, idx) => ({
                id: `otro-${idx + 1}`,
                label,
            }));
            return {
                eventType: CODE_TO_EVENT_TYPE[eventCode] ?? "",
                eventOther:
                    eventOtherCode && eventOtherCode !== "-"
                        ? fromBase64Url(eventOtherCode)
                        : "",
                sections: [...sections, ...customSections.map((item) => item.id)],
                customSections,
            };
        }

        const decodedText = fromBase64Url(encodedConfig);
        if (!decodedText) return null;
        try {
            return JSON.parse(decodedText) as {
                eventType?: EventType;
                eventOther?: string;
                sections?: string[];
                customSections?: CustomSection[];
                eventDate?: string;
                name1?: string;
                name2?: string;
            };
        } catch {
            return null;
        }
    }, [encodedConfig]);

    const eventType =
        decodedConfig?.eventType ?? ((search.get("eventType") as EventType) || "");
    const eventOther = decodedConfig?.eventOther ?? search.get("eventOther") ?? "";
    const sectionIds = (
        decodedConfig?.sections?.join(",") ??
        search.get("sections") ??
        ""
    )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    const customSections =
        decodedConfig?.customSections ?? parseCustomSections(search.get("customSections"));
    const eventDatePreset = decodedConfig?.eventDate ?? search.get("eventDate") ?? "";
    const name1Preset = decodedConfig?.name1 ?? search.get("name1") ?? "";
    const name2Preset = decodedConfig?.name2 ?? search.get("name2") ?? "";
    const detailsId = realId || rawRouteId;
    const waNumber = landingHomeData.whatsapp.number;

    const hasMapSection = sectionIds.includes("mapa");
    const hasFotos10Section = sectionIds.includes("fotos10");
    const initialTriviaOptionsCount = eventType === "boda" ? 2 : 4;
    const sectionSteps = useMemo<StepDefinition[]>(() => {
        const filtered = sectionIds.filter((id) => id !== "fotos10" && id !== "mapa");
        return filtered.map((id) => ({
            id,
            title:
                customSections.find((item) => item.id === id)?.label ??
                SECTION_LABELS[id] ??
                id,
        }));
    }, [customSections, sectionIds]);

    const steps: StepDefinition[] = useMemo(() => {
        return [
            { id: "base", title: "Datos principales" },
            { id: "eventos", title: "Eventos y horarios" },
            ...sectionSteps,
            { id: "resumen", title: "Resumen" },
        ];
    }, [sectionSteps]);

    const [stepIdx, setStepIdx] = useState(0);
    const [primaryName, setPrimaryName] = useState(name1Preset);
    const [secondaryName, setSecondaryName] = useState(name2Preset);
    const [eventDate, setEventDate] = useState(eventDatePreset);
    const [rsvpDeadline, setRsvpDeadline] = useState("");
    const [events, setEvents] = useState<EventItem[]>([
        { name: "", hour: "", address: "", maps: "" },
    ]);
    const [dressCode, setDressCode] = useState("");
    const [colorsToAvoid, setColorsToAvoid] = useState("");
    const [dressTips, setDressTips] = useState("");
    const [itinerary, setItinerary] = useState("");
    const [giftAliases, setGiftAliases] = useState<AliasItem[]>([
        { alias: "", owner: "", bank: "", cbu: "" },
    ]);
    const [giftListLink, setGiftListLink] = useState("");
    const [cardPrices, setCardPrices] = useState<CardPrice[]>([
        { amount: "", note: "" },
    ]);
    const [driveAlbumLink, setDriveAlbumLink] = useState("");
    const [musicYoutube, setMusicYoutube] = useState("");
    const [musicNotes, setMusicNotes] = useState("");
    const [spotifyPlaylist, setSpotifyPlaylist] = useState("");
    const [storyBrief, setStoryBrief] = useState("");
    const [storyDetailsOpen, setStoryDetailsOpen] = useState(false);
    const [storySteps, setStorySteps] = useState<StoryStep[]>([
        { title: "", message: "" },
    ]);
    const [triviaItems, setTriviaItems] = useState<TriviaItem[]>([
        {
            question: "",
            options: Array.from({ length: initialTriviaOptionsCount }, () => ""),
            correctIndex: null,
            description: "",
            descriptionOpen: false,
        },
        {
            question: "",
            options: Array.from({ length: initialTriviaOptionsCount }, () => ""),
            correctIndex: null,
            description: "",
            descriptionOpen: false,
        },
        {
            question: "",
            options: Array.from({ length: initialTriviaOptionsCount }, () => ""),
            correctIndex: null,
            description: "",
            descriptionOpen: false,
        },
    ]);
    const [faqItems, setFaqItems] = useState<FaqItem[]>([
        { question: "", answer: "" },
    ]);
    const [stayItems, setStayItems] = useState<StayItem[]>([
        { place: "", maps: "" },
    ]);
    const [kidsMessage, setKidsMessage] = useState("");
    const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
    const [returnToSummary, setReturnToSummary] = useState(false);
    const skipPruneOnStepChange = useRef(true);

    const activeStep = steps[stepIdx];
    const isLast = stepIdx === steps.length - 1;
    const summaryStepIdx = steps.findIndex((step) => step.id === "resumen");
    const stepsWithoutSummary = useMemo(
        () => steps.filter((step) => step.id !== "resumen"),
        [steps],
    );
    const formStepIndex =
        activeStep.id === "resumen"
            ? -1
            : stepsWithoutSummary.findIndex((s) => s.id === activeStep.id);
    /** Siempre mostrar * Campo obligatorio donde corresponda (no solo al volver del resumen). */
    const showRequiredHints = true;
    const draftStorageKey = useMemo(
        () => `detalles-draft:${detailsId}`,
        [detailsId],
    );
    const triviaOptionsCount = eventType === "boda" ? 2 : 4;
    const storyExampleHref =
        eventType === "boda"
            ? "/m/boda/anto-walter?enter=1#our-story"
            : "/m/xv/bianca?enter=1#my-story";
    const storyExampleLabel =
        eventType === "boda"
            ? "Ver muestra en Anto & Walter"
            : "Ver muestra en Bianca";
    const triviaExampleHref =
        eventType === "xv"
            ? "/m/xv/dasha?enter=1#trivia-game"
            : "/m/boda/anto-walter?enter=1#truths-game";
    const triviaExampleLabel =
        eventType === "xv"
            ? "Ver trivia real en Dasha"
            : "Ver trivia real en Anto & Walter";
    const eventNameLabel =
        eventType === "boda"
            ? "Nombre novio/a 1"
            : eventType === "xv"
              ? "Nombre de la quinceanera"
              : "Titulo o nombre principal";
    const eventSecondaryLabel =
        eventType === "boda" ? "Nombre novio/a 2" : "Subtitulo (opcional)";
    const eventNamePlaceholder =
        eventType === "boda"
            ? "Nombre como deberia figurar"
            : eventType === "xv"
              ? "Nombre como deberia figurar"
              : "Titulo o nombre como deberia figurar";
    const secondNamePlaceholder =
        eventType === "boda" ? "Nombre como deberia figurar" : "Opcional";
    const eventPlaceholder =
        eventType === "boda"
            ? "Ej: Civil, Ceremonia, Recepcion"
            : eventType === "xv"
              ? "Ej: Recepcion, entrada, fiesta"
              : "Ej: Acto principal, recepcion";
    const storyMainLabel =
        eventType === "xv" ? "Contanos brevemente tu historia" : "Contanos brevemente su historia";
    const storyMainHint =
        eventType === "xv"
            ? "Con esto armamos la seccion a tu medida."
            : "Con esto armamos la seccion a tu medida.";
    const storyPlaceholder =
        eventType === "xv"
            ? "Ej: Desde chiquita soñe este dia. Me encanta bailar, compartir con mi familia y celebrar esta etapa con mis amigos."
            : "Ej: Nos conocimos en 2019, nos hicimos amigos y con el tiempo entendimos que queriamos caminar juntos.";

    const setNote = (sectionId: string, value: string) =>
        setSectionNotes((prev) => ({ ...prev, [sectionId]: value }));

    const sectionMessageBlocks = useMemo(() => {
        return sectionSteps
            .map((section) => {
                const note = sectionNotes[section.id] || "";
                if (section.id === "mapa") {
                    const rows = events
                        .filter((item) => item.name || item.address || item.maps)
                        .map(
                            (item, idx) =>
                                `  ${idx + 1}) ${item.name || "Evento"} - ${item.address || "-"} - Maps: ${item.maps || "-"}`,
                        )
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        rows || "  - Sin lugares cargados",
                    ].join("\n");
                }
                if (section.id === "dress") {
                    return [
                        `- ${section.title}:`,
                        `  Dress code: ${dressCode || "-"}`,
                        `  Colores a evitar: ${colorsToAvoid || "-"}`,
                        `  Consejos extras: ${dressTips || "-"}`,
                    ].join("\n");
                }
                if (section.id === "itinerario") {
                    return [
                        `- ${section.title}:`,
                        `  Detalle: ${itinerary || "-"}`,
                    ].join("\n");
                }
                if (section.id === "regalos") {
                    const aliases = giftAliases
                        .filter(
                            (item) =>
                                item.alias || item.owner || item.bank || item.cbu,
                        )
                        .map(
                            (item, idx) =>
                                `  ${idx + 1}) Alias: ${item.alias || "-"} | Titular: ${item.owner || "-"} | Banco: ${item.bank || "-"} | CBU: ${item.cbu || "-"}`,
                        )
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        aliases || "  - Sin alias cargados",
                        `  Lista regalos link: ${giftListLink || "-"}`,
                        `  Nota extra: ${note || "-"}`,
                    ].join("\n");
                }
                if (section.id === "tarjeta") {
                    const values = cardPrices
                        .filter(
                            (item) =>
                                item.amount.trim() ||
                                item.note.trim(),
                        )
                        .map(
                            (item, idx) =>
                                `  ${idx + 1}) $${item.amount || "-"} (${item.note || "Sin detalle"})`,
                        )
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        values || "  - Sin valores cargados",
                        `  Nota extra: ${note || "-"}`,
                    ].join("\n");
                }
                if (section.id === "album") {
                    return [
                        `- ${section.title}:`,
                        `  Link album Drive: ${driveAlbumLink || "-"}`,
                    ].join("\n");
                }
                if (section.id === "musica") {
                    return [
                        `- ${section.title}:`,
                        `  Link o nombre cancion: ${musicYoutube || "-"}`,
                        `  Preferencias: ${musicNotes || "-"}`,
                    ].join("\n");
                }
                if (section.id === "playlist") {
                    return [
                        `- ${section.title}:`,
                        `  Spotify: ${spotifyPlaylist || "-"}`,
                    ].join("\n");
                }
                if (section.id === "historia") {
                    const values = storySteps
                        .filter((item) => item.title.trim() || item.message.trim())
                        .map(
                            (item, idx) =>
                                `  ${idx + 1}) ${item.title || "Paso"}: ${item.message || "(mensaje a criterio del disenador)"}`,
                        )
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        `  Relato breve: ${storyBrief || "-"}`,
                        values ? `  Pasos opcionales:\n${values}` : "  Pasos opcionales: -",
                    ].join("\n");
                }
                if (section.id === "trivia") {
                    const values = triviaItems
                        .filter((item) => item.question.trim())
                        .map((item, idx) => {
                            const opts = item.options
                                .map((opt, optIdx) => {
                                    const marker =
                                        item.correctIndex === optIdx ? "*" : "-";
                                    return `${marker} ${opt || "(vacia)"}`;
                                })
                                .join(" | ");
                            const desc = item.description?.trim();
                            const descLine = desc
                                ? `\n     Descripcion (al acertar): ${desc}`
                                : "";
                            return `  ${idx + 1}) ${item.question}\n     ${opts}${descLine}`;
                        })
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        values || "  - Sin preguntas cargadas",
                    ].join("\n");
                }
                if (section.id === "faq") {
                    const values = faqItems
                        .filter((item) => item.question.trim() || item.answer.trim())
                        .map(
                            (item, idx) =>
                                `  ${idx + 1}) Q: ${item.question || "-"} | A: ${item.answer || "-"}`,
                        )
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        values || "  - Sin FAQ cargadas",
                    ].join("\n");
                }
                if (section.id === "alojamiento") {
                    const values = stayItems
                        .filter((item) => item.place.trim() || item.maps.trim())
                        .map(
                            (item, idx) =>
                                `  ${idx + 1}) ${item.place || "Lugar"} - ${item.maps || "Sin link"}`,
                        )
                        .join("\n");
                    return [
                        `- ${section.title}:`,
                        values || "  - Sin alojamientos cargados",
                    ].join("\n");
                }
                if (section.id === "adultos") {
                    return [
                        `- ${section.title}:`,
                        `  Mensaje: ${kidsMessage || "-"}`,
                    ].join("\n");
                }
                if (section.id === "fotos10") {
                    return [
                        `- ${section.title}:`,
                        "  Se aclara por chat que las fotos se suben en album compartido.",
                    ].join("\n");
                }
                if (section.id === "fotos") {
                    return [
                        `- ${section.title}:`,
                        hasFotos10Section
                            ? "  Incluye hasta 10 fotos. En el chat se comparte album de Drive para subirlas."
                            : "  Incluye hasta 5 fotos. En el chat se comparte album de Drive para subirlas.",
                    ].join("\n");
                }
                return [
                    `- ${section.title}:`,
                    `  Detalle: ${note || "-"}`,
                ].join("\n");
            })
            .join("\n\n");
    }, [
        cardPrices,
        colorsToAvoid,
        dressCode,
        dressTips,
        driveAlbumLink,
        faqItems,
        events,
        giftAliases,
        giftListLink,
        storyBrief,
        storySteps,
        hasFotos10Section,
        itinerary,
        kidsMessage,
        musicNotes,
        musicYoutube,
        sectionNotes,
        sectionSteps,
        spotifyPlaylist,
        stayItems,
        triviaItems,
    ]);

    const finalMessage = [
        `Hola! Completo detalles de invitacion.`,
        `ID: ${detailsId}`,
        "",
        "Datos principales:",
        `- Tipo evento: ${eventType || "No definido"}${eventOther ? ` (${eventOther})` : ""}`,
        `- ${eventNameLabel}: ${primaryName || "-"}`,
        `- ${eventSecondaryLabel}: ${secondaryName || "-"}`,
        `- Fecha evento: ${eventDate || "-"}`,
        `- Fecha limite confirmar asistencia: ${rsvpDeadline || "-"}`,
        "- Eventos:",
        ...events.map(
            (item, idx) =>
                `  ${idx + 1}) ${item.name || "-"} | ${item.hour || "-"} | ${item.address || "-"}${hasMapSection ? ` | Maps: ${item.maps || "-"}` : ""}`,
        ),
        "",
        "Secciones:",
        sectionMessageBlocks || "- Sin secciones",
        "",
        "Fotos:",
        hasFotos10Section
            ? "- Incluye hasta 10 fotos (se comparte album de Drive por chat)."
            : "- Incluye hasta 5 fotos (se comparte album de Drive por chat).",
    ].join("\n");

    const isStepComplete = (stepId: string) => {
        if (stepId === "base") {
            const hasPrimary = primaryName.trim().length > 1;
            const hasDate = eventDate.trim().length > 0;
            const hasSecondaryIfNeeded =
                eventType === "boda" ? secondaryName.trim().length > 1 : true;
            return hasPrimary && hasDate && hasSecondaryIfNeeded;
        }
        if (stepId === "eventos") {
            return (
                events.length > 0 &&
                events.every(
                    (item) =>
                        item.name.trim() && item.hour.trim() && item.address.trim(),
                )
            );
        }
        if (stepId === "dress") return dressCode.trim().length > 0;
        if (stepId === "itinerario") return itinerary.trim().length > 0;
        if (stepId === "regalos") {
            return giftAliases.every(
                (item) => item.alias.trim().length > 0,
            );
        }
        if (stepId === "tarjeta") {
            return (
                cardPrices.length > 0 &&
                cardPrices.every((item) => item.amount.trim().length > 0)
            );
        }
        if (stepId === "album") return driveAlbumLink.trim().length > 0;
        if (stepId === "musica") return musicYoutube.trim().length > 0;
        if (stepId === "playlist") return spotifyPlaylist.trim().length > 0;
        if (stepId === "historia") return storyBrief.trim().length > 0;
        if (stepId === "trivia") {
            return (
                triviaItems.length >= 3 &&
                triviaItems.every((item) =>
                    isTriviaQuestionCardComplete(item, triviaOptionsCount),
                )
            );
        }
        if (stepId === "faq") {
            return faqItems.every(
                (item) =>
                    item.question.trim().length > 0 && item.answer.trim().length > 0,
            );
        }
        if (stepId === "alojamiento") {
            return stayItems.every(
                (item) => item.place.trim().length > 0 && item.maps.trim().length > 0,
            );
        }
        if (stepId === "adultos") return kidsMessage.trim().length > 0;
        if (stepId === "resumen") return true;
        return (sectionNotes[stepId] || "").trim().length > 0;
    };

    const checklistItems = steps
        .filter((step) => step.id !== "resumen")
        .map((step, idx) => ({
            ...step,
            idx,
            done: isStepComplete(step.id),
        }));
    const allRequiredComplete = checklistItems.every((item) => item.done);

    const clearDraftAndReset = () => {
        if (typeof window !== "undefined") {
            const confirmed = window.confirm(
                "Se van a borrar los datos cargados. Queres continuar?",
            );
            if (!confirmed) return;
            window.localStorage.removeItem(draftStorageKey);
        }
        setStepIdx(0);
        setPrimaryName(name1Preset);
        setSecondaryName(name2Preset);
        setEventDate(eventDatePreset);
        setRsvpDeadline("");
        setEvents([{ name: "", hour: "", address: "", maps: "" }]);
        setDressCode("");
        setColorsToAvoid("");
        setDressTips("");
        setItinerary("");
        setGiftAliases([{ alias: "", owner: "", bank: "", cbu: "" }]);
        setGiftListLink("");
        setCardPrices([{ amount: "", note: "" }]);
        setDriveAlbumLink("");
        setMusicYoutube("");
        setMusicNotes("");
        setSpotifyPlaylist("");
        setStoryBrief("");
        setStoryDetailsOpen(false);
        setStorySteps([{ title: "", message: "" }]);
        const emptyTriviaItem = (): TriviaItem => ({
            question: "",
            options: Array.from({ length: triviaOptionsCount }, () => ""),
            correctIndex: null,
            description: "",
            descriptionOpen: false,
        });
        setTriviaItems([
            emptyTriviaItem(),
            emptyTriviaItem(),
            emptyTriviaItem(),
        ]);
        setFaqItems([{ question: "", answer: "" }]);
        setStayItems([{ place: "", maps: "" }]);
        setKidsMessage("");
        setSectionNotes({});
        setReturnToSummary(false);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(draftStorageKey);
            if (!raw) return;
            const draft = JSON.parse(raw) as Partial<{
                stepIdx: number;
                primaryName: string;
                secondaryName: string;
                eventDate: string;
                rsvpDeadline: string;
                events: EventItem[];
                dressCode: string;
                colorsToAvoid: string;
                dressTips: string;
                itinerary: string;
                giftAliases: AliasItem[];
                giftListLink: string;
                cardPrices: CardPrice[];
                driveAlbumLink: string;
                musicYoutube: string;
                musicNotes: string;
                spotifyPlaylist: string;
                storyBrief: string;
                storyDetailsOpen: boolean;
                storySteps: StoryStep[];
                triviaItems: TriviaItem[];
                faqItems: FaqItem[];
                stayItems: StayItem[];
                kidsMessage: string;
                sectionNotes: Record<string, string>;
                returnToSummary: boolean;
            }>;

            if (typeof draft.stepIdx === "number") {
                setStepIdx(Math.max(0, Math.min(steps.length - 1, draft.stepIdx)));
            }
            if (typeof draft.primaryName === "string") setPrimaryName(draft.primaryName);
            if (typeof draft.secondaryName === "string") setSecondaryName(draft.secondaryName);
            if (typeof draft.eventDate === "string") setEventDate(draft.eventDate);
            if (typeof draft.rsvpDeadline === "string") setRsvpDeadline(draft.rsvpDeadline);
            if (Array.isArray(draft.events) && draft.events.length > 0) setEvents(draft.events);
            if (typeof draft.dressCode === "string") setDressCode(draft.dressCode);
            if (typeof draft.colorsToAvoid === "string") setColorsToAvoid(draft.colorsToAvoid);
            if (typeof draft.dressTips === "string") setDressTips(draft.dressTips);
            if (typeof draft.itinerary === "string") setItinerary(draft.itinerary);
            if (Array.isArray(draft.giftAliases) && draft.giftAliases.length > 0) {
                setGiftAliases(draft.giftAliases);
            }
            if (typeof draft.giftListLink === "string") setGiftListLink(draft.giftListLink);
            if (Array.isArray(draft.cardPrices) && draft.cardPrices.length > 0) {
                setCardPrices(draft.cardPrices);
            }
            if (typeof draft.driveAlbumLink === "string") setDriveAlbumLink(draft.driveAlbumLink);
            if (typeof draft.musicYoutube === "string") setMusicYoutube(draft.musicYoutube);
            if (typeof draft.musicNotes === "string") setMusicNotes(draft.musicNotes);
            if (typeof draft.spotifyPlaylist === "string") setSpotifyPlaylist(draft.spotifyPlaylist);
            if (typeof draft.storyBrief === "string") setStoryBrief(draft.storyBrief);
            if (typeof draft.storyDetailsOpen === "boolean") {
                setStoryDetailsOpen(draft.storyDetailsOpen);
            }
            if (Array.isArray(draft.storySteps) && draft.storySteps.length > 0) {
                setStorySteps(draft.storySteps);
            }
            if (Array.isArray(draft.triviaItems) && draft.triviaItems.length > 0) {
                const optCount = eventType === "boda" ? 2 : 4;
                setTriviaItems(
                    draft.triviaItems.map((raw) =>
                        normalizeTriviaItem(
                            raw as Partial<TriviaItem>,
                            optCount,
                        ),
                    ),
                );
            }
            if (Array.isArray(draft.faqItems) && draft.faqItems.length > 0) {
                setFaqItems(draft.faqItems);
            }
            if (Array.isArray(draft.stayItems) && draft.stayItems.length > 0) {
                setStayItems(draft.stayItems);
            }
            if (typeof draft.kidsMessage === "string") setKidsMessage(draft.kidsMessage);
            if (draft.sectionNotes && typeof draft.sectionNotes === "object") {
                setSectionNotes(draft.sectionNotes);
            }
            if (typeof draft.returnToSummary === "boolean") {
                setReturnToSummary(draft.returnToSummary);
            }
        } catch {
            // Ignore invalid cached drafts.
        }
    }, [draftStorageKey, steps.length, eventType]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [stepIdx]);

    useEffect(() => {
        if (skipPruneOnStepChange.current) {
            skipPruneOnStepChange.current = false;
            return;
        }
        setEvents((prev) => {
            const kept = prev.filter(eventRowHasContent);
            return kept.length > 0
                ? kept
                : [{ name: "", hour: "", address: "", maps: "" }];
        });
        setGiftAliases((prev) => {
            const kept = prev.filter(aliasRowHasContent);
            return kept.length > 0
                ? kept
                : [{ alias: "", owner: "", bank: "", cbu: "" }];
        });
        setCardPrices((prev) => {
            const kept = prev.filter(cardPriceHasContent);
            return kept.length > 0
                ? kept
                : [{ amount: "", note: "" }];
        });
        setStorySteps((prev) => {
            const kept = prev.filter(storyStepHasContent);
            return kept.length > 0
                ? kept
                : [{ title: "", message: "" }];
        });
        setTriviaItems((prev) => pruneTriviaItems(prev, triviaOptionsCount));
        setFaqItems((prev) => {
            const kept = prev.filter(faqRowHasContent);
            return kept.length > 0
                ? kept
                : [{ question: "", answer: "" }];
        });
        setStayItems((prev) => {
            const kept = prev.filter(stayRowHasContent);
            return kept.length > 0
                ? kept
                : [{ place: "", maps: "" }];
        });
    }, [stepIdx, triviaOptionsCount]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const draft = {
            stepIdx,
            primaryName,
            secondaryName,
            eventDate,
            rsvpDeadline,
            events,
            dressCode,
            colorsToAvoid,
            dressTips,
            itinerary,
            giftAliases,
            giftListLink,
            cardPrices,
            driveAlbumLink,
            musicYoutube,
            musicNotes,
            spotifyPlaylist,
            storyBrief,
            storyDetailsOpen,
            storySteps,
            triviaItems,
            faqItems,
            stayItems,
            kidsMessage,
            sectionNotes,
            returnToSummary,
        };
        window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    }, [
        cardPrices,
        colorsToAvoid,
        draftStorageKey,
        dressCode,
        dressTips,
        driveAlbumLink,
        eventDate,
        events,
        faqItems,
        giftAliases,
        giftListLink,
        itinerary,
        kidsMessage,
        musicNotes,
        musicYoutube,
        primaryName,
        rsvpDeadline,
        secondaryName,
        sectionNotes,
        spotifyPlaylist,
        stayItems,
        stepIdx,
        storyBrief,
        storyDetailsOpen,
        storySteps,
        triviaItems,
        returnToSummary,
    ]);

    return (
        <main className="min-h-svh overflow-x-hidden bg-[#FDFBF7] px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pb-[calc(17rem+env(safe-area-inset-bottom,0px))] text-[#3F332B]">
            <section className="mx-auto max-w-3xl pt-6">
                <p className="text-center text-xs uppercase tracking-[0.12em] text-[#7A5F45]">
                    Detalles de invitacion
                </p>
                <div
                    className="mt-2 w-screen max-w-[100vw] shrink-0"
                    style={{
                        marginLeft: "calc(50% - 50vw)",
                        marginRight: "calc(50% - 50vw)",
                    }}
                >
                    <div className="px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))]">
                        {activeStep.id !== "resumen" ? (
                            <div className="mb-4 flex justify-end sm:mb-5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReturnToSummary(false);
                                        setStepIdx(
                                            summaryStepIdx >= 0
                                                ? summaryStepIdx
                                                : steps.length - 1,
                                        );
                                    }}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#7A5F45] sm:text-base hover:text-[#5C4A3D]"
                                >
                                    Ver resumen
                                    <ChevronRight
                                        size={22}
                                        strokeWidth={2.25}
                                        className="shrink-0 opacity-90"
                                        aria-hidden
                                    />
                                </button>
                            </div>
                        ) : null}
                    <div className="flex h-5 w-full min-w-0 gap-1">
                        {stepsWithoutSummary.map((s, i) => {
                            const onSummary = activeStep.id === "resumen";
                            const isCurrent = !onSummary && formStepIndex === i;
                            const done = isStepComplete(s.id);
                            const targetIdx = steps.findIndex(
                                (step) => step.id === s.id,
                            );
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    title={s.title}
                                    aria-label={`Ir a ${s.title}`}
                                    aria-current={isCurrent ? "step" : undefined}
                                    onClick={() => {
                                        if (targetIdx >= 0) {
                                            setStepIdx(targetIdx);
                                        }
                                    }}
                                    className={[
                                        "inline-flex h-5 min-h-5 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full font-medium leading-none tracking-tight text-[10px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A5F45]",
                                        isCurrent
                                            ? "ring-2 ring-[#7A5F45] ring-offset-2 ring-offset-[#FDFBF7]"
                                            : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    style={{
                                        backgroundColor: done
                                            ? STEP_PILL_DONE_BG
                                            : STEP_PILL_TODO_BG,
                                        color: done
                                            ? STEP_PILL_DONE_FG
                                            : STEP_PILL_TODO_FG,
                                    }}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                    </div>
                </div>
                <h1
                    className="mt-2 text-2xl font-normal sm:text-[1.65rem]"
                    style={{
                        fontFamily: "var(--font-landing-hero), Georgia, serif",
                    }}
                >
                    {activeStep.title}
                </h1>
                <p className="mt-2 text-sm text-[#6A5C52]">
                    {STEP_HELP_TEXT[activeStep.id] ??
                        "Este formulario se adapta a las secciones elegidas en tu configuracion."}
                </p>

                <div className="details-form mt-5 space-y-4 rounded-2xl border border-[#DCCFC0] bg-white p-4 sm:p-5">
                    {activeStep.id === "base" ? (
                        <>
                            <Input
                                label={eventNameLabel}
                                value={primaryName}
                                onChange={setPrimaryName}
                                placeholder={eventNamePlaceholder}
                            />
                            {showRequiredHints && primaryName.trim().length <= 1 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <Input
                                label={eventSecondaryLabel}
                                value={secondaryName}
                                onChange={setSecondaryName}
                                placeholder={secondNamePlaceholder}
                            />
                            {showRequiredHints &&
                            eventType === "boda" &&
                            secondaryName.trim().length <= 1 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <Input
                                label="Fecha del evento"
                                value={eventDate}
                                onChange={setEventDate}
                                type="date"
                            />
                            {showRequiredHints && eventDate.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <Input
                                label="Fecha limite para confirmar asistencia"
                                value={rsvpDeadline}
                                onChange={setRsvpDeadline}
                                type="date"
                            />
                        </>
                    ) : null}
                    {activeStep.id === "eventos" ? (
                        <>
                            <p className="text-sm text-[#6A5C52]">
                                Agrega de 1 a 3 eventos con horario y direccion.
                            </p>
                            {events.map((item, idx) => (
                                <div
                                    key={`event-${idx}`}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3"
                                >
                                    {events.length > 1 ? (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEvents((prev) =>
                                                        prev.filter(
                                                            (_, entryIdx) =>
                                                                entryIdx !== idx,
                                                        ),
                                                    )
                                                }
                                                aria-label="Eliminar evento"
                                                title="Eliminar evento"
                                                className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                    <Input
                                        label={`Evento ${idx + 1}`}
                                        value={item.name}
                                        onChange={(value) =>
                                            setEvents((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, name: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder={eventPlaceholder}
                                    />
                                    {showRequiredHints && item.name.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    <Input
                                        label="Hora"
                                        value={item.hour}
                                        onChange={(value) =>
                                            setEvents((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, hour: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: 20:30"
                                    />
                                    {showRequiredHints && item.hour.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    <Input
                                        label="Direccion"
                                        value={item.address}
                                        onChange={(value) =>
                                            setEvents((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              address: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: Salon Paraiso, Av. Siempre Viva 123"
                                    />
                                    {showRequiredHints &&
                                    item.address.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    {hasMapSection ? (
                                        <Input
                                            label="Link Google Maps"
                                            value={item.maps}
                                            onChange={(value) =>
                                                setEvents((prev) =>
                                                    prev.map((entry, entryIdx) =>
                                                        entryIdx === idx
                                                            ? {
                                                                  ...entry,
                                                                  maps: value,
                                                              }
                                                            : entry,
                                                    ),
                                                )
                                            }
                                            placeholder="https://maps.app.goo.gl/..."
                                        />
                                    ) : null}
                                </div>
                            ))}
                            {events.length < 3 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEvents((prev) => [
                                            ...prev,
                                            {
                                                name: "",
                                                hour: "",
                                                address: "",
                                                maps: "",
                                            },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar evento
                                </button>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "dress" ? (
                        <>
                            <Input
                                label="Dress code"
                                value={dressCode}
                                onChange={setDressCode}
                                placeholder="Ej: Elegante sport"
                            />
                            {showRequiredHints && dressCode.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <Input
                                label="Colores a evitar"
                                value={colorsToAvoid}
                                onChange={setColorsToAvoid}
                                placeholder="Ej: Blanco total, color bordo"
                            />
                            <Textarea
                                label="Consejos extra para invitados (opcional)"
                                value={dressTips}
                                onChange={setDressTips}
                                placeholder="Ej: llevar abrigo liviano porque es al aire libre"
                            />
                        </>
                    ) : null}

                    {activeStep.id === "itinerario" ? (
                        <>
                            <Textarea
                                label="Itinerario del evento"
                                value={itinerary}
                                onChange={setItinerary}
                                placeholder="Ej: 20:00 recepcion, 21:00 cena..."
                            />
                        </>
                    ) : null}

                    {activeStep.id === "regalos" ? (
                        <>
                            {giftAliases.map((item, idx) => (
                                <div
                                    key={`alias-${idx}`}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3"
                                >
                                    {giftAliases.length > 1 ? (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setGiftAliases((prev) =>
                                                        prev.filter(
                                                            (_, entryIdx) =>
                                                                entryIdx !== idx,
                                                        ),
                                                    )
                                                }
                                                aria-label="Eliminar alias"
                                                title="Eliminar alias"
                                                className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                    <Input
                                        label={`Alias ${idx + 1}`}
                                        value={item.alias}
                                        onChange={(value) =>
                                            setGiftAliases((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              alias: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: tumomento.caja"
                                    />
                                    {showRequiredHints && item.alias.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    <Input
                                        label="Titular"
                                        value={item.owner}
                                        onChange={(value) =>
                                            setGiftAliases((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              owner: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: Maria Lopez"
                                    />
                                    <Input
                                        label="Banco (opcional)"
                                        value={item.bank}
                                        onChange={(value) =>
                                            setGiftAliases((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              bank: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: Banco Nacion"
                                    />
                                    <Input
                                        label="CBU (opcional)"
                                        value={item.cbu}
                                        onChange={(value) =>
                                            setGiftAliases((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, cbu: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: 0000003100000000000000"
                                    />
                                </div>
                            ))}
                            {giftAliases.length < 2 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setGiftAliases((prev) => [
                                            ...prev,
                                            {
                                                alias: "",
                                                owner: "",
                                                bank: "",
                                                cbu: "",
                                            },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar segundo alias
                                </button>
                            ) : null}
                            <Input
                                label="Link lista de regalos (opcional)"
                                value={giftListLink}
                                onChange={setGiftListLink}
                                placeholder="https://..."
                            />
                            <Textarea
                                label="Mensaje o detalle extra (opcional)"
                                value={sectionNotes.regalos || ""}
                                onChange={(value) => setNote("regalos", value)}
                                placeholder="Ej: Priorizamos transferencia, no efectivo."
                            />
                        </>
                    ) : null}

                    {activeStep.id === "tarjeta" ? (
                        <>
                            <p className="text-sm font-medium text-[#5A4A3F]">
                                Podes cargar varios valores, y detallar para
                                quien aplica.
                            </p>
                            {cardPrices.map((item, idx) => (
                                <div
                                    key={`card-${idx}`}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3 sm:grid-cols-2"
                                >
                                    {cardPrices.length > 1 ? (
                                        <div className="sm:col-span-2 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCardPrices((prev) =>
                                                        prev.filter(
                                                            (_, entryIdx) =>
                                                                entryIdx !== idx,
                                                        ),
                                                    )
                                                }
                                                aria-label="Eliminar valor"
                                                title="Eliminar valor"
                                                className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                    <Input
                                        label="Valor"
                                        value={item.amount}
                                        onChange={(value) =>
                                            setCardPrices((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, amount: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="$45000"
                                    />
                                    {showRequiredHints && item.amount.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    <Input
                                        label="Detalle (opcional)"
                                        value={item.note}
                                        onChange={(value) =>
                                            setCardPrices((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, note: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: adultos / ninos / por pareja"
                                    />
                                </div>
                            ))}
                            {cardPrices.length < 5 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCardPrices((prev) => [
                                            ...prev,
                                            { amount: "", note: "" },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar otro valor
                                </button>
                            ) : null}
                            <Textarea
                                label="Mensaje o detalle extra (opcional)"
                                value={sectionNotes.tarjeta || ""}
                                onChange={(value) => setNote("tarjeta", value)}
                                placeholder="Ej: El valor incluye cena y barra libre."
                            />
                        </>
                    ) : null}

                    {activeStep.id === "album" ? (
                        <>
                            <Input
                                label="Link de album compartido de Drive"
                                value={driveAlbumLink}
                                onChange={setDriveAlbumLink}
                                placeholder="https://drive.google.com/..."
                            />
                            {showRequiredHints &&
                            driveAlbumLink.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <div className="overflow-x-auto pb-1">
                                <div className="flex min-w-max gap-3">
                                    {[1, 2, 3].map((step) => (
                                        <article
                                            key={step}
                                            className="w-56 shrink-0 rounded-xl border border-[#E7DFD4] bg-[#FCF8F2] p-3"
                                        >
                                            <div className="relative mb-2 h-80 overflow-hidden rounded-lg border border-[#E1D7C9]">
                                                <Image
                                                    src={`/detalles-usuario/images/${step}.jpg`}
                                                    alt={`Paso ${step} para compartir Drive`}
                                                    fill
                                                    className="object-cover object-top"
                                                />
                                            </div>
                                            <p className="text-xs text-[#6A5C52]">
                                                {step === 1
                                                    ? "Abris Google Drive, tocas + y creas una carpeta."
                                                    : step === 2
                                                      ? "Dentro de la carpeta tocas los 3 puntitos y vas a administrar acceso."
                                                      : "Seleccionas 'cualquier usuario con el vinculo', copias el enlace y lo pegas aqui en el formulario."}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : null}

                    {activeStep.id === "musica" ? (
                        <>
                            <Input
                                label="Link de YouTube o nombre cancion"
                                value={musicYoutube}
                                onChange={setMusicYoutube}
                                placeholder="Ej: https://youtube.com/... o Perfect - Ed Sheeran"
                            />
                            {showRequiredHints && musicYoutube.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <Textarea
                                label="Detalle deseado (opcional)"
                                value={musicNotes}
                                onChange={setMusicNotes}
                                placeholder="Ej: que empiece en el segundo 00:35"
                            />
                        </>
                    ) : null}

                    {activeStep.id === "playlist" ? (
                        <>
                            <Input
                                label="Link de playlist colaborativa Spotify"
                                value={spotifyPlaylist}
                                onChange={setSpotifyPlaylist}
                                placeholder="https://open.spotify.com/playlist/..."
                            />
                            {showRequiredHints &&
                            spotifyPlaylist.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "historia" ? (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7DFD4] bg-[#FCF8F2] p-3">
                                <p className="text-sm text-[#6A5C52]">
                                    Si queres, podes ver un ejemplo de esta
                                    seccion antes de completar.
                                </p>
                                <a
                                    href={storyExampleHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-[#7A5F45] px-3 py-1 text-xs font-semibold text-[#5A4A3F]"
                                >
                                    {storyExampleLabel}
                                </a>
                            </div>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A5F45]">
                                    {storyMainLabel}
                                </span>
                                <span className="mb-1.5 block text-xs text-[#7A6A5D]">
                                    {storyMainHint}
                                </span>
                                <textarea
                                    value={storyBrief}
                                    onChange={(e) => setStoryBrief(e.target.value)}
                                    placeholder={storyPlaceholder}
                                    rows={4}
                                    className="w-full rounded-xl border border-[#DCCFC0] bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-[#7A5F45]"
                                />
                            </label>
                            {showRequiredHints && storyBrief.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setStoryDetailsOpen((prev) => !prev)}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#7A5F45]"
                            >
                                {storyDetailsOpen
                                    ? "Ocultar detalle de pasos"
                                    : "Quiero detallar cada paso"}
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform ${storyDetailsOpen ? "rotate-180" : ""}`}
                                />
                            </button>
                            {storyDetailsOpen
                                ? storySteps.map((item, idx) => (
                                      <div
                                          key={`story-${idx}`}
                                          className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3"
                                      >
                                          {storySteps.length > 1 ? (
                                              <div className="flex justify-end">
                                                  <button
                                                      type="button"
                                                      onClick={() =>
                                                          setStorySteps((prev) =>
                                                              prev.filter(
                                                                  (
                                                                      _,
                                                                      entryIdx,
                                                                  ) =>
                                                                      entryIdx !==
                                                                      idx,
                                                              ),
                                                          )
                                                      }
                                                      aria-label="Eliminar paso"
                                                      title="Eliminar paso"
                                                      className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                                  >
                                                      <Trash2 size={14} />
                                                  </button>
                                              </div>
                                          ) : null}
                                          <Input
                                              label={`Paso ${idx + 1} - titulo`}
                                              value={item.title}
                                              onChange={(value) =>
                                                  setStorySteps((prev) =>
                                                      prev.map((entry, entryIdx) =>
                                                          entryIdx === idx
                                                              ? {
                                                                    ...entry,
                                                                    title: value,
                                                                }
                                                              : entry,
                                                      ),
                                                  )
                                              }
                                          />
                                          <Textarea
                                              label={`Paso ${idx + 1} - mensaje`}
                                              value={item.message}
                                              onChange={(value) =>
                                                  setStorySteps((prev) =>
                                                      prev.map((entry, entryIdx) =>
                                                          entryIdx === idx
                                                              ? {
                                                                    ...entry,
                                                                    message:
                                                                        value,
                                                                }
                                                              : entry,
                                                      ),
                                                  )
                                              }
                                          />
                                      </div>
                                  ))
                                : null}
                            {storyDetailsOpen && storySteps.length < 3 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setStorySteps((prev) => [
                                            ...prev,
                                            { title: "", message: "" },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar paso opcional
                                </button>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "trivia" ? (
                        <>
                            <p className="text-sm font-medium text-[#5A4A3F]">
                                Carga preguntas, respuestas y cual es la
                                correcta.
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7DFD4] bg-[#FCF8F2] p-3">
                                <p className="text-sm text-[#6A5C52]">
                                    Si queres, mira una trivia real antes de
                                    completarla.
                                </p>
                                <a
                                    href={triviaExampleHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-[#7A5F45] px-3 py-1 text-xs font-semibold text-[#5A4A3F]"
                                >
                                    {triviaExampleLabel}
                                </a>
                            </div>
                            {triviaItems.map((item, idx) => (
                                <div
                                    key={`trivia-${idx}`}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3"
                                >
                                    {triviaItems.length > 3 ? (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTriviaItems((prev) =>
                                                        prev.filter(
                                                            (_, entryIdx) =>
                                                                entryIdx !== idx,
                                                        ),
                                                    )
                                                }
                                                aria-label="Eliminar pregunta"
                                                title="Eliminar pregunta"
                                                className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                    <Input
                                        label={`Pregunta ${idx + 1}`}
                                        value={item.question}
                                        onChange={(value) =>
                                            setTriviaItems((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              question: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder={triviaQuestionPlaceholder(
                                            eventType,
                                            idx,
                                        )}
                                    />
                                    {Array.from(
                                        { length: triviaOptionsCount },
                                        (_, optionIdx) => optionIdx,
                                    ).map((optionIdx) => (
                                        <div
                                            key={`opt-${idx}-${optionIdx}`}
                                            className="flex items-center gap-2 rounded-xl border border-[#E7DFD4] p-2"
                                        >
                                            <input
                                                value={item.options[optionIdx] || ""}
                                                onChange={(e) =>
                                                    setTriviaItems((prev) =>
                                                        prev.map(
                                                            (entry, entryIdx) => {
                                                                if (entryIdx !== idx) {
                                                                    return entry;
                                                                }
                                                                const updated = Array.from(
                                                                    {
                                                                        length: triviaOptionsCount,
                                                                    },
                                                                    (_, i) =>
                                                                        entry.options[i] || "",
                                                                );
                                                                updated[optionIdx] =
                                                                    e.target.value;
                                                                return {
                                                                    ...entry,
                                                                    options: updated,
                                                                };
                                                            },
                                                        ),
                                                    )
                                                }
                                                placeholder={triviaOptionPlaceholder(
                                                    eventType,
                                                    idx,
                                                    optionIdx,
                                                )}
                                                className="min-w-0 flex-1 rounded-lg border border-[#DCCFC0] bg-white px-3 py-2 text-sm outline-none focus:border-[#7A5F45]"
                                            />
                                            <label className="inline-flex shrink-0 items-center gap-1 self-center text-xs text-[#6A5C52]">
                                                <input
                                                    type="radio"
                                                    name={`correct-${idx}`}
                                                    checked={
                                                        item.correctIndex ===
                                                        optionIdx
                                                    }
                                                    onChange={() =>
                                                        setTriviaItems((prev) =>
                                                            prev.map(
                                                                (
                                                                    entry,
                                                                    entryIdx,
                                                                ) =>
                                                                    entryIdx ===
                                                                    idx
                                                                        ? {
                                                                              ...entry,
                                                                              correctIndex:
                                                                                  optionIdx,
                                                                          }
                                                                        : entry,
                                                            ),
                                                        )
                                                    }
                                                />
                                                Correcta
                                            </label>
                                        </div>
                                    ))}
                                    {showRequiredHints &&
                                    !isTriviaQuestionCardComplete(
                                        item,
                                        triviaOptionsCount,
                                    ) ? (
                                        <p className="text-[11px] font-semibold text-[#B71C1C]">
                                            * Campos obligatorios
                                        </p>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTriviaItems((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              descriptionOpen: !(
                                                                  entry.descriptionOpen ??
                                                                  false
                                                              ),
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#7A5F45]"
                                    >
                                        {(item.descriptionOpen ?? false)
                                            ? "Ocultar descripcion"
                                            : "Agregar descripcion"}
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform ${(item.descriptionOpen ?? false) ? "rotate-180" : ""}`}
                                            aria-hidden
                                        />
                                    </button>
                                    {(item.descriptionOpen ?? false) ? (
                                        <Textarea
                                            label="Descripcion al responder (opcional)"
                                            value={item.description}
                                            onChange={(value) =>
                                                setTriviaItems((prev) =>
                                                    prev.map((entry, entryIdx) =>
                                                        entryIdx === idx
                                                            ? {
                                                                  ...entry,
                                                                  description:
                                                                      value,
                                                              }
                                                            : entry,
                                                    ),
                                                )
                                            }
                                            placeholder={triviaDescriptionPlaceholder(
                                                eventType,
                                                idx,
                                            )}
                                        />
                                    ) : null}
                                </div>
                            ))}
                            {triviaItems.length < 5 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setTriviaItems((prev) => [
                                            ...prev,
                                            {
                                                question: "",
                                                options: Array.from(
                                                    {
                                                        length: triviaOptionsCount,
                                                    },
                                                    () => "",
                                                ),
                                                correctIndex: null,
                                                description: "",
                                                descriptionOpen: false,
                                            },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar pregunta
                                </button>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "faq" ? (
                        <>
                            {faqItems.map((item, idx) => (
                                <div
                                    key={`faq-${idx}`}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3"
                                >
                                    {faqItems.length > 1 ? (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFaqItems((prev) =>
                                                        prev.filter(
                                                            (_, entryIdx) =>
                                                                entryIdx !== idx,
                                                        ),
                                                    )
                                                }
                                                aria-label="Eliminar pregunta"
                                                title="Eliminar pregunta"
                                                className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                    <Input
                                        label={`Pregunta ${idx + 1}`}
                                        value={item.question}
                                        onChange={(value) =>
                                            setFaqItems((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              question: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: Se puede llevar acompanantes?"
                                    />
                                    {showRequiredHints &&
                                    item.question.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    <Textarea
                                        label="Respuesta"
                                        value={item.answer}
                                        onChange={(value) =>
                                            setFaqItems((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? {
                                                              ...entry,
                                                              answer: value,
                                                          }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: Si, hasta 2 acompanantes por invitado."
                                    />
                                    {showRequiredHints &&
                                    item.answer.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                            {faqItems.length < 5 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFaqItems((prev) => [
                                            ...prev,
                                            { question: "", answer: "" },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar otra pregunta
                                </button>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "alojamiento" ? (
                        <>
                            {stayItems.map((item, idx) => (
                                <div
                                    key={`stay-${idx}`}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#E7DFD4] p-3"
                                >
                                    {stayItems.length > 1 ? (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setStayItems((prev) =>
                                                        prev.filter(
                                                            (_, entryIdx) =>
                                                                entryIdx !== idx,
                                                        ),
                                                    )
                                                }
                                                aria-label="Eliminar alojamiento"
                                                title="Eliminar alojamiento"
                                                className="rounded-full border border-[#C86C6C] p-1.5 text-[#A44343]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                    <Input
                                        label={`Alojamiento ${idx + 1}`}
                                        value={item.place}
                                        onChange={(value) =>
                                            setStayItems((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, place: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="Ej: Hotel Libertador"
                                    />
                                    {showRequiredHints &&
                                    item.place.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                    <Input
                                        label="Direccion o link Google Maps"
                                        value={item.maps}
                                        onChange={(value) =>
                                            setStayItems((prev) =>
                                                prev.map((entry, entryIdx) =>
                                                    entryIdx === idx
                                                        ? { ...entry, maps: value }
                                                        : entry,
                                                ),
                                            )
                                        }
                                        placeholder="https://maps.app.goo.gl/..."
                                    />
                                    {showRequiredHints &&
                                    item.maps.trim().length === 0 ? (
                                        <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                            * Campo obligatorio
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                            {stayItems.length < 5 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setStayItems((prev) => [
                                            ...prev,
                                            { place: "", maps: "" },
                                        ])
                                    }
                                    className="rounded-full border border-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-[#5A4A3F]"
                                >
                                    Agregar alojamiento
                                </button>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "adultos" ? (
                        <>
                            <Textarea
                                label="Mensaje sobre ninos y cuidados"
                                value={kidsMessage}
                                onChange={setKidsMessage}
                                placeholder="Ej: Evento solo para adultos / Habra espacio kids"
                            />
                            {showRequiredHints && kidsMessage.trim().length === 0 ? (
                                <p className="-mt-1 text-[11px] font-semibold text-[#B71C1C]">
                                    * Campo obligatorio
                                </p>
                            ) : null}
                        </>
                    ) : null}

                    {activeStep.id === "fotos10" ? (
                        <></>
                    ) : null}
                    {activeStep.id === "resumen" ? (
                        <div className="space-y-2">
                            <p className="text-sm text-[#6A5C52]">
                                Revisa cada punto. Verde = completo. Rojo = faltan datos.
                            </p>
                            {checklistItems.length === 0 ? (
                                <p className="rounded-xl border border-[#E7DFD4] bg-white px-3 py-2 text-sm text-[#6A5C52]">
                                    Aun no hay pasos para mostrar.
                                </p>
                            ) : null}
                            {checklistItems.map((item) => (
                                <button
                                    key={`resume-${item.id}`}
                                    type="button"
                                    onClick={() => {
                                        setStepIdx(item.idx);
                                        setReturnToSummary(true);
                                    }}
                                    className="flex w-full items-center justify-between rounded-xl border border-[#E7DFD4] bg-white px-3 py-2 text-left text-sm"
                                >
                                    <span>{item.title}</span>
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs font-semibold ${item.done ? "text-[#2F7E56]" : "text-[#B71C1C]"}`}
                                    >
                                        {item.done ? (
                                            <>
                                                <CircleCheckBig size={14} /> Completo
                                            </>
                                        ) : (
                                            <>
                                                <CircleAlert size={14} /> Falta
                                            </>
                                        )}
                                    </span>
                                </button>
                            ))}
                            <p className="rounded-xl border border-[#E7DFD4] bg-[#FCF8F2] p-3 text-sm text-[#6A5C52]">
                                {hasFotos10Section
                                    ? "Fotos: esta invitacion incluye hasta 10 fotos. Te voy a compartir por chat un album de Drive para que las subas."
                                    : "Fotos: esta invitacion incluye hasta 5 fotos. Te voy a compartir por chat un album de Drive para que las subas."}
                            </p>
                        </div>
                    ) : null}

                    {!["base", "eventos", "resumen", ...Object.keys(SECTION_LABELS)].includes(activeStep.id) ? (
                        <>
                            <p className="text-sm text-[#6A5C52]">
                                Seccion personalizada: {activeStep.title}
                            </p>
                            <Textarea
                                label="Explicanos que queres incluir"
                                value={sectionNotes[activeStep.id] || ""}
                                onChange={(value) => setNote(activeStep.id, value)}
                            />
                        </>
                    ) : null}
                </div>
            </section>

            <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E4DCD1] bg-[#FDFBF7]/95 px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
                <div className="mx-auto grid max-w-3xl grid-cols-3 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setStepIdx((prev) => Math.max(0, prev - 1));
                        }}
                        className="justify-self-start text-sm font-medium text-[#6A5C52]"
                        disabled={stepIdx === 0}
                        style={{ opacity: stepIdx === 0 ? 0.45 : 1 }}
                    >
                        Atras
                    </button>
                    {activeStep.id === "resumen" ? (
                        <button
                            type="button"
                            onClick={clearDraftAndReset}
                            className="justify-self-center rounded-full border border-[#C86C6C] px-3 py-1 text-xs font-semibold text-[#A44343]"
                        >
                            Borrar datos
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setReturnToSummary(false);
                                setStepIdx(summaryStepIdx >= 0 ? summaryStepIdx : steps.length - 1);
                            }}
                            className="justify-self-center rounded-full border border-[#2F7E56] bg-[#EAF6EF] px-3 py-1 text-xs font-semibold text-[#2F7E56]"
                        >
                            Ver resumen
                        </button>
                    )}
                    {activeStep.id === "resumen" ? (
                        <button
                            type="button"
                            onClick={() =>
                                window.open(
                                    waHref(waNumber, finalMessage),
                                    "_blank",
                                    "noopener,noreferrer",
                                )
                            }
                            disabled={!allRequiredComplete}
                            className="justify-self-end rounded-full bg-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-45"
                        >
                            Enviar
                        </button>
                    ) : !isLast ? (
                        <button
                            type="button"
                            onClick={() => {
                                const next = Math.min(
                                    steps.length - 1,
                                    stepIdx + 1,
                                );
                                if (steps[next]?.id === "resumen") {
                                    setReturnToSummary(false);
                                }
                                setStepIdx(next);
                            }}
                            className="justify-self-end rounded-full bg-[#7A5F45] px-4 py-1.5 text-sm font-semibold text-white"
                        >
                            Siguiente
                        </button>
                    ) : null}
                </div>
            </footer>
        </main>
    );
}
