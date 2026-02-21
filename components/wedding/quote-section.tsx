interface QuoteSectionProps {
  text: string
  author?: string
}

export default function QuoteSection({ text, author }: QuoteSectionProps) {
  return (
    <section className="px-8 py-16 text-center md:px-16">
      <p
        className="mx-auto max-w-md text-lg font-medium leading-relaxed tracking-wide uppercase text-primary-foreground md:text-xl"
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
