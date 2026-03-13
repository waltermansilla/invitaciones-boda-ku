"use client";

import { useConfig } from "@/lib/config-context";
import ModalProvider from "./modal-provider";
import HeroOverlay from "./hero-overlay";
import HeroSection from "./hero-section";
import Section from "./section";
import MusicPlayer from "./music-player";

export default function WeddingInvitation() {
    const config = useConfig();
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
                    namesDisplay={
                        (hero as Record<string, unknown>).namesDisplay as
                            | { 
                                enabled: boolean
                                position: "top" | "bottom"
                                font?: string
                                weight?: string
                                size?: string
                                style?: string
                                color?: string
                                decorativeLines?: boolean
                                logo?: string
                                texts?: { text: string; font?: string; weight?: string; size?: string; style?: string }[]
                              }
                            | undefined
                    }
                    countdownPrefix={
                        (hero as Record<string, unknown>).countdownPrefix as
                            | string
                            | undefined
                    }
                    countdownLabels={hero.countdownLabels}
                    countdownStyle={
                        (hero as Record<string, unknown>).countdownStyle as
                            | { 
                                background: "none" | "background" | "primary" | "secondary" | string
                                shape: "rounded" | "circle" | "square" | "pill"
                                layout?: "inline" | "overlay"
                                overlayStyle?: "card" | "floating"
                              }
                            | undefined
                    }
                    countdownAreaBg={
                        (hero as Record<string, unknown>).countdownAreaBg as
                            | "primary" | "background" | string
                            | undefined
                    }
                />

                {/* Dynamic sections: order controlled by array position in JSON */}
                {sections.map((section, index) => {
                    const prev = sections[index - 1]
                    const selfStyledTypes = ["gallery", "closingImage", "footer", "presentation", "specialMessage"]
                    const prevBg = prev && !selfStyledTypes.includes(prev.type) ? (prev.bgColor || "background") : undefined
                    return (
                        <Section
                            key={section.id}
                            section={section}
                            coupleNames={meta.coupleNames}
                            prevBgColor={prevBg}
                        />
                    )
                })}

                {music.enabled && (
                    <MusicPlayer src={music.src} autoplay={music.autoplay} />
                )}
            </main>
        </ModalProvider>
    );
}
