"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Wine, UtensilsCrossed, Music } from "lucide-react"

interface ItineraryEvent {
  icon: string
  name: string
  time: string
}

interface ItinerarySectionProps {
  title: string
  events: ItineraryEvent[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  heart: Heart,
  wine: Wine,
  utensils: UtensilsCrossed,
  music: Music,
}

export default function ItinerarySection({ title, events }: ItinerarySectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const timelineTrackRef = useRef<HTMLDivElement>(null)
  const [fillHeight, setFillHeight] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const track = timelineTrackRef.current
    if (!section || !track) return

    const handleScroll = () => {
      const sectionRect = section.getBoundingClientRect()
      const viewportMid = window.innerHeight / 2

      const trackTop = track.getBoundingClientRect().top
      const trackHeight = track.offsetHeight

      const progress = (viewportMid - trackTop) / trackHeight
      const clamped = Math.min(Math.max(progress, 0), 1)
      setFillHeight(clamped * 100)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="flex flex-col items-center bg-background px-6 py-20">
      <h2 className="mb-14 text-center text-2xl font-semibold tracking-[0.25em] uppercase text-foreground md:text-3xl">
        {title}
      </h2>

      <div className="relative w-full max-w-sm">
        {/* Timeline track */}
        <div
          ref={timelineTrackRef}
          className="absolute left-5 top-0 bottom-0 w-px bg-foreground/10 md:left-6"
        >
          {/* Filled portion */}
          <div
            className="absolute top-0 left-0 w-full bg-primary transition-all duration-150 ease-out"
            style={{ height: `${fillHeight}%` }}
          />
        </div>

        {/* Events */}
        <div className="flex flex-col gap-12">
          {events.map((event, index) => {
            const Icon = iconMap[event.icon] || Heart
            return (
              <div key={index} className="relative flex items-start gap-7 pl-0 md:gap-8">
                {/* Icon dot on the timeline */}
                <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-background md:h-12 md:w-12">
                  <Icon
                    className="h-6 w-6 text-primary md:h-7 md:w-7"
                    strokeWidth={1.2}
                  />
                </div>

                {/* Text */}
                <div className="flex flex-col justify-center gap-1 pt-1">
                  <h3 className="text-base font-semibold tracking-[0.15em] uppercase text-foreground md:text-lg">
                    {event.name}
                  </h3>
                  <p className="text-sm font-light tracking-wide text-foreground/50 md:text-base">
                    {event.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
