"use client"

import { useFadeIn } from "@/hooks/use-fade-in"
import { RevealContent } from "./animated-section"
import { LogoByLogoRow } from "./logo-by-logo-row"

type LogoRowSectionProps = {
  title?: string
  headline?: string
  byText?: string
  logos: string[]
}

export default function LogoRowSection({
  title,
  headline,
  byText,
  logos,
}: LogoRowSectionProps) {
  const { ref, isVisible } = useFadeIn(0.15)
  const items = logos.filter(Boolean)

  if (items.length === 0) return null

  return (
    <section ref={ref} className="px-8 py-14 text-center md:px-12">
      <RevealContent isVisible={isVisible}>
        {headline ? (
          <p className="mb-8 font-light tracking-[0.12em] text-inherit/80 md:text-lg">
            {headline}
          </p>
        ) : null}
        {title ? (
          <p className="mb-6 text-center text-[11px] font-semibold tracking-[0.25em] uppercase text-inherit/50">
            {title}
          </p>
        ) : null}
        <LogoByLogoRow
          logos={items}
          byText={byText}
          logoWrapClassName="flex h-16 min-w-[100px] flex-1 items-center justify-center sm:h-20"
          logoImgClassName="max-h-full max-w-[180px] object-contain"
        />
      </RevealContent>
    </section>
  )
}
