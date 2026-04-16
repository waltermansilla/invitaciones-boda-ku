"use client"

import { Car, Bus, Info, CircleHelp, MapPin, PartyPopper, Sparkles, TriangleAlert, Clock3, Hotel, Martini, Baby } from "lucide-react"
import { useModal } from "./modal-provider"

const ICON_MAP: Record<string, React.ElementType> = {
  car: Car,
  bus: Bus,
  info: Info,
  help: CircleHelp,
  pin: MapPin,
  party: PartyPopper,
  sparkles: Sparkles,
  alert: TriangleAlert,
  clock: Clock3,
  hotel: Hotel,
  drink: Martini,
  kids: Baby,
}

interface UniversalInfoSectionProps {
  icon?: string
  title?: string
  description?: string
  descriptionSize?: "normal" | "large"
  showButton?: boolean
  button?: {
    text: string
    variant?: "primary" | "secondary"
  }
  modal?: {
    title?: string
    sections?: { heading: string; text: string }[]
  }
}

export default function UniversalInfoSection({
  icon,
  title,
  description,
  descriptionSize = "normal",
  showButton = true,
  button,
  modal,
}: UniversalInfoSectionProps) {
  const { openModal } = useModal()
  const IconComponent = icon ? ICON_MAP[icon] || Info : null
  const hasModalContent = Boolean(
    modal && ((modal.title && modal.title.trim()) || (modal.sections && modal.sections.length > 0))
  )

  const handleOpen = () => {
    if (!hasModalContent || !modal) return

    openModal(
      <>
        {modal.title && (
          <h3 className="mb-6 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
            {modal.title}
          </h3>
        )}
        {modal.sections && modal.sections.length > 0 && (
          <div className="space-y-5">
            {modal.sections.map((section) => (
              <div key={section.heading} className="text-left">
                <h4 className="mb-2 text-xs font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                  {section.heading}
                </h4>
                <p className="text-sm font-light leading-relaxed text-primary-foreground/85">
                  {section.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const buttonVariantClasses =
    button?.variant === "primary"
      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
      : "border-current/30 text-inherit hover:bg-current/5"
  const descriptionSizeClasses =
    descriptionSize === "large"
      ? "text-base md:text-lg"
      : "text-sm"

  return (
    <section className="flex flex-col items-center px-8 py-14 text-center">
      {IconComponent && <IconComponent className="mb-5 h-9 w-9 opacity-70" strokeWidth={1} />}
      {title && <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">{title}</h2>}
      {description && (
        <p className={`max-w-sm ${descriptionSizeClasses} font-light leading-relaxed opacity-80 ${showButton && button ? "mb-6" : ""}`}>
          {description}
        </p>
      )}
      {showButton && button && (
        <button
          onClick={handleOpen}
          disabled={!hasModalContent}
          className={`inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariantClasses}`}
        >
          {button.text}
        </button>
      )}
    </section>
  )
}
