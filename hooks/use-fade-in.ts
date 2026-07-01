"use client"

import { useEffect, useRef, useState } from "react"

export function useFadeIn(threshold = 0.15, initialVisible = false) {
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
      { threshold }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, initialVisible])

  return { ref, isVisible }
}
