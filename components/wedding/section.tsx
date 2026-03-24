"use client"

import AnimatedSection from "./animated-section"
import QuoteSection from "./quote-section"
import EventInfoSection from "./event-info-section"
import DateInfoSection from "./date-info-section"
import LocationInfoSection from "./location-info-section"
import GallerySection from "./gallery-section"
import ItinerarySection from "./itinerary-section"
import PhotosSection from "./photos-section"
import GiftCardSection from "./gift-card-section"
import HoneymoonSection from "./honeymoon-section"
import DressCodeSection from "./dress-code-section"
import EmotionalQuoteSection from "./emotional-quote-section"
import TriviaSection from "./trivia-section"
import RSVPSection from "./rsvp-section"
import FooterSection from "./footer-section"
import ClosingSection from "./closing-section"
import OurStorySection from "./our-story-section"
import TruthsSection from "./truths-section"
import PresentationSection from "./presentation-section"
import ParentsSection from "./parents-section"
import PlaylistSection from "./playlist-section"
import SpecialMessageSection from "./special-message-section"
import ConfirmarWhatsappSection from "./confirmar-whatsapp-section"
import AdultsOnlySection from "./adults-only-section"
import { useConfig } from "@/lib/config-context"

export interface SectionConfig {
  type: string
  id: string
  blocks: string[]
  data: Record<string, unknown>
  bgColor?: string
  bgImage?: string // imagen de fondo en vez de color
  textColor?: string
  enabled?: boolean // true por defecto si no se especifica
}

interface SectionProps {
  section: SectionConfig
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
  prevBgColor?: string
  prevBgImage?: string
}

export default function Section({ section, coupleNames, prevBgColor, prevBgImage }: SectionProps) {
  const config = useConfig()
  const { type, id, data, bgColor, bgImage, textColor, enabled = true } = section
  const theme = config.theme as Record<string, unknown>

  // Si enabled es false, no renderizar la seccion
  if (enabled === false) return null

  // Resolve background image from theme if using keywords
  let resolvedBgImage = bgImage
  if (bgImage === "backgroundImage") {
    resolvedBgImage = (theme.backgroundImage as string) || undefined
  } else if (bgImage === "primaryImage") {
    resolvedBgImage = (theme.primaryImage as string) || undefined
  }

  // Determine bg + text color from theme
  const bg = bgColor === "primary" ? "bg-primary" : bgColor === "transparent" ? "bg-transparent" : "bg-background"
  let resolvedTextColor: string
  if (textColor) {
    resolvedTextColor = textColor
  } else if (bgColor === "primary") {
    resolvedTextColor = (theme.darkBgTextColor as string) || "#FFFFFF"
  } else {
    resolvedTextColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"
  }
  const colors = { bg, resolvedTextColor }

  // Check if this section continues the same background image as previous
  // Compare using original bgImage keywords (e.g. "backgroundImage") not resolved URLs
  const continuesBgImage = resolvedBgImage && bgImage && prevBgImage === bgImage

  // Show a subtle divider line when this section has the same bgColor as the previous one
  const selfStyledTypes = ["gallery", "closingImage", "footer", "presentation", "specialMessage"]
  const skipWrapper = selfStyledTypes.includes(type)
  const effectiveBg = skipWrapper ? null : (bgColor || "background")
  const prevEffective = prevBgColor || null
  const showDivider = !skipWrapper && effectiveBg && prevEffective && effectiveBg === prevEffective && !resolvedBgImage

  // Background image styles
  // When continuing from previous section, use attachment: local so image scrolls with content
  const bgImageStyle: React.CSSProperties = resolvedBgImage ? {
    backgroundImage: `url(${resolvedBgImage})`,
    backgroundRepeat: "repeat",
    backgroundSize: "100% auto",
    backgroundPosition: "top center",
    // Hide the top of the image by a small amount when continuing, creating seamless flow
    ...(continuesBgImage ? { backgroundAttachment: "local" } : {}),
  } : {}

  const renderContent = () => {
    switch (type) {
      case "quote":
        return (
          <QuoteSection
            text={data.text as string}
            author={data.author as string}
            decorativeLines={data.decorativeLines as boolean | undefined}
          />
        )

      case "eventInfo":
        return (
          <EventInfoSection
            date={data.date as { icon: string; title: string; value: string }}
            locations={
              data.locations as {
                enabled: boolean
                title: string
                address: string
                button: { text: string; url: string; variant: "primary" | "secondary" }
              }[]
            }
          />
        )

      case "dateInfo":
        return (
          <DateInfoSection
            title={data.title as string}
            value={data.value as string}
          />
        )

      case "locationInfo":
        return (
          <LocationInfoSection
            title={data.title as string}
            address={data.address as string}
            icon={data.icon as string | undefined}
            showButton={data.showButton as boolean | undefined}
            datetime={data.datetime as { date?: string; time?: string } | undefined}
            order={data.order as ("date" | "time" | "address")[] | undefined}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" | "background" }}
          />
        )

      case "gallery":
        return <GallerySection images={data.images as string[]} aspectRatio={data.aspectRatio as string | undefined} />

      case "itinerary":
        return (
          <ItinerarySection
            title={data.title as string}
            events={data.events as { icon: string; name: string; time: string }[]}
            sectionBgColor={bgColor}
          />
        )

      case "photos":
        return (
          <PhotosSection
            icon={data.icon as string | undefined}
            title={data.title as string}
            description={data.description as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" | "background" }}
          />
        )

      case "giftCard":
        return (
          <GiftCardSection
            icon={data.icon as string}
            title={data.title as string}
            description={data.description as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
            modal={data.modal as { title: string; suggestedValue: string; description: string; transferData: { label: string; value: string }[] }}
          />
        )

      case "honeymoon":
        return (
          <HoneymoonSection
            icon={data.icon as string | undefined}
            title={data.title as string}
            description={data.description as string}
            showButton={data.showButton as boolean | undefined}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary"; action?: "modal" | "url" }}
            modal={data.modal as { title: string; description: string; bankData: { label: string; value: string }[]; thankYouText?: string } | undefined}
            modals={data.modals as Array<{ type: "bank" | "address"; title: string; subtitle?: string; description?: string; address?: string; bankData?: { label: string; value: string }[]; thankYouText?: string; button?: { text: string; url: string } }> | undefined}
            modalMode={data.modalMode as "combined" | "sequential" | undefined}
          />
        )

      case "dressCode":
        return (
          <DressCodeSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            description={data.description as string | undefined}
            icons={data.icons as string[] | undefined}
            showButton={data.showButton as boolean | undefined}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
            modal={data.modal as { title: string; sections: { heading: string; text: string }[] }}
            colorSwatches={data.colorSwatches as { enabled: boolean; shape: "circle" | "square"; colors: string[] } | undefined}
          />
        )

      case "emotionalQuote":
        return <EmotionalQuoteSection text={data.text as string} />

      case "trivia":
        return (
          <TriviaSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            button={data.button as { text: string; variant: "primary" | "secondary" }}
            modal={data.modal as { questions: { question: string; options: string[]; correctIndex: number; explanation: string }[]; finishTitle: string; finishText: string }}
          />
        )

      case "rsvp":
        return (
          <RSVPSection
            title={data.title as string}
            deadline={data.deadline as string}
            guestCountLabel={data.guestCountLabel as string}
            guestCountOptions={data.guestCountOptions as number[]}
            fields={
              data.fields as {
                firstName: string
                lastName: string
                attendance: string
                attendanceYes: string
                attendanceNo: string
                dietary: string
                dietaryOptions: string[]
                songRequest: string
                submitButton: string
              }
            }
            whatsapp={data.whatsapp as { number: string; messageTemplate: string } | undefined}
          />
        )

      case "confirmarWhatsapp":
        return (
          <ConfirmarWhatsappSection
            title={data.title as string}
            subtitle={data.subtitle as string | undefined}
            buttonText={data.buttonText as string}
            whatsappNumber={data.whatsappNumber as string}
            message={data.message as string}
          />
        )

      case "adultsOnly":
        return (
          <AdultsOnlySection
            icon={data.icon as string | undefined}
            title={data.title as string}
            description={data.description as string}
          />
        )

      case "ourStory":
        return (
          <OurStorySection
            title={data.title as string}
            moments={data.moments as { image: string; title: string; text: string }[]}
            aspectRatio={data.aspectRatio as string | undefined}
          />
        )

      case "truths":
        return (
          <TruthsSection
            title={data.title as string}
            questions={
              data.questions as {
                question: string
                optionA: string
                optionB: string
                correctOption: "A" | "B"
                revealText: string
              }[]
            }
            finishText={data.finishText as string}
          />
        )

      case "presentation":
        return (
          <PresentationSection
            image={data.image as string}
            name={data.name as string}
            description={data.description as string}
            aspectRatio={data.aspectRatio as string | undefined}
          />
        )

      case "parents":
        return (
          <ParentsSection
            title={data.title as string}
            subtitle={data.subtitle as string | undefined}
            parents={data.parents as { name: string; role: string }[]}
          />
        )

      case "playlist":
        return (
          <PlaylistSection
            title={data.title as string}
            description={data.description as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        )

      case "specialMessage":
        return (
          <SpecialMessageSection
            title={data.title as string}
            text={data.text as string}
            signature={data.signature as string | undefined}
            decorativeLines={data.decorativeLines as boolean | undefined}
          />
        )

      case "closingImage":
        return (
          <ClosingSection
            image={data.image as string}
            aspectRatio={data.aspectRatio as string | undefined}
            coupleNames={coupleNames}
            namesDisplay={data.namesDisplay as { 
              enabled?: boolean
              font?: string
              weight?: string
              size?: string
              style?: string
              color?: string
              decorativeLines?: boolean
              logo?: string
              copyFromHero?: boolean 
            } | undefined}
          />
        )

      case "footer":
        return <FooterSection />

      default:
        return null
    }
  }

  return (
    <AnimatedSection id={id}>
      {/* Subtle divider between consecutive sections with same background color */}
      {showDivider && (
        <div className={colors.bg} style={bgImageStyle}>
          <div className="mx-auto w-16 border-t" style={{ borderColor: colors.resolvedTextColor, opacity: 0.12 }} />
        </div>
      )}
      {skipWrapper ? (
        renderContent()
      ) : (
        <div
          className={resolvedBgImage ? "" : colors.bg}
          style={{ 
            color: colors.resolvedTextColor,
            ...bgImageStyle,
          }}
        >
          {renderContent()}
        </div>
      )}
    </AnimatedSection>
  )
}
