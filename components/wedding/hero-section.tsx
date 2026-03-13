"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useConfig } from "@/lib/config-context"

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
  showNamesOnPhoto?: boolean
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

  // Determine if names should show
  const shouldShowNames = namesDisplay?.enabled ?? showNamesOnPhoto
  const namesPosition = namesDisplay?.position || "bottom"
  const namesLogo = namesDisplay?.logo
  const namesColor = namesDisplay?.color || "rgba(255,255,255,0.9)"
  const showDecorativeLines = namesDisplay?.decorativeLines ?? false
  const useTextsArray = namesDisplay?.texts && namesDisplay.texts.length >= 2

  // Legacy single style
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
  const isOverlayLayout = cdLayout === "overlay"

  // Countdown area background
  const getAreaBgStyle = (): React.CSSProperties => {
    if (!countdownAreaBg) return { backgroundColor: backgroundColor, color: textColor }
    if (countdownAreaBg === "primary") return { backgroundColor: primaryColor, color: "#fff" }
    if (countdownAreaBg === "background") return { backgroundColor: backgroundColor, color: textColor }
    return { backgroundColor: countdownAreaBg, color: textColor }
  }

  // Build countdown ITEM background style (individual boxes)
  const getCountdownItemBgStyle = (): React.CSSProperties => {
    if (cdBg === "none") return {}
    if (cdBg === "background") return { backgroundColor: backgroundColor, border: `1px solid ${primaryColor}30` }
    if (cdBg === "primary") return { backgroundColor: primaryColor, color: "#fff" }
    if (cdBg === "secondary") return { backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }
    return { backgroundColor: cdBg, color: "#fff" }
  }

  const getCountdownShapeClass = () => {
    if (cdBg === "none") return ""
    switch (cdShape) {
      case "circle": return "rounded-full"
      case "square": return "rounded-none"
      case "pill": return "rounded-full px-4"
      case "rounded":
      default: return "rounded-lg"
    }
  }

  // For circle shape, use fixed EQUAL sizes
  const isCircle = cdShape === "circle" && cdBg !== "none"
  const circleSize = "w-[72px] h-[72px] sm:w-[80px] sm:h-[80px]"

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

    // Calculate position - more padding at bottom when overlay layout is active
    const getPositionClass = () => {
      if (namesPosition === "top") return "top-0 pt-10"
      return isOverlayLayout ? "bottom-0 pb-24" : "bottom-0 pb-10"
    }

    if (namesLogo) {
      return (
        <div className={`absolute inset-x-0 ${getPositionClass()} flex flex-col items-center`}>
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

    if (useTextsArray && namesDisplay?.texts) {
      return (
        <div className={`absolute inset-x-0 ${getPositionClass()} flex flex-col items-center`}>
          {showDecorativeLines && <div className="mb-3 h-px w-12 bg-white/40" />}
          {renderNameText(namesDisplay.texts[0], legacyFont, legacyWeight, legacySize, legacyStyle)}
          <span className="my-1 text-lg font-extralight tracking-[0.3em] sm:text-xl md:text-2xl" style={{ color: namesColor, opacity: 0.6 }}>
            {separator}
          </span>
          {renderNameText(namesDisplay.texts[1], legacyFont, legacyWeight, legacySize, legacyStyle)}
          {showDecorativeLines && <div className="mt-3 h-px w-12 bg-white/40" />}
        </div>
      )
    }

    // Legacy format
    const resolvedWeight = weightMap[legacyWeight] || legacyWeight
    const sizeClass = sizeMap[legacySize] || sizeMap.lg
    const namesFontStyle: React.CSSProperties = {
      ...(legacyFont ? { fontFamily: `'${legacyFont}', cursive` } : {}),
      fontWeight: resolvedWeight,
      fontStyle: legacyStyle,
      color: namesColor,
    }

    return (
      <div className={`absolute inset-x-0 ${getPositionClass()} flex flex-col items-center`} style={namesFontStyle}>
        {showDecorativeLines && <div className="mb-3 h-px w-12 bg-current opacity-40" />}
        <p className={`text-center tracking-[0.25em] uppercase ${sizeClass}`}>{brideName}</p>
        <span className="my-1 text-lg font-extralight tracking-[0.3em] opacity-60 sm:text-xl md:text-2xl">{separator}</span>
        <p className={`text-center tracking-[0.25em] uppercase ${sizeClass}`}>{groomName}</p>
        {showDecorativeLines && <div className="mt-3 h-px w-12 bg-current opacity-40" />}
      </div>
    )
  }

  // Countdown component
  const CountdownContent = ({ overlayMode = false }: { overlayMode?: boolean }) => {
    const hasBg = cdBg !== "none"
    const isPrimaryBg = cdBg === "primary" || (hasBg && cdBg !== "background" && cdBg !== "secondary")
    
    return (
      <div className="flex flex-col items-center" style={{ color: textColor }}>
        {countdownPrefix && (
          <p className="mb-4 text-[10px] font-medium tracking-[0.2em] uppercase opacity-60">
            {countdownPrefix}
          </p>
        )}

        <div className={`flex items-start justify-center ${hasBg ? "gap-3" : "gap-2"}`} aria-live="polite">
          {items.map((item, i) => {
            const itemBgStyle = getCountdownItemBgStyle()
            
            return (
              <div key={item.label} className="flex items-start gap-2">
                <div 
                  className={`flex flex-col items-center justify-center ${
                    hasBg ? (isCircle ? circleSize : "px-3 py-2 min-w-[60px] sm:min-w-[70px]") : ""
                  } ${getCountdownShapeClass()}`}
                  style={itemBgStyle}
                >
                  <span
                    className={`tabular-nums ${
                      overlayMode 
                        ? "text-3xl font-light sm:text-4xl" 
                        : "text-4xl font-extralight sm:text-5xl md:text-6xl"
                    } ${isPrimaryBg && hasBg ? "text-white" : "text-inherit"}`}
                    suppressHydrationWarning
                  >
                    {time
                      ? String(item.value).padStart(item.label === countdownLabels.days ? 1 : 2, "0")
                      : "--"}
                  </span>
                  <span className={`mt-0.5 text-[8px] font-medium tracking-[0.1em] uppercase ${isPrimaryBg && hasBg ? "text-white/70" : "opacity-50"}`}>
                    {item.label}
                  </span>
                </div>
                {i < 3 && !hasBg && (
                  <span className={`mt-1 font-light opacity-40 ${overlayMode ? "text-3xl" : "text-4xl md:text-5xl"}`}>
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

  return (
    <section className="flex flex-col items-center bg-background">
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

      {/* Hero image with names */}
      <div className={`relative aspect-[3/4] w-full sm:aspect-[4/5] ${isOverlayLayout ? "mb-0" : ""}`}>
        <Image
          src={coupleImage}
          alt="Foto de la pareja"
          fill
          className="object-cover"
          priority
        />
        {shouldShowNames && (
          <>
            <div className={`absolute inset-0 ${
              namesPosition === "top" 
                ? "bg-gradient-to-b from-black/50 via-black/10 to-transparent" 
                : "bg-gradient-to-t from-black/50 via-black/10 to-transparent"
            }`} />
            <NamesOverlay />
          </>
        )}
      </div>

      {/* Countdown */}
      {isOverlayLayout ? (
        <div className="relative z-10 -mt-14 mb-4">
          <div 
            className="rounded-2xl px-6 py-5 shadow-lg"
            style={{ backgroundColor: backgroundColor }}
          >
            <CountdownContent overlayMode />
          </div>
        </div>
      ) : (
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
