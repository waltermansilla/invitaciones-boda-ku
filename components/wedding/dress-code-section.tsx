import { Shirt } from "lucide-react"
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
    <section className="flex flex-col items-center px-6 py-16 text-center">
      <Shirt className="mb-4 h-7 w-7 text-primary transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
      <h2
        className="mb-2 text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p
        className="mb-5 text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {subtitle}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
