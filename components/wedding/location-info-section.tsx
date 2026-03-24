import { 
  MapPin, 
  Church, 
  UtensilsCrossed, 
  PartyPopper, 
  Building2,
  BookOpen,
  Presentation,
  GlassWater,
  Heart,
  Music,
  Sparkles
} from "lucide-react"
import ActionButton from "./action-button"

/**
 * Location Info Section
 * 
 * icon: "pin" (default), "church", "dinner", "party", "salon", "book", "podium", "reception", "ring", "music", "sparkles"
 * showButton: true (default) / false para ocultar el boton "Como llegar"
 * datetime: { date: string, time: string } - (OPCIONAL) fecha y hora del evento
 * order: array con el orden de elementos, ej: ["date", "time", "address"] o ["address", "date", "time"]
 *        Valores posibles: "date", "time", "address". Por defecto: ["date", "time", "address"]
 */

interface LocationInfoSectionProps {
  title: string
  address: string
  icon?: string
  showButton?: boolean
  datetime?: {
    date?: string
    time?: string
  }
  order?: ("date" | "time" | "address")[]
  button: {
    text: string
    url: string
    variant: "primary" | "secondary" | "background"
  }
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  pin: MapPin,
  church: Church,
  dinner: UtensilsCrossed,
  party: PartyPopper,
  salon: Building2,
  book: BookOpen,
  podium: Presentation,
  reception: GlassWater,
  ring: Heart,
  music: Music,
  sparkles: Sparkles,
}

export default function LocationInfoSection({ 
  title, 
  address, 
  icon = "pin",
  showButton = true,
  datetime,
  order = ["date", "time", "address"],
  button 
}: LocationInfoSectionProps) {
  const IconComponent = iconMap[icon] || MapPin

  // Render elements based on order
  const renderElement = (element: "date" | "time" | "address") => {
    switch (element) {
      case "date":
        return datetime?.date ? (
          <p key="date" className="text-sm font-medium tracking-[0.15em] uppercase text-inherit/80">
            {datetime.date}
          </p>
        ) : null
      case "time":
        return datetime?.time ? (
          <p key="time" className="text-lg font-semibold tracking-[0.1em] text-inherit">
            {datetime.time}
          </p>
        ) : null
      case "address":
        return (
          <p key="address" className="text-sm font-medium tracking-[0.1em] uppercase text-inherit/70">
            {address}
          </p>
        )
      default:
        return null
    }
  }

  return (
    <section className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <IconComponent className="h-9 w-9 text-inherit/50" strokeWidth={1} />
      <h2 className="text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
        {title}
      </h2>
      
      {/* Render elements in specified order */}
      <div className="flex flex-col items-center gap-1">
        {order.map(element => renderElement(element))}
      </div>
      
      {showButton && (
        <div className="mt-1">
          <ActionButton text={button.text} url={button.url} variant={button.variant} />
        </div>
      )}
    </section>
  )
}
