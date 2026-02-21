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
    <section className="flex flex-col items-center bg-background px-6 py-14 text-center">
      <h2
        className="mb-2 text-2xl font-semibold tracking-wide text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p
        className="mb-6 text-sm font-light text-foreground/60"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {subtitle}
      </p>
      <a
        href={button.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {button.text}
      </a>
    </section>
  )
}
