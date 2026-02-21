import { Sparkles } from "lucide-react"

interface TriviaSectionProps {
  title: string
  subtitle: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function TriviaSection({
  title,
  subtitle,
  button,
}: TriviaSectionProps) {
  return (
    <section className="px-6 py-16 text-center">
      <Sparkles className="mx-auto mb-4 h-7 w-7 text-primary-foreground transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
      <h2
        className="mb-2 text-3xl font-light tracking-[0.05em] text-primary-foreground md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p
        className="mb-6 text-sm font-light tracking-wide text-primary-foreground/80"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {subtitle}
      </p>
      <a
        href={button.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block min-h-[48px] rounded-full bg-primary-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-primary transition-opacity hover:opacity-90"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {button.text}
      </a>
    </section>
  )
}
