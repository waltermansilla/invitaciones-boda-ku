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
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const activatedRef = useRef<Set<number>>(new Set())
  const rafRef = useRef<number>(0)

  const positionTrack = useCallback(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track || iconRefs.current.length < 2) return

    const first = iconRefs.current[0]
    const last = iconRefs.current[iconRefs.current.length - 1]
    if (!first || !last) return

    const containerRect = container.getBoundingClientRect()
    const firstCenter = first.getBoundingClientRect().top - containerRect.top + first.offsetHeight / 2
    const lastCenter = last.getBoundingClientRect().top - containerRect.top + last.offsetHeight / 2

    track.style.top = `${firstCenter}px`
    track.style.height = `${lastCenter - firstCenter}px`
  }, [])

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

      iconRefs.current.forEach((el, i) => {
        if (!el) return
        const iconRect = el.getBoundingClientRect()
        const iconMid = iconRect.top + iconRect.height / 2
        const isActive = iconMid <= viewportMid

        if (isActive) {
          el.classList.add("border-primary", "text-primary")
          el.classList.remove("border-foreground/15", "text-foreground/30")
          if (!activatedRef.current.has(i)) {
            activatedRef.current.add(i)
            el.classList.add("animate-icon-touch")
            el.addEventListener("animationend", () => {
              el.classList.remove("animate-icon-touch")
            }, { once: true })
          }
        } else {
          el.classList.remove("border-primary", "text-primary")
          el.classList.add("border-foreground/15", "text-foreground/30")
          activatedRef.current.delete(i)
        }
      })
    })
  }, [])

  useEffect(() => {
    positionTrack()
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", positionTrack)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", positionTrack)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleScroll, positionTrack])

  return (
    <section className="bg-background px-6 py-20">
      <h2 className="mb-16 text-center text-2xl font-semibold tracking-[0.25em] uppercase text-foreground md:text-3xl">
        {title}
      </h2>

      <div className="mx-auto flex w-fit flex-col gap-24" ref={containerRef}>
        {/* Track: positioned at center of icons (28px = half of 56px icon) */}
        <div
          ref={trackRef}
          className="pointer-events-none absolute bg-foreground/10"
          style={{ left: "27px", width: "2px" }}
        >
          <div
            ref={fillRef}
            className="absolute top-0 left-0 w-[2px] bg-primary"
            style={{ height: "0%", willChange: "height" }}
          />
        </div>

        {events.map((event, index) => {
          const Icon = iconMap[event.icon] || Heart
          return (
            <div key={index} className="relative flex items-start gap-6">
              <div
                ref={(el) => { iconRefs.current[index] = el }}
                className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-foreground/15 bg-background text-foreground/30 transition-colors duration-500"
              >
                <Icon className="h-6 w-6" strokeWidth={1.3} />
              </div>
              <div className="flex flex-col justify-center pt-2">
                <h3 className="text-base font-semibold tracking-[0.15em] uppercase text-foreground md:text-lg">
                  {event.name}
                </h3>
                <p className="mt-1 text-sm font-light tracking-wide text-foreground/50 md:text-base">
                  {event.time}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
