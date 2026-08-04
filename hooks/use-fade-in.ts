"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Fade / reveal al scrollear.
 * `rootMargin` negativo abajo retrasa el disparo: el bloque tiene que
 * subir más en el viewport antes de contar como visible.
 */
export function useFadeIn(
  threshold = 0.12,
  initialVisible = false,
  /** Por defecto: hay que entrar ~un quinto de pantalla hacia el centro. */
  rootMargin = "0px 0px -20% 0px",
) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(initialVisible)

  useEffect(() => {
    if (initialVisible) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, initialVisible, rootMargin])

  return { ref, isVisible }
}
