import { Camera } from "lucide-react"
import ActionButton from "./action-button"

interface PhotosSectionProps {
  title: string
  description: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function PhotosSection({
  title,
  description,
  button,
}: PhotosSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-16 text-center">
      <Camera className="mb-4 h-8 w-8 text-primary transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
      <h2
        className="mb-3 text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-xs text-sm font-light leading-relaxed text-muted-foreground"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {description}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
