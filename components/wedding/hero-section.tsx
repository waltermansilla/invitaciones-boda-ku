"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface HeroSectionProps {
  coupleImage: string
  groomName: string
  brideName: string
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
  groomName,
  brideName,
  headline,
  eventDate,
  countdownLabels,
}: HeroSectionProps) {
  const [time, setTime] = useState(getTimeRemaining(eventDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(eventDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [eventDate])

  return (
    <section className="flex flex-col items-center px-6 py-12 text-center">
      <div className="relative mb-8 h-[400px] w-[300px] overflow-hidden rounded-[180px_180px_20px_20px] md:h-[500px] md:w-[360px]">
        <Image
          src={coupleImage}
          alt={`${brideName} & ${groomName}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      <h1
        className="mb-8 text-4xl font-light tracking-[0.15em] uppercase text-foreground md:text-5xl"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {headline}
      </h1>

      <div className="flex items-baseline gap-3">
        {[
          { value: time.days, label: countdownLabels.days },
          { value: time.hours, label: countdownLabels.hours },
          { value: time.minutes, label: countdownLabels.minutes },
          { value: time.seconds, label: countdownLabels.seconds },
        ].map((item, i) => (
          <div key={item.label} className="flex items-baseline gap-3">
            <div className="flex flex-col items-center">
              <span
                className="text-4xl font-light tabular-nums text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {String(item.value).padStart(item.label === countdownLabels.days ? 1 : 2, "0")}
              </span>
              <span
                className="mt-1 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {item.label}
              </span>
            </div>
            {i < 3 && (
              <span
                className="-mt-4 text-2xl font-light text-muted-foreground"
                style={{ fontFamily: "var(--font-cormorant)" }}
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
