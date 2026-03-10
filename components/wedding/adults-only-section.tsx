"use client"

import { Baby, Wine, GlassWater, Users, Heart, Sparkles } from "lucide-react"

/**
 * Seccion "Solo Adultos" - Indica que el evento es exclusivo para adultos.
 *
 * Configurable desde JSON:
 *   icon        -> Tipo de icono (ver opciones abajo)
 *   title       -> Titulo (ej: "Evento solo para adultos")
 *   description -> Texto explicativo
 *
 * ICONOS DISPONIBLES:
 *   "baby-strike"   -> Bebe con linea diagonal (tachado) - DEFAULT
 *   "baby"          -> Bebe sin tachar (para usar con texto que aclare)
 *   "stroller"      -> Cochecito con linea diagonal (tachado)
 *   "wine"          -> Copa de vino (elegante, implica adultos)
 *   "cocktail"      -> Vaso de cocktail
 *   "users"         -> Grupo de personas (adultos)
 *   "heart-adult"   -> Corazon con estilo elegante
 *   "sparkles"      -> Brillos (elegante, neutro)
 */

// Custom icons with strike-through
function BabyStrikeIcon({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Baby className="h-full w-full" strokeWidth={1.5} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[140%] w-0.5 rotate-45 bg-current opacity-80" />
      </div>
    </div>
  )
}

function StrollerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Stroller body */}
      <circle cx="7" cy="20" r="2" />
      <circle cx="17" cy="20" r="2" />
      <path d="M5 20H3V12a4 4 0 0 1 4-4h8" />
      <path d="M15 8v6a2 2 0 0 1-2 2H7" />
      <path d="M15 8l4-4" />
      <circle cx="19" cy="4" r="1.5" fill="currentColor" />
      {/* Hood */}
      <path d="M7 8c0-2.2 1.8-4 4-4h1" />
    </svg>
  )
}

function StrollerStrikeIcon({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <StrollerIcon className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[140%] w-0.5 rotate-45 bg-current opacity-80" />
      </div>
    </div>
  )
}

function CocktailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8" />
      <path d="M12 12v10" />
      <path d="M5 2l5 10h4l5-10" />
      <path d="M7.5 7h9" />
    </svg>
  )
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "baby-strike": BabyStrikeIcon,
  "baby": ({ className }) => <Baby className={className} strokeWidth={1.5} />,
  "stroller": StrollerIcon,
  "stroller-strike": StrollerStrikeIcon,
  "wine": ({ className }) => <Wine className={className} strokeWidth={1.5} />,
  "cocktail": CocktailIcon,
  "users": ({ className }) => <Users className={className} strokeWidth={1.5} />,
  "heart": ({ className }) => <Heart className={className} strokeWidth={1.5} />,
  "sparkles": ({ className }) => <Sparkles className={className} strokeWidth={1.5} />,
}

interface AdultsOnlySectionProps {
  icon?: string
  title: string
  description: string
}

export default function AdultsOnlySection({
  icon = "baby-strike",
  title,
  description,
}: AdultsOnlySectionProps) {
  const IconComponent = ICON_MAP[icon] || ICON_MAP["baby-strike"]

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <IconComponent className="mb-5 h-10 w-10 opacity-70" />
      <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
        {title}
      </h2>
      <p className="max-w-sm text-sm font-light leading-relaxed opacity-80">
        {description}
      </p>
    </section>
  )
}
