interface QuoteSectionProps {
    text: string;
    author?: string;
    decorativeLines?: boolean;
    /** Tamaño de la frase en px (opcional). Sin valor: text-lg (~18px). */
    pxFrase?: number;
    /** Tamaño del autor en px (opcional). Sin valor: text-xl (~20px). */
    pxAuthor?: number;
}

export default function QuoteSection({
    text,
    author,
    decorativeLines,
    pxFrase,
    pxAuthor,
}: QuoteSectionProps) {
    return (
        <section className="px-16 py-20 text-center md:px-12">
            {decorativeLines && (
                <div
                    className="mx-auto mb-6 w-12 border-t"
                    style={{ borderColor: "currentColor", opacity: 0.2 }}
                />
            )}
            <p
                className={`mx-auto max-w-sm font-semibold leading-relaxed tracking-wide uppercase${
                    pxFrase == null ? " text-base text-lg md:text-lg" : ""
                }`}
                style={pxFrase != null ? { fontSize: `${pxFrase}px` } : undefined}
            >
                {text}
            </p>
            {author && (
                <p
                    className={`mt-4 italic text-inherit/70${
                        pxAuthor == null ? " text-xl" : ""
                    }`}
                    style={
                        pxAuthor != null ? { fontSize: `${pxAuthor}px` } : undefined
                    }
                >
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
