"use client"

import { useState } from "react"

interface NameStyle {
  font?: string
  size?: string
  weight?: string
  color?: string
  lowercase?: boolean // true = respeta mayusculas/minusculas del JSON, false/undefined = todo mayusculas
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
  onDismiss?: () => void // callback when overlay is dismissed
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
  onDismiss,
}: HeroOverlayProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  function handleEnter() {
    setExiting(true)
    // Notify parent that overlay is being dismissed (show content behind)
    onDismiss?.()
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

  // Map size to tailwind classes
  const sizeClasses: Record<string, string> = {
    "sm": "text-2xl sm:text-3xl",
    "md": "text-3xl sm:text-4xl",
    "lg": "text-4xl sm:text-5xl",
    "xl": "text-4xl sm:text-5xl md:text-6xl",
    "2xl": "text-5xl sm:text-6xl md:text-7xl",
    "3xl": "text-6xl sm:text-7xl md:text-8xl",
    "4xl": "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
  }
  const nameSizeClass = sizeClasses[nameSize] || sizeClasses["4xl"]

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

  // Background styles
  const bgStyles: React.CSSProperties = {}
  if (bgImage) {
    bgStyles.backgroundImage = `url(${bgImage})`
    bgStyles.backgroundSize = "cover"
    bgStyles.backgroundPosition = "center"
  } else if (bgColor) {
    bgStyles.backgroundColor = bgColor
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center ${justifyClass} ${!bgImage && !bgColor ? "bg-background" : ""} ${
        exiting ? "animate-overlay-exit" : ""
      }`}
      style={bgStyles}
      aria-live="polite"
    >
      {/* Content wrapper - only show if names or phrase enabled */}
      {(showNames || showPhrase) && typeof numPosition !== "number" && (
        <div className="flex flex-col items-center">
          {showNames && (
            <>
              {/* Decorative thin line */}
              <div className="mb-8 h-px w-12 bg-primary/30" />

              {/* Couple names */}
              <h1 
                className={`text-center ${nameSizeClass} ${nameWeightClass} tracking-[0.2em] ${nameColor ? "" : "text-foreground"}`}
                style={{ 
                  fontFamily: nameFontFamily,
                  color: nameColor,
                  textTransform: nameStyle?.lowercase ? "none" : "uppercase",
                }}
              >
                {brideName}
              </h1>
              <span className="my-3 text-2xl font-extralight tracking-[0.3em] text-primary/60 sm:text-3xl md:text-4xl">
                {separator}
              </span>
              <h1 
                className={`text-center ${nameSizeClass} ${nameWeightClass} tracking-[0.2em] ${nameColor ? "" : "text-foreground"}`}
                style={{ 
                  fontFamily: nameFontFamily,
                  color: nameColor,
                  textTransform: nameStyle?.lowercase ? "none" : "uppercase",
                }}
              >
                {groomName}
              </h1>

              {/* Decorative thin line */}
              <div className="mt-8 mb-10 h-px w-12 bg-primary/30" />
            </>
          )}

          {/* Romantic phrase */}
          {showPhrase && (
            <p className="mx-auto max-w-xs px-6 text-center text-sm font-light leading-relaxed tracking-wider text-muted-foreground sm:text-base">
              {phrase}
            </p>
          )}
        </div>
      )}

      {/* Enter button */}
      <button
        onClick={handleEnter}
        className={`${typeof numPosition === "number" ? "" : "mt-14"} border border-primary/40 px-10 py-3 text-xs font-medium tracking-[0.3em] uppercase text-primary transition-all duration-500 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95`}
        style={buttonStyle}
        aria-label={buttonText}
      >
        {buttonText}
      </button>
    </div>
  )
}
