"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import config from "@/data/wedding-config.json"

interface HeroSectionProps {
  coupleImage: string
  headline: string
  eventDate: string
  groomName: string
  brideName: string
  separator: string
  showNamesOnPhoto?: boolean
  countdownPrefix?: string
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
  groomName,
  brideName,
  separator,
  showNamesOnPhoto = true,
  countdownPrefix,
  countdownLabels,
}: HeroSectionProps) {
  const theme = config.theme as Record<string, unknown>
  const textColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"
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
      {/* Couple photo with names overlaid */}
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
        <Image
          src={coupleImage}
          alt="Foto de la pareja"
          fill
          className="object-cover"
          priority
        />
        {showNamesOnPhoto && (
          <>
            {/* Subtle gradient overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {/* Names on the photo */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-10">
              <p className="text-center text-3xl font-extralight tracking-[0.25em] uppercase text-white/90 sm:text-4xl md:text-5xl">
                {brideName}
              </p>
              <span className="my-1 text-lg font-extralight tracking-[0.3em] text-white/60 sm:text-xl md:text-2xl">
                {separator}
              </span>
              <p className="text-center text-3xl font-extralight tracking-[0.25em] uppercase text-white/90 sm:text-4xl md:text-5xl">
                {groomName}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Headline + Countdown below photo */}
      <div className="flex flex-col items-center px-6 pt-10 pb-10" style={{ color: textColor }}>
        <h1 className="mb-8 text-center text-3xl font-light tracking-wide uppercase text-inherit md:text-4xl">
          {headline}
        </h1>

        {/* Countdown prefix */}
        {countdownPrefix && (
          <p className="mb-4 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/60">
            {countdownPrefix}
          </p>
        )}

        {/* Countdown */}
        <div className="flex items-start justify-center gap-2" aria-live="polite">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <span
                  className="text-4xl font-light tabular-nums text-inherit md:text-5xl"
                  suppressHydrationWarning
                >
                  {time
                    ? String(item.value).padStart(
                        item.label === countdownLabels.days ? 1 : 2,
                        "0"
                      )
                    : "--"}
                </span>
                <span className="mt-1 text-[9px] font-medium tracking-[0.15em] uppercase text-inherit/50">
                  {item.label}
                </span>
              </div>
              {i < 3 && (
                <span className="mt-1 text-3xl font-light text-inherit/40 md:text-4xl">
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
