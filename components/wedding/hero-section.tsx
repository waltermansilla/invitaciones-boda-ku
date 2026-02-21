"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface HeroSectionProps {
  coupleImage: string
  headline: string
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

  const items = [
    { value: time?.days ?? 0, label: countdownLabels.days },
    { value: time?.hours ?? 0, label: countdownLabels.hours },
    { value: time?.minutes ?? 0, label: countdownLabels.minutes },
    { value: time?.seconds ?? 0, label: countdownLabels.seconds },
  ]

  return (
    <section className="flex flex-col items-center bg-background">
      {/* Couple photo - full width */}
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
        <Image
          src={coupleImage}
          alt="Foto de la pareja"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Headline */}
      <div className="flex flex-col items-center px-6 pt-10 pb-10">
        <h1
          className="mb-8 text-center text-3xl font-semibold tracking-wide uppercase text-foreground md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {headline}
        </h1>

        {/* Countdown */}
        <div className="flex items-start justify-center gap-2" aria-live="polite">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <span
                  className="text-4xl font-light tabular-nums text-foreground md:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
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
                  className="mt-1 text-[9px] font-medium tracking-[0.15em] uppercase text-muted-foreground"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {item.label}
                </span>
              </div>
              {i < 3 && (
                <span
                  className="mt-1 text-3xl font-light text-foreground/40 md:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
