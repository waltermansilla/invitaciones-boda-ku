"use client"

import { useState } from "react"
import { Copy, Check, Plane, Gift, Heart, Star, Sparkles, Moon, HandHeart, MapPin, ExternalLink, ChevronRight } from "lucide-react"
import { useModal } from "./modal-provider"
import { useIsMuestra } from "@/lib/config-context"

/**
 * ICONOS DISPONIBLES para honeymoon:
 * "plane"      -> Avion (viaje / luna de miel)
 * "gift"       -> Caja de regalo (regalos generales)
 * "heart"      -> Corazon (contribucion emotiva)
 * "star"       -> Estrella (sueno especial)
 * "sparkles"   -> Brillos (celebracion)
 * "moon"       -> Luna (luna de miel clasico)
 * "handHeart"  -> Mano con corazon (donacion / ayuda)
 */
const ICON_MAP: Record<string, React.ElementType> = {
  plane: Plane,
  gift: Gift,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  moon: Moon,
  handHeart: HandHeart,
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-primary-foreground/20 text-primary-foreground/50 transition-colors hover:text-primary-foreground"
      aria-label="Copiar"
    >
      {copied ? <Check className="h-3 w-3 text-primary-foreground" strokeWidth={2} /> : <Copy className="h-3 w-3" strokeWidth={1.5} />}
    </button>
  )
}

// Tipos para los modales
interface BankModal {
  type: "bank"
  title: string
  description?: string
  bankData: { label: string; value: string }[]
  thankYouText?: string
}

interface AddressModal {
  type: "address"
  title: string
  subtitle?: string
  address: string
  button?: { text: string; url: string }
}

type ModalConfig = BankModal | AddressModal

// Modal legacy (compatibilidad hacia atras)
interface LegacyModal {
  title: string
  description: string
  bankData: { label: string; value: string }[]
  thankYouText?: string
}

interface HoneymoonSectionProps {
  icon?: string
  title: string
  description: string
  showButton?: boolean
  button: { 
    text: string
    url: string
    variant: "primary" | "secondary"
    action?: "modal" | "url" // nuevo: "url" abre link directo, "modal" abre modal (default)
  }
  // Modal legacy (compatibilidad)
  modal?: LegacyModal
  // Nuevo sistema de modales multiples
  modals?: ModalConfig[]
  modalMode?: "combined" | "sequential" // combined = ambos a la vez, sequential = uno y boton al otro
}

export default function HoneymoonSection({ 
  icon, 
  title, 
  description, 
  showButton = true, 
  button, 
  modal,
  modals,
  modalMode = "combined"
}: HoneymoonSectionProps) {
  const { openModal } = useModal()
  const isMuestra = useIsMuestra()
  const buttonVariantClasses =
    button.variant === "primary"
      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
      : "border-current/30 text-inherit hover:bg-current/5"

  const IconComponent = icon ? ICON_MAP[icon] || Gift : Gift

  // Renderiza un modal de tipo "bank"
  const renderBankModal = (config: BankModal, showSeparator = false) => {
    const maskedData = isMuestra
      ? config.bankData.map((item) => ({ ...item, value: "XXXX-XXXX-XXXX" }))
      : config.bankData

    return (
      <div className={showSeparator ? "border-t border-primary-foreground/15 pt-6 mt-6" : ""}>
        <h3 className="mb-4 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
          {config.title}
        </h3>
        {config.description && (
          <p className="mb-4 text-sm font-light leading-relaxed text-primary-foreground/80">
            {config.description}
          </p>
        )}
        <div className="mb-4 space-y-3">
          {maskedData.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-sm border border-primary-foreground/15 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary-foreground/50">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-light text-primary-foreground">
                  {item.value}
                </p>
              </div>
              {!isMuestra && <CopyBtn value={item.value} />}
            </div>
          ))}
        </div>
        {config.thankYouText && (
          <p className="text-xs font-light italic text-primary-foreground/60">
            {config.thankYouText}
          </p>
        )}
      </div>
    )
  }

  // Renderiza un modal de tipo "address"
  const renderAddressModal = (config: AddressModal, showSeparator = false) => {
    const displayAddress = isMuestra ? "Calle Ejemplo 123, Ciudad" : config.address
    
    return (
      <div className={showSeparator ? "border-t border-primary-foreground/15 pt-6 mt-6" : ""}>
        <h3 className="mb-3 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
          {config.title}
        </h3>
        {config.subtitle && (
          <p className="mb-3 text-sm font-light text-primary-foreground/70">
            {config.subtitle}
          </p>
        )}
        <div className="flex items-start gap-3 rounded-sm border border-primary-foreground/15 px-4 py-3 mb-4">
          <MapPin className="h-5 w-5 flex-shrink-0 text-primary-foreground/50 mt-0.5" strokeWidth={1.5} />
          <p className="text-sm font-light text-primary-foreground">
            {displayAddress}
          </p>
        </div>
        {config.button && !isMuestra && (
          <a
            href={config.button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            {config.button.text}
          </a>
        )}
      </div>
    )
  }

  // Renderiza cualquier tipo de modal
  const renderModalContent = (config: ModalConfig, showSeparator = false) => {
    if (config.type === "bank") {
      return renderBankModal(config, showSeparator)
    } else {
      return renderAddressModal(config, showSeparator)
    }
  }

  const handleOpen = () => {
    // Si button.action es "url", abrir link directo
    if (button.action === "url") {
      if (isMuestra) {
        alert("Modo muestra: en la invitacion real se abrira el link configurado.")
      } else {
        window.open(button.url, "_blank")
      }
      return
    }

    // Si hay nuevo sistema de modales
    if (modals && modals.length > 0) {
      if (modalMode === "combined") {
        // Mostrar todos los modales juntos
        openModal(
          <>
            {modals.map((m, idx) => (
              <div key={idx}>
                {renderModalContent(m, idx > 0)}
              </div>
            ))}
          </>
        )
      } else {
        // Modo sequential: mostrar el primero con boton para ir al segundo
        const openSecondModal = () => {
          if (modals.length > 1) {
            openModal(
              <>
                {renderModalContent(modals[1], false)}
              </>
            )
          }
        }

        openModal(
          <>
            {renderModalContent(modals[0], false)}
            {modals.length > 1 && (
              <button
                onClick={openSecondModal}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-sm border border-primary-foreground/30 px-5 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground transition-all hover:bg-primary-foreground/10"
              >
                {modals[1].title}
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </>
        )
      }
      return
    }

    // Modal legacy (compatibilidad hacia atras)
    if (modal) {
      const maskedData = isMuestra
        ? modal.bankData.map((item) => ({ ...item, value: "XXXX-XXXX-XXXX" }))
        : modal.bankData

      openModal(
        <>
          <h3 className="mb-5 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
            {modal.title}
          </h3>
          <p className="mb-5 text-sm font-light leading-relaxed text-primary-foreground/80">
            {modal.description}
          </p>
          <div className="mb-5 space-y-3">
            {maskedData.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-sm border border-primary-foreground/15 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary-foreground/50">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-light text-primary-foreground">
                    {item.value}
                  </p>
                </div>
                {!isMuestra && <CopyBtn value={item.value} />}
              </div>
            ))}
          </div>
          {modal.thankYouText && (
            <p className="text-xs font-light italic text-primary-foreground/60">
              {modal.thankYouText}
            </p>
          )}
        </>
      )
    }
  }

  return (
    <section className="flex flex-col items-center px-8 py-14 text-center">
        <IconComponent className="mb-5 h-9 w-9 opacity-70" strokeWidth={1} />
        <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
          {title}
        </h2>
        <p className={`max-w-sm text-sm font-light leading-relaxed opacity-80 ${showButton ? "mb-6" : ""}`}>
          {description}
        </p>
        {showButton && (
          <button
            onClick={handleOpen}
            className={`inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 ${buttonVariantClasses}`}
          >
            {button.text}
          </button>
        )}
    </section>
  )
}
