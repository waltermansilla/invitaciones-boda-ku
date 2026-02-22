"use client"

import { useEffect, useState } from "react"

export default function ScrollBlurOverlay() {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Start fading in after 100px of scroll, fully visible by 400px
      const scrollY = window.scrollY
      const progress = Math.min(Math.max((scrollY - 100) / 300, 0), 1)
      setOpacity(progress * 0.85)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (opacity <= 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-20"
      style={{
        background: `linear-gradient(to bottom, rgba(250, 248, 245, ${opacity}) 0%, rgba(250, 248, 245, ${opacity * 0.5}) 60%, transparent 100%)`,
        backdropFilter: opacity > 0.1 ? `blur(${opacity * 6}px)` : "none",
        WebkitBackdropFilter: opacity > 0.1 ? `blur(${opacity * 6}px)` : "none",
      }}
      aria-hidden="true"
    />
  )
}
