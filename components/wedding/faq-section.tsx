"use client"

import { useState } from "react"
import {
  Car,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Info,
  MapPin,
  Phone,
} from "lucide-react"
import ActionButton from "./action-button"

/**
 * FAQ - Preguntas frecuentes en acordeón (una abierta a la vez, sin modal).
 *
 * JSON:
 *   icon: ícono del encabezado (ver SECTION_ICON_MAP). Default: help
 *   title / description: opcionales
 *   defaultOpen: índice abierto al inicio (default 0). null/-1 = todas cerradas
 *   items: array de { question, answer, buttons? }
 *     buttons: [{ text, url? | whatsapp?, variant?, icon? }]
 *       whatsapp: número → https://wa.me/{digits}
 *       url: enlace externo
 *       icon: whatsapp | phone | car | pin | external | help | info (ver BUTTON_ICON_MAP)
 */

function WhatsAppIcon({
  className,
}: {
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

/** Íconos del encabezado de la sección FAQ. */
const SECTION_ICON_MAP: Record<string, React.ElementType> = {
  help: CircleHelp,
  info: Info,
  car: Car,
  phone: Phone,
  pin: MapPin,
  whatsapp: WhatsAppIcon,
}

/** Íconos opcionales dentro de cada botón de respuesta. */
const BUTTON_ICON_MAP: Record<string, React.ElementType> = {
  whatsapp: WhatsAppIcon,
  phone: Phone,
  car: Car,
  pin: MapPin,
  external: ExternalLink,
  help: CircleHelp,
  info: Info,
}

export interface FaqButton {
  text: string
  url?: string
  /** Número de WhatsApp; si está, tiene prioridad sobre url. */
  whatsapp?: string
  variant?: "primary" | "secondary" | "outline-light" | "background"
  /** Ícono del botón: whatsapp | phone | car | pin | external | help | info */
  icon?: string
}

export interface FaqItem {
  question: string
  answer: string
  buttons?: FaqButton[]
}

interface FaqSectionProps {
  /** Ícono del encabezado: help | info | car | phone | pin | whatsapp. Default help. */
  icon?: string
  title?: string
  description?: string
  items: FaqItem[]
  /** Índice abierto al montar. Default 0. Usar -1 o null para empezar cerrado. */
  defaultOpen?: number | null
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

function resolveButtonUrl(button: FaqButton): string | null {
  if (button.whatsapp?.trim()) {
    const phone = digitsOnly(button.whatsapp)
    if (!phone) return null
    return `https://wa.me/${phone}`
  }
  if (button.url?.trim()) return button.url.trim()
  return null
}

export default function FaqSection({
  icon = "help",
  title = "Preguntas frecuentes",
  description,
  items,
  defaultOpen = 0,
}: FaqSectionProps) {
  const initialOpen =
    defaultOpen === null || defaultOpen === undefined
      ? 0
      : defaultOpen < 0
        ? null
        : defaultOpen

  const [openIndex, setOpenIndex] = useState<number | null>(
    items.length === 0 ? null : initialOpen,
  )

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  if (!items.length) return null

  const SectionIcon = SECTION_ICON_MAP[icon] || CircleHelp

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center md:px-8">
      <SectionIcon className="mb-5 h-9 w-9 opacity-70" strokeWidth={1} />
      {title && (
        <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
          {title}
        </h2>
      )}
      {description && (
        <p className="mb-8 max-w-sm text-sm font-light leading-relaxed opacity-80">
          {description}
        </p>
      )}

      <div className={`mx-auto w-full max-w-md ${description ? "" : "mt-5"}`}>
        {items.map((item, index) => {
          const isOpen = openIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-trigger-${index}`

          return (
            <div
              key={`${item.question}-${index}`}
              className="border-b border-current/15 first:border-t"
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-medium leading-snug tracking-wide text-inherit md:text-[15px]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 opacity-60 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pb-5 text-left">
                    {item.answer && (
                      <p className="text-sm font-light leading-relaxed opacity-80 whitespace-pre-line">
                        {item.answer}
                      </p>
                    )}
                    {item.buttons && item.buttons.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                        {item.buttons.map((btn, btnIndex) => {
                          const href = resolveButtonUrl(btn)
                          if (!href || !btn.text?.trim()) return null
                          const variant =
                            btn.variant === "background"
                              ? "secondary"
                              : btn.variant || "secondary"
                          const ButtonIcon = btn.icon
                            ? BUTTON_ICON_MAP[btn.icon]
                            : undefined
                          return (
                            <ActionButton
                              key={`${btn.text}-${btnIndex}`}
                              text={btn.text}
                              url={href}
                              variant={variant}
                              icon={
                                ButtonIcon ? (
                                  <ButtonIcon className="h-4 w-4" />
                                ) : undefined
                              }
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
