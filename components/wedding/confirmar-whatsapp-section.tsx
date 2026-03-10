"use client"

import { useIsMuestra } from "@/lib/config-context"

/**
 * Seccion simple de confirmacion por WhatsApp (Plan Base).
 * Sin formulario: solo un boton que abre WhatsApp con un mensaje predefinido.
 *
 * Configurable desde JSON:
 *   title           -> Titulo de la seccion
 *   subtitle        -> (OPCIONAL) Texto entre titulo y boton (ej: "Confirmar antes del 15 de marzo")
 *   buttonText      -> Texto del boton
 *   whatsappNumber  -> Numero sin +, sin espacios (ej: "3456023759")
 *   message         -> Mensaje que se envia (default: "Confirmo mi asistencia")
 */
interface ConfirmarWhatsappSectionProps {
  title: string
  subtitle?: string
  buttonText: string
  whatsappNumber: string
  message: string
}

export default function ConfirmarWhatsappSection({
  title,
  subtitle,
  buttonText,
  whatsappNumber,
  message,
}: ConfirmarWhatsappSectionProps) {
  const isMuestra = useIsMuestra()

  const handleClick = () => {
    if (isMuestra) {
      alert("Modo muestra: en la version real, esto abre WhatsApp.")
      return
    }
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <h2 className="mb-3 text-xl font-semibold tracking-[0.2em] uppercase text-inherit/90 md:text-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mb-6 max-w-sm text-sm font-light leading-relaxed opacity-70">
          {subtitle}
        </p>
      )}
      <button
        onClick={handleClick}
        className={`inline-flex min-h-[48px] items-center rounded-full border border-current/40 px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-inherit transition-opacity hover:bg-current/10 ${!subtitle ? "mt-3" : ""}`}
      >
        {buttonText}
      </button>
    </section>
  )
}
