interface QuoteSectionProps {
    text: string;
    author?: string;
    decorativeLines?: boolean;
}

export default function QuoteSection({
    text,
    author,
    decorativeLines,
}: QuoteSectionProps) {
    return (
        <section className="px-16 py-20 text-center md:px-12">
            {decorativeLines && (
                <div
                    className="mx-auto mb-6 w-12 border-t"
                    style={{ borderColor: "currentColor", opacity: 0.2 }}
                />
            )}
            <p className="mx-auto max-w-sm text-base font-semibold leading-relaxed tracking-wide uppercase text-lg md:text-lg">
                {text}
            </p>
            {author && (
                <p className="mt-4 text-xl italic text-inherit/70">
                    {"- "}
                    {author}
                </p>
            )}
            {decorativeLines && (
                <div
                    className="mx-auto mt-6 w-12 border-t"
                    style={{ borderColor: "currentColor", opacity: 0.2 }}
                />
            )}
        </section>
    );
}
