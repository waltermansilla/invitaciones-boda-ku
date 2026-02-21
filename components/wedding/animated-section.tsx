"use client"

import { useFadeIn } from "@/hooks/use-fade-in"

interface AnimatedSectionProps {
  children: React.ReactNode
  id?: string
  className?: string
}

export default function AnimatedSection({
  children,
  id,
  className = "",
}: AnimatedSectionProps) {
  const { ref, isVisible } = useFadeIn(0.1)

  return (
    <div
      ref={ref}
      id={id}
      className={`${className} transition-all duration-700 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0"
      }`}
    >
      {children}
    </div>
  )
}
