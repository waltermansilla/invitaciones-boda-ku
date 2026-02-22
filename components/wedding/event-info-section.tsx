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
    <section className="flex flex-col items-center gap-10 px-6 py-14 text-center">
      {/* Date */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-current/20">
          <Calendar className="h-5 w-5 text-inherit/60" strokeWidth={1.2} />
        </div>
        <h2
          className="text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl"
  
        >
          {date.title}
        </h2>
        <p
          className="text-sm font-medium tracking-[0.1em] uppercase text-inherit/70"
  
        >
          {date.value}
        </p>
      </div>

      {/* Locations */}
      {enabledLocations.map((location, index) => (
        <div key={index} className="flex flex-col items-center gap-3">
          <MapPin className="h-5 w-5 text-inherit/60" strokeWidth={1.2} />
          <h2
            className="text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl"
    
          >
            {location.title}
          </h2>
          <p
            className="text-sm font-medium tracking-[0.1em] uppercase text-inherit/70"
    
          >
            {location.address}
          </p>
          <div className="mt-1">
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
