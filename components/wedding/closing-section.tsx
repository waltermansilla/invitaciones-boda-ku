import Image from "next/image"
import config from "@/data/wedding-config.json"

interface ClosingSectionProps {
  image: string
  aspectRatio?: string
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
}

export default function ClosingSection({
  image,
  aspectRatio = "3/4",
  coupleNames,
}: ClosingSectionProps) {
  const theme = config.theme as Record<string, unknown>
  const textColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"

  return (
    <section className="bg-background" style={{ color: textColor }}>
      {/* Full-width closing image */}
      <div className="relative w-full" style={{ aspectRatio }}>
        <Image
          src={image}
          alt="Foto de cierre"
          fill
          className="object-cover"
        />
      </div>

      {/* Names as elegant close */}
      <div className="flex flex-col items-center px-6 py-14">
        <div className="mb-4 h-px w-10 bg-current/30" />
        <p className="text-center text-2xl font-light tracking-[0.2em] uppercase text-inherit sm:text-3xl md:text-4xl">
          {coupleNames.brideName}
        </p>
        <span className="my-1 text-base font-extralight tracking-[0.3em] text-inherit/50 md:text-lg">
          {coupleNames.separator}
        </span>
        <p className="text-center text-2xl font-light tracking-[0.2em] uppercase text-inherit sm:text-3xl md:text-4xl">
          {coupleNames.groomName}
        </p>
        <div className="mt-4 h-px w-10 bg-current/30" />
      </div>
    </section>
  )
}
