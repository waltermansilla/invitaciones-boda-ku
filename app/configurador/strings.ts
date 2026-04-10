import pricingData from "@/data/pricing.json";

export type ConfiguratorLang = "es" | "en";

type Price = { ARS: number; USD: number };

const USD_ARS = pricingData.usdArs;
const toPrice = (ars: number): Price => ({
    ARS: ars,
    USD: Math.ceil(ars / USD_ARS),
});

const EXTRA_SECTION_PRICE: Price = toPrice(pricingData.configurator.extraSection);
const SECOND_LANGUAGE_PRICE: Price = toPrice(
    pricingData.configurator.secondLanguage,
);

export interface ExtraOption {
    id: string;
    label: string;
    subtitle: string;
    price: Price;
}

export function getExtrasForLang(lang: ConfiguratorLang): ExtraOption[] {
    if (lang === "en") {
        return [
            {
                id: "panel",
                label: "Guest dashboard",
                subtitle: "Real-time RSVPs",
                price: toPrice(pricingData.configurator.extras.panel),
            },
            {
                id: "dominio",
                label: "Custom domain",
                subtitle: "e.g. yournames.com",
                price: toPrice(pricingData.configurator.extras.dominio),
            },
            {
                id: "rapida",
                label: "24-hour rush delivery",
                subtitle: "Top priority (standard: 3–5 business days)",
                price: toPrice(pricingData.configurator.extras.rapida24h),
            },
        ];
    }
    return [
        {
            id: "panel",
            label: "Panel de invitados",
            subtitle: "Confirmaciones en tiempo real",
            price: toPrice(pricingData.configurator.extras.panel),
        },
        {
            id: "dominio",
            label: "Dominio personalizado",
            subtitle: "Ej: meliza-ivan.com",
            price: toPrice(pricingData.configurator.extras.dominio),
        },
        {
            id: "rapida",
            label: "Entrega rápida 24hs",
            subtitle: "Prioridad máxima (normal: 3 a 5 días hábiles)",
            price: toPrice(pricingData.configurator.extras.rapida24h),
        },
    ];
}

export function getExtraDetailById(
    lang: ConfiguratorLang,
): Record<string, { title: string; summary: string; body: string }> {
    if (lang === "en") {
        return {
            panel: {
                title: "Guest dashboard",
                summary: "Automatic, end-to-end RSVP management",
                body: "With WhatsApp (included), messages arrive but you track everything manually. With the dashboard, each guest confirms and your board updates automatically: who’s in, who’s pending, filters by status, and clear totals.",
            },
            dominio: {
                title: "Custom domain",
                summary: "Your own link—cleaner and easier to share",
                body: "Instead of a long URL, you get a short, memorable domain (e.g. yournames.com). It looks more polished, is easier to remember, and is simpler to share on WhatsApp or social media.",
            },
            rapida: {
                title: "24-hour rush delivery",
                summary: "Top priority to ship in one day",
                body: "This add-on moves your invitation to the front of the queue. Standard timing is 3–5 business days; with rush delivery we prioritize to target a 24-hour turnaround.",
            },
        };
    }
    return {
        panel: {
            title: "Panel de invitados",
            summary: "Gestión automática y completa de confirmaciones",
            body: "Con WhatsApp (incluido) recibís los mensajes, pero tenés que anotar y ordenar todo a mano. Con Panel, cada invitado confirma y el tablero se actualiza solo: quién confirmó, cuántos faltan, pendientes y filtros por estado.",
        },
        dominio: {
            title: "Dominio personalizado",
            summary: "Tu link propio, más prolijo y fácil de compartir",
            body: "En lugar de un enlace largo, usás un dominio corto y memorable (ej: tusnombres.com). Da imagen más premium, se recuerda mejor y simplifica compartir por WhatsApp o redes.",
        },
        rapida: {
            title: "Entrega rápida 24hs",
            summary: "Prioridad total para tenerla lista en 1 día",
            body: "Con este extra tu invitación pasa al frente de la cola de trabajo. El tiempo habitual es de 3 a 5 días hábiles; con entrega rápida se prioriza para salir en 24hs.",
        },
    };
}

/** Section id → English label (Spanish defaults stay in page for es). */
export const SECTION_LABEL_EN: Record<string, string> = {
    mapa: "Map & directions",
    dress: "Dress code",
    itinerario: "Itinerary",
    regalos: "Gifts / payment info",
    tarjeta: "Gift amount",
    album: "Drive album (photos)",
    musica: "Music on the invite",
    playlist: "Collaborative Spotify playlist",
    historia: "Our story",
    trivia: "Interactive trivia",
    fotos10: "Up to 10 photos",
    faq: "FAQ",
    alojamiento: "Accommodations",
    adultos: "Kids & childcare notes",
    otro: "Other",
};

export { EXTRA_SECTION_PRICE, SECOND_LANGUAGE_PRICE };

/** Preset second-language options (labels match UI language). */
export const PRESET_LANGUAGES: Record<ConfiguratorLang, string[]> = {
    es: [
        "Inglés",
        "Portugués",
        "Francés",
        "Alemán",
        "Italiano",
        "Chino",
    ],
    en: [
        "English",
        "Portuguese",
        "French",
        "German",
        "Italian",
        "Chinese",
    ],
};

export function getEventLabels(lang: ConfiguratorLang): Record<
    | "boda"
    | "xv"
    | "cumpleanos"
    | "baby-shower"
    | "corporativo"
    | "otro",
    string
> {
    if (lang === "en") {
        return {
            boda: "Wedding",
            xv: "Quinceañera",
            cumpleanos: "Birthday",
            "baby-shower": "Baby shower",
            corporativo: "Corporate",
            otro: "Other",
        };
    }
    return {
        boda: "Boda",
        xv: "XV",
        cumpleanos: "Cumpleaños",
        "baby-shower": "Baby Shower",
        corporativo: "Corporativo",
        otro: "Otro",
    };
}

export function getUiStrings(lang: ConfiguratorLang) {
    if (lang === "en") {
        return {
            headerClose: "Close",
            planPremium: "Premium",
            planUnique: "Unique design",
            eventTitle: "What type of event is it?",
            eventOtherPh: "Tell us what kind of event…",
            styleTitle: "Which style do you like most?",
            styleBodyBefore: "Pick the sample that fits you best or your vision—it becomes our",
            styleBodyRef: "reference",
            styleBodyAfter:
                "to build your invitation. You’ll choose sections, languages, and add-ons in the next steps.",
            styleView: "View",
            seccionesTitle: "Invitation sections",
            incluyeTitle: "What’s included in your invitation?",
            incluyeOpen: "Tap to close",
            incluyeClosed:
                "We explain what’s already included and how blocks work.",
            incluyeP1Before: "Your invitation already includes:",
            incluyeP1Bold:
                "WhatsApp RSVP, up to 5 photos, countdown, custom colors, and custom wording",
            incluyeP1After: ". All of that is included.",
            incluyeP2Before: "In this grid you can add",
            incluyeP2Free: "4 free sections",
            incluyeP2Mid: "(dress code, more photos, story, etc.).",
            incluyeP2From5: "From the 5th block you select onward,",
            incluyeP2After: "we add",
            incluyeP2Each: "each.",
            seccionesCountFoot: "included · Extra",
            perBlock: "/block",
            sinExtras: "(no extras)",
            seccionOtroPh: "Describe the section you want to add…",
            seccionOtroAria: "Describe the section you want to add",
            idiomaTitle: "Language",
            idiomaLead:
                "Spanish is included by default. You can add a second language.",
            idiomaDefault: "Spanish (included by default)",
            noLanguage: "Don’t see your language?",
            typeLanguage: "Type it here",
            addBtn: "Add",
            secondLangUnique: "Second language included in this plan.",
            secondLangPremiumPrefix: "Second language:",
            extrasTitle: "Add-ons",
            included: "Included",
            verDetalle: "Details",
            ocultarDetalle: "Hide details",
            datosTitle: "Your details",
            datosIntro:
                "Complete this information to move forward with your booking. After we receive your message, we’ll send bank details for the deposit transfer, then we’ll coordinate every detail of your invitation over chat, step by step.",
            name1: "Name 1 *",
            name1Ph: "e.g. Maria",
            name2: "Name 2",
            name2Ph: "Optional",
            email: "Email *",
            emailPh: "you@email.com",
            emailInvalid: "Enter a valid email to continue.",
            dateLabel: "Event date *",
            datePlaceholder: "Choose your event date",
            dateAria: "Event date",
            dateHelp: "Tap the field to open the calendar and pick a date.",
            terminosTitle: "Terms & privacy",
            terminosTermsLabel: "Terms:",
            terminosTermsBody:
                "The deposit is 50% to reserve the slot and start design. The remaining 50% is due on final delivery. Timelines and revisions depend on receiving complete materials.",
            terminosPrivacyLabel: "Privacy:",
            terminosPrivacyBody:
                "We use your information only to create and manage your invitation. We do not sell data to third parties.",
            terminosCheck: "I have read and accept the Terms and Privacy Policy",
            back: "Back",
            next: "Next",
            goWhatsapp: "Open WhatsApp",
            totalDeposit: (total: string) => `Total ${total} | Deposit 50%`,
            footerNote: "The remaining 50% is due on final delivery.",
            summaryHi: (planLabel: string) =>
                `Hi! I’d like to book my invitation (${planLabel}).`,
            currency: "Currency",
            total: "Total",
            deposit50: "Deposit 50%",
            event: "Event",
            style: "Style",
            sections: "Sections",
            tbd: "TBD",
            primaryLang: "Primary language",
            spanish: "Spanish",
            secondLang: "Second language",
            none: "None",
            extrasLine: "Add-ons",
            noneExtras: "None",
            uniqueExtrasNote:
                "(dashboard included; other add-ons optional)",
            name1Line: "Name 1",
            name2Line: "Name 2",
            emailLine: "Email",
            eventDateLine: "Event date",
        };
    }
    return {
        headerClose: "Cerrar",
        planPremium: "Premium",
        planUnique: "Diseño único",
        eventTitle: "¿Qué evento es?",
        eventOtherPh: "Contanos qué evento es...",
        styleTitle: "¿Qué estilo te gusta más?",
        styleBodyBefore: "Elegí la muestra que más te represente o que mejor vaya con lo que buscás: nos queda como",
        styleBodyRef: "referencia",
        styleBodyAfter:
            "para trabajar tu invitación. Más adelante vas a definir secciones, idiomas y extras con calma.",
        styleView: "Ver",
        seccionesTitle: "Secciones de tu invitación",
        incluyeTitle: "¿Qué incluye tu invitación?",
        incluyeOpen: "Tocá para cerrar",
        incluyeClosed:
            "Te explicamos lo que ya está incluido y cómo funcionan los bloques.",
        incluyeP1Before: "Tu invitación ya incluye:",
        incluyeP1Bold:
            "confirmación de asistencia por WhatsApp, hasta 5 fotos, cuenta regresiva, colores personalizados y frases personalizadas",
        incluyeP1After: ". Todo eso ya viene incluido.",
        incluyeP2Before: "En esta grilla podés sumar",
        incluyeP2Free: "4 secciones gratis",
        incluyeP2Mid: "(dress code, más fotos, historia, etc.).",
        incluyeP2From5: "A partir del 5.º bloque",
        incluyeP2After: "que marques, se suma",
        incluyeP2Each: "por cada uno.",
        seccionesCountFoot: "incluidos · Extra",
        perBlock: "/bloque",
        sinExtras: "(sin extras)",
        seccionOtroPh: "Contanos qué sección querés agregar...",
        seccionOtroAria: "Contanos qué sección querés agregar",
        idiomaTitle: "Idioma",
        idiomaLead:
            "Español viene por defecto. Podés sumar un segundo idioma.",
        idiomaDefault: "Español (incluido por defecto)",
        noLanguage: "¿No encontrás tu idioma?",
        typeLanguage: "Escribilo acá",
        addBtn: "Cargar",
        secondLangUnique: "2do idioma incluido en este plan.",
        secondLangPremiumPrefix: "2do idioma:",
        extrasTitle: "Extras",
        included: "Incluido",
        verDetalle: "Ver detalle",
        ocultarDetalle: "Ocultar detalle",
        datosTitle: "Tus datos",
        datosIntro:
            "Completá estos datos para avanzar con tu reserva. Una vez que recibimos tu envío, te compartimos los datos bancarios para la transferencia de la seña y luego coordinamos por mensaje todos los detalles de tu invitación paso a paso.",
        name1: "Nombre 1 *",
        name1Ph: "Ej: María",
        name2: "Nombre 2",
        name2Ph: "Opcional",
        email: "Email *",
        emailPh: "ejemplo@mail.com",
        emailInvalid: "Ingresá un email válido para continuar.",
        dateLabel: "Fecha del evento *",
        datePlaceholder: "Seleccioná la fecha del evento",
        dateAria: "Fecha del evento",
        dateHelp:
            "Tocá el campo para abrir el calendario y seleccionar la fecha.",
        terminosTitle: "Términos y privacidad",
        terminosTermsLabel: "Términos:",
        terminosTermsBody:
            "La seña corresponde al 50% para reservar agenda e iniciar el diseño. El 50% restante se abona en la entrega final. Cambios y tiempos dependen de entregar el material completo.",
        terminosPrivacyLabel: "Privacidad:",
        terminosPrivacyBody:
            "Usamos tus datos únicamente para crear y gestionar tu invitación. No vendemos información a terceros.",
        terminosCheck:
            "Leí y acepto Términos y Política de Privacidad",
        back: "Atrás",
        next: "Siguiente",
        goWhatsapp: "Ir a WhatsApp",
        totalDeposit: (total: string) => `Total ${total} | Señar 50%`,
        footerNote: "El 50% restante se abona en la entrega final.",
        summaryHi: (planLabel: string) =>
            `Hola! Quiero señar mi invitación (${planLabel}).`,
        currency: "Moneda",
        total: "Total",
        deposit50: "Seña 50%",
        event: "Evento",
        style: "Estilo",
        sections: "Secciones",
        tbd: "A definir",
        primaryLang: "Idioma principal",
        spanish: "Español",
        secondLang: "2do idioma",
        none: "No",
        extrasLine: "Extras",
        noneExtras: "Ninguno",
        uniqueExtrasNote:
            " (panel incluido; otros extras opcionales)",
        name1Line: "Nombre 1",
        name2Line: "Nombre 2",
        emailLine: "Email",
        eventDateLine: "Fecha del evento",
    };
}
