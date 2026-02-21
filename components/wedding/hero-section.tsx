"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"

interface HeroSectionProps {
  coupleImage: string
  headline: string
  enterButtonText: string
  countdownPrefix: string
  eventDate: string
  countdownLabels: {
    days: string
    hours: string
    minutes: string
    seconds: string
  }
}

function getTimeRemaining(targetDate: string) {
  const total = new Date(targetDate).getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  return { days, hours, minutes, seconds }
}

export default function HeroSection({
  coupleImage,
  headline,
  enterButtonText,
  countdownPrefix,
  eventDate,
  countdownLabels,
}: HeroSectionProps) {
  const [time, setTime] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    setTime(getTimeRemaining(eventDate))
    const interval = setInterval(() => {
      setTime(getTimeRemaining(eventDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [eventDate])

  const handleEnter = () => {
    const firstSection = document.querySelector("main > div:nth-child(2)")
    if (firstSection) {
      firstSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="flex min-h-svh flex-col items-center justify-center px-6 py-12 text-center">
      {/* Image - square with slightly rounded corners */}
      <div className="relative mb-8 aspect-square w-[280px] overflow-hidden rounded-2xl md:w-[340px]">
        <Image
          src={coupleImage}
          alt="Foto de la pareja"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Headline */}
      <h1
        className="mb-6 text-4xl font-light tracking-[0.15em] uppercase text-foreground md:text-5xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {headline}
      </h1>

      {/* Enter button */}
      <button
        onClick={handleEnter}
        className="mb-12 flex min-h-[48px] flex-col items-center gap-1 bg-transparent text-foreground transition-opacity hover:opacity-70"
        aria-label={enterButtonText}
      >
        <span
          className="text-xs font-medium tracking-[0.25em] uppercase"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {enterButtonText}
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce" strokeWidth={1.5} />
      </button>

      {/* Countdown prefix */}
      <p
        className="mb-4 text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {countdownPrefix}
      </p>

      {/* Countdown */}
      <div className="flex items-center gap-4" aria-live="polite">
        {[
          { value: time?.days ?? 0, label: countdownLabels.days },
          { value: time?.hours ?? 0, label: countdownLabels.hours },
          { value: time?.minutes ?? 0, label: countdownLabels.minutes },
          { value: time?.seconds ?? 0, label: countdownLabels.seconds },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span
                className="text-3xl font-light tabular-nums text-foreground md:text-4xl"
                style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
                suppressHydrationWarning
              >
                {time
                  ? String(item.value).padStart(
                      item.label === countdownLabels.days ? 1 : 2,
                      "0"
                    )
                  : "--"}
              </span>
              <span
                className="mt-1 text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {item.label}
              </span>
            </div>
            {i < 3 && (
              <span
                className="mb-4 text-xl font-light text-muted-foreground/50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
