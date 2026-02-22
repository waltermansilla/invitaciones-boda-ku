"use client"

import { useEffect, useRef, useCallback } from "react"
import { Heart, Wine, UtensilsCrossed, Music, Church, Camera, Cake, Car, GlassWater, PartyPopper, Sparkles, Sun, Moon, Clock, MapPin, Gift, Bus } from "lucide-react"
import config from "@/data/wedding-config.json"

interface ItineraryEvent {
  icon: string
  name: string
  time: string
}

interface ItinerarySectionProps {
  title: string
  events: ItineraryEvent[]
  sectionBgColor?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  heart: Heart,
  wine: Wine,
  utensils: UtensilsCrossed,
  music: Music,
  church: Church,
  camera: Camera,
  cake: Cake,
  car: Car,
  glass: GlassWater,
  party: PartyPopper,
  sparkles: Sparkles,
  sun: Sun,
  moon: Moon,
  clock: Clock,
  pin: MapPin,
  gift: Gift,
  bus: Bus,
}

export default function ItinerarySection({ title, events, sectionBgColor }: ItinerarySectionProps) {
  // Resolve the actual bg color so icons can cover the timeline line
  const theme = config.theme as Record<string, unknown>
  const iconBg = sectionBgColor === "primary"
    ? (theme.primaryColor as string) || "#6B7F5E"
    : (theme.backgroundColor as string) || "#FAF8F5"
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const activatedRef = useRef<Set<number>>(new Set())
  const rafRef = useRef<number>(0)

  /* Position the track so it starts at center of first icon and ends at center of last */
  const positionTrack = useCallback(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track || iconRefs.current.length < 2) return

    const first = iconRefs.current[0]
    const last = iconRefs.current[iconRefs.current.length - 1]
    if (!first || !last) return

    const containerTop = container.getBoundingClientRect().top + window.scrollY
    const firstCenter = first.getBoundingClientRect().top + window.scrollY + first.offsetHeight / 2
    const lastCenter = last.getBoundingClientRect().top + window.scrollY + last.offsetHeight / 2

    track.style.top = `${firstCenter - containerTop}px`
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
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", positionTrack)
    handleScroll()
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", positionTrack)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleScroll, positionTrack])

  return (
    <section className="px-6 py-20">
      <h2 className="mb-16 text-center text-2xl font-semibold tracking-[0.25em] uppercase text-inherit md:text-3xl">
        {title}
      </h2>

      <div className="flex justify-center">
      <div ref={containerRef} className="relative">
        {/* Timeline track -- positioned dynamically from first to last icon center */}
        <div
          ref={trackRef}
          className="absolute bg-current/10"
          style={{ left: "28px", width: "2px", transform: "translateX(-50%)" }}
        >
          <div
            ref={fillRef}
            className="absolute top-0 bg-primary"
            style={{ left: "0px", height: "0%", width: "2px", willChange: "height" }}
          />
        </div>

        {/* Events */}
        <div className="flex flex-col gap-24">
          {events.map((event, index) => {
            const Icon = iconMap[event.icon] || Heart
            return (
              <div key={index} className="relative flex items-start gap-6">
                {/* Icon circle on LEFT, sits on the timeline */}
                <div
                  ref={(el) => { iconRefs.current[index] = el }}
                  className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-current/15 text-inherit/30 transition-colors duration-500"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.3} />
                </div>

                {/* Details on RIGHT */}
                <div className="flex flex-col justify-center pt-2">
                  <h3 className="text-base font-semibold tracking-[0.15em] uppercase text-inherit md:text-lg">
                    {event.name}
                  </h3>
                  <p className="mt-1 text-sm font-light tracking-wide text-inherit/50 md:text-base">
                    {event.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </section>
  )
}
