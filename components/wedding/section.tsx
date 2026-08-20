"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RevealContent } from "./animated-section";
import { useFadeIn } from "@/hooks/use-fade-in";
import QuoteSection from "./quote-section";
import EventInfoSection from "./event-info-section";
import DateInfoSection from "./date-info-section";
import LocationInfoSection from "./location-info-section";
import GallerySection from "./gallery-section";
import ItinerarySection from "./itinerary-section";
import PhotosSection from "./photos-section";
import GiftCardSection from "./gift-card-section";
import HoneymoonSection from "./honeymoon-section";
import UniversalInfoSection from "./universal-info-section";
import DressCodeSection from "./dress-code-section";
import EmotionalQuoteSection from "./emotional-quote-section";
import TriviaSection from "./trivia-section";
import RSVPSection from "./rsvp-section";
import ClosingSection from "./closing-section";
import OurStorySection from "./our-story-section";
import TruthsSection from "./truths-section";
import PresentationSection from "./presentation-section";
import ParentsSection from "./parents-section";
import PlaylistSection from "./playlist-section";
import SpecialMessageSection from "./special-message-section";
import ConfirmarWhatsappSection from "./confirmar-whatsapp-section";
import AdultsOnlySection from "./adults-only-section";
import ZoomInfoSection from "./zoom-info-section";
import CaptureCardSection from "./capture-card-section";
import {
    getSectionPartTextStyle,
    parseSectionStyleMap,
    parseSectionTextStyle,
} from "@/lib/section-text-style";
import FaqSection from "./faq-section";
import { useConfig } from "@/lib/config-context";
import {
    confirmarComunUsesPanelApi,
    rsvpFormUsesPanelApi,
} from "@/lib/panel-confirmacion";

export interface SectionConfig {
    type: string;
    id: string;
    blocks: string[];
    data: Record<string, unknown>;
    /**
     * Modo de contenido/texto: 'primary' | 'background' | 'transparent'.
     * Define contraste del texto (claro u oscuro), no el hex del fondo.
     */
    bgColor?: string;
    /**
     * Color de fondo real (hex/CSS). Opcional.
     * Si está, pinta el fondo con ese color; el texto sigue el modo de `bgColor`.
     * Ej: bgColor "background" + bgColorTheme "#E8F0E4"
     */
    bgColorTheme?: string;
    bgImage?: string; // imagen de fondo en vez de color
    textColor?: string;
    enabled?: boolean; // true por defecto si no se especifica
    /**
     * Tipografía opcional por parte de la sección (hermano de type/id/data).
     * Ej: { title: { font, sizePx, weight, letterSpacing }, body: { … } }
     */
    style?: Record<string, unknown>;
}

interface SectionProps {
    section: SectionConfig;
    coupleNames: {
        groomName: string;
        brideName: string;
        separator: string;
        nameOrder?: "bride-first" | "groom-first";
    };
    prevBgColor?: string;
    prevBgImage?: string;
    revealImmediately?: boolean;
}

function useCodigoInvitado() {
    const searchParams = useSearchParams();
    return searchParams.get("i") || searchParams.get("c") || "";
}

/** Vista proveedor: ignora confirmación guardada en localStorage y muestra el formulario RSVP. */
function usePreviewRsvpForm() {
    const searchParams = useSearchParams();
    return searchParams.get("rsvpForm") === "1";
}

function SectionContent({
    section,
    coupleNames,
    prevBgColor,
    prevBgImage,
    revealImmediately = false,
}: SectionProps) {
    const config = useConfig();
    const {
        type,
        id,
        data,
        bgColor,
        bgColorTheme,
        bgImage,
        textColor,
        enabled = true,
        style: sectionStyleRaw,
    } = section;
    const sectionStyle = parseSectionStyleMap(sectionStyleRaw);
    const theme = config.theme as Record<string, unknown>;
    const rsvpPanel = config.rsvpPanel as
        | {
              enabled?: boolean;
              panelId?: string;
              confirmationMessage?: string;
              confirmacion?: string;
              registrarSinCodigoEnPanel?: boolean;
              colados?: boolean;
              /** Texto singular; en plural se añade "s" a cada palabra (espacios). */
              coladoLabel?: string;
              /**
               * Sistema de cupones referidos post-confirmación.
               * Solo true si contrataron panel y quieren este feature.
               */
              referidos?: boolean;
              /** Prefijo opcional del cupón (default: nombres). */
              referidosCodePrefix?: string;
          }
        | undefined;
    const codigoInvitado = useCodigoInvitado();
    const previewRsvpForm = usePreviewRsvpForm();
    const quinceaneraName =
        typeof (config.meta as { quinceaneraName?: string } | undefined)
            ?.quinceaneraName === "string"
            ? (config.meta as { quinceaneraName: string }).quinceaneraName
            : undefined;
    const eventLabelFromNames = (() => {
        if (quinceaneraName?.trim()) return quinceaneraName.trim();
        const a = coupleNames?.brideName?.trim() || "";
        const b = coupleNames?.groomName?.trim() || "";
        const sep = coupleNames?.separator?.trim() || "&";
        if (a && b) return `${a} ${sep} ${b}`;
        return a || b || undefined;
    })();

    // Si enabled es false, no renderizar la seccion
    if (enabled === false) return null;

    // Resolve background image from theme if using keywords
    let resolvedBgImage = bgImage;
    if (bgImage === "backgroundImage") {
        resolvedBgImage = (theme.backgroundImage as string) || undefined;
    } else if (bgImage === "primaryImage") {
        resolvedBgImage = (theme.primaryImage as string) || undefined;
    }

    // bgColor = modo de contenido (texto). bgColorTheme = color de fondo real (opcional).
    const bgPaint =
        typeof bgColorTheme === "string" && bgColorTheme.trim()
            ? bgColorTheme.trim()
            : undefined;
    const bg =
        bgPaint || resolvedBgImage
            ? ""
            : bgColor === "primary"
              ? "bg-primary"
              : bgColor === "transparent"
                ? "bg-transparent"
                : "bg-background";
    const resolveTextColorValue = (value: string): string => {
        const color = value.trim();
        if (!color) return color;
        if (color === "foreground") return "hsl(var(--foreground))";
        if (color === "primary-foreground")
            return "hsl(var(--primary-foreground))";
        if (color === "background") return "hsl(var(--background))";
        if (color === "primary") return "hsl(var(--primary))";
        return color;
    };
    let resolvedTextColor: string;
    if (textColor) {
        resolvedTextColor = resolveTextColorValue(textColor);
    } else if (bgColor === "primary") {
        resolvedTextColor = (theme.darkBgTextColor as string) || "#FFFFFF";
    } else {
        resolvedTextColor =
            (theme.lightBgTextColor as string) ||
            (theme.primaryColor as string) ||
            "#6B7F5E";
    }
    const colors = { bg, resolvedTextColor };

    // Check if this section continues the same background image as previous
    // Compare using original bgImage keywords (e.g. "backgroundImage") not resolved URLs
    const continuesBgImage =
        resolvedBgImage && bgImage && prevBgImage === bgImage;

    // Show a subtle divider line when this section has the same bgColor as the previous one
    const selfStyledTypes = [
        "gallery",
        "closingImage",
        "presentation",
        "specialMessage",
        "ourStory",
    ];
    const skipWrapper = selfStyledTypes.includes(type);
    const effectiveBg = skipWrapper ? null : bgColor || "background";
    const prevEffective = prevBgColor || null;
    const showDivider =
        type !== "spacer" &&
        !skipWrapper &&
        effectiveBg &&
        prevEffective &&
        effectiveBg === prevEffective &&
        !resolvedBgImage;

    // Background image styles
    // When continuing from previous section, use attachment: local so image scrolls with content
    const bgImageStyle: React.CSSProperties = resolvedBgImage
        ? {
              backgroundImage: `url(${resolvedBgImage})`,
              backgroundRepeat: "repeat",
              backgroundSize: "100% auto",
              backgroundPosition: "top center",
              // Hide the top of the image by a small amount when continuing, creating seamless flow
              ...(continuesBgImage ? { backgroundAttachment: "local" } : {}),
          }
        : bgPaint
          ? { backgroundColor: bgPaint }
          : {};

    const renderContent = () => {
        switch (type) {
            case "spacer": {
                const rawHeight = data.heightPx ?? data.height;
                const parsed =
                    typeof rawHeight === "number"
                        ? rawHeight
                        : typeof rawHeight === "string"
                          ? Number.parseFloat(rawHeight)
                          : NaN;
                const heightPx = Number.isFinite(parsed)
                    ? Math.max(0, parsed)
                    : 48;
                return (
                    <div
                        aria-hidden="true"
                        style={{ height: `${heightPx}px`, width: "100%" }}
                    />
                );
            }

            case "quote":
                return (
                    <QuoteSection
                        text={data.text as string}
                        author={data.author as string}
                        decorativeLines={
                            data.decorativeLines as boolean | undefined
                        }
                        pxFrase={
                            typeof data.pxFrase === "number"
                                ? data.pxFrase
                                : undefined
                        }
                        pxAuthor={
                            typeof data.pxAuthor === "number"
                                ? data.pxAuthor
                                : undefined
                        }
                    />
                );

            case "eventInfo":
                return (
                    <EventInfoSection
                        date={
                            data.date as {
                                icon: string;
                                title: string;
                                value: string;
                            }
                        }
                        locations={
                            data.locations as {
                                enabled: boolean;
                                title: string;
                                address: string;
                                button: {
                                    text: string;
                                    url: string;
                                    variant: "primary" | "secondary";
                                };
                            }[]
                        }
                    />
                );

            case "dateInfo":
                return (
                    <DateInfoSection
                        title={data.title as string}
                        value={data.value as string}
                        titleStyle={getSectionPartTextStyle(
                            sectionStyle,
                            "title",
                        )}
                        valueStyle={getSectionPartTextStyle(
                            sectionStyle,
                            "value",
                        )}
                    />
                );

            case "locationInfo":
                return (
                    <LocationInfoSection
                        title={data.title as string}
                        address={data.address as string}
                        icon={data.icon as string | undefined}
                        showButton={data.showButton as boolean | undefined}
                        datetime={
                            data.datetime as
                                | { date?: string; time?: string }
                                | undefined
                        }
                        order={
                            data.order as
                                | ("date" | "time" | "address")[]
                                | undefined
                        }
                        button={
                            data.button as {
                                text: string;
                                url: string;
                                variant: "primary" | "secondary" | "background";
                            }
                        }
                    />
                );

            case "zoomInfo":
                return (
                    <ZoomInfoSection
                        title={data.title as string}
                        meetingId={data.meetingId as string}
                        passcode={data.passcode as string}
                        notes={data.notes as string | undefined}
                        showButton={data.showButton as boolean | undefined}
                        button={
                            data.button as {
                                text: string;
                                url: string;
                                variant: "primary" | "secondary" | "background";
                            }
                        }
                    />
                );

            case "captureCard":
                return (
                    <CaptureCardSection
                        image={data.image as string}
                        name={data.name as string}
                        topLabel={data.topLabel as string | undefined}
                        nameSize={data.nameSize as string | undefined}
                        locationTitle={data.locationTitle as string | undefined}
                        locationAddress={
                            data.locationAddress as string | undefined
                        }
                        eventDay={data.eventDay as string | undefined}
                        eventTime={data.eventTime as string | undefined}
                        zoomTitle={data.zoomTitle as string | undefined}
                        meetingId={data.meetingId as string | undefined}
                        passcode={data.passcode as string | undefined}
                        colors={
                            data.colors as
                                | {
                                      blockBg?: string;
                                      blockBorder?: string;
                                      dateTimeBg?: string;
                                      locationBg?: string;
                                      zoomBg?: string;
                                      captureBg?: string;
                                      cardBg?: string;
                                      photoPanelBg?: string;
                                      nameTextColor?: string;
                                      blockTextColor?: string;
                                  }
                                | undefined
                        }
                    />
                );

            case "gallery":
                return (
                    <GallerySection
                        images={data.images as string[]}
                        aspectRatio={data.aspectRatio as string | undefined}
                        sectionBgColor={bgColor}
                        bgColorTheme={bgPaint}
                        bgImage={resolvedBgImage}
                    />
                );

            case "itinerary":
                return (
                    <ItinerarySection
                        title={data.title as string}
                        events={
                            data.events as {
                                icon: string;
                                name: string;
                                time: string;
                            }[]
                        }
                        sectionBgColor={bgColor}
                    />
                );

            case "photos":
                return (
                    <PhotosSection
                        icon={data.icon as string | undefined}
                        title={data.title as string}
                        description={data.description as string}
                        button={
                            data.button as {
                                text: string;
                                url: string;
                                variant: "primary" | "secondary" | "background";
                            }
                        }
                    />
                );

            case "giftCard":
                return (
                    <GiftCardSection
                        icon={data.icon as string}
                        title={data.title as string}
                        description={data.description as string}
                        showButton={data.showButton as boolean | undefined}
                        button={
                            data.button as
                                | {
                                      text: string;
                                      url: string;
                                      variant: "primary" | "secondary";
                                  }
                                | undefined
                        }
                        modal={
                            data.modal as
                                | {
                                      title: string;
                                      suggestedValueLabel?: string;
                                      suggestedValue?: string;
                                      suggestedValues?: {
                                          label: string;
                                          value: string;
                                      }[];
                                      dateRanges?: {
                                          label: string;
                                          helperText?: string;
                                          suggestedValue?: string;
                                          suggestedValues?: {
                                              label: string;
                                              value: string;
                                          }[];
                                      }[];
                                      description: string;
                                      transferData: {
                                          label: string;
                                          value: string;
                                      }[];
                                      comprobanteWhatsapp?: {
                                          number: string;
                                          text?: string;
                                          message?: string;
                                          hint?: string;
                                      };
                                  }
                                | undefined
                        }
                    />
                );

            case "honeymoon":
                return (
                    <HoneymoonSection
                        icon={data.icon as string | undefined}
                        title={data.title as string}
                        description={data.description as string}
                        showButton={data.showButton as boolean | undefined}
                        button={
                            data.button as {
                                text: string;
                                url: string;
                                variant: "primary" | "secondary";
                                action?: "modal" | "url";
                            }
                        }
                        modal={
                            data.modal as
                                | {
                                      title: string;
                                      description: string;
                                      bankData: {
                                          label: string;
                                          value: string;
                                      }[];
                                      thankYouText?: string;
                                  }
                                | undefined
                        }
                        modals={
                            data.modals as
                                | Array<{
                                      type: "bank" | "address";
                                      title: string;
                                      subtitle?: string;
                                      description?: string;
                                      address?: string;
                                      bankData?: {
                                          label: string;
                                          value: string;
                                      }[];
                                      thankYouText?: string;
                                      button?: { text: string; url: string };
                                  }>
                                | undefined
                        }
                        modalMode={
                            data.modalMode as
                                | "combined"
                                | "sequential"
                                | undefined
                        }
                    />
                );

            case "universalInfo":
                return (
                    <UniversalInfoSection
                        icon={data.icon as string | undefined}
                        title={data.title as string | undefined}
                        description={data.description as string | undefined}
                        descriptionSize={
                            data.descriptionSize as
                                | "normal"
                                | "large"
                                | undefined
                        }
                        showButton={data.showButton as boolean | undefined}
                        button={
                            data.button as
                                | {
                                      text: string;
                                      variant?: "primary" | "secondary";
                                  }
                                | undefined
                        }
                        modal={
                            data.modal as
                                | {
                                      title?: string;
                                      sections?: {
                                          heading: string;
                                          text: string;
                                      }[];
                                  }
                                | undefined
                        }
                    />
                );

            case "dressCode":
                return (
                    <DressCodeSection
                        title={data.title as string}
                        subtitle={data.subtitle as string}
                        description={
                            data.description as string | string[] | undefined
                        }
                        descriptionAfterColors={
                            data.descriptionAfterColors as
                                | string
                                | string[]
                                | undefined
                        }
                        icons={data.icons as string[] | undefined}
                        showButton={data.showButton as boolean | undefined}
                        button={
                            data.button as
                                | {
                                      text: string;
                                      url: string;
                                      variant: "primary" | "secondary";
                                  }
                                | undefined
                        }
                        modal={
                            data.modal as
                                | {
                                      title: string;
                                      intro?: string;
                                      sections: {
                                          heading: string;
                                          text: string;
                                      }[];
                                  }
                                | undefined
                        }
                        colorSwatches={
                            data.colorSwatches as
                                | {
                                      enabled: boolean;
                                      shape: "circle" | "square";
                                      labels?: string[];
                                      colors: (
                                          | string
                                          | {
                                                color?: string;
                                                hex?: string;
                                                label?: string;
                                            }
                                      )[];
                                  }
                                | undefined
                        }
                    />
                );

            case "emotionalQuote":
                return <EmotionalQuoteSection text={data.text as string} />;

            case "trivia":
                return (
                    <TriviaSection
                        title={data.title as string}
                        subtitle={data.subtitle as string}
                        button={
                            data.button as {
                                text: string;
                                variant: "primary" | "secondary";
                            }
                        }
                        modal={
                            data.modal as {
                                questions: {
                                    question: string;
                                    options: string[];
                                    correctIndex: number;
                                    explanation: string;
                                }[];
                                finishTitle: string;
                                finishText: string;
                            }
                        }
                    />
                );

            case "rsvp":
                return (
                    <RSVPSection
                        title={data.title as string}
                        deadline={data.deadline as string}
                        guestCountLabel={data.guestCountLabel as string}
                        guestCountOptions={data.guestCountOptions as number[]}
                        fields={
                            data.fields as {
                                firstName: string;
                                lastName: string;
                                attendance: string;
                                attendanceYes: string;
                                attendanceNo: string;
                                dietary: string;
                                dietaryOptions: string[];
                                songRequestLabel?: string;
                                songRequest: string;
                                extraInputs?: {
                                    id: string;
                                    label: string;
                                    placeholder?: string;
                                    tituloPanel?: string;
                                    required?: boolean;
                                }[];
                                submitButton: string;
                            }
                        }
                        whatsapp={
                            data.whatsapp as
                                | {
                                      number: string;
                                      messageTemplate: string;
                                      noAttendanceMessageTemplate?: string;
                                  }
                                | undefined
                        }
                        panel={
                            rsvpFormUsesPanelApi(rsvpPanel) &&
                            (Boolean(codigoInvitado) ||
                                (Boolean(rsvpPanel?.panelId) &&
                                    Boolean(
                                        rsvpPanel?.registrarSinCodigoEnPanel,
                                    )))
                                ? {
                                      enabled: true,
                                      codigo: codigoInvitado || undefined,
                                      panelId: rsvpPanel?.panelId,
                                      allowAnonymousToPanel: Boolean(
                                          rsvpPanel?.registrarSinCodigoEnPanel,
                                      ),
                                      allowColados: Boolean(rsvpPanel?.colados),
                                      coladoLabel:
                                          typeof rsvpPanel?.coladoLabel ===
                                          "string"
                                              ? rsvpPanel.coladoLabel
                                              : undefined,
                                      confirmationMessage:
                                          rsvpPanel.confirmationMessage ||
                                          "Gracias por confirmar!",
                                  }
                                : undefined
                        }
                        previewRsvpForm={previewRsvpForm}
                        hasBgImage={Boolean(resolvedBgImage)}
                        promo={
                            data.promo as
                                | {
                                      enabled?: boolean;
                                      clientRef?: string;
                                      codePrefix?: string;
                                      discountPercent?: number;
                                      validityDays?: number;
                                      teaser?: {
                                          title?: string;
                                          subtitle?: string;
                                          benefit?: string;
                                          buttonText?: string;
                                      };
                                      modal?: {
                                          title?: string;
                                          subtitle?: string;
                                          code?: string;
                                          modelsLinkUrl?: string;
                                          modelsButtonText?: string;
                                          shareButtonText?: string;
                                          shareMessage?: string;
                                          captureHint?: string;
                                      };
                                  }
                                | undefined
                        }
                        referral={
                            Boolean(rsvpPanel?.enabled) &&
                            rsvpPanel?.referidos === true &&
                            Boolean(rsvpPanel?.panelId)
                                ? {
                                      enabled: true,
                                      panelId: rsvpPanel.panelId,
                                      brideName: coupleNames?.brideName,
                                      groomName: coupleNames?.groomName,
                                      quinceaneraName,
                                      eventLabel: eventLabelFromNames,
                                  }
                                : { enabled: false }
                        }
                    />
                );

            case "confirmarWhatsapp":
                return (
                    <ConfirmarWhatsappSection
                        title={data.title as string}
                        subtitle={data.subtitle as string | undefined}
                        buttonText={data.buttonText as string}
                        whatsappNumber={data.whatsappNumber as string}
                        message={data.message as string}
                        noAsiste={
                            data.noAsiste as
                                | {
                                      enabled: boolean;
                                      buttonText: string;
                                      message: string;
                                  }
                                | undefined
                        }
                        panelSync={
                            confirmarComunUsesPanelApi(rsvpPanel) &&
                            codigoInvitado
                                ? {
                                      codigo: codigoInvitado,
                                      confirmationMessage:
                                          rsvpPanel?.confirmationMessage ||
                                          "Gracias por confirmar!",
                                  }
                                : undefined
                        }
                    />
                );

            case "adultsOnly":
                return (
                    <AdultsOnlySection
                        icon={data.icon as string | undefined}
                        title={data.title as string}
                        description={data.description as string}
                    />
                );

            case "faq":
                return (
                    <FaqSection
                        icon={data.icon as string | undefined}
                        title={data.title as string | undefined}
                        description={data.description as string | undefined}
                        items={
                            (data.items as {
                                question: string;
                                answer: string;
                                buttons?: {
                                    text: string;
                                    url?: string;
                                    whatsapp?: string;
                                    variant?:
                                        | "primary"
                                        | "secondary"
                                        | "outline-light"
                                        | "background";
                                    icon?: string;
                                }[];
                            }[]) || []
                        }
                        defaultOpen={
                            data.defaultOpen as number | null | undefined
                        }
                    />
                );

            case "ourStory":
                return (
                    <OurStorySection
                        title={data.title as string}
                        variant={
                            data.variant === "simple" ? "simple" : "classic"
                        }
                        paragraphs={
                            Array.isArray(data.paragraphs)
                                ? (data.paragraphs as string[])
                                : undefined
                        }
                        moments={
                            data.moments as
                                | {
                                      image?: string;
                                      title: string;
                                      text: string;
                                      bgColor?: string;
                                  }[]
                                | undefined
                        }
                        aspectRatio={data.aspectRatio as string | undefined}
                        sectionBgColor={bgColor}
                        bgColorTheme={bgPaint}
                        bgImage={resolvedBgImage}
                        titleStyle={
                            getSectionPartTextStyle(sectionStyle, "title") ??
                            parseSectionTextStyle(data.titleStyle)
                        }
                        bodyStyle={
                            getSectionPartTextStyle(
                                sectionStyle,
                                "paragraphs",
                            ) ??
                            getSectionPartTextStyle(sectionStyle, "body") ??
                            parseSectionTextStyle(data.bodyStyle)
                        }
                        showHearts={data.showHearts !== false}
                        decorativeLines={
                            data.decorativeLines as boolean | undefined
                        }
                    />
                );

            case "truths":
                return (
                    <TruthsSection
                        title={data.title as string}
                        questions={
                            data.questions as {
                                question: string;
                                optionA: string;
                                optionB: string;
                                correctOption: "A" | "B";
                                revealText: string;
                            }[]
                        }
                        finishText={data.finishText as string}
                        sectionBgColor={bgColor}
                    />
                );

            case "presentation":
                return (
                    <PresentationSection
                        image={data.image as string}
                        name={data.name as string}
                        description={data.description as string}
                        aspectRatio={data.aspectRatio as string | undefined}
                    />
                );

            case "parents":
                return (
                    <ParentsSection
                        title={data.title as string}
                        subtitle={data.subtitle as string | undefined}
                        parents={
                            data.parents as { name: string; role: string }[]
                        }
                    />
                );

            case "playlist":
                return (
                    <PlaylistSection
                        title={data.title as string}
                        description={data.description as string}
                        button={
                            data.button as {
                                text: string;
                                url: string;
                                variant: "primary" | "secondary";
                            }
                        }
                    />
                );

            case "specialMessage":
                return (
                    <SpecialMessageSection
                        title={data.title as string}
                        text={data.text as string}
                        signature={data.signature as string | undefined}
                        decorativeLines={
                            data.decorativeLines as boolean | undefined
                        }
                    />
                );

            case "closingImage":
                return (
                    <ClosingSection
                        image={data.image as string}
                        aspectRatio={data.aspectRatio as string | undefined}
                        coupleNames={coupleNames}
                        namesDisplay={
                            data.namesDisplay as
                                | {
                                      enabled?: boolean;
                                      font?: string;
                                      weight?: string;
                                      size?: string;
                                      style?: string;
                                      color?: string;
                                      decorativeLines?: boolean;
                                      logo?: string;
                                      copyFromHero?: boolean;
                                  }
                                | undefined
                        }
                        sectionBgColor={bgColor}
                        bgColorTheme={bgPaint}
                        bgImage={resolvedBgImage}
                    />
                );

            default:
                return null;
        }
    };

    const { ref: revealRef, isVisible: isRevealVisible } = useFadeIn(
        0.15,
        revealImmediately,
    );

    return (
        <div ref={revealRef} id={id}>
            {/* Subtle divider between consecutive sections with same background color */}
            {showDivider && (
                <div
                    className={colors.bg}
                    style={
                        bgPaint && !resolvedBgImage
                            ? { backgroundColor: bgPaint }
                            : bgImageStyle
                    }
                >
                    <div
                        className="mx-auto w-16 border-t"
                        style={{
                            borderColor: colors.resolvedTextColor,
                            opacity: 0.12,
                        }}
                    />
                </div>
            )}
            {skipWrapper ? (
                // Self-styled: el fondo vive adentro del componente; no animar el wrapper
                // (cada uno con fondo animaria mal). Esa seccion anima su contenido interno.
                renderContent()
            ) : (
                <div
                    className={resolvedBgImage || bgPaint ? "" : colors.bg}
                    style={{
                        color: colors.resolvedTextColor,
                        ...bgImageStyle,
                    }}
                >
                    <RevealContent isVisible={isRevealVisible}>
                        {renderContent()}
                    </RevealContent>
                </div>
            )}
        </div>
    );
}

export default function Section(props: SectionProps) {
    return (
        <Suspense fallback={null}>
            <SectionContent {...props} />
        </Suspense>
    );
}
