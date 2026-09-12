"use client"

import {
  Car,
  Bus,
  Info,
  CircleHelp,
  MapPin,
  PartyPopper,
  Sparkles,
  TriangleAlert,
  Clock3,
  Hotel,
  Martini,
  Baby,
  Gift,
  Music,
  BookOpen,
  Shirt,
  UtensilsCrossed,
  Dumbbell,
} from "lucide-react"
import { useFadeIn } from "@/hooks/use-fade-in"
import { RevealContent } from "./animated-section"
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
  gift: Gift,
  music: Music,
  book: BookOpen,
  shirt: Shirt,
  food: UtensilsCrossed,
  gym: Dumbbell,
}

interface UniversalInfoSectionProps {
  icon?: string
  title?: string
  description?: string
  descriptionSize?: "normal" | "large"
  showButton?: boolean
  inlineListStyle?: "default" | "featured"
  button?: {
    text: string
    variant?: "primary" | "secondary"
  }
  modal?: {
    title?: string
    sections?: { heading: string; text: string; icon?: string }[]
  }
}

function FeaturedExperienciaItem({
  text,
  icon,
  index,
}: {
  text: string
  icon?: string
  index: number
}) {
  const { ref, isVisible } = useFadeIn(0.15)
  const ItemIcon = (icon && ICON_MAP[icon]) || Sparkles

  return (
    <li>
      <div ref={ref}>
        <RevealContent
          isVisible={isVisible}
          style={{ transitionDelay: `${index * 120}ms` }}
        >
          <div className="flex items-center gap-4 rounded-2xl border border-current/12 bg-current/[0.05] px-5 py-5 text-left shadow-sm sm:px-6 sm:py-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-current/10">
              <ItemIcon className="h-5 w-5 opacity-80" strokeWidth={1.5} />
            </span>
            <span className="text-base font-medium leading-snug tracking-wide text-inherit sm:text-lg">
              {text}
            </span>
          </div>
        </RevealContent>
      </div>
    </li>
  )
}

export default function UniversalInfoSection({
  icon,
  title,
  description,
  descriptionSize = "normal",
  showButton = true,
  inlineListStyle = "default",
  button,
  modal,
}: UniversalInfoSectionProps) {
  const { openModal } = useModal()
  const IconComponent = icon ? ICON_MAP[icon] || Info : null
  const hasModalContent = Boolean(
    modal && ((modal.title && modal.title.trim()) || (modal.sections && modal.sections.length > 0))
  )
  const showInlineList =
    !showButton && modal?.sections && modal.sections.length > 0
  const featuredList = inlineListStyle === "featured"

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
            {modal.sections.map((section, i) => (
              <div key={i} className="text-left">
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
    <section className="flex flex-col items-center px-6 py-14 text-center sm:px-8">
      {IconComponent && <IconComponent className="mb-5 h-9 w-9 opacity-70" strokeWidth={1} />}
      {title && <h2 className="mb-6 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">{title}</h2>}
      {description && (
        <p className={`max-w-sm ${descriptionSizeClasses} font-light leading-relaxed opacity-80 ${showButton && button ? "mb-6" : showInlineList ? "mb-4" : ""}`}>
          {description}
        </p>
      )}
      {showInlineList && modal?.sections ? (
        featuredList ? (
          <ul className="mx-auto w-full max-w-md space-y-4">
            {modal.sections.map((section, i) => (
              <FeaturedExperienciaItem
                key={i}
                text={section.text}
                icon={section.icon}
                index={i}
              />
            ))}
          </ul>
        ) : (
          <ul className="mx-auto max-w-md space-y-3 text-left text-sm font-light leading-relaxed opacity-90">
            {modal.sections.map((section, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                <span>{section.text}</span>
              </li>
            ))}
          </ul>
        )
      ) : null}
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
