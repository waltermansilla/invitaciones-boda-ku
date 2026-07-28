"use client"

import { useIsMuestra } from "@/lib/config-context"

interface ActionButtonProps {
  text: string
  url: string
  variant: string
  /** Ícono opcional a la izquierda del texto. */
  icon?: React.ReactNode
}

export default function ActionButton({ text, url, variant, icon }: ActionButtonProps) {
  const isMuestra = useIsMuestra()

  const base =
    "inline-flex min-h-[48px] items-center justify-center gap-2 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200"

  let variantClasses: string
  switch (variant) {
    case "primary":
      variantClasses = "rounded-sm bg-primary text-primary-foreground hover:opacity-90"
      break
    case "outline-light":
      variantClasses = "rounded-sm border border-current/40 text-inherit hover:bg-current/10"
      break
    case "secondary":
    default:
      variantClasses = "rounded-sm border border-current/30 text-inherit hover:bg-current/5"
      break
  }

  const content = (
    <>
      {icon ? <span className="inline-flex shrink-0 opacity-90 [&_svg]:h-4 [&_svg]:w-4">{icon}</span> : null}
      {text}
    </>
  )

  if (isMuestra) {
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          alert("Este enlace esta deshabilitado en la version de muestra.")
        }}
        className={`${base} ${variantClasses}`}
      >
        {content}
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${variantClasses}`}
    >
      {content}
    </a>
  )
}
