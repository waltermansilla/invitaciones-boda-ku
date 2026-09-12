"use client"

import { useFadeIn } from "@/hooks/use-fade-in"
import { RevealContent } from "./animated-section"

interface SpecialMessageSectionProps {
  title: string
  text: string
  signature?: string
  decorativeLines?: boolean
  image?: string
  imageAspectRatio?: string
  /** Igual que bgColor de la sección en el JSON (default primary). */
  sectionBg?: "primary" | "background" | "transparent"
}

export default function SpecialMessageSection({
  title,
  text,
  signature,
  decorativeLines,
  image,
  imageAspectRatio = "3/4",
  sectionBg = "primary",
}: SpecialMessageSectionProps) {
  const { ref, isVisible } = useFadeIn(0.15)
  const onPrimary = sectionBg === "primary"

  return (
    <section
      ref={ref}
      className={`w-full ${onPrimary ? "bg-primary" : "bg-background"}`}
    >
      {image ? (
        <div className="px-4 pt-6 pb-1 sm:px-5 md:px-6">
          <div
            className="relative w-full overflow-hidden rounded-md border border-primary"
            style={{ aspectRatio: imageAspectRatio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ) : null}
      <RevealContent isVisible={isVisible}>
        <div className="px-8 py-16 text-center md:px-12">
        {decorativeLines && (
          <div
            className={`mx-auto mb-6 w-12 border-t ${onPrimary ? "border-primary-foreground/20" : "border-current/20"}`}
          />
        )}
        <h2
          className={`mb-6 text-xl font-semibold tracking-[0.2em] uppercase md:text-2xl ${onPrimary ? "text-primary-foreground" : "text-inherit"}`}
        >
          {title}
        </h2>
        <p
          className={`mx-auto max-w-sm text-sm font-light leading-relaxed ${onPrimary ? "text-primary-foreground/85" : "text-inherit/85"}`}
        >
          {text}
        </p>
        {signature && (
          <p
            className={`mt-6 text-lg font-light italic tracking-wide ${onPrimary ? "text-primary-foreground/70" : "text-inherit/70"}`}
          >
            {"- "}
            {signature}
          </p>
        )}
        {decorativeLines && (
          <div
            className={`mx-auto mt-6 w-12 border-t ${onPrimary ? "border-primary-foreground/20" : "border-current/20"}`}
          />
        )}
        </div>
      </RevealContent>
    </section>
  )
}
