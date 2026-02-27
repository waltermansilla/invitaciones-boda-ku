"use client"

import { useState } from "react"
import { Copy, Check, Plane, Gift, Heart, Star, Sparkles, Moon, HandHeart } from "lucide-react"
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
 *
 * Se elige desde el JSON: data.icon = "plane" | "gift" | "heart" | etc.
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

interface HoneymoonSectionProps {
  icon?: string
  title: string
  description: string
  button: { text: string; url: string; variant: "primary" | "secondary" }
  modal: {
    title: string
    description: string
    bankData: { label: string; value: string }[]
    thankYouText?: string
  }
}

export default function HoneymoonSection({ icon, title, description, button, modal }: HoneymoonSectionProps) {
  const { openModal } = useModal()
  const isMuestra = useIsMuestra()

  const IconComponent = icon ? ICON_MAP[icon] || Gift : Gift

  const handleOpen = () => {
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

  return (
    <section className="flex flex-col items-center px-8 py-14 text-center">
        <IconComponent className="mb-5 h-9 w-9 opacity-70" strokeWidth={1} />
        <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
          {title}
        </h2>
        <p className="mb-6 max-w-sm text-sm font-light leading-relaxed opacity-80">
          {description}
        </p>
        <button
          onClick={handleOpen}
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:opacity-70"
          style={{ borderColor: "currentColor", borderOpacity: 0.4 }}
        >
          {button.text}
        </button>
    </section>
  )
}
