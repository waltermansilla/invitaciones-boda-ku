"use client"

import { useEffect } from "react"
import config from "@/data/wedding-config.json"

function hexToHSLValues(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = config

  useEffect(() => {
    const root = document.documentElement

    if (theme.primaryColor) {
      root.style.setProperty("--primary", theme.primaryColor)
      root.style.setProperty("--ring", theme.primaryColor)
      // Compute a lighter version for accent
      root.style.setProperty("--accent", theme.primaryColor)
    }
    if (theme.backgroundColor) {
      root.style.setProperty("--background", theme.backgroundColor)
    }
    if (theme.textColor) {
      root.style.setProperty("--foreground", theme.textColor)
      root.style.setProperty("--card-foreground", theme.textColor)
    }
    if (theme.accentBackground) {
      root.style.setProperty("--accent-bg", theme.accentBackground)
    }
    if (theme.fontPrimary) {
      root.style.setProperty("--font-display", `'${theme.fontPrimary}', Georgia, serif`)
    }
    if (theme.fontSecondary) {
      root.style.setProperty("--font-body", `'${theme.fontSecondary}', system-ui, sans-serif`)
    }
  }, [theme])

  return <>{children}</>
}
