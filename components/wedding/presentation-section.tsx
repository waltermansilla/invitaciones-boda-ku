"use client"

import Image from "next/image"
import { useFadeIn } from "@/hooks/use-fade-in"
import { RevealContent } from "./animated-section"

interface PresentationSectionProps {
  image: string
  name: string
  description: string
  aspectRatio?: string
}

export default function PresentationSection({
  image,
  name,
  description,
  aspectRatio = "3/4",
}: PresentationSectionProps) {
  const isFreeAspect = aspectRatio === "libre"
  const { ref, isVisible } = useFadeIn(0.15)

  return (
    <section ref={ref} className="bg-background">
      <RevealContent isVisible={isVisible}>
        {/* Portrait photo */}
        {isFreeAspect ? (
          <img
            src={image}
            alt={`Foto de ${name}`}
            className="block h-auto w-full"
          />
        ) : (
          <div className="relative w-full" style={{ aspectRatio }}>
            <Image
              src={image}
              alt={`Foto de ${name}`}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Name and description */}
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <div className="mb-4 h-px w-10 bg-primary/30" />
          <h2 className="mb-6 text-3xl font-semibold tracking-[0.2em] uppercase text-foreground sm:text-4xl">
            {name}
          </h2>
          <p className="max-w-sm text-sm font-light leading-relaxed text-foreground/70">
            {description}
          </p>
        </div>
      </RevealContent>
    </section>
  )
}
