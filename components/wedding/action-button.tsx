interface ActionButtonProps {
  text: string
  url: string
  variant: "primary" | "secondary"
}

export default function ActionButton({ text, url, variant }: ActionButtonProps) {
  const baseClasses =
    "inline-block min-h-[48px] min-w-[48px] rounded-full px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-200"
  const variantClasses =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border border-foreground/30 text-foreground hover:bg-foreground hover:text-background"

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variantClasses}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {text}
    </a>
  )
}
