interface EmotionalQuoteSectionProps {
  text: string
}

export default function EmotionalQuoteSection({ text }: EmotionalQuoteSectionProps) {
  return (
    <section className="bg-primary px-8 py-16 text-center md:px-12">
      <p
        className="mx-auto max-w-xs text-lg font-semibold leading-relaxed tracking-wide uppercase text-primary-foreground md:text-xl"
      >
        {text}
      </p>
    </section>
  )
}
