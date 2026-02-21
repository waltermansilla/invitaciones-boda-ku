import Image from "next/image"
import { Gift } from "lucide-react"
import ActionButton from "./action-button"

interface GiftCardSectionProps {
  icon: string
  title: string
  description: string
  image: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function GiftCardSection({
  title,
  description,
  image,
  button,
}: GiftCardSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border">
        <Gift className="h-6 w-6 text-primary transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
      </div>
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
      <div className="mb-8">
        <ActionButton text={button.text} url={button.url} variant={button.variant} />
      </div>
      <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg">
        <Image src={image} alt="Regalo" fill className="object-cover" />
      </div>
    </section>
  )
}
