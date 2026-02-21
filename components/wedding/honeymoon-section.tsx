import Image from "next/image"
import { Plane } from "lucide-react"
import ActionButton from "./action-button"

interface HoneymoonSectionProps {
  title: string
  description: string
  image: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function HoneymoonSection({
  title,
  description,
  image,
  button,
}: HoneymoonSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-16 text-center">
      <div className="relative mb-8 aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg">
        <Image src={image} alt="Luna de miel" fill className="object-cover" />
      </div>
      <Plane className="mb-4 h-7 w-7 text-primary transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
      <h2
        className="mb-3 text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-sm text-sm font-light leading-relaxed text-muted-foreground"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {description}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
