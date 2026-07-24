import configuradorEs from "@/data/landing/configurador-es.json";
import pricingData from "@/data/landing/pricing.json";
import {
    pairToConfiguratorPrice,
    type ConfiguratorPrice,
} from "@/lib/landing/landing-pricing";

export type ConfiguratorLang = "es" | "en";

export type Price = ConfiguratorPrice;

const DELIVERY_MIN_DAYS = pricingData.deliveryWindow.minBusinessDays;
const DELIVERY_MAX_DAYS = pricingData.deliveryWindow.maxBusinessDays;
const DELIVERY_RANGE_ES = `${DELIVERY_MIN_DAYS} a ${DELIVERY_MAX_DAYS} días hábiles`;
const DELIVERY_RANGE_EN = `${DELIVERY_MIN_DAYS}–${DELIVERY_MAX_DAYS} business days`;

function configuratorExtraPriceKey(
    id: string,
): keyof typeof pricingData.configurator.extras {
    if (id === "rapida") return "rapida24h";
    return id as keyof typeof pricingData.configurator.extras;
}

const EXTRA_SECTION_PRICE: Price = pairToConfiguratorPrice(
    pricingData.configurator.extraSection,
);
const SECOND_LANGUAGE_PRICE: Price = pairToConfiguratorPrice(
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
                price: pairToConfiguratorPrice(
                    pricingData.configurator.extras.bienvenida,
                ),
            },
            {
                id: "panel",
                label: "Guest dashboard",
                subtitle: "Real-time RSVPs",
                price: pairToConfiguratorPrice(
                    pricingData.configurator.extras.panel,
                ),
            },
            {
                id: "dominio",
                label: "Custom domain",
                subtitle: "e.g. yournames.com",
                price: pairToConfiguratorPrice(
                    pricingData.configurator.extras.dominio,
                ),
            },
            {
                id: "rapida",
                label: "24-hour rush delivery",
                subtitle: `Top priority (standard: ${DELIVERY_RANGE_EN})`,
                price: pairToConfiguratorPrice(
                    pricingData.configurator.extras.rapida24h,
                ),
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
        price: pairToConfiguratorPrice(
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
                body: "With WhatsApp (included), messages arrive but you track everything manually. With the dashboard, each guest confirms and your board updates automatically: who’s in, who’s pending, filters by status, and clear totals. You can also see dietary requirements (vegetarian, celiac, etc.) and guest song requests. Fixed pricing by capacity: up to 150, 250, 350, or 500 guests.",
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

export function getSectionDetailById(
    lang: ConfiguratorLang,
): Record<string, { title: string; body: string }> {
    if (lang === "en") {
        return {
            mapa: {
                title: "Map & directions",
                body: "Show the venue with an embedded map and clear details: address, time, and a button to open Google Maps or Waze. Ideal when there is more than one stop (ceremony and party).",
            },
            countdown: {
                title: "Countdown",
                body: "A live countdown to the event date (days, hours, minutes). Builds anticipation and keeps the date front and center.",
            },
            dress: {
                title: "Dress code",
                body: "Tell guests how to dress: formal, elegant, themed, suggested colors, or what to avoid. Fewer last-minute questions.",
            },
            itinerario: {
                title: "Itinerary",
                body: "The day’s flow with times: ceremony, cocktail, dinner, dancing, and more. Guests know what to expect and when to arrive.",
            },
            regalos: {
                title: "Gifts / payment info",
                body: "Space for aliases, bank details, or other gift options. You can add a short note (honeymoon fund, joint account, etc.) without a traditional registry list.",
            },
            tarjeta: {
                title: "Gift amount",
                body: "If you use an entry fee or advance gift amount, list the amount and how to pay. Pairs well with the guest dashboard to track who already paid.",
            },
            album: {
                title: "Drive album (photos)",
                body: "A shared album link (Drive or similar) so guests can upload event photos. Everything lands in one place.",
            },
            musica: {
                title: "Music on the invite",
                body: "A background track that plays when the invitation opens (with a pause control). Sets the mood from the first second.",
            },
            playlist: {
                title: "Collaborative Spotify playlist",
                body: "Guests can suggest songs for the party. You get organized ideas and the playlist is built together.",
            },
            historia: {
                title: "Our story",
                body: "A block to share how you met, relationship milestones, or the guest of honor’s story. Text + photos, in a personal tone.",
            },
            trivia: {
                title: "Interactive trivia",
                body: "Fun questions about you or the guest of honor. Guests answer right in the invitation—a great icebreaker before the day.",
            },
            fotos10: {
                title: "Up to 10 photos",
                body: "Your invitation already includes up to 5 photos. This block lets you add more (up to 10 total) for gallery, story, or key moments.",
            },
            faq: {
                title: "FAQ",
                body: "Answers to common questions: parking, arrival time, dress code, kids, weather, and more. Fewer one-off WhatsApp messages.",
            },
            alojamiento: {
                title: "Accommodations",
                body: "Hotel or lodging suggestions near the venue, with links or contact details. Especially useful for out-of-town guests.",
            },
            adultos: {
                title: "Kids & childcare notes",
                body: "Clarify if the event is adults-only, kid-friendly, or if childcare is available. Avoids confusion when confirming.",
            },
            dietas: {
                title: "RSVP, dietary preferences, messages",
                body: "A fuller RSVP: attending / not attending, dietary needs (vegetarian, celiac, etc.), and messages for you, the DJ, or others. Ideal when you want structured replies (even better with the dashboard).",
            },
            otro: {
                title: "Other section",
                body: "If you need something not on the list (special gift table, padrinos, QR code, etc.), describe it here and we’ll see how to include it.",
            },
        };
    }
    return structuredClone(configuradorEs.sectionDetails) as Record<
        string,
        { title: string; body: string }
    >;
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
    dietas: "RSVP, dietary preferences, messages",
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
            seccionesTopNoteUnique:
                "In Unique design you can pick all sections at no extra cost. A 5-block minimum still applies to define the structure.",
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
            incluyeP2Mid:
                "(dress code, more photos, story, etc.). For the RSVP, dietary preferences, and messages block (to you, DJ, etc.), add the section ",
            incluyeP2From5: "\"RSVP, dietary preferences, messages\".",
            incluyeP2After: "Further sections bill extra.",
            incluyeP2Each: "",
            seccionesCountFoot: "blocks included (free) · Extra",
            seccionesMinThree: "Pick at least 5 blocks to continue.",
            perBlock: "/block",
            sinExtras: "(no extras)",
            seccionesUniqueIncluded: "(all included)",
            seccionesSoloConteo: "{{count}} blocks selected",
            seccionesPremiumCompareNote:
                "On Premium, each block after the first five adds {{precioPorBloque}}. On Unique design, all blocks are included.",
            seccionesSummaryUnique:
                "You selected {{count}} blocks. Minimum 5 to continue — on this plan every section is included, with no extra per-block fee.",
            seccionOtroPh: "Describe the section you want to add…",
            seccionOtroAria: "Describe the section you want to add",
            seccionInfoHint:
                "*Press and hold* any section to see what it’s about.",
            seccionInfoClose: "Got it",
            panelTitle: "Guest dashboard",
            panelLead:
                "Organize your guests and send them exclusive invitations with their names:",
            panelImg1Summary: "Live RSVPs",
            panelImg1Body:
                "Who’s in, who’s pending, diets and songs—organized, no copying WhatsApp by hand.",
            panelImg2Summary: "Invite with their name",
            panelImg2Body:
                "Each guest gets an exclusive link with their name on the welcome screen.",
            panelImg3Summary: "Families and members",
            panelImg3Body:
                "Open each family, see who’s confirmed, diets and messages, and send the invite from there.",
            panelImg4Summary: "Downloadable PDF summary",
            panelImg4Body:
                "Download a PDF of your list: names, RSVPs, dietary needs, and more—ready to print or share.",
            panelCapacityIntro:
                "The dashboard includes up to *{{n}} guests* to load your list, send named invitations, and see confirmations.",
            panelCapacityYes: "Yes, that’s enough",
            panelCapacityMore: "I need more capacity",
            panelIncludedInPlan: "Included in your plan",
            panelWithoutTitle: "What if I don’t add the guest dashboard?",
            panelWithoutLead:
                "You’ll still get a beautiful invitation with RSVP confirmation, with these differences:",
            panelWithoutPoints: [
                "Confirmations arrive in your WhatsApp.",
                "Everyone gets the same invitation—no personal names.",
                "You’ll need to track who’s confirming on WhatsApp yourself, including dietary needs and other details.",
            ],
            panelWithoutReassure:
                "Your digital invitation is still beautiful, personalized, and ready to share—the dashboard adds organization comfort, but it isn’t required for a polished result.",
            rsvpWithoutTitle: "What if I don’t include RSVP?",
            rsvpWithoutLead:
                "Confirmation stays simpler: just one button to confirm and another if they can’t make it—no forms or dietary questions.",
            idiomaTitle: "Language",
            idiomaLead:
                "Spanish is included by default, and you can add a second language. On the finished invitation, recipients can switch languages with a single tap.",
            idiomaDefault: "Spanish (included by default)",
            noLanguage: "Don’t see your language?",
            typeLanguage: "Type it here",
            addBtn: "Add",
            secondLangPremiumPrefix: "Second language:",
            briefingTitle: "Tell us your design vision",
            briefingLead:
                "Before the final step, share how you imagine your invitation. Include references, visual style, phrases, palettes, textures, or special effects.",
            briefingPlaceholder:
                "Ex: Describe your visual idea, paste reference links or a mood board, and if you have special artwork—your own sketches or illustrations—a looping video in the background, custom fonts… whatever you have in mind helps.",
            briefingHint:
                "The more context you share, the more accurate the creative direction can be.",
            extrasTitle: "Add-ons",
            extrasTitlePart1: "Add-ons (1 of 2)",
            extrasTitlePart2: "Add-ons (2 of 2)",
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
            couponLabel: "Coupon",
            couponHint: "If you received a gift coupon, enter it here",
            couponPh: "",
            couponApply: "Apply",
            couponApplying: "Applying…",
            couponApplied: "{{pct}}% OFF coupon applied",
            couponRemove: "Remove",
            couponRedeemError: "We couldn’t register the coupon. Try again.",
            couponLocked:
                "Too many attempts. Wait 15 minutes to try again. If you have any problem,",
            couponLockedContact: "Contact us",
            back: "Back",
            next: "Next",
            goWhatsapp: "Pay 50% deposit",
            totalDeposit: (total: string) => `Total ${total} | Deposit 50%`,
            footerNote: "The remaining 50% is due on final delivery.",
            summaryHi: (planLabel: string) =>
                `Hi! I’d like to book my invitation (${planLabel}).`,
            currency: "Currency",
            total: "Total",
            totalWithDiscount: "Total −{{pct}}%:",
            totalBeforeDiscount: "Before",
            deposit50: "Deposit 50%",
            couponWaLine: "Coupon",
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
                "(custom welcome screen + guest dashboard up to 150 guests included; custom domain & rush optional, paid separately)",
            name1Line: "Name 1",
            name2Line: "Name 2",
            emailLine: "Email",
            eventDateLine: "Event date",
            headingCreativeBrief: "CREATIVE BRIEF",
            creativeBriefLine: "Design vision",
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
