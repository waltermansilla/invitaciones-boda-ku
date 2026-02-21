import Image from "next/image"
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
    <section className="flex flex-col items-center bg-background text-center">
      <div className="relative aspect-[4/3] w-full">
        <Image src={image} alt="Luna de miel" fill className="object-cover" />
      </div>
      <div className="flex flex-col items-center px-8 py-14">
        <h2
          className="mb-3 text-2xl font-semibold tracking-wide uppercase text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p
          className="mb-6 max-w-sm text-sm font-light leading-relaxed text-foreground/70"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {description}
        </p>
        <ActionButton text={button.text} url={button.url} variant={button.variant} />
      </div>
    </section>
  )
}
