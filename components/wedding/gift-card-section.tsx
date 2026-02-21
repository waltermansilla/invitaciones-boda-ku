import Image from "next/image"
import { Gift } from "lucide-react"

interface GiftCardSectionProps {
  icon: string
  title: string
  description: string
  buttonText: string
  buttonUrl: string
  image: string
}

export default function GiftCardSection({
  title,
  description,
  buttonText,
  buttonUrl,
  image,
}: GiftCardSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border">
        <Gift className="h-6 w-6 text-primary" strokeWidth={1.5} />
      </div>
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
        className="mb-8 inline-block border border-foreground/30 px-6 py-2 text-xs font-medium tracking-[0.2em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {buttonText}
      </a>
      <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-sm">
        <Image
          src={image}
          alt="Regalo"
          fill
          className="object-cover"
        />
      </div>
    </section>
  )
}
