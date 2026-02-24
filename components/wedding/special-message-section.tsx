interface SpecialMessageSectionProps {
  title: string
  text: string
  signature?: string
}

export default function SpecialMessageSection({
  title,
  text,
  signature,
}: SpecialMessageSectionProps) {
  return (
    <section className="bg-primary px-8 py-16 text-center md:px-12">
      <h2 className="mb-6 text-xl font-semibold tracking-[0.2em] uppercase text-primary-foreground md:text-2xl">
        {title}
      </h2>
      <p className="mx-auto max-w-sm text-sm font-light leading-relaxed text-primary-foreground/85">
        {text}
      </p>
      {signature && (
        <p className="mt-6 text-lg font-light italic tracking-wide text-primary-foreground/70">
          {"- "}{signature}
        </p>
      )}
    </section>
  )
}
