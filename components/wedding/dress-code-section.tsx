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
    <section className="flex flex-col items-center border-y border-border px-6 py-14 text-center">
      <Shirt className="mb-4 h-7 w-7 text-primary" strokeWidth={1.5} />
      <h2
        className="mb-2 text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {title}
      </h2>
      <p
        className="mb-5 text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {subtitle}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
