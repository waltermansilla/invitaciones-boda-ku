import { Calendar, MapPin } from "lucide-react"
import ActionButton from "./action-button"

interface LocationConfig {
  enabled: boolean
  title: string
  address: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

interface EventInfoSectionProps {
  date: {
    icon: string
    title: string
    value: string
  }
  locations: LocationConfig[]
}

export default function EventInfoSection({ date, locations }: EventInfoSectionProps) {
  const enabledLocations = locations.filter((loc) => loc.enabled)

  return (
    <section className="flex flex-col items-center gap-12 px-6 py-16 text-center">
      {/* Date */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border">
          <Calendar className="h-6 w-6 text-primary transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
        </div>
        <h2
          className="text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {date.title}
        </h2>
        <p
          className="text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {date.value}
        </p>
      </div>

      {/* Locations */}
      {enabledLocations.map((location, index) => (
        <div key={index} className="flex flex-col items-center gap-3">
          <MapPin className="h-6 w-6 text-primary transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
          <h2
            className="text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {location.title}
          </h2>
          <p
            className="text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {location.address}
          </p>
          <div className="mt-2">
            <ActionButton
              text={location.button.text}
              url={location.button.url}
              variant={location.button.variant}
            />
          </div>
        </div>
      ))}
    </section>
  )
}
