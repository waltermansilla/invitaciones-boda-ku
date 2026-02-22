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
      variantClasses = "rounded-sm border border-current/40 text-inherit hover:bg-current/10"
      break
    case "secondary":
    default:
      variantClasses = "rounded-sm border border-current/30 text-inherit hover:bg-current/5"
      break
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${variantClasses}`}
    >
      {text}
    </a>
  )
}
