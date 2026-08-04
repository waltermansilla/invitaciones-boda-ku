"use client"

import { useFadeIn } from "@/hooks/use-fade-in"

interface RevealContentProps {
  isVisible: boolean
  children: React.ReactNode
  className?: string
  /** Retardo CSS opcional (p. ej. momentos). */
  style?: React.CSSProperties
}

/** Solo anima el contenido (opacidad + translate), no el contenedor de fondo del padre. */
export function RevealContent({
  isVisible,
  children,
  className = "",
  style,
}: RevealContentProps) {
  return (
    <div
      style={style}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface AnimatedSectionProps {
  children: React.ReactNode
  id?: string
  /** Sin animación de entrada: visible al montar (1ª sección tras el hero). */
  initialVisible?: boolean
  /**
   * Si true (default), anima un wrapper interno. El padre puede poner el fondo
   * fuera de children… pero si children incluyen el fondo, usa contentOnly=false
   * y estructura vos el fondo fuera de RevealContent en el consumidor.
   */
}

/**
 * Shell con IntersectionObserver. El fondo debe ir FUERA de {@link RevealContent}
 * (ver Section). Por defecto anima children como contenido.
 */
export default function AnimatedSection({
  children,
  id,
  initialVisible = false,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useFadeIn(0.15, initialVisible)

  return (
    <div ref={ref} id={id}>
      <RevealContent isVisible={isVisible}>{children}</RevealContent>
    </div>
  )
}
