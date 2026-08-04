"use client"

import { useEffect, useCallback, useState, type CSSProperties } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import { useFadeIn } from "@/hooks/use-fade-in"
import { RevealContent } from "./animated-section"

interface GallerySectionProps {
  images: string[]
  aspectRatio?: string
  /**
   * Modo de fondo: 'primary' | 'background' | 'transparent'.
   * Default 'background' → color theme.backgroundColor (CSS --background).
   */
  sectionBgColor?: string
  /** Color de fondo real (hex/CSS). Solo pinta; el texto/indicadores siguen el theme. */
  bgColorTheme?: string
  /** Imagen de fondo detrás del slider (se ve antes del reveal de las fotos). */
  bgImage?: string
}

export default function GallerySection({
  images,
  aspectRatio = "3/4",
  sectionBgColor = "background",
  bgColorTheme,
  bgImage,
}: GallerySectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
  })
  const [activeIndex, setActiveIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setActiveIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  const { ref, isVisible } = useFadeIn(0.12)

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    onSelect()

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 3000)

    return () => {
      clearInterval(interval)
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  if (!images || images.length === 0) return null
  const isFreeAspect = aspectRatio === "libre"

  const bgPaint =
    typeof bgColorTheme === "string" && bgColorTheme.trim()
      ? bgColorTheme.trim()
      : undefined
  const hasBgImage = Boolean(bgImage?.trim())
  // Default: theme background (antes era transparente → se veía blanco al hide de las fotos)
  const sectionBgClass =
    hasBgImage || bgPaint
      ? sectionBgColor === "transparent"
        ? "bg-transparent"
        : ""
      : sectionBgColor === "primary"
        ? "bg-primary"
        : sectionBgColor === "transparent"
          ? "bg-transparent"
          : "bg-background"

  const sectionBgStyle: CSSProperties = hasBgImage
    ? {
        backgroundImage: `url(${bgImage!.trim()})`,
        backgroundRepeat: "repeat",
        backgroundSize: "100% auto",
        backgroundPosition: "top center",
      }
    : bgPaint
      ? { backgroundColor: bgPaint }
      : {}

  return (
    <section
      ref={ref}
      className={`w-full ${sectionBgClass}`}
      style={sectionBgStyle}
    >
      <RevealContent isVisible={isVisible}>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((src, index) => (
              <div
                key={index}
                className="relative mr-[6px] min-w-0 shrink-0 grow-0"
                style={{ flex: "0 0 100%" }}
              >
                {isFreeAspect ? (
                  <img
                    src={src}
                    alt={`Foto de la pareja ${index + 1}`}
                    className="block h-auto w-full"
                  />
                ) : (
                  <div className="relative w-full" style={{ aspectRatio }}>
                    <Image
                      src={src}
                      alt={`Foto de la pareja ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 bg-transparent py-5">
            {images.map((_, index) => (
              <button
                key={index}
                aria-label={`Ir a foto ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === activeIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-primary/25"
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
              />
            ))}
          </div>
        )}
      </RevealContent>
    </section>
  )
}
