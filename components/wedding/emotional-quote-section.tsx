interface EmotionalQuoteSectionProps {
  text: string
}

export default function EmotionalQuoteSection({ text }: EmotionalQuoteSectionProps) {
  return (
    <section className="px-8 py-20 text-center md:px-16">
      <p
        className="mx-auto max-w-sm text-xl font-light leading-relaxed tracking-wide uppercase text-foreground md:text-2xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {text}
      </p>
    </section>
  )
}
