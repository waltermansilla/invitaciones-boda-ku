interface FooterSectionProps {
  credit: string
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
}

export default function FooterSection({
  credit,
  coupleNames,
}: FooterSectionProps) {
  return (
    <footer className="px-6 py-14 text-center">
      <h2
        className="mb-6 text-3xl font-light tracking-[0.1em] uppercase text-primary-foreground md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {coupleNames.brideName} {coupleNames.separator} {coupleNames.groomName}
      </h2>
      <p
        className="text-xs font-light italic tracking-wide text-primary-foreground/60"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {credit}
      </p>
    </footer>
  )
}
