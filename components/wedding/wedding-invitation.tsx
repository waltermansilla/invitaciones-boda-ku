"use client";

import config from "@/data/anto-walter-config.json";
import ModalProvider from "./modal-provider";
import HeroOverlay from "./hero-overlay";
import HeroSection from "./hero-section";
import Section from "./section";
import MusicPlayer from "./music-player";

export default function WeddingInvitation() {
    const hero = config.hero;
    const sections = config.sections ?? [];
    const meta = config.meta;
    const music = config.music;
    const overlay = config.overlay;

    return (
        <ModalProvider>
            <main className="mx-auto min-h-screen max-w-lg md:max-w-xl lg:max-w-2xl">
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
                    showNamesOnPhoto={
                        (hero as Record<string, unknown>).showNamesOnPhoto as
                            | boolean
                            | undefined
                    }
                    countdownPrefix={
                        (hero as Record<string, unknown>).countdownPrefix as
                            | string
                            | undefined
                    }
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
    );
}
