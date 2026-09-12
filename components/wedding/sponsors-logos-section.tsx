"use client"

import { useFadeIn } from "@/hooks/use-fade-in"
import { RevealContent } from "./animated-section"

export type SponsorLogoItem =
  | string
  | { src: string; /** Rellena el cuadrado recortando si hace falta. Default: contain */ fit?: "contain" | "cover" }

function normalizeLogo(item: SponsorLogoItem): {
  src: string
  fit: "contain" | "cover"
} {
  if (typeof item === "string") return { src: item, fit: "contain" }
  return { src: item.src, fit: item.fit ?? "contain" }
}

type SponsorsLogosSectionProps = {
  title: string
  description?: string
  logos: SponsorLogoItem[]
}

export default function SponsorsLogosSection({
  title,
  description,
  logos,
}: SponsorsLogosSectionProps) {
  const { ref, isVisible } = useFadeIn(0.15)
  const items = logos.filter(Boolean).slice(0, 4).map(normalizeLogo)

  return (
    <section ref={ref} className="py-14 text-center">
      <RevealContent isVisible={isVisible}>
        <div className="px-8 md:px-12">
          <h2 className="mb-2 text-xl font-semibold tracking-[0.2em] uppercase md:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto mb-8 max-w-md text-sm font-light leading-relaxed opacity-80">
              {description}
            </p>
          ) : (
            <div className="mb-8" />
          )}
        </div>
        <div className="grid w-full grid-cols-2 gap-0">
          {items.map((item) => (
            <div
              key={item.src}
              className="relative aspect-square w-full overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className={`absolute inset-0 h-full w-full ${item.fit === "cover" ? "object-cover" : "object-contain"}`}
              />
            </div>
          ))}
        </div>
      </RevealContent>
    </section>
  )
}
