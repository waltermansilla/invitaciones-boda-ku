import Image from "next/image"
import { Plane } from "lucide-react"

interface HoneymoonSectionProps {
  title: string
  description: string
  buttonText: string
  buttonUrl: string
  image: string
}

export default function HoneymoonSection({
  title,
  description,
  buttonText,
  buttonUrl,
  image,
}: HoneymoonSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <div className="relative mb-8 aspect-[4/3] w-full max-w-md overflow-hidden rounded-sm">
        <Image
          src={image}
          alt="Luna de miel"
          fill
          className="object-cover"
        />
      </div>
      <Plane className="mb-4 h-7 w-7 text-primary" strokeWidth={1.5} />
      <h2
        className="mb-3 text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-sm text-sm font-light leading-relaxed text-muted-foreground"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {description}
      </p>
      <a
        href={buttonUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-primary px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {buttonText}
      </a>
    </section>
  )
}
