"use client"

import { useEffect, useCallback, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"

interface GallerySectionProps {
  images: string[]
  aspectRatio?: string
}

export default function GallerySection({ images, aspectRatio = "3/4" }: GallerySectionProps) {
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

  return (
    <section className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative mr-[6px] min-w-0 shrink-0 grow-0"
              style={{ flex: "0 0 100%" }}
            >
              <div className="relative w-full" style={{ aspectRatio }}>
                <Image
                  src={src}
                  alt={`Foto de la pareja ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 bg-background py-5">
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
    </section>
  )
}
