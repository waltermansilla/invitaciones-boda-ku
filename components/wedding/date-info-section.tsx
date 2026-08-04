import { Calendar } from "lucide-react"
import type { SectionTextStyle } from "@/lib/section-text-style"
import { sectionTextStyleToCss } from "@/lib/section-text-style"

interface DateInfoSectionProps {
  title: string
  value: string
  /** Tipografía de partes: style.title / style.value (mismo nombre que en el JSON). */
  titleStyle?: SectionTextStyle | null
  valueStyle?: SectionTextStyle | null
}

export default function DateInfoSection({
  title,
  value,
  titleStyle,
  valueStyle,
}: DateInfoSectionProps) {
  const titleCss = sectionTextStyleToCss(titleStyle)
  const valueCss = sectionTextStyleToCss(valueStyle)

  return (
    <section className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <Calendar className="h-9 w-9 text-inherit/50" strokeWidth={1} />
      <h2
        className="text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl"
        style={titleCss}
      >
        {title}
      </h2>
      <p
        className="text-sm font-medium tracking-[0.1em] uppercase text-inherit/70"
        style={valueCss}
      >
        {value}
      </p>
    </section>
  )
}
