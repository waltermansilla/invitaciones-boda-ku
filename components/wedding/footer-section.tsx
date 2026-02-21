interface FooterSectionProps {
  groomName: string
  brideName: string
  separator: string
  credit: string
}

export default function FooterSection({
  groomName,
  brideName,
  separator,
  credit,
}: FooterSectionProps) {
  return (
    <footer className="bg-primary px-6 py-12 text-center">
      <h2
        className="mb-6 text-3xl font-light tracking-[0.1em] uppercase text-primary-foreground md:text-4xl"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {groomName} {separator} {brideName}
      </h2>
      <p
        className="text-xs font-light italic tracking-wide text-primary-foreground/60"
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {credit}
      </p>
    </footer>
  )
}
