interface ActionButtonProps {
  text: string
  url: string
  variant: string
}

export default function ActionButton({ text, url, variant }: ActionButtonProps) {
  const base =
    "inline-flex min-h-[48px] items-center justify-center px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200"

  let variantClasses: string
  switch (variant) {
    case "primary":
      variantClasses = "rounded-sm bg-primary text-primary-foreground hover:opacity-90"
      break
    case "outline-light":
      variantClasses = "rounded-sm border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
      break
    case "secondary":
    default:
      variantClasses = "rounded-sm border border-foreground/30 text-foreground hover:bg-foreground/5"
      break
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${variantClasses}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {text}
    </a>
  )
}
