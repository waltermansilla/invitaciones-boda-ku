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
    <footer className="bg-[#4A5A3F] px-6 py-16 text-center">
      <h2
        className="mb-6 text-3xl font-semibold tracking-[0.1em] uppercase text-[#D4C9A8] md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {coupleNames.brideName} {coupleNames.separator} {coupleNames.groomName}
      </h2>
      <p
        className="text-sm italic tracking-wide text-[#D4C9A8]/50"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {credit}
      </p>
    </footer>
  )
}
