"use client"

import { useFadeIn } from "@/hooks/use-fade-in"

interface AnimatedSectionProps {
  children: React.ReactNode
  id?: string
}

export default function AnimatedSection({
  children,
  id,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useFadeIn(0.15)

  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      {children}
    </div>
  )
}
