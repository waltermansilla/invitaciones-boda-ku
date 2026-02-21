import { Shirt } from "lucide-react"

interface DressCodeSectionProps {
  title: string
  type: string
  buttonText: string
  buttonUrl: string
}

export default function DressCodeSection({
  title,
  type,
  buttonText,
  buttonUrl,
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
        {type}
      </p>
      <a
        href={buttonUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block border border-foreground/30 px-6 py-2 text-xs font-medium tracking-[0.2em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {buttonText}
      </a>
    </section>
  )
}
