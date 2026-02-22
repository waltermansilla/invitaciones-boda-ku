import Image from "next/image"
import { HelpCircle } from "lucide-react"
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
    <section className="flex flex-col items-center bg-primary px-8 py-14 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-primary-foreground/30">
        <HelpCircle className="h-5 w-5 text-primary-foreground" strokeWidth={1.3} />
      </div>
      <h2
        className="mb-3 text-xl font-semibold tracking-wide uppercase text-primary-foreground md:text-2xl"
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-sm text-sm font-light leading-relaxed text-primary-foreground/80"
      >
        {description}
      </p>
      <div className="mb-8">
        <ActionButton text={button.text} url={button.url} variant="outline-light" />
      </div>
      <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden">
        <Image src={image} alt="Regalo" fill className="object-cover" />
      </div>
    </section>
  )
}
