import ActionButton from "./action-button"

interface PhotosSectionProps {
  title: string
  description: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function PhotosSection({
  title,
  description,
  button,
}: PhotosSectionProps) {
  return (
    <section className="flex flex-col items-center px-8 py-14 text-center">
      <h2
        className="mb-3 text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl"
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-xs text-sm font-light leading-relaxed text-inherit/70"
      >
        {description}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
