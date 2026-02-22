"use client"

import config from "@/data/wedding-config.json"
import ModalProvider from "./modal-provider"
import HeroOverlay from "./hero-overlay"
import HeroSection from "./hero-section"
import Section from "./section"
import MusicPlayer from "./music-player"
import ScrollNightMode from "./scroll-night-mode"

export default function WeddingInvitation() {
  const hero = config.hero
  const sections = config.sections ?? []
  const meta = config.meta
  const music = config.music
  const overlay = config.overlay
  const theme = config.theme as Record<string, unknown>

  return (
    <ModalProvider>
      <ScrollNightMode
        lightColor={(theme.backgroundColor as string) || "#FAF8F5"}
        darkColor={(theme.nightColor as string) || "#2C3527"}
        lightTextColor={(theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"}
        darkTextColor={(theme.nightTextColor as string) || "#D4C9A8"}
        intensity={typeof theme.nightIntensity === "number" ? (theme.nightIntensity as number) : 0.85}
      />
      <main
        className="mx-auto min-h-screen max-w-lg md:max-w-xl lg:max-w-2xl"
        style={{
          "--scroll-progress": "0",
          "--night-bg": (theme.backgroundColor as string) || "#FAF8F5",
          "--night-text": (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E",
        } as React.CSSProperties}
      >
        {/* Fullscreen entry overlay */}
        {overlay.enabled && (
          <HeroOverlay
            groomName={meta.coupleNames.groomName}
            brideName={meta.coupleNames.brideName}
            separator={meta.coupleNames.separator}
            phrase={overlay.phrase}
            buttonText={overlay.buttonText}
          />
        )}

        {/* Hero is always rendered first */}
        <HeroSection
          coupleImage={hero.coupleImage}
          headline={hero.headline}
          eventDate={hero.eventDate}
          groomName={meta.coupleNames.groomName}
          brideName={meta.coupleNames.brideName}
          separator={meta.coupleNames.separator}
          showNamesOnPhoto={(hero as Record<string, unknown>).showNamesOnPhoto as boolean | undefined}
          countdownPrefix={(hero as Record<string, unknown>).countdownPrefix as string | undefined}
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
    </ModalProvider>
  )
}
