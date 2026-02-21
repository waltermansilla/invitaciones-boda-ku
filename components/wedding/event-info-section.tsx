import { Calendar, MapPin } from "lucide-react"
import ActionButton from "./action-button"

interface EventInfoSectionProps {
  date: {
    icon: string
    title: string
    value: string
  }
  location: {
    icon: string
    title: string
    value: string
    button: {
      text: string
      url: string
      variant: "primary" | "secondary"
    }
  }
}

export default function EventInfoSection({ date, location }: EventInfoSectionProps) {
  return (
    <section className="flex flex-col items-center gap-10 px-6 py-14 text-center">
      {/* Date */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border">
          <Calendar className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <h2
          className="text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {date.title}
        </h2>
        <p
          className="text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          {date.value}
        </p>
      </div>

      {/* Location */}
      <div className="flex flex-col items-center gap-3">
        <MapPin className="h-6 w-6 text-primary" strokeWidth={1.5} />
        <h2
          className="text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {location.title}
        </h2>
        <p
          className="text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          {location.value}
        </p>
        <div className="mt-2">
          <ActionButton text={location.button.text} url={location.button.url} variant={location.button.variant} />
        </div>
      </div>
    </section>
  )
}
