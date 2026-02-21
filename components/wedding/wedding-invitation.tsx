"use client"

import config from "@/data/wedding-config.json"
import HeroSection from "./hero-section"
import Section from "./section"
import MusicPlayer from "./music-player"

export default function WeddingInvitation() {
  const hero = config.hero
  const sections = config.sections ?? []
  const meta = config.meta
  const music = config.music

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background">
      {/* Hero is always rendered first, outside the dynamic sections array */}
      <HeroSection
        coupleImage={hero.coupleImage}
        groomName={meta.coupleNames.groomName}
        brideName={meta.coupleNames.brideName}
        headline={hero.headline}
        eventDate={hero.eventDate}
        countdownLabels={hero.countdownLabels}
      />

      {/* Dynamic sections: order controlled by array position in JSON */}
      {sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          coupleNames={meta.coupleNames}
        />
      ))}

      {music.enabled && (
        <MusicPlayer src={music.src} autoplay={music.autoplay} />
      )}
    </main>
  )
}
