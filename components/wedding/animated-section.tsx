"use client"

import { useEffect, useRef, useState } from "react"
import config from "@/data/wedding-config.json"

interface AnimatedSectionProps {
  children: React.ReactNode
  id?: string
}

export default function AnimatedSection({
  children,
  id,
}: AnimatedSectionProps) {
  const animations = (config as Record<string, unknown>).animations as {
    enabled?: boolean
    staggerChildren?: boolean
  } | undefined

  const enabled = animations?.enabled !== false
  const stagger = enabled && animations?.staggerChildren !== false

  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(!enabled)

  useEffect(() => {
    if (!enabled) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  // Apply stagger CSS variable to direct children via a class
  return (
    <div
      ref={ref}
      id={id}
      className={
        enabled
          ? `transition-all duration-700 ease-out ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }${stagger && isVisible ? " stagger-children" : ""}`
          : ""
      }
    >
      {children}
    </div>
  )
}
