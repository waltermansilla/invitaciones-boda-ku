"use client"

import { useState } from "react"

interface NameStyle {
  font?: string
  size?: string
  weight?: string
  color?: string
  lowercase?: boolean // true = respeta mayusculas/minusculas del JSON, false/undefined = todo mayusculas
  letterSpacing?: string // "none" = sin espaciado (cursivas conectan), "normal" = 0.1em, "wide" = 0.2em (default)
}

interface InvitadoData {
  id: string
  nombre: string
  tipo: "persona" | "familia"
  estado: "pendiente" | "confirmado" | "no_asiste"
  integrantes?: { id: string; nombre: string; estado: string }[]
}

interface HeroOverlayProps {
  groomName: string
  brideName: string
  separator: string
  phrase: string
  buttonText: string
  // New props
  bgColor?: string
  bgImage?: string
  showNames?: boolean
  showPhrase?: boolean
  nameStyle?: NameStyle
  buttonPosition?: "center" | "top" | "bottom" | number // number = percentage from top (0-100)
  textPositionsPx?: {
    brideY?: number | string
    separatorY?: number | string
    groomY?: number | string
    phraseY?: number | string
    topLineY?: number | string
    bottomLineY?: number | string
    buttonY?: number | string
  }
  onDismiss?: () => void // callback when overlay is dismissed
  invitado?: InvitadoData | null // datos del invitado cuando viene con código
}

export default function HeroOverlay({
  groomName,
  brideName,
  separator,
  phrase,
  buttonText,
  bgColor,
  bgImage,
  showNames = true,
  showPhrase = true,
  nameStyle,
  buttonPosition = "center",
  textPositionsPx,
  onDismiss,
  invitado,
}: HeroOverlayProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  function handleEnter() {
    setExiting(true)
    // Notify parent that overlay is being dismissed (show content behind)
    // Small delay to let the exit animation start before showing content
    setTimeout(() => onDismiss?.(), 300)
    setTimeout(() => setVisible(false), 1200)
  }

  if (!visible) return null

  // Resolve button position - accept string or number
  let justifyClass = "justify-center"
  let buttonStyle: React.CSSProperties = {}
  
  // Convert string number to actual number (e.g. "40" -> 40)
  const numPosition = typeof buttonPosition === "string" && !isNaN(Number(buttonPosition)) 
    ? Number(buttonPosition) 
    : buttonPosition
  
  if (numPosition === "top") {
    justifyClass = "justify-start pt-20"
  } else if (numPosition === "bottom") {
    justifyClass = "justify-end pb-20"
  } else if (typeof numPosition === "number") {
    justifyClass = ""
    buttonStyle = { 
      position: "absolute",
      top: `${numPosition}%`,
      left: "50%",
      transform: "translateX(-50%)"
    }
  }

  // Resolve name styles
  const nameFontFamily = nameStyle?.font || undefined
  const nameSize = nameStyle?.size || "4xl"
  const nameWeight = nameStyle?.weight || "200"
  const nameColor = nameStyle?.color || undefined
  
  // Letter spacing: "none" = 0, "normal" = 0.1em, "wide" = 0.2em (default)
  const letterSpacingMap: Record<string, string> = {
    "none": "0",
    "normal": "0.1em", 
    "wide": "0.2em",
  }
  const nameLetterSpacing = letterSpacingMap[nameStyle?.letterSpacing || "wide"] || "0.2em"

  // Map size to tailwind classes
  const sizeClasses: Record<string, string> = {
    "sm": "text-2xl sm:text-3xl",
    "md": "text-3xl sm:text-4xl",
    "lg": "text-4xl sm:text-5xl",
    "xl": "text-4xl sm:text-5xl md:text-6xl",
    "2xl": "text-5xl sm:text-6xl md:text-7xl",
    "3xl": "text-6xl sm:text-7xl md:text-8xl",
    "4xl": "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
    "5xl": "text-5xl sm:text-6xl md:text-7xl lg:text-8xl",
  }
  // Check if size is a pixel value (e.g. "48px", "60px")
  const isPixelSize = nameSize.endsWith("px")
  const nameSizeClass = isPixelSize ? "" : (sizeClasses[nameSize] || sizeClasses["4xl"])
  const nameSizeStyle: React.CSSProperties = isPixelSize ? { fontSize: nameSize } : {}

  // Map weight to tailwind
  const weightClasses: Record<string, string> = {
    "100": "font-thin",
    "200": "font-extralight",
    "300": "font-light",
    "400": "font-normal",
    "500": "font-medium",
    "600": "font-semibold",
    "700": "font-bold",
  }
  const nameWeightClass = weightClasses[nameWeight] || "font-extralight"

  const toPxValue = (value?: number | string): string | undefined => {
    if (value === undefined || value === null || value === "") return undefined
    if (typeof value === "number") return `${value}px`
    const trimmed = value.trim()
    if (!trimmed) return undefined
    return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed
  }

  const parsePosition = (value?: number | string) => {
    if (value === undefined || value === null || value === "") return null
    if (typeof value === "number") {
      return { top: `${value}px`, left: "50%", centered: true }
    }
    const trimmed = value.trim()
    if (!trimmed) return null
    const [rawY, rawX] = trimmed.split(",").map((part) => part.trim())
    const top = toPxValue(rawY)
    if (!top) return null
    const left = toPxValue(rawX)
    if (left) return { top, left, centered: false }
    return { top, left: "50%", centered: true }
  }

  const bridePos = parsePosition(textPositionsPx?.brideY)
  const separatorPos = parsePosition(textPositionsPx?.separatorY)
  const groomPos = parsePosition(textPositionsPx?.groomY)
  const phrasePos = parsePosition(textPositionsPx?.phraseY)
  const topLinePos = parsePosition(textPositionsPx?.topLineY)
  const bottomLinePos = parsePosition(textPositionsPx?.bottomLineY)
  const buttonPos = parsePosition(textPositionsPx?.buttonY)

  if (buttonPos) {
    justifyClass = ""
    buttonStyle = {
      position: "absolute",
      top: buttonPos.top,
      left: buttonPos.left,
      transform: buttonPos.centered ? "translateX(-50%)" : undefined,
    }
  }

  // Background styles
  const bgStyles: React.CSSProperties = {}
  if (bgImage) {
    bgStyles.backgroundImage = `url(${bgImage})`
    bgStyles.backgroundSize = "cover"
    bgStyles.backgroundPosition = "center"
  } else if (bgColor) {
    bgStyles.backgroundColor = bgColor
  }

  const hasCustomTextPositions = Boolean(bridePos || separatorPos || groomPos || phrasePos || topLinePos || bottomLinePos)

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center ${justifyClass} ${!bgImage && !bgColor ? "bg-background" : ""} ${
        exiting ? "animate-overlay-exit" : ""
      }`}
      style={bgStyles}
      aria-live="polite"
    >
      {/* Content wrapper - only show if names or phrase enabled */}
      {(showNames || showPhrase) && typeof numPosition !== "number" && !hasCustomTextPositions && (
        <div className="flex flex-col items-center">
          {showNames && (
            <div className="flex flex-col items-center justify-center">
              {/* Decorative thin line - same margin top/bottom for centering */}
              <div className="my-8 h-px w-12 bg-primary/30" />

              {/* Couple names */}
              <h1 
                className={`text-center ${nameSizeClass} ${nameWeightClass} ${nameColor ? "" : "text-foreground"}`}
                style={{ 
                  fontFamily: nameFontFamily,
                  color: nameColor,
                  textTransform: nameStyle?.lowercase ? "none" : "uppercase",
                  letterSpacing: nameLetterSpacing,
                  ...nameSizeStyle,
                }}
              >
                {brideName}
              </h1>
              {separator && (
                <span className="my-3 text-2xl font-extralight tracking-[0.3em] text-primary/60 sm:text-3xl md:text-4xl">
                  {separator}
                </span>
              )}
              {groomName && (
                <h1 
                  className={`text-center ${nameSizeClass} ${nameWeightClass} ${nameColor ? "" : "text-foreground"}`}
                  style={{ 
                    fontFamily: nameFontFamily,
                    color: nameColor,
                    textTransform: nameStyle?.lowercase ? "none" : "uppercase",
                    letterSpacing: nameLetterSpacing,
                    ...nameSizeStyle,
                  }}
                >
                  {groomName}
                </h1>
              )}

              {/* Decorative thin line - same margin top/bottom for centering */}
              <div className="my-8 h-px w-12 bg-primary/30" />
            </div>
          )}

          {/* Romantic phrase */}
          {showPhrase && !invitado && (
            <p className="mx-auto w-[88vw] max-w-md px-5 text-center text-sm font-light leading-relaxed tracking-wider text-muted-foreground sm:w-auto sm:px-8 sm:text-base">
              {phrase}
            </p>
          )}

          {/* Caja con nombre del invitado - cuando hay código */}
          {invitado && (
            <div className="mx-6 mt-6 rounded-2xl border border-muted/30 bg-background/90 px-8 py-6 text-center shadow-sm backdrop-blur-sm">
              <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-foreground/80 sm:text-xl">
                {invitado.nombre}
              </h2>
              <p className="mt-2 text-sm font-light tracking-wide text-muted-foreground">
                {invitado.tipo === "familia" && invitado.integrantes
                  ? `Hay ${invitado.integrantes.length} lugares reservados para ustedes`
                  : "Tenemos un lugar reservado para ti"}
              </p>
            </div>
          )}
        </div>
      )}

      {(showNames || showPhrase) && typeof numPosition !== "number" && hasCustomTextPositions && (
        <div className="pointer-events-none absolute inset-0">
          {showNames && (
            <>
              {topLinePos && (
                <div
                  className="absolute z-10 h-px w-12 bg-primary/30"
                  style={{
                    top: topLinePos?.top,
                    left: topLinePos?.left,
                    transform: topLinePos?.centered ? "translateX(-50%)" : undefined,
                  }}
                />
              )}
              {bridePos && (
                <h1
                  className={`absolute text-center ${nameSizeClass} ${nameWeightClass} ${nameColor ? "" : "text-foreground"}`}
                  style={{
                    top: bridePos.top,
                    left: bridePos.left,
                    transform: bridePos.centered ? "translateX(-50%)" : undefined,
                    fontFamily: nameFontFamily,
                    color: nameColor,
                    textTransform: nameStyle?.lowercase ? "none" : "uppercase",
                    letterSpacing: nameLetterSpacing,
                    ...nameSizeStyle,
                  }}
                >
                  {brideName}
                </h1>
              )}
              {separator && separatorPos && (
                <span
                  className="absolute text-2xl font-extralight tracking-[0.3em] text-primary/60 sm:text-3xl md:text-4xl"
                  style={{
                    top: separatorPos.top,
                    left: separatorPos.left,
                    transform: separatorPos.centered ? "translateX(-50%)" : undefined,
                  }}
                >
                  {separator}
                </span>
              )}
              {groomName && groomPos && (
                <h1
                  className={`absolute text-center ${nameSizeClass} ${nameWeightClass} ${nameColor ? "" : "text-foreground"}`}
                  style={{
                    top: groomPos.top,
                    left: groomPos.left,
                    transform: groomPos.centered ? "translateX(-50%)" : undefined,
                    fontFamily: nameFontFamily,
                    color: nameColor,
                    textTransform: nameStyle?.lowercase ? "none" : "uppercase",
                    letterSpacing: nameLetterSpacing,
                    ...nameSizeStyle,
                  }}
                >
                  {groomName}
                </h1>
              )}
              {bottomLinePos && (
                <div
                  className="absolute z-10 h-px w-12 bg-primary/30"
                  style={{
                    top: bottomLinePos.top,
                    left: bottomLinePos.left,
                    transform: bottomLinePos.centered ? "translateX(-50%)" : undefined,
                  }}
                />
              )}
            </>
          )}

          {showPhrase && !invitado && phrasePos && (
            <p
              className="absolute mx-auto w-[88vw] max-w-md px-5 text-center text-sm font-light leading-relaxed tracking-wider text-muted-foreground sm:w-auto sm:px-8 sm:text-base"
              style={{
                top: phrasePos.top,
                left: phrasePos.left,
                transform: phrasePos.centered ? "translateX(-50%)" : undefined,
              }}
            >
              {phrase}
            </p>
          )}
        </div>
      )}

      {/* Enter button */}
      <button
        onClick={handleEnter}
        className={`${typeof numPosition === "number" || buttonPos ? "" : "mt-14"} border border-primary/40 px-10 py-3 text-xs font-medium tracking-[0.3em] uppercase text-primary transition-all duration-500 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95`}
        style={buttonStyle}
        aria-label={buttonText}
      >
        {buttonText}
      </button>
    </div>
  )
}
