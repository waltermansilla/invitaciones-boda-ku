"use client"

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
}

export default function Section({ section, coupleNames }: SectionProps) {
  const { type, id, data } = section

  switch (type) {
    case "quote":
      return (
        <div id={id}>
          <QuoteSection
            text={data.text as string}
            author={data.author as string}
          />
        </div>
      )

    case "eventInfo":
      return (
        <div id={id}>
          <EventInfoSection
            date={data.date as { icon: string; title: string; value: string }}
            location={data.location as { icon: string; title: string; value: string; button: { text: string; url: string; variant: "primary" | "secondary" } }}
          />
        </div>
      )

    case "gallery":
      return (
        <div id={id}>
          <GallerySection images={data.images as string[]} />
        </div>
      )

    case "itinerary":
      return (
        <div id={id}>
          <ItinerarySection
            title={data.title as string}
            events={data.events as { icon: string; name: string; time: string }[]}
          />
        </div>
      )

    case "photos":
      return (
        <div id={id}>
          <PhotosSection
            title={data.title as string}
            description={data.description as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        </div>
      )

    case "giftCard":
      return (
        <div id={id}>
          <GiftCardSection
            icon={data.icon as string}
            title={data.title as string}
            description={data.description as string}
            image={data.image as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        </div>
      )

    case "honeymoon":
      return (
        <div id={id}>
          <HoneymoonSection
            title={data.title as string}
            description={data.description as string}
            image={data.image as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        </div>
      )

    case "dressCode":
      return (
        <div id={id}>
          <DressCodeSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        </div>
      )

    case "emotionalQuote":
      return (
        <div id={id}>
          <EmotionalQuoteSection text={data.text as string} />
        </div>
      )

    case "trivia":
      return (
        <div id={id}>
          <TriviaSection
            title={data.title as string}
            subtitle={data.subtitle as string}
            button={data.button as { text: string; url: string; variant: "primary" | "secondary" }}
          />
        </div>
      )

    case "rsvp":
      return (
        <div id={id}>
          <RSVPSection
            title={data.title as string}
            deadline={data.deadline as string}
            guestCountLabel={data.guestCountLabel as string}
            guestCountOptions={data.guestCountOptions as number[]}
            fields={data.fields as {
              firstName: string
              lastName: string
              attendance: string
              attendanceYes: string
              attendanceNo: string
              dietary: string
              dietaryOptions: string[]
              songRequest: string
              submitButton: string
            }}
          />
        </div>
      )

    case "footer":
      return (
        <div id={id}>
          <FooterSection
            credit={data.credit as string}
            coupleNames={coupleNames}
          />
        </div>
      )

    default:
      return null
  }
}
