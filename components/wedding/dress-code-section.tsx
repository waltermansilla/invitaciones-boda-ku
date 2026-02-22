import ActionButton from "./action-button"

interface DressCodeSectionProps {
  title: string
  subtitle: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function DressCodeSection({
  title,
  subtitle,
  button,
}: DressCodeSectionProps) {
  return (
    <section className="flex flex-col items-center bg-background px-6 py-14 text-center">
      <h2
        className="mb-2 text-2xl font-semibold tracking-wide uppercase text-foreground md:text-3xl"
      >
        {title}
      </h2>
      <p
        className="mb-5 text-sm font-medium tracking-[0.1em] uppercase text-foreground/60"
      >
        {subtitle}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
