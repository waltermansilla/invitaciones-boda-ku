"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConfig, useIsMuestra } from "@/lib/config-context";
import ModalProvider from "./modal-provider";
import HeroOverlay from "./hero-overlay";
import HeroSection from "./hero-section";
import Section from "./section";
import FooterSection from "./footer-section";
import MusicPlayer from "./music-player";

interface InvitadoData {
    id: string;
    nombre: string;
    tipo: "persona" | "familia";
    estado: "pendiente" | "confirmado" | "no_asiste";
    integrantes?: { id: string; nombre: string; estado: string }[];
}

function WeddingInvitationContent() {
    const config = useConfig();
    const isMuestra = useIsMuestra();
    const searchParams = useSearchParams();
    const codigoInvitado = searchParams.get("i") || searchParams.get("c") || "";
    const skipOverlay =
        searchParams.get("enter") === "1" ||
        searchParams.get("noOverlay") === "1";
    const hero = config.hero;
    const sections = config.sections ?? [];
    // El pie de marca es global (landing); si el JSON aún trae type "footer", no lo duplicamos.
    const sectionsForLayout = sections.filter(
        (s) => (s as { type?: string }).type !== "footer",
    );
    const footerConfig = config.footer as { enabled?: boolean } | undefined;
    const footerSectionOverride = sections.find(
        (s) => (s as { type?: string }).type === "footer",
    ) as { enabled?: boolean } | undefined;
    const showFooter =
        footerConfig?.enabled !== false && footerSectionOverride?.enabled !== false;
    const meta = config.meta;
    const music = config.music;
    const overlay = config.overlay;
    const rsvpPanel = config.rsvpPanel as
        | {
              enabled?: boolean;
              panelId?: string;
              confirmationMessage?: string;
              confirmacion?: "formulario" | "comun";
          }
        | undefined;
    
    // Datos del invitado (cuando viene con código)
    const [invitado, setInvitado] = useState<InvitadoData | null>(null);
    const [loadingInvitado, setLoadingInvitado] = useState(!!codigoInvitado && !!rsvpPanel?.enabled);
    
    // Track if overlay has been dismissed
    const [overlayDismissed, setOverlayDismissed] = useState(false);
    
    // Track if music should start (triggered by overlay dismiss when autoplay is true)
    const [shouldPlayMusic, setShouldPlayMusic] = useState(false);
    
    // Obtener datos del invitado si hay código
    useEffect(() => {
        if (codigoInvitado && rsvpPanel?.enabled) {
            setLoadingInvitado(true);
            fetch(`/api/rsvp/${codigoInvitado}`)
                .then(res => res.json())
                .then(data => {
                    if (data.invitado) {
                        setInvitado(data.invitado);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingInvitado(false));
        }
    }, [codigoInvitado, rsvpPanel?.enabled]);

    // Si hay código y estamos cargando, mostrar pantalla de carga en lugar del overlay
    const showOverlay =
        overlay.enabled && !overlayDismissed && !loadingInvitado && !skipOverlay;
    const shouldBlockMainUntilEntry =
        overlay.enabled && !overlayDismissed && !skipOverlay;

    const overlayWantsFullBleedEntry =
        overlay.enabled === true && !skipOverlay;

    // Si el overlay está activo, al recargar siempre arrancamos desde arriba.
    // Si overlay.enabled !== true, no forzamos scroll aquí (trabajo operativo / sin pantalla de ingreso).
    useEffect(() => {
        if (!overlayWantsFullBleedEntry) return;
        if (typeof window === "undefined") return;

        const previousScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";
        window.scrollTo(0, 0);

        return () => {
            window.history.scrollRestoration = previousScrollRestoration;
        };
    }, [overlayWantsFullBleedEntry]);

    // Sin overlay de ingreso: el navegador a veces no restaura bien el scroll al recargar
    // (p. ej. smooth scroll en html + hidratación). Guardamos en pagehide y reaplicamos en reload.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const path = window.location.pathname + window.location.search;
        const key = `mu:inv-scroll:${path}`;

        if (overlayWantsFullBleedEntry) {
            try {
                sessionStorage.removeItem(key);
            } catch {
                /* private mode / quota */
            }
            return;
        }

        const nav = performance.getEntriesByType(
            "navigation",
        )[0] as PerformanceNavigationTiming | undefined;
        const hasMeaningfulHash =
            typeof window.location.hash === "string" &&
            window.location.hash.length > 1;

        if (nav?.type === "reload" && !hasMeaningfulHash) {
            try {
                const raw = sessionStorage.getItem(key);
                if (raw != null) {
                    const y = Number.parseInt(raw, 10);
                    if (!Number.isNaN(y) && y > 0) {
                        const scrollInstant = (top: number) => {
                            const html = document.documentElement;
                            const prev = html.style.scrollBehavior;
                            html.style.scrollBehavior = "auto";
                            try {
                                window.scrollTo({
                                    top,
                                    left: 0,
                                    behavior: "instant",
                                });
                            } catch {
                                window.scrollTo(0, top);
                            }
                            html.style.scrollBehavior = prev;
                        };
                        const apply = () => scrollInstant(y);
                        apply();
                        requestAnimationFrame(apply);
                        [50, 200, 500].forEach((ms) => {
                            window.setTimeout(apply, ms);
                        });
                    }
                }
            } catch {
                /* ignore */
            }
        } else if (nav?.type === "navigate") {
            try {
                sessionStorage.removeItem(key);
            } catch {
                /* ignore */
            }
        }

        const persist = () => {
            try {
                sessionStorage.setItem(key, String(window.scrollY));
            } catch {
                /* ignore */
            }
        };
        window.addEventListener("pagehide", persist);
        window.addEventListener("beforeunload", persist);

        return () => {
            window.removeEventListener("pagehide", persist);
            window.removeEventListener("beforeunload", persist);
        };
    }, [overlayWantsFullBleedEntry]);

    // Deep link (#section-id): el scroll nativo del navegador corre antes de que existan
    // los nodos client-side; en producción suele fallar. Reintentamos tras hidratar y cuando
    // el overlay ya no tapa el contenido.
    useEffect(() => {
        if (showOverlay) return;

        const scrollToHash = () => {
            const raw = window.location.hash;
            if (!raw || raw.length <= 1) return;
            const id = decodeURIComponent(raw.slice(1));
            if (!id) return;
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };

        scrollToHash();
        const timeouts = [50, 200, 500, 1000].map((ms) =>
            window.setTimeout(() => scrollToHash(), ms),
        );
        const onHashChange = () => scrollToHash();
        window.addEventListener("hashchange", onHashChange);

        return () => {
            timeouts.forEach(clearTimeout);
            window.removeEventListener("hashchange", onHashChange);
        };
    }, [showOverlay]);

    // Bloquear scroll del documento mientras el overlay está visible.
    // Evita que se desplace el contenido de fondo antes de presionar "Ingresar".
    useEffect(() => {
        if (!showOverlay) return;

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;
        const previousBodyTouchAction = document.body.style.touchAction;

        window.scrollTo(0, 0);
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
            document.body.style.touchAction = previousBodyTouchAction;
        };
    }, [showOverlay]);

    // Handle overlay dismiss - start music if autoplay is enabled (not in muestra mode)
    const handleOverlayDismiss = () => {
        setOverlayDismissed(true);
        if (music.autoplay && !isMuestra) {
            setShouldPlayMusic(true);
        }
    };

    return (
        <ModalProvider>
            {/* Fullscreen entry overlay - OUTSIDE main so it's always visible */}
            {showOverlay && (
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
                    textPositionsPx={(overlay as Record<string, unknown>).textPositionsPx as {
                        brideY?: number | string
                        separatorY?: number | string
                        groomY?: number | string
                        phraseY?: number | string
                        topLineY?: number | string
                        bottomLineY?: number | string
                        buttonY?: number | string
                    } | undefined}
                    invitado={invitado}
                />
            )}
            {shouldBlockMainUntilEntry && loadingInvitado && (
                <div className="fixed inset-0 z-[9998] bg-[#F7F3EE]" />
            )}

            {/* Hide main content until overlay is dismissed - fade in when overlay exits */}
            <main 
                className="mx-auto min-h-screen max-w-lg md:max-w-xl lg:max-w-2xl transition-opacity duration-700 ease-out"
                style={{ 
                    opacity: shouldBlockMainUntilEntry ? 0 : 1,
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
                    showCountdown={
                        (hero as Record<string, unknown>).showCountdown as
                            | boolean
                            | undefined
                    }
                    vignette={
                        (hero as Record<string, unknown>).vignette as
                            | { enabled?: boolean; opacity?: number }
                            | undefined
                    }
                />

                {/* Dynamic sections: order controlled by array position in JSON */}
                {/* Group consecutive sections with same bgImage */}
                {(() => {
                    const theme = config.theme as Record<string, unknown>
                    const groups: { bgImage: string | null; sections: typeof sectionsForLayout }[] = []
                    
                    sectionsForLayout.forEach((section) => {
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
                                        const selfStyledTypes = ["gallery", "closingImage", "presentation", "specialMessage"]
                                        const prevBg = prev && !selfStyledTypes.includes(prev.type) ? (prev.bgColor || "background") : undefined
                                        const inheritedTextColor =
                                            section.textColor ||
                                            (section.bgColor === "primary"
                                                ? ((theme.darkBgTextColor as string) ||
                                                  "#FFFFFF")
                                                : ((theme.lightBgTextColor as string) ||
                                                  (theme.primaryColor as string) ||
                                                  "#6B7F5E"))
                                        return (
                                            <Section
                                                key={section.id}
                                                section={{
                                                    ...section,
                                                    bgImage: undefined,
                                                    bgColor: "transparent",
                                                    textColor: inheritedTextColor,
                                                }} // Remove bgImage and make transparent since parent has bg
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
                                const globalIndex = sectionsForLayout.indexOf(section)
                                const prev = sectionsForLayout[globalIndex - 1]
                                const selfStyledTypes = ["gallery", "closingImage", "presentation", "specialMessage"]
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

                {showFooter && <FooterSection />}

                {music.enabled && (
                    <MusicPlayer 
                        src={music.src} 
                        startTime={(music as Record<string, unknown>).startTime as number | undefined}
                        endTime={(music as Record<string, unknown>).endTime as number | undefined}
                        triggerPlay={shouldPlayMusic}
                    />
                )}
            </main>
        </ModalProvider>
    );
}

export default function WeddingInvitation() {
    return (
        <Suspense fallback={null}>
            <WeddingInvitationContent />
        </Suspense>
    );
}
