"use client"

import { useEffect, useRef, useCallback } from "react"
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
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number>(0)

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const track = trackRef.current
      const fill = fillRef.current
      if (!track || !fill) return

      const viewportMid = window.innerHeight / 2
      const trackRect = track.getBoundingClientRect()
      const progress = (viewportMid - trackRect.top) / trackRect.height
      const clamped = Math.min(Math.max(progress, 0), 1)
      fill.style.height = `${clamped * 100}%`

      // Update icon borders
      iconRefs.current.forEach((el) => {
        if (!el) return
        const iconRect = el.getBoundingClientRect()
        const iconMid = iconRect.top + iconRect.height / 2
        if (iconMid <= viewportMid) {
          el.classList.add("border-primary", "text-primary")
          el.classList.remove("border-foreground/15", "text-foreground/30")
        } else {
          el.classList.remove("border-primary", "text-primary")
          el.classList.add("border-foreground/15", "text-foreground/30")
        }
      })
    })
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleScroll])

  return (
    <section className="flex flex-col items-center bg-background px-6 py-20">
      <h2 className="mb-16 text-center text-2xl font-semibold tracking-[0.25em] uppercase text-foreground md:text-3xl">
        {title}
      </h2>

      <div className="relative flex w-full max-w-xs flex-col items-center">
        {/* Timeline vertical track -- centered */}
        <div
          ref={trackRef}
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-foreground/10"
        >
          <div
            ref={fillRef}
            className="absolute left-0 top-0 w-full bg-primary"
            style={{ height: "0%", willChange: "height" }}
          />
        </div>

        {/* Events */}
        <div className="flex w-full flex-col gap-20">
          {events.map((event, index) => {
            const Icon = iconMap[event.icon] || Heart
            return (
              <div key={index} className="flex flex-col items-center">
                {/* Icon circle ON the timeline */}
                <div
                  ref={(el) => { iconRefs.current[index] = el }}
                  className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground/15 bg-background text-foreground/30 transition-colors duration-500"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.3} />
                </div>

                {/* Text below icon */}
                <h3 className="mt-4 text-center text-base font-semibold tracking-[0.15em] uppercase text-foreground md:text-lg">
                  {event.name}
                </h3>
                <p className="mt-1 text-center text-sm font-light tracking-wide text-foreground/50 md:text-base">
                  {event.time}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
