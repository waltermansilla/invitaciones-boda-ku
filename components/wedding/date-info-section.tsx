import { Calendar } from "lucide-react"

interface DateInfoSectionProps {
  title: string
  value: string
}

export default function DateInfoSection({ title, value }: DateInfoSectionProps) {
  return (
    <section className="flex flex-col items-center gap-4 bg-background px-6 py-14 text-center">
      <Calendar className="h-9 w-9 text-foreground/50" strokeWidth={1} />
      <h2 className="text-xl font-semibold tracking-wide uppercase text-foreground md:text-2xl">
        {title}
      </h2>
      <p className="text-sm font-medium tracking-[0.1em] uppercase text-foreground/70">
        {value}
      </p>
    </section>
  )
}
