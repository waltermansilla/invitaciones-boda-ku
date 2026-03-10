"use client"

import { Baby } from "lucide-react"

/**
 * Seccion "Solo Adultos" - Indica que el evento es exclusivo para adultos.
 * Muestra un icono de cochecito tachado, titulo y descripcion.
 *
 * Configurable desde JSON:
 *   title       -> Titulo (ej: "Evento solo para adultos")
 *   description -> Texto explicativo
 */

// Custom "No babies" icon (baby with strike)
function NoBabiesIcon({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Baby className="h-full w-full" strokeWidth={1} />
      {/* Diagonal strike line */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[140%] w-0.5 rotate-45 bg-current opacity-70" />
      </div>
    </div>
  )
}

interface AdultsOnlySectionProps {
  title: string
  description: string
}

export default function AdultsOnlySection({
  title,
  description,
}: AdultsOnlySectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <NoBabiesIcon className="mb-5 h-10 w-10 opacity-70" />
      <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
        {title}
      </h2>
      <p className="max-w-sm text-sm font-light leading-relaxed opacity-80">
        {description}
      </p>
    </section>
  )
}
