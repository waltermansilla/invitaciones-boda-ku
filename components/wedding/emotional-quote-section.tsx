interface EmotionalQuoteSectionProps {
  text: string
}

export default function EmotionalQuoteSection({ text }: EmotionalQuoteSectionProps) {
  return (
    <section className="px-8 py-16 text-center md:px-12">
      <p
        className="mx-auto max-w-xs text-lg font-semibold leading-relaxed tracking-wide uppercase text-inherit md:text-xl"
      >
        {text}
      </p>
    </section>
  )
}
