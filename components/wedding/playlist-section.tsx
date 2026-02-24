import { Music } from "lucide-react"
import ActionButton from "./action-button"

interface PlaylistSectionProps {
  title: string
  description: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function PlaylistSection({
  title,
  description,
  button,
}: PlaylistSectionProps) {
  return (
    <section className="flex flex-col items-center bg-background px-8 py-14 text-center">
      <Music className="mb-5 h-9 w-9 text-foreground/50" strokeWidth={1} />
      <h2 className="mb-3 text-2xl font-semibold tracking-wide uppercase text-foreground md:text-3xl">
        {title}
      </h2>
      <p className="mb-6 max-w-xs text-sm font-light leading-relaxed text-foreground/70">
        {description}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
