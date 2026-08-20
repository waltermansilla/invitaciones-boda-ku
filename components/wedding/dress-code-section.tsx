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

type ColorSwatchItem = string | { color?: string; hex?: string; label?: string }

type DressCodeDescription = string | string[]

interface DressCodeSectionProps {
  title: string
  subtitle: string
  /** Texto antes de las muestras de color. */
  description?: DressCodeDescription
  /** Texto después de las muestras de color (ej. pileta, calzado). */
  descriptionAfterColors?: DressCodeDescription
  icons?: string[]
  showButton?: boolean
  button?: { text: string; url: string; variant?: "primary" | "secondary" }
  modal?: {
    title: string
    /** Párrafo breve antes de las secciones (heading + text). */
    intro?: string
    sections: { heading: string; text: string }[]
  }
  colorSwatches?: {
    enabled: boolean
    shape: "circle" | "square"
    /** Textos por índice (alternativa a label en cada color). */
    labels?: string[]
    colors: ColorSwatchItem[]
  }
}

function DescriptionBlocks({
  description,
  className,
}: {
  description: DressCodeDescription
  className: string
}) {
  const paragraphs = Array.isArray(description)
    ? description.map((p) => String(p).trim()).filter(Boolean)
    : String(description)
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
  if (paragraphs.length === 0) return null
  if (
    !Array.isArray(description) &&
    paragraphs.length === 1 &&
    String(description).includes("\n")
  ) {
    return (
      <p className={`whitespace-pre-line ${className}`}>
        {String(description).trim()}
      </p>
    )
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  )
}

function normalizeSwatches(
  colors: ColorSwatchItem[] | undefined,
  labels?: string[],
): { color: string; label: string }[] {
  if (!colors?.length) return []
  return colors
    .map((item, idx) => {
      if (typeof item === "string") {
        return { color: item, label: (labels?.[idx] || "").trim() }
      }
      const color = (item.color || item.hex || "").trim()
      const label = (item.label || labels?.[idx] || "").trim()
      return { color, label }
    })
    .filter((item) => Boolean(item.color))
}

type MarkerRole = "outer-left" | "mid-left" | "center" | "mid-right" | "outer-right"

/**
 * Extremos: abren hacia afuera.
 * Medios: inclinados al costado más cercano y más abajo.
 * Centro derecho solo si la cantidad es impar (3, 5, …).
 */
function getMarkerRole(index: number, total: number): MarkerRole {
  if (total <= 1) return "center"
  if (index === 0) return "outer-left"
  if (index === total - 1) return "outer-right"

  const mid = (total - 1) / 2
  if (total % 2 === 1 && index === Math.floor(mid)) return "center"
  if (index < mid) return "mid-left"
  return "mid-right"
}

/**
 * Anclado al centro inferior del swatch.
 * Extremos/medios: texto centrado en la punta de la curva (+ gap chico).
 * Centro: sin gap extra.
 */
function SwatchMarker({
  label,
  role,
  total,
}: {
  label: string
  role: MarkerRole
  total: number
}) {
  const labelClass =
    "whitespace-nowrap text-center text-[9px] font-light leading-none tracking-[0.1em] uppercase opacity-70 sm:text-[10px]"
  // Centrado en la punta: left del tip + -translate-x-1/2; mt = aire bajo la línea
  // Mismo espacio que el del centro (sin margin extra bajo la línea)
  const tipLabel = `absolute top-full -translate-x-1/2 ${labelClass}`

  if (role === "outer-left") {
    return (
      <div className="pointer-events-none absolute top-full left-1/2 z-10 w-0">
        <div className="absolute top-0 right-0 w-[70px]">
          <svg
            width="70"
            height="34"
            viewBox="0 0 70 34"
            fill="none"
            className="block opacity-40"
            aria-hidden
          >
            <path
              d="M68 1C52 4 34 12 18 22C10 27 4 31 1 33"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          <span className={tipLabel} style={{ left: 1 }}>
            {label}
          </span>
        </div>
      </div>
    )
  }

  if (role === "outer-right") {
    return (
      <div className="pointer-events-none absolute top-full left-1/2 z-10 w-0">
        <div className="absolute top-0 left-0 w-[70px]">
          <svg
            width="70"
            height="34"
            viewBox="0 0 70 34"
            fill="none"
            className="block opacity-40"
            aria-hidden
          >
            <path
              d="M2 1C18 4 36 12 52 22C60 27 66 31 69 33"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          <span className={tipLabel} style={{ left: 69 }}>
            {label}
          </span>
        </div>
      </div>
    )
  }

  if (role === "mid-left") {
    return (
      <div className="pointer-events-none absolute top-full left-1/2 z-10 w-0">
        <div className="absolute top-0 right-0 w-[36px]">
          <svg
            width="36"
            height="52"
            viewBox="0 0 36 52"
            fill="none"
            className="block opacity-40"
            aria-hidden
          >
            <path
              d="M34 1C28 12 22 24 14 36C9 43 4 49 2 51"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          <span className={tipLabel} style={{ left: 2 }}>
            {label}
          </span>
        </div>
      </div>
    )
  }

  if (role === "mid-right") {
    return (
      <div className="pointer-events-none absolute top-full left-1/2 z-10 w-0">
        <div className="absolute top-0 left-0 w-[36px]">
          <svg
            width="36"
            height="52"
            viewBox="0 0 36 52"
            fill="none"
            className="block opacity-40"
            aria-hidden
          >
            <path
              d="M2 1C8 12 14 24 22 36C27 43 32 49 34 51"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          <span className={tipLabel} style={{ left: 34 }}>
            {label}
          </span>
        </div>
      </div>
    )
  }

  // Centro exacto: línea recta (más corta con 3 colores)
  const centerH = total === 3 ? 36 : 56
  return (
    <div className="pointer-events-none absolute top-full left-1/2 z-10 flex w-max -translate-x-1/2 flex-col items-center">
      <svg
        width="14"
        height={centerH}
        viewBox={`0 0 14 ${centerH}`}
        fill="none"
        className="opacity-40"
        aria-hidden
      >
        <path
          d={`M7 1L7 ${centerH - 1}`}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      <span className={`max-w-[4.5rem] leading-tight ${labelClass}`}>
        {label}
      </span>
    </div>
  )
}

export default function DressCodeSection({
  title,
  subtitle,
  description,
  descriptionAfterColors,
  icons,
  showButton = true,
  button,
  modal,
  colorSwatches,
}: DressCodeSectionProps) {
  const { openModal } = useModal()
  const canOpenModal = Boolean(
    modal?.title &&
      ((modal.sections &&
        Array.isArray(modal.sections) &&
        modal.sections.length > 0) ||
        modal.intro?.trim()),
  )
  const shouldRenderButton = Boolean(showButton && canOpenModal && button?.text)

  const buttonVariantClasses =
    button?.variant === "primary"
      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
      : "border-current/30 text-inherit hover:bg-current/5"

  const handleOpen = () => {
    if (!canOpenModal) return

    openModal(
      <>
        <h3
          className={`${modal?.intro?.trim() ? "mb-4" : "mb-6"} text-lg font-semibold tracking-wide uppercase text-primary-foreground`}
        >
          {modal?.title}
        </h3>
        {modal?.intro?.trim() ? (
          <p className="mb-6 text-left text-sm font-light leading-relaxed text-primary-foreground/85">
            {modal.intro.trim()}
          </p>
        ) : null}
        {modal?.sections && modal.sections.length > 0 ? (
          <div className="space-y-5">
            {modal.sections.map((section, idx) => (
              <div key={`${section.heading}-${idx}`} className="text-left">
                {section.heading?.trim() ? (
                  <h4 className="mb-2 text-xs font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                    {section.heading}
                  </h4>
                ) : null}
                {section.text?.trim() ? (
                  <p className="text-sm font-light leading-relaxed text-primary-foreground/85">
                    {section.text}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </>
    )
  }

  const swatches = normalizeSwatches(
    colorSwatches?.colors,
    colorSwatches?.labels,
  )
  const hasAnyLabel = swatches.some((s) => Boolean(s.label))
  const isSquare = colorSwatches?.shape === "square"

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

      {/* Optional description text — string, \n, o array de párrafos */}
      {description ? (
        <DescriptionBlocks
          description={description}
          className="mb-5 max-w-sm text-sm font-light leading-relaxed opacity-80"
        />
      ) : null}

      {/* Color swatches */}
      {colorSwatches?.enabled && swatches.length > 0 && (
        <div
          className={`overflow-visible ${
            hasAnyLabel
              ? "mb-20 px-10 sm:px-14"
              : descriptionAfterColors
                ? "mb-8"
                : "mb-6"
          }`}
        >
          <div
            className={`flex items-start justify-center overflow-visible ${
              isSquare ? "gap-0" : "gap-2"
            }`}
          >
            {swatches.map((swatch, idx) => {
              const role = getMarkerRole(idx, swatches.length)
              const showMarker = Boolean(swatch.label)
              return (
                <div
                  key={`${swatch.color}-${idx}`}
                  className="relative shrink-0 overflow-visible"
                >
                  <div
                    className={
                      isSquare
                        ? [
                            "h-8 w-8 border-y border-current/10",
                            idx === 0 ? "rounded-l-sm border-l" : "",
                            idx === swatches.length - 1
                              ? "rounded-r-sm border-r"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        : "h-8 w-8 rounded-full border border-current/20"
                    }
                    style={{ backgroundColor: swatch.color }}
                    title={swatch.label || swatch.color}
                    aria-label={swatch.label || swatch.color}
                  />
                  {showMarker ? (
                    <SwatchMarker
                      label={swatch.label}
                      role={role}
                      total={swatches.length}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {descriptionAfterColors ? (
        <DescriptionBlocks
          description={descriptionAfterColors}
          className="mb-6 max-w-sm text-sm font-light leading-relaxed opacity-80"
        />
      ) : null}

      {/* Optional button */}
      {shouldRenderButton && (
        <button
          onClick={handleOpen}
          className={`inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 ${buttonVariantClasses}`}
        >
          {button?.text}
        </button>
      )}
    </section>
  )
}
