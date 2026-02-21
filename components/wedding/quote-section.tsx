interface QuoteSectionProps {
  text: string
  author?: string
}

export default function QuoteSection({ text, author }: QuoteSectionProps) {
  return (
    <section className="bg-primary px-8 py-14 text-center md:px-12">
      <p
        className="mx-auto max-w-sm text-base font-semibold leading-relaxed tracking-wide uppercase text-primary-foreground md:text-lg"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {text}
      </p>
      {author && (
        <p
          className="mt-4 text-sm italic text-primary-foreground/70"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {"- "}{author}
        </p>
      )}
    </section>
  )
}
