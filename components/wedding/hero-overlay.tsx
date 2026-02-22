"use client"

import { useState } from "react"

interface HeroOverlayProps {
  groomName: string
  brideName: string
  separator: string
  phrase: string
  buttonText: string
}

export default function HeroOverlay({
  groomName,
  brideName,
  separator,
  phrase,
  buttonText,
}: HeroOverlayProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  function handleEnter() {
    setExiting(true)
    setTimeout(() => setVisible(false), 1200)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background ${
        exiting ? "animate-overlay-exit" : ""
      }`}
      aria-live="polite"
    >
      {/* Decorative thin line */}
      <div className="mb-8 h-px w-12 bg-primary/30" />

      {/* Couple names */}
      <h1 className="text-center text-4xl font-extralight tracking-[0.25em] uppercase text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
        {brideName}
      </h1>
      <span className="my-3 text-2xl font-extralight tracking-[0.3em] text-primary/60 sm:text-3xl md:text-4xl">
        {separator}
      </span>
      <h1 className="text-center text-4xl font-extralight tracking-[0.25em] uppercase text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
        {groomName}
      </h1>

      {/* Decorative thin line */}
      <div className="mt-8 mb-10 h-px w-12 bg-primary/30" />

      {/* Romantic phrase */}
      <p className="mx-auto max-w-xs px-6 text-center text-sm font-light leading-relaxed tracking-wider text-muted-foreground sm:text-base">
        {phrase}
      </p>

      {/* Enter button */}
      <button
        onClick={handleEnter}
        className="mt-14 border border-primary/40 px-10 py-3 text-xs font-medium tracking-[0.3em] uppercase text-primary transition-all duration-500 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
        aria-label={buttonText}
      >
        {buttonText}
      </button>
    </div>
  )
}
