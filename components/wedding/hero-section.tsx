"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useConfig } from "@/lib/config-context"

/**
 * Hero Section - Portada principal de la invitacion
 * 
 * Opciones de nombres sobre la foto (namesDisplay):
 *   enabled: boolean         -> true para mostrar, false para ocultar
 *   position: "top" | "bottom" -> arriba o abajo de la imagen
 *   font: string             -> (OPCIONAL) Google Font para los nombres
 *   weight: string           -> (OPCIONAL) "100"-"900" o "light", "normal", "bold"
 *   size: string             -> (OPCIONAL) "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"
 *   style: string            -> (OPCIONAL) "normal", "italic"
 *   color: string            -> (OPCIONAL) color hex para los nombres (default: white)
 *   decorativeLines: boolean -> (OPCIONAL) mostrar lineas decorativas arriba/abajo
 *   logo: string             -> (OPCIONAL) Ruta a imagen de logo en vez de texto
 * 
 * Opciones de countdown (countdownStyle):
 *   background: "none" | "background" | "primary" | "secondary"
 *   shape: "rounded" | "circle" | "square" | "pill"
 */

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
    font?: string
    weight?: string
    size?: string
    style?: string
    color?: string
    decorativeLines?: boolean
    logo?: string
  }
  countdownPrefix?: string
  countdownLabels: {
    days: string
    hours: string
    minutes: string
    seconds: string
  }
  countdownStyle?: {
    background: "none" | "background" | "primary" | "secondary"
    shape: "rounded" | "circle" | "square" | "pill"
  }
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
  sm: "text-xl sm:text-2xl",
  base: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
  xl: "text-4xl sm:text-5xl",
  "2xl": "text-4xl sm:text-5xl md:text-6xl",
  "3xl": "text-5xl sm:text-6xl md:text-7xl",
  "4xl": "text-6xl sm:text-7xl md:text-8xl",
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
  const namesFont = namesDisplay?.font
  const namesLogo = namesDisplay?.logo
  const namesWeight = namesDisplay?.weight || "300"
  const namesSize = namesDisplay?.size || "lg"
  const namesStyle = namesDisplay?.style || "normal"
  const namesColor = namesDisplay?.color || "rgba(255,255,255,0.9)"
  const showDecorativeLines = namesDisplay?.decorativeLines ?? false

  // Resolve weight value
  const resolvedWeight = weightMap[namesWeight] || namesWeight

  // Build font family style if custom font specified
  const namesFontStyle: React.CSSProperties = {
    ...(namesFont ? { fontFamily: `'${namesFont}', cursive` } : {}),
    fontWeight: resolvedWeight,
    fontStyle: namesStyle,
    color: namesColor,
  }

  // Get size class
  const sizeClass = sizeMap[namesSize] || sizeMap.lg

  // Countdown style options
  const cdBg = countdownStyle?.background || "none"
  const cdShape = countdownStyle?.shape || "rounded"

  // Build countdown item classes based on style
  const getCountdownBgClass = () => {
    if (cdBg === "none") return ""
    if (cdBg === "background") return "border border-current/20"
    if (cdBg === "primary") return ""
    if (cdBg === "secondary") return ""
    return ""
  }

  const getCountdownBgStyle = (): React.CSSProperties => {
    if (cdBg === "none") return {}
    if (cdBg === "background") return { backgroundColor: backgroundColor }
    if (cdBg === "primary") return { backgroundColor: primaryColor, color: "#fff" }
    if (cdBg === "secondary") return { backgroundColor: `${primaryColor}20`, borderColor: primaryColor }
    return {}
  }

  const getCountdownShapeClass = () => {
    if (cdBg === "none") return ""
    switch (cdShape) {
      case "circle": return "rounded-full aspect-square"
      case "square": return "rounded-none"
      case "pill": return "rounded-full"
      case "rounded":
      default: return "rounded-lg"
    }
  }

  const items = [
    { value: time?.days ?? 0, label: countdownLabels.days },
    { value: time?.hours ?? 0, label: countdownLabels.hours },
    { value: time?.minutes ?? 0, label: countdownLabels.minutes },
    { value: time?.seconds ?? 0, label: countdownLabels.seconds },
  ]

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

    // Show names as text
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

  return (
    <section className="flex flex-col items-center bg-background">
      {/* Load custom font if specified */}
      {namesFont && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link 
            href={`https://fonts.googleapis.com/css2?family=${namesFont.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`} 
            rel="stylesheet" 
          />
        </>
      )}

      {/* Couple photo with names overlaid */}
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
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

      {/* Headline + Countdown below photo */}
      <div className="flex flex-col items-center px-6 pt-10 pb-10" style={{ color: textColor }}>
        <h1 className="mb-8 text-center text-3xl font-light tracking-wide uppercase text-inherit md:text-4xl">
          {headline}
        </h1>

        {/* Countdown prefix */}
        {countdownPrefix && (
          <p className="mb-4 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/60">
            {countdownPrefix}
          </p>
        )}

        {/* Countdown */}
        <div className="flex items-start justify-center gap-2" aria-live="polite">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-start gap-2">
              <div 
                className={`flex flex-col items-center ${cdBg !== "none" ? "px-3 py-2 min-w-[60px]" : ""} ${getCountdownBgClass()} ${getCountdownShapeClass()}`}
                style={getCountdownBgStyle()}
              >
                <span
                  className={`text-4xl font-light tabular-nums md:text-5xl ${cdBg === "primary" ? "text-white" : "text-inherit"}`}
                  suppressHydrationWarning
                >
                  {time
                    ? String(item.value).padStart(
                        item.label === countdownLabels.days ? 1 : 2,
                        "0"
                      )
                    : "--"}
                </span>
                <span className={`mt-1 text-[9px] font-medium tracking-[0.15em] uppercase ${cdBg === "primary" ? "text-white/70" : "text-inherit/50"}`}>
                  {item.label}
                </span>
              </div>
              {i < 3 && cdBg === "none" && (
                <span className="mt-1 text-3xl font-light text-inherit/40 md:text-4xl">
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
