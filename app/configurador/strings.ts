import configuradorEs from "@/data/landing/configurador-es.json";
import pricingData from "@/data/landing/pricing.json";

export type ConfiguratorLang = "es" | "en";

type Price = { ARS: number; USD: number };

const USD_ARS = pricingData.usdArs;
const DELIVERY_MIN_DAYS = pricingData.deliveryWindow.minBusinessDays;
const DELIVERY_MAX_DAYS = pricingData.deliveryWindow.maxBusinessDays;
const DELIVERY_RANGE_ES = `${DELIVERY_MIN_DAYS} a ${DELIVERY_MAX_DAYS} días hábiles`;
const DELIVERY_RANGE_EN = `${DELIVERY_MIN_DAYS}–${DELIVERY_MAX_DAYS} business days`;
const toPrice = (ars: number): Price => ({
    ARS: ars,
    USD: Math.ceil(ars / USD_ARS),
});

function configuratorExtraPriceKey(
    id: string,
): keyof typeof pricingData.configurator.extras {
    if (id === "rapida") return "rapida24h";
    return id as keyof typeof pricingData.configurator.extras;
}

const EXTRA_SECTION_PRICE: Price = toPrice(
    pricingData.configurator.extraSection,
);
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
                id: "bienvenida",
                label: "Custom welcome screen",
                subtitle: "Tailored entry overlay",
                price: toPrice(pricingData.configurator.extras.bienvenida),
            },
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
                subtitle: `Top priority (standard: ${DELIVERY_RANGE_EN})`,
                price: toPrice(pricingData.configurator.extras.rapida24h),
            },
        ];
    }
    return configuradorEs.extras.map((ex) => ({
        id: ex.id,
        label: ex.label,
        subtitle: ex.subtitle.replace(
            /\{\{deliveryRangeEs\}\}/g,
            DELIVERY_RANGE_ES,
        ),
        price: toPrice(
            pricingData.configurator.extras[configuratorExtraPriceKey(ex.id)],
        ),
    }));
}

export function getExtraDetailById(
    lang: ConfiguratorLang,
): Record<string, { title: string; summary: string; body: string }> {
    if (lang === "en") {
        return {
            bienvenida: {
                title: "Custom welcome screen",
                summary:
                    "The first screen when opening the link, with bespoke design",
                body: "This is the welcome overlay: when guests open the invitation they first see names, the phrase, and the button to enter. That flow is already included with styling that matches your invite. This add-on is for going further—a special background image, a more crafted graphic layout, or a prominent logo, built to order. It takes extra design and polish time, so it’s priced separately.",
            },
            panel: {
                title: "Guest dashboard",
                summary: "Automatic, end-to-end RSVP management",
                body: "With WhatsApp (included), messages arrive but you track everything manually. With the dashboard, each guest confirms and your board updates automatically: who’s in, who’s pending, filters by status, and clear totals. You can also see dietary requirements (vegetarian, celiac, etc.) and guest song requests. Includes up to 150 guests; then +9,000 ARS for each extra 100 guests.",
            },
            dominio: {
                title: "Custom domain",
                summary: "Your own link—cleaner and easier to share",
                body: "Instead of a long URL, you get a short, memorable domain (e.g. yournames.com). It looks more polished, is easier to remember, and is simpler to share on WhatsApp or social media.",
            },
            rapida: {
                title: "24-hour rush delivery",
                summary: "Top priority to ship in one day",
                body: `This add-on moves your invitation to the front of the queue. Standard timing is ${DELIVERY_RANGE_EN}; with rush delivery we prioritize to target a 24-hour turnaround.`,
            },
        };
    }
    const details = structuredClone(configuradorEs.extraDetails) as Record<
        string,
        { title: string; summary: string; body: string }
    >;
    Object.values(details).forEach((detail) => {
        detail.summary = detail.summary.replace(
            /\{\{deliveryRangeEs\}\}/g,
            DELIVERY_RANGE_ES,
        );
        detail.body = detail.body.replace(
            /\{\{deliveryRangeEs\}\}/g,
            DELIVERY_RANGE_ES,
        );
    });
    return details;
}

/** Section id → English label (Spanish defaults stay in page for es). */
export const SECTION_LABEL_EN: Record<string, string> = {
    mapa: "Map & directions",
    countdown: "Countdown",
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
    dietas: "Detailed RSVP (vegan, celiac, etc.)",
    otro: "Other",
};

export { EXTRA_SECTION_PRICE, SECOND_LANGUAGE_PRICE };

/** Preset second-language options (labels match UI language). */
export const PRESET_LANGUAGES: Record<ConfiguratorLang, string[]> = {
    es: configuradorEs.presetLanguages,
    en: ["English", "Portuguese", "French", "German", "Italian", "Chinese"],
};

export function getEventLabels(
    lang: ConfiguratorLang,
): Record<
    "boda" | "xv" | "cumpleanos" | "baby-shower" | "corporativo" | "otro",
    string
> {
    if (lang === "en") {
        return {
            boda: "Wedding",
            xv: "XV",
            cumpleanos: "Birthday",
            "baby-shower": "Baby shower",
            corporativo: "Corporate",
            otro: "Other",
        };
    }
    return configuradorEs.eventLabels as Record<
        "boda" | "xv" | "cumpleanos" | "baby-shower" | "corporativo" | "otro",
        string
    >;
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
            styleBodyBefore:
                "Pick the sample that fits you best or your vision—it becomes our",
            styleBodyRef: "reference",
            styleBodyAfter:
                "to build your invitation. You’ll choose sections, languages, and add-ons in the next steps.",
            styleView: "View",
            seccionesTitle: "Invitation sections",
            seccionesTopNote:
                "Your invitation already includes up to 5 photos and RSVP confirmation",
            incluyeTitle: "What’s included in your invitation?",
            incluyeOpen: "Tap to close",
            incluyeClosed:
                "We explain what’s already included and how blocks work.",
            incluyeP1Before: "Your invitation already includes:",
            incluyeP1Bold:
                "WhatsApp RSVP, up to 5 photos, countdown, custom colors, and custom wording",
            incluyeP1After: ". All of that is included.",
            incluyeP2Before: "In this grid you can add",
            incluyeP2Free: "5 free sections",
            incluyeP2Mid: "(dress code, more photos, story, etc.).",
            incluyeP2From5: "From the 6th block you select onward,",
            incluyeP2After: "we add",
            incluyeP2Each: "each.",
            seccionesCountFoot: "blocks included (free) · Extra",
            seccionesMinThree: "Pick at least 5 blocks to continue.",
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
            back: "Back",
            next: "Next",
            goWhatsapp: "Pay 50% deposit",
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
            uniqueExtrasNote: "(dashboard included; other add-ons optional)",
            name1Line: "Name 1",
            name2Line: "Name 2",
            emailLine: "Email",
            eventDateLine: "Event date",
        };
    }
    const u = configuradorEs.ui;
    const tpl = configuradorEs.templates;
    return {
        ...u,
        totalDeposit: (total: string) =>
            tpl.totalDeposit.replace(/\{\{total\}\}/g, total),
        summaryHi: (planLabel: string) =>
            tpl.summaryHi.replace(/\{\{planLabel\}\}/g, planLabel),
    };
}
