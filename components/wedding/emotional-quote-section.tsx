interface EmotionalQuoteSectionProps {
  text: string
}

export default function EmotionalQuoteSection({ text }: EmotionalQuoteSectionProps) {
  return (
    <section className="bg-secondary px-8 py-16 text-center md:px-16">
      <p
        className="mx-auto max-w-sm text-xl font-light leading-relaxed tracking-wide uppercase text-foreground md:text-2xl"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {text}
      </p>
    </section>
  )
}
