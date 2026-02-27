"use client"

import { useIsMuestra } from "@/lib/config-context"

/**
 * Seccion simple de confirmacion por WhatsApp (Plan Base).
 * Sin formulario: solo un boton que abre WhatsApp con un mensaje predefinido.
 *
 * Configurable desde JSON:
 *   title           -> Titulo de la seccion
 *   buttonText      -> Texto del boton
 *   whatsappNumber  -> Numero sin +, sin espacios (ej: "3456023759")
 *   message         -> Mensaje que se envia (default: "Confirmo mi asistencia")
 */
interface ConfirmarWhatsappSectionProps {
  title: string
  buttonText: string
  whatsappNumber: string
  message: string
}

export default function ConfirmarWhatsappSection({
  title,
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
      <h2 className="mb-6 text-xl font-semibold tracking-[0.2em] uppercase opacity-90 md:text-2xl">
        {title}
      </h2>
      <button
        onClick={handleClick}
        className="inline-flex min-h-[48px] items-center rounded-full px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-70"
        style={{ border: "1px solid currentColor", borderOpacity: 0.4 }}
      >
        {buttonText}
      </button>
    </section>
  )
}
