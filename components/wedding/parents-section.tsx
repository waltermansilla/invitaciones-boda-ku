interface Parent {
  name: string
  role: string
}

interface ParentsSectionProps {
  title: string
  subtitle?: string
  parents: Parent[]
}

export default function ParentsSection({
  title,
  subtitle,
  parents,
}: ParentsSectionProps) {
  return (
    <section className="flex flex-col items-center bg-background px-8 py-14 text-center">
      <h2 className="mb-2 text-2xl font-semibold tracking-[0.2em] uppercase text-foreground md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mb-8 max-w-xs text-sm font-light leading-relaxed text-foreground/60">
          {subtitle}
        </p>
      )}
      <div className="flex flex-col gap-6">
        {parents.map((parent) => (
          <div key={parent.name} className="flex flex-col items-center">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary/70">
              {parent.role}
            </p>
            <p className="mt-1 text-lg font-light tracking-wide text-foreground">
              {parent.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
