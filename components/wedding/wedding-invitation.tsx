"use client";

import { useState } from "react";
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
    
    // Track if overlay has been dismissed
    const [overlayDismissed, setOverlayDismissed] = useState(false);
    
    // Track if music should start (triggered by overlay dismiss when autoplay is true)
    const [shouldPlayMusic, setShouldPlayMusic] = useState(false);
    
    // Handle overlay dismiss - start music if autoplay is enabled
    const handleOverlayDismiss = () => {
        setOverlayDismissed(true);
        if (music.autoplay) {
            setShouldPlayMusic(true);
        }
    };

    return (
        <ModalProvider>
            {/* Fullscreen entry overlay - OUTSIDE main so it's always visible */}
            {overlay.enabled && (
                <HeroOverlay
                    onDismiss={handleOverlayDismiss}
                    groomName={meta.coupleNames.groomName}
                    brideName={meta.coupleNames.brideName}
                    separator={meta.coupleNames.separator}
                    phrase={overlay.phrase}
                    buttonText={overlay.buttonText}
                    bgColor={(overlay as Record<string, unknown>).bgColor as string | undefined}
                    bgImage={(overlay as Record<string, unknown>).bgImage as string | undefined}
                    showNames={(overlay as Record<string, unknown>).showNames as boolean | undefined}
                    showPhrase={(overlay as Record<string, unknown>).showPhrase as boolean | undefined}
                    nameStyle={(overlay as Record<string, unknown>).nameStyle as { font?: string; size?: string; weight?: string; color?: string } | undefined}
                    buttonPosition={(overlay as Record<string, unknown>).buttonPosition as "center" | "top" | "bottom" | number | undefined}
                />
            )}

            {/* Hide main content until overlay is dismissed */}
            <main 
                className="mx-auto min-h-screen max-w-lg md:max-w-xl lg:max-w-2xl"
                style={{ 
                    visibility: overlay.enabled && !overlayDismissed ? "hidden" : "visible",
                    opacity: overlay.enabled && !overlayDismissed ? 0 : 1,
                }}
            >
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
                {/* Group consecutive sections with same bgImage */}
                {(() => {
                    const theme = config.theme as Record<string, unknown>
                    const groups: { bgImage: string | null; sections: typeof sections }[] = []
                    
                    sections.forEach((section) => {
                        let resolvedBgImage = section.bgImage
                        if (section.bgImage === "backgroundImage") {
                            resolvedBgImage = (theme.backgroundImage as string) || undefined
                        } else if (section.bgImage === "primaryImage") {
                            resolvedBgImage = (theme.primaryImage as string) || undefined
                        }
                        
                        const lastGroup = groups[groups.length - 1]
                        if (lastGroup && lastGroup.bgImage && lastGroup.bgImage === resolvedBgImage) {
                            // Continue same group
                            lastGroup.sections.push(section)
                        } else {
                            // Start new group
                            groups.push({ bgImage: resolvedBgImage || null, sections: [section] })
                        }
                    })
                    
                    return groups.map((group, groupIndex) => {
                        if (group.bgImage && group.sections.length > 1) {
                            // Render grouped sections with shared background
                            return (
                                <div
                                    key={`group-${groupIndex}`}
                                    style={{
                                        backgroundImage: `url(${group.bgImage})`,
                                        backgroundRepeat: "repeat",
                                        backgroundSize: "100% auto",
                                        backgroundPosition: "top center",
                                    }}
                                >
                                    {group.sections.map((section, index) => {
                                        const prev = group.sections[index - 1]
                                        const selfStyledTypes = ["gallery", "closingImage", "footer", "presentation", "specialMessage"]
                                        const prevBg = prev && !selfStyledTypes.includes(prev.type) ? (prev.bgColor || "background") : undefined
                                        return (
                                            <Section
                                                key={section.id}
                                                section={{ ...section, bgImage: undefined, bgColor: "transparent" }} // Remove bgImage and make transparent since parent has bg
                                                coupleNames={meta.coupleNames}
                                                prevBgColor={prevBg}
                                                prevBgImage={undefined}
                                            />
                                        )
                                    })}
                                </div>
                            )
                        } else {
                            // Single section or no bgImage
                            return group.sections.map((section, index) => {
                                const globalIndex = sections.indexOf(section)
                                const prev = sections[globalIndex - 1]
                                const selfStyledTypes = ["gallery", "closingImage", "footer", "presentation", "specialMessage"]
                                const prevBg = prev && !selfStyledTypes.includes(prev.type) ? (prev.bgColor || "background") : undefined
                                const prevBgImg = prev && !selfStyledTypes.includes(prev.type) ? prev.bgImage : undefined
                                return (
                                    <Section
                                        key={section.id}
                                        section={section}
                                        coupleNames={meta.coupleNames}
                                        prevBgColor={prevBg}
                                        prevBgImage={prevBgImg}
                                    />
                                )
                            })
                        }
                    })
                })()}

                {music.enabled && (
                    <MusicPlayer 
                        src={music.src} 
                        startTime={(music as Record<string, unknown>).startTime as number | undefined}
                        triggerPlay={shouldPlayMusic}
                    />
                )}
            </main>
        </ModalProvider>
    );
}
