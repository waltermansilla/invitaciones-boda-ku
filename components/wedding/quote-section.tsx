interface QuoteSectionProps {
  text: string
  author?: string
}

export default function QuoteSection({ text, author }: QuoteSectionProps) {
  return (
    <section className="px-8 py-14 text-center md:px-12">
      <p
        className="mx-auto max-w-sm text-base font-semibold leading-relaxed tracking-wide uppercase text-inherit md:text-lg"
      >
        {text}
      </p>
      {author && (
        <p
          className="mt-4 text-sm italic text-inherit/70"
        >
          {"- "}{author}
        </p>
      )}
    </section>
  )
}
