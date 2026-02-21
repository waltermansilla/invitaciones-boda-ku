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
    <section className="flex flex-col items-center px-6 py-16">
      <h2
        className="mb-12 text-2xl font-light tracking-[0.2em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {title}
      </h2>

      <div className="flex flex-col items-center gap-0">
        {events.map((event, index) => {
          const Icon = iconMap[event.icon] || Heart
          return (
            <div key={index} className="flex flex-col items-center">
              {index > 0 && <div className="h-8 w-px bg-primary/30" />}
              <div className="flex flex-col items-center gap-2 py-2">
                <Icon
                  className="h-6 w-6 text-primary transition-transform duration-300 hover:scale-110"
                  strokeWidth={1.5}
                />
                <h3
                  className="text-sm font-semibold tracking-[0.15em] uppercase text-foreground"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {event.name}
                </h3>
                <p
                  className="text-sm font-light text-muted-foreground"
                  style={{ fontFamily: "var(--font-body)" }}
                >
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
