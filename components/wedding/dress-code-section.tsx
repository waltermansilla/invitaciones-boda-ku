"use client"

import { useModal } from "./modal-provider"
import { Shirt, Gem, Crown, Sparkles, Star, Heart } from "lucide-react"

/**
 * ICONOS DISPONIBLES para dressCode:
 * "dress"     -> Vestido (mujer) - custom SVG
 * "suit"      -> Traje (hombre) - Shirt icon
 * "gem"       -> Diamante (elegancia)
 * "crown"     -> Corona (formalidad)
 * "sparkles"  -> Brillos (celebracion)
 * "star"      -> Estrella
 * "heart"     -> Corazon
 *
 * Se elige desde el JSON: data.icons = ["dress", "suit", "gem"]
 */

// Custom dress icon (no existe en lucide)
function DressIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth || 1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L9 8H15L12 2Z" />
      <path d="M9 8L6 22H18L15 8" />
      <path d="M9 8C9 8 10 10 12 10C14 10 15 8 15 8" />
      <path d="M8 14H16" />
    </svg>
  )
}

// Custom suit/tuxedo icon
function SuitIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth || 1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L14 6L12 10L10 6L12 2Z" />
      <path d="M6 6L10 6L8 22H4L6 6Z" />
      <path d="M18 6L14 6L16 22H20L18 6Z" />
      <path d="M10 6L14 6" />
      <path d="M11 12L12 14L13 12" />
    </svg>
  )
}

const ICON_MAP: Record<string, React.ElementType> = {
  dress: DressIcon,
  suit: SuitIcon,
  shirt: Shirt,
  gem: Gem,
  crown: Crown,
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
}

interface DressCodeSectionProps {
  title: string
  subtitle: string
  description?: string
  icons?: string[]
  showButton?: boolean
  button?: { text: string; url: string; variant: "primary" | "secondary" }
  modal?: {
    title: string
    sections: { heading: string; text: string }[]
  }
  colorSwatches?: {
    enabled: boolean
    shape: "circle" | "square"
    colors: string[]
  }
}

export default function DressCodeSection({
  title,
  subtitle,
  description,
  icons,
  showButton = true,
  button,
  modal,
  colorSwatches,
}: DressCodeSectionProps) {
  const { openModal } = useModal()
  const canOpenModal = Boolean(
    modal?.title && modal.sections && Array.isArray(modal.sections) && modal.sections.length > 0,
  )
  const shouldRenderButton = Boolean(showButton && canOpenModal && button?.text)

  const handleOpen = () => {
    if (!canOpenModal) return

    openModal(
      <>
        <h3 className="mb-6 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
          {modal?.title}
        </h3>
        <div className="space-y-5">
          {modal?.sections?.map((section) => (
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
      </>
    )
  }

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      {/* Icons row */}
      {icons && icons.length > 0 && (
        <div className="mb-5 flex items-center justify-center gap-4">
          {icons.map((iconName, idx) => {
            const IconComponent = ICON_MAP[iconName]
            if (!IconComponent) return null
            return (
              <IconComponent
                key={idx}
                className="h-8 w-8 opacity-70"
                strokeWidth={1}
              />
            )
          })}
        </div>
      )}

      <h2 className="mb-2 text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl">
        {title}
      </h2>
      <p className="mb-3 text-sm font-medium tracking-[0.1em] uppercase text-inherit/60">
        {subtitle}
      </p>

      {/* Optional description text */}
      {description && (
        <p className="mb-5 max-w-sm text-sm font-light leading-relaxed opacity-80">
          {description}
        </p>
      )}

      {/* Color swatches */}
      {colorSwatches?.enabled && colorSwatches.colors && colorSwatches.colors.length > 0 && (
        <div className={`mb-6 flex items-center justify-center ${colorSwatches.shape === "square" ? "gap-0" : "gap-2"}`}>
          {colorSwatches.colors.map((color, idx) => (
            <div
              key={idx}
              className={`${
                colorSwatches.shape === "circle" 
                  ? "h-8 w-8 rounded-full border border-current/20" 
                  : "h-8 w-8 border-y border-current/10 first:rounded-l-sm first:border-l last:rounded-r-sm last:border-r"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Optional button */}
      {shouldRenderButton && (
        <button
          onClick={handleOpen}
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-current/30 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:bg-current/5"
        >
          {button?.text}
        </button>
      )}
    </section>
  )
}
