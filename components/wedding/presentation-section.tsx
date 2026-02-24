"use client"

import Image from "next/image"

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
  return (
    <section className="bg-background">
      {/* Portrait photo */}
      <div className="relative w-full" style={{ aspectRatio }}>
        <Image
          src={image}
          alt={`Foto de ${name}`}
          fill
          className="object-cover"
        />
      </div>

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
    </section>
  )
}
