"use client"

import AnimatedSection from "./animated-section"
import QuoteSection from "./quote-section"
import EventInfoSection from "./event-info-section"
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

export interface SectionConfig {
  type: string
  id: string
  blocks: string[]
  data: Record<string, unknown>
}

interface SectionProps {
  section: SectionConfig
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
  bgClass: string
}

/**
 * Some section types provide their own strong background (quote, trivia, footer)
 * so we apply the bgClass to the wrapper only for "normal" sections.
 * For full-bleed colored sections we let the component handle its own styling.
 */
const fullBleedTypes = new Set(["quote", "trivia", "footer"])

export default function Section({ section, coupleNames, bgClass }: SectionProps) {
  const { type, id, data } = section
  const isFullBleed = fullBleedTypes.has(type)

  // For full-bleed sections apply a specific bg:
  // quote & trivia -> primary bg, footer -> primary bg
  const wrapperBg = isFullBleed ? "bg-primary" : bgClass

  const renderContent = () => {
    switch (type) {
      case "quote":
        return (
          <QuoteSection
            text={data.text as string}
            author={data.author as string}
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

      case "gallery":
        return <GallerySection images={data.images as string[]} />

      case "itinerary":
        return (
          <ItinerarySection
            title={data.title as string}
            events={data.events as { icon: string; name: string; time: string }[]}
          />
        )

      case "photos":
        return (
          <PhotosSection
            title={data.title as string}
            description={data.description as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        )

      case "giftCard":
        return (
          <GiftCardSection
            icon={data.icon as string}
            title={data.title as string}
            description={data.description as string}
            image={data.image as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        )

      case "honeymoon":
        return (
          <HoneymoonSection
            title={data.title as string}
            description={data.description as string}
            image={data.image as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        )

      case "dressCode":
        return (
          <DressCodeSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        )

      case "emotionalQuote":
        return <EmotionalQuoteSection text={data.text as string} />

      case "trivia":
        return (
          <TriviaSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
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
          />
        )

      case "footer":
        return (
          <FooterSection
            credit={data.credit as string}
            coupleNames={coupleNames}
          />
        )

      default:
        return null
    }
  }

  return (
    <AnimatedSection id={id} className={wrapperBg}>
      {renderContent()}
    </AnimatedSection>
  )
}
