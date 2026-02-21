"use client"

import config from "@/data/wedding-config.json"
import HeroSection from "./hero-section"
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
import MusicPlayer from "./music-player"

type SectionKey = (typeof config.sectionsOrder)[number]

const sectionComponents: Record<SectionKey, () => React.ReactNode> = {
  hero: () => <HeroSection {...config.hero} />,
  quote: () => <QuoteSection {...config.quote} />,
  eventInfo: () => <EventInfoSection {...config.eventInfo} />,
  gallery: () => <GallerySection {...config.gallery} />,
  itinerary: () => <ItinerarySection {...config.itinerary} />,
  photos: () => <PhotosSection {...config.photos} />,
  giftCard: () => <GiftCardSection {...config.giftCard} />,
  honeymoon: () => <HoneymoonSection {...config.honeymoon} />,
  dressCode: () => <DressCodeSection {...config.dressCode} />,
  emotionalQuote: () => <EmotionalQuoteSection {...config.emotionalQuote} />,
  trivia: () => <TriviaSection {...config.trivia} />,
  rsvp: () => <RSVPSection {...config.rsvp} />,
  footer: () => <FooterSection {...config.footer} />,
}

export default function WeddingInvitation() {
  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background">
      {config.sectionsOrder.map((sectionKey) => {
        const renderSection = sectionComponents[sectionKey as SectionKey]
        if (!renderSection) return null
        return (
          <div key={sectionKey}>
            {renderSection()}
          </div>
        )
      })}

      {config.music.enabled && (
        <MusicPlayer src={config.music.src} autoplay={config.music.autoplay} />
      )}
    </main>
  )
}
