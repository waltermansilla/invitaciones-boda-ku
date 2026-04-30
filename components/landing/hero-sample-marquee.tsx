"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Miniatura del panel (u otra captura “panel.*”) — no va en el carrusel del hero. */
export function isExcludedHeroMarqueeAsset(src: string): boolean {
    const file = src.split("/").pop() ?? "";
    return /^panel\./i.test(file);
}

/** Sin URLs duplicadas, mismo orden que en entrada (primera aparición gana). */
function uniqueSrcs(srcs: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of srcs) {
        const s = raw.trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

/**
 * Si existe la captura “normal” (misma ruta sin `-overlay`), no mostrar el overlay.
 */
function withoutRedundantOverlays(srcs: string[]): string[] {
    const set = new Set(srcs);
    return srcs.filter((src) => {
        const m = src.match(/^(.*)-overlay\.(jpe?g|png|webp)$/i);
        if (!m) return true;
        const prefix = m[1];
        const candidates = [".jpg", ".jpeg", ".png", ".webp"].map(
            (ext) => prefix + ext,
        );
        return !candidates.some((c) => set.has(c));
    });
}

function cleanMarqueeSrcs(srcs: string[]): string[] {
    return withoutRedundantOverlays(uniqueSrcs(srcs)).filter(
        (s) => !isExcludedHeroMarqueeAsset(s),
    );
}

/** Suavidad tipo smoothstep para el zoom “carrusel” hacia el centro. */
function smooth01(t: number): number {
    const u = Math.max(0, Math.min(1, t));
    return u * u * (3 - 2 * u);
}

/** Velocidad similar al scroll automático anterior (~px/s de “lectura” del carrusel). */
const MARQUEE_PX_PER_SEC = 42;
/** Ancho medio por miniatura + gap (aprox.) para estimar duración del bucle. */
const EST_SLOT_PX = 128;

/**
 * Cuántas miniaturas muestra el carrusel en un ciclo (1…N, luego otra vez 1…N vía `[tiles, tiles]`).
 * El resto de URLs que envía la home no se usan aquí.
 */
export const HERO_MARQUEE_VISIBLE_COUNT = 13;

function sliceMarqueeTiles(cleaned: string[]): string[] {
    return cleaned.slice(0, HERO_MARQUEE_VISIBLE_COUNT);
}

/**
 * Carrusel horizontal automático (CSS), sin scroll ni arrastre: la tira se mueve sola.
 */
export function HeroSampleMarquee({ imageSrcs }: { imageSrcs: string[] }) {
    const cleaned = cleanMarqueeSrcs(imageSrcs);
    /** Orden de entrada; solo las primeras `HERO_MARQUEE_VISIBLE_COUNT`; bucle = esa tira duplicada. */
    const [tiles, setTiles] = useState<string[]>(() =>
        sliceMarqueeTiles(cleaned),
    );
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const next = cleanMarqueeSrcs(imageSrcs);
        if (next.length === 0) return;
        setTiles(sliceMarqueeTiles(next));
    }, [imageSrcs]);

    useEffect(() => {
        if (cleaned.length === 0) return;
        if (typeof window === "undefined") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const minScale = 0.85;
        const minOpacity = 0.9;

        let raf = 0;
        const tick = () => {
            const track = trackRef.current;
            if (track) {
                const mid = window.innerWidth * 0.5;
                const falloff = Math.max(260, window.innerWidth * 0.46);
                const arcPx = window.innerWidth < 640 ? 5 : 7;
                const slots = track.querySelectorAll<HTMLElement>(
                    "[data-marquee-slot]",
                );
                slots.forEach((slot) => {
                    const inner = slot.querySelector<HTMLElement>(
                        "[data-marquee-card]",
                    );
                    if (!inner) return;
                    const r = slot.getBoundingClientRect();
                    if (r.width < 2) return;
                    const cx = r.left + r.width * 0.5;
                    const dist = Math.abs(cx - mid);
                    const u = Math.min(1, dist / falloff);
                    const s = smooth01(u);
                    const scale = 1 - (1 - minScale) * s;
                    const opacity = 1 - (1 - minOpacity) * s;
                    const liftY = arcPx * (2 * s - 1);
                    inner.style.transform = `translateY(${liftY}px) scale(${scale})`;
                    inner.style.opacity = String(opacity);
                });
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [cleaned.length, tiles]);

    if (cleaned.length === 0) return null;

    const halfWidthPx = Math.max(40, tiles.length * EST_SLOT_PX);
    const loopDurationSec = Math.max(
        12,
        halfWidthPx / MARQUEE_PX_PER_SEC,
    );

    const sequence = [...tiles, ...tiles];

    const slotClass =
        "flex min-h-[190px] w-[95px] shrink-0 items-center justify-center overflow-visible py-1 sm:min-h-[212px] sm:w-[106px] md:min-h-[230px] md:w-[115px]";
    const cardClass =
        "relative h-[168px] w-[95px] origin-center overflow-hidden rounded-xl border-b border-l border-solid border-[#4A3A2F]/18 bg-transparent shadow-[0_1px_2px_rgba(74,58,47,0.06),-1px_0_2px_rgba(74,58,47,0.05)] will-change-transform sm:h-[188px] sm:w-[106px] sm:rounded-2xl sm:border-[#4A3A2F]/20 sm:shadow-[0_1px_3px_rgba(74,58,47,0.07),-1px_0_3px_rgba(74,58,47,0.06)] md:h-[204px] md:w-[115px]";

    return (
        <div
            className="pointer-events-none select-none overflow-visible bg-transparent"
            aria-hidden
        >
            <div className="relative max-w-full overflow-x-hidden overflow-y-visible bg-transparent pt-3.5 pb-4 sm:pt-5 sm:pb-5">
                <div
                    ref={trackRef}
                    className="hero-sample-marquee-track flex w-max items-center gap-6 sm:gap-8 md:gap-10"
                    style={{
                        animationDuration: `${loopDurationSec}s`,
                    }}
                >
                    {sequence.map((src, i) => (
                        <div
                            key={`${i}-${src}`}
                            className={slotClass}
                            data-marquee-slot
                        >
                            <div
                                data-marquee-card
                                className={cardClass}
                                style={{
                                    transform: "translateY(0px) scale(1)",
                                    opacity: 1,
                                }}
                            >
                                <Image
                                    src={src}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100px, 120px"
                                    draggable={false}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
