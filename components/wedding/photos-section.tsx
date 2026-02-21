import { Camera } from "lucide-react"

interface PhotosSectionProps {
  title: string
  description: string
  buttonText: string
  buttonUrl: string
}

export default function PhotosSection({
  title,
  description,
  buttonText,
  buttonUrl,
}: PhotosSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <Camera className="mb-4 h-8 w-8 text-primary" strokeWidth={1.5} />
      <h2
        className="mb-3 text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-xs text-sm font-light leading-relaxed text-muted-foreground"
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
