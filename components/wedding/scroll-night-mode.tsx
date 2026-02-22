"use client"

import { useEffect, useCallback } from "react"

/**
 * Reads total scroll progress (0..1) and sets a CSS custom property
 * --scroll-progress on <main>, which other components can use to
 * progressively darken their backgrounds.
 *
 * Also sets --night-bg with the interpolated background color.
 */

function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function lerpColor(from: string, to: string, t: number) {
  const f = hexToRgb(from)
  const toRgb = hexToRgb(to)
  const r = Math.round(f.r + (toRgb.r - f.r) * t)
  const g = Math.round(f.g + (toRgb.g - f.g) * t)
  const b = Math.round(f.b + (toRgb.b - f.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

interface ScrollNightModeProps {
  lightColor: string    // e.g. "#FAF8F5"
  darkColor: string     // e.g. "#2C3527"
  lightTextColor: string  // text on light bg, e.g. "#6B7F5E"
  darkTextColor: string   // text transitions to this as bg darkens, e.g. "#D4C9A8"
  intensity?: number    // 0..1, how much of the transition to apply (default 1)
}

export default function ScrollNightMode({
  lightColor,
  darkColor,
  lightTextColor,
  darkTextColor,
  intensity = 1,
}: ScrollNightModeProps) {
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) return

    // Raw progress 0..1
    const raw = Math.min(scrollTop / docHeight, 1)
    // Apply easing: slow start, faster after 40% scroll
    const eased = raw < 0.4 ? raw * 0.3 : 0.12 + (raw - 0.4) * 1.47
    const progress = Math.min(Math.max(eased * intensity, 0), 1)

    const main = document.querySelector("main")
    if (main) {
      main.style.setProperty("--scroll-progress", String(progress))
      main.style.setProperty("--night-bg", lerpColor(lightColor, darkColor, progress))
      main.style.setProperty("--night-text", lerpColor(lightTextColor, darkTextColor, progress))
    }
  }, [lightColor, darkColor, lightTextColor, darkTextColor, intensity])

  useEffect(() => {
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return null
}
