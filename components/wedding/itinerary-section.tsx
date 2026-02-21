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
  return (
    <section className="flex flex-col items-center bg-background px-6 py-14">
      <div className="w-full max-w-xs rounded-sm border border-foreground/15 px-8 py-10">
        <h2
          className="mb-10 text-center text-lg font-medium tracking-[0.25em] uppercase text-foreground"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {title}
        </h2>

        <div className="flex flex-col items-center">
          {events.map((event, index) => {
            const Icon = iconMap[event.icon] || Heart
            return (
              <div key={index} className="flex flex-col items-center">
                {/* Connecting line above (except first) */}
                {index > 0 && <div className="h-6 w-px bg-primary/30" />}
                <div className="flex flex-col items-center gap-1 py-1">
                  <Icon
                    className="h-5 w-5 text-primary"
                    strokeWidth={1.3}
                  />
                  <h3
                    className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {event.name}
                  </h3>
                  <p
                    className="text-xs font-light text-foreground/60"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
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
