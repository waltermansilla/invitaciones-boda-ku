import { MapPin } from "lucide-react"
import ActionButton from "./action-button"

interface LocationInfoSectionProps {
  title: string
  address: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
}

export default function LocationInfoSection({ title, address, button }: LocationInfoSectionProps) {
  return (
    <section className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <MapPin className="h-9 w-9 text-inherit/50" strokeWidth={1} />
      <h2 className="text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
        {title}
      </h2>
      <p className="text-sm font-medium tracking-[0.1em] uppercase text-inherit/70">
        {address}
      </p>
      <div className="mt-1">
        <ActionButton text={button.text} url={button.url} variant={button.variant} />
      </div>
    </section>
  )
}
