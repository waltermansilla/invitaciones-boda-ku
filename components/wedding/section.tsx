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
import { useConfig } from "@/lib/config-context"

export interface SectionConfig {
  type: string
  id: string
  blocks: string[]
  data: Record<string, unknown>
  bgColor?: string
  textColor?: string
}

interface SectionProps {
  section: SectionConfig
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
}

export default function Section({ section, coupleNames }: SectionProps) {
  const config = useConfig()
  const { type, id, data, bgColor, textColor } = section

  // Determine bg + text color from theme
  const theme = config.theme as Record<string, unknown>
  const bg = bgColor === "primary" ? "bg-primary" : "bg-background"
  let resolvedTextColor: string
  if (textColor) {
    resolvedTextColor = textColor
  } else if (bgColor === "primary") {
    resolvedTextColor = (theme.darkBgTextColor as string) || "#FFFFFF"
  } else {
    resolvedTextColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#555555"
  }
  const colors = { bg, resolvedTextColor }

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
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
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
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
            modal={data.modal as { title: string; suggestedValue: string; description: string; transferData: { label: string; value: string }[] }}
          />
        )

      case "honeymoon":
        return (
          <HoneymoonSection
            title={data.title as string}
            description={data.description as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
            modal={data.modal as { title: string; description: string; bankData: { label: string; value: string }[]; thankYouText: string }}
          />
        )

      case "dressCode":
        return (
          <DressCodeSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
            modal={data.modal as { title: string; sections: { heading: string; text: string }[] }}
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
          />
        )

      case "closingImage":
        return (
          <ClosingSection
            image={data.image as string}
            aspectRatio={data.aspectRatio as string | undefined}
            coupleNames={coupleNames}
          />
        )

      case "footer":
        return (
          <FooterSection
            brandName={data.brandName as string}
            socialLinks={data.socialLinks as { icon: "instagram" | "whatsapp"; url: string }[]}
          />
        )

      default:
        return null
    }
  }

  // Sections that manage their own bg (gallery, closingImage, footer) skip the wrapper
  const selfStyledTypes = ["gallery", "closingImage", "footer", "presentation", "specialMessage"]
  const skipWrapper = selfStyledTypes.includes(type)

  return (
    <AnimatedSection id={id}>
      {skipWrapper ? (
        renderContent()
      ) : (
        <div
          className={colors.bg}
          style={{ color: colors.resolvedTextColor }}
        >
          {renderContent()}
        </div>
      )}
    </AnimatedSection>
  )
}
