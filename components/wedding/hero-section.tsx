"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useConfig } from "@/lib/config-context"

/**
 * Hero Section - Portada principal de la invitacion
 * 
 * NOMBRES SOBRE LA FOTO (namesDisplay):
 *   enabled: boolean         -> true para mostrar, false para ocultar
 *   position: "top" | "bottom" -> arriba o abajo de la imagen
 *   texts: array con 2 items -> cada texto con su propia fuente/weight/size/style
 *     [0] = primer texto (ej: "Mis XV" o nombre novia)
 *     [1] = segundo texto (ej: "Valentina" o nombre novio)
 *   color: string            -> color compartido para ambos textos
 *   decorativeLines: boolean -> lineas decorativas arriba/abajo
 *   logo: string             -> ruta a imagen de logo (reemplaza textos)
 * 
 * ESTILO DEL COUNTDOWN (countdownStyle):
 *   background: "none" | "background" | "primary" | "secondary" | "#hexcolor"
 *   shape: "rounded" | "circle" | "square" | "pill"
 *   layout: "inline" (debajo del hero) | "overlay" (superpuesto en transicion)
 * 
 * FONDO DEL AREA COUNTDOWN (countdownAreaBg):
 *   "primary" | "background" | "#hexcolor"
 */

interface NamesText {
  text: string
  font?: string
  weight?: string
  size?: string
  style?: string
}

interface HeroSectionProps {
  coupleImage: string
  headline: string
  eventDate: string
  groomName: string
  brideName: string
  separator: string
  showNamesOnPhoto?: boolean // backward compatibility
  namesDisplay?: {
    enabled: boolean
    position: "top" | "bottom"
    // Legacy single font support
    font?: string
    weight?: string
    size?: string
    style?: string
    color?: string
    decorativeLines?: boolean
    logo?: string
    // New: two separate texts with own styles
    texts?: NamesText[]
  }
  countdownPrefix?: string
  countdownLabels: {
    days: string
    hours: string
    minutes: string
    seconds: string
  }
  countdownStyle?: {
    background: "none" | "background" | "primary" | "secondary" | string
    shape: "rounded" | "circle" | "square" | "pill"
    layout?: "inline" | "overlay"
  }
  countdownAreaBg?: "primary" | "background" | string
}

function getTimeRemaining(targetDate: string) {
  const total = new Date(targetDate).getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  return { days, hours, minutes, seconds }
}

// Map size names to Tailwind classes
const sizeMap: Record<string, string> = {
  xs: "text-lg sm:text-xl",
  sm: "text-xl sm:text-2xl",
  base: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
  xl: "text-4xl sm:text-5xl",
  "2xl": "text-4xl sm:text-5xl md:text-6xl",
  "3xl": "text-5xl sm:text-6xl md:text-7xl",
  "4xl": "text-6xl sm:text-7xl md:text-8xl",
  "5xl": "text-7xl sm:text-8xl md:text-9xl",
}

// Map weight names to CSS values
const weightMap: Record<string, string> = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
}

export default function HeroSection({
  coupleImage,
  headline,
  eventDate,
  groomName,
  brideName,
  separator,
  showNamesOnPhoto = true,
  namesDisplay,
  countdownPrefix,
  countdownLabels,
  countdownStyle,
  countdownAreaBg,
}: HeroSectionProps) {
  const config = useConfig()
  const theme = config.theme as Record<string, unknown>
  const textColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"
  const primaryColor = (theme.primaryColor as string) || "#6B7F5E"
  const backgroundColor = (theme.backgroundColor as string) || "#FAF8F5"
  
  const [time, setTime] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    setTime(getTimeRemaining(eventDate))
    const interval = setInterval(() => {
      setTime(getTimeRemaining(eventDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [eventDate])

  // Determine if names should show (support both old and new format)
  const shouldShowNames = namesDisplay?.enabled ?? showNamesOnPhoto
  const namesPosition = namesDisplay?.position || "bottom"
  const namesLogo = namesDisplay?.logo
  const namesColor = namesDisplay?.color || "rgba(255,255,255,0.9)"
  const showDecorativeLines = namesDisplay?.decorativeLines ?? false

  // Check if using new texts array format
  const useTextsArray = namesDisplay?.texts && namesDisplay.texts.length >= 2

  // Legacy single style (for backward compatibility)
  const legacyFont = namesDisplay?.font
  const legacyWeight = namesDisplay?.weight || "300"
  const legacySize = namesDisplay?.size || "lg"
  const legacyStyle = namesDisplay?.style || "normal"

  // Get fonts to preload
  const fontsToLoad: string[] = []
  if (legacyFont) fontsToLoad.push(legacyFont)
  if (useTextsArray && namesDisplay?.texts) {
    namesDisplay.texts.forEach(t => {
      if (t.font && !fontsToLoad.includes(t.font)) fontsToLoad.push(t.font)
    })
  }

  // Countdown style options
  const cdBg = countdownStyle?.background || "none"
  const cdShape = countdownStyle?.shape || "rounded"
  const cdLayout = countdownStyle?.layout || "inline"

  // Countdown area background
  const getAreaBgStyle = (): React.CSSProperties => {
    if (!countdownAreaBg) return { backgroundColor: backgroundColor, color: textColor }
    if (countdownAreaBg === "primary") return { backgroundColor: primaryColor, color: "#fff" }
    if (countdownAreaBg === "background") return { backgroundColor: backgroundColor, color: textColor }
    // Custom hex color
    return { backgroundColor: countdownAreaBg, color: textColor }
  }

  // Build countdown item background style
  const getCountdownBgStyle = (): React.CSSProperties => {
    if (cdBg === "none") return {}
    if (cdBg === "background") return { backgroundColor: backgroundColor, border: `1px solid ${primaryColor}30` }
    if (cdBg === "primary") return { backgroundColor: primaryColor, color: "#fff" }
    if (cdBg === "secondary") return { backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }
    // Custom hex color
    return { backgroundColor: cdBg, color: "#fff" }
  }

  const getCountdownShapeClass = () => {
    if (cdBg === "none") return ""
    switch (cdShape) {
      case "circle": return "rounded-full"
      case "square": return "rounded-none"
      case "pill": return "rounded-full"
      case "rounded":
      default: return "rounded-lg"
    }
  }

  // For circle shape, use fixed equal sizes
  const isCircle = cdShape === "circle" && cdBg !== "none"
  const circleSize = "w-16 h-16 sm:w-20 sm:h-20"

  const items = [
    { value: time?.days ?? 0, label: countdownLabels.days },
    { value: time?.hours ?? 0, label: countdownLabels.hours },
    { value: time?.minutes ?? 0, label: countdownLabels.minutes },
    { value: time?.seconds ?? 0, label: countdownLabels.seconds },
  ]

  // Render a single name text with its own styling
  const renderNameText = (textConfig: NamesText, fallbackFont?: string, fallbackWeight?: string, fallbackSize?: string, fallbackStyle?: string) => {
    const font = textConfig.font || fallbackFont
    const weight = textConfig.weight || fallbackWeight || "300"
    const size = textConfig.size || fallbackSize || "lg"
    const style = textConfig.style || fallbackStyle || "normal"
    const resolvedWeight = weightMap[weight] || weight
    const sizeClass = sizeMap[size] || sizeMap.lg

    const textStyle: React.CSSProperties = {
      ...(font ? { fontFamily: `'${font}', cursive` } : {}),
      fontWeight: resolvedWeight,
      fontStyle: style,
      color: namesColor,
    }

    return (
      <p className={`text-center tracking-[0.25em] uppercase ${sizeClass}`} style={textStyle}>
        {textConfig.text}
      </p>
    )
  }

  // Names/Logo overlay component
  const NamesOverlay = () => {
    if (!shouldShowNames) return null

    // If logo is provided, show logo instead of names
    if (namesLogo) {
      return (
        <div className={`absolute inset-x-0 ${namesPosition === "top" ? "top-0 pt-10" : "bottom-0 pb-10"} flex flex-col items-center`}>
          <Image
            src={namesLogo}
            alt="Logo"
            width={200}
            height={100}
            className="max-h-24 w-auto object-contain sm:max-h-32"
          />
        </div>
      )
    }

    // Using new texts array format
    if (useTextsArray && namesDisplay?.texts) {
      return (
        <div 
          className={`absolute inset-x-0 ${namesPosition === "top" ? "top-0 pt-10" : "bottom-0 pb-10"} flex flex-col items-center`}
        >
          {showDecorativeLines && (
            <div className="mb-3 h-px w-12 bg-white/40" />
          )}
          {renderNameText(namesDisplay.texts[0], legacyFont, legacyWeight, legacySize, legacyStyle)}
          <span className="my-1 text-lg font-extralight tracking-[0.3em] sm:text-xl md:text-2xl" style={{ color: namesColor, opacity: 0.6 }}>
            {separator}
          </span>
          {renderNameText(namesDisplay.texts[1], legacyFont, legacyWeight, legacySize, legacyStyle)}
          {showDecorativeLines && (
            <div className="mt-3 h-px w-12 bg-white/40" />
          )}
        </div>
      )
    }

    // Legacy format: use brideName and groomName with shared styling
    const resolvedWeight = weightMap[legacyWeight] || legacyWeight
    const sizeClass = sizeMap[legacySize] || sizeMap.lg
    const namesFontStyle: React.CSSProperties = {
      ...(legacyFont ? { fontFamily: `'${legacyFont}', cursive` } : {}),
      fontWeight: resolvedWeight,
      fontStyle: legacyStyle,
      color: namesColor,
    }

    return (
      <div 
        className={`absolute inset-x-0 ${namesPosition === "top" ? "top-0 pt-10" : "bottom-0 pb-10"} flex flex-col items-center`}
        style={namesFontStyle}
      >
        {showDecorativeLines && (
          <div className="mb-3 h-px w-12 bg-current opacity-40" />
        )}
        <p className={`text-center tracking-[0.25em] uppercase ${sizeClass}`}>
          {brideName}
        </p>
        <span className="my-1 text-lg font-extralight tracking-[0.3em] opacity-60 sm:text-xl md:text-2xl">
          {separator}
        </span>
        <p className={`text-center tracking-[0.25em] uppercase ${sizeClass}`}>
          {groomName}
        </p>
        {showDecorativeLines && (
          <div className="mt-3 h-px w-12 bg-current opacity-40" />
        )}
      </div>
    )
  }

  // Countdown component
  const CountdownContent = ({ overlayMode = false }: { overlayMode?: boolean }) => {
    const textColorStyle = overlayMode && cdBg !== "none" ? {} : { color: textColor }
    
    return (
      <div className="flex flex-col items-center" style={overlayMode ? { color: textColor } : textColorStyle}>
        {/* Countdown prefix */}
        {countdownPrefix && (
          <p className="mb-4 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/60">
            {countdownPrefix}
          </p>
        )}

        {/* Countdown */}
        <div className="flex items-start justify-center gap-2" aria-live="polite">
          {items.map((item, i) => {
            const bgStyle = getCountdownBgStyle()
            const isPrimary = cdBg === "primary" || (cdBg !== "none" && cdBg !== "background" && cdBg !== "secondary")
            
            return (
              <div key={item.label} className="flex items-start gap-2">
                <div 
                  className={`flex flex-col items-center justify-center ${
                    cdBg !== "none" ? (isCircle ? circleSize : "px-3 py-2 min-w-[60px]") : ""
                  } ${getCountdownShapeClass()}`}
                  style={bgStyle}
                >
                  <span
                    className={`text-3xl font-light tabular-nums sm:text-4xl ${isCircle ? "" : "md:text-5xl"} ${isPrimary ? "text-white" : "text-inherit"}`}
                    suppressHydrationWarning
                  >
                    {time
                      ? String(item.value).padStart(
                          item.label === countdownLabels.days ? 1 : 2,
                          "0"
                        )
                      : "--"}
                  </span>
                  <span className={`mt-0.5 text-[8px] font-medium tracking-[0.1em] uppercase ${isPrimary ? "text-white/70" : "text-inherit/50"}`}>
                    {item.label}
                  </span>
                </div>
                {i < 3 && cdBg === "none" && (
                  <span className="mt-1 text-3xl font-light text-inherit/40 md:text-4xl">
                    :
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const isOverlay = cdLayout === "overlay"

  return (
    <section className="flex flex-col items-center bg-background">
      {/* Load custom fonts if specified */}
      {fontsToLoad.length > 0 && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {fontsToLoad.map(font => (
            <link 
              key={font}
              href={`https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`} 
              rel="stylesheet" 
            />
          ))}
        </>
      )}

      {/* Couple photo with names overlaid */}
      <div className={`relative aspect-[3/4] w-full sm:aspect-[4/5] ${isOverlay ? "mb-0" : ""}`}>
        <Image
          src={coupleImage}
          alt="Foto de la pareja"
          fill
          className="object-cover"
          priority
        />
        {shouldShowNames && (
          <>
            {/* Subtle gradient overlay for text contrast */}
            <div className={`absolute inset-0 ${
              namesPosition === "top" 
                ? "bg-gradient-to-b from-black/50 via-black/10 to-transparent" 
                : "bg-gradient-to-t from-black/50 via-black/10 to-transparent"
            }`} />
            <NamesOverlay />
          </>
        )}
      </div>

      {/* Overlay countdown - positioned to overlap between hero and next section */}
      {isOverlay ? (
        <div className="relative z-10 -mt-14 mb-4">
          <div 
            className="rounded-2xl px-6 py-5 shadow-lg"
            style={{ backgroundColor: backgroundColor }}
          >
            <CountdownContent overlayMode />
          </div>
        </div>
      ) : (
        /* Inline countdown - standard layout below photo */
        <div className="flex w-full flex-col items-center px-6 pt-10 pb-10" style={getAreaBgStyle()}>
          <h1 className="mb-8 text-center text-3xl font-light tracking-wide uppercase text-inherit md:text-4xl">
            {headline}
          </h1>
          <CountdownContent />
        </div>
      )}
    </section>
  )
}
