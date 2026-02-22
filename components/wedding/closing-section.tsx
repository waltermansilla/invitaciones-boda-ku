import Image from "next/image"

interface ClosingSectionProps {
  image: string
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
}

export default function ClosingSection({
  image,
  coupleNames,
}: ClosingSectionProps) {
  return (
    <section className="bg-background">
      {/* Full-width closing image */}
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={image}
          alt="Foto de cierre"
          fill
          className="object-cover"
        />
      </div>

      {/* Names as elegant close */}
      <div className="flex flex-col items-center px-6 py-14">
        <div className="mb-4 h-px w-10 bg-primary/30" />
        <p className="text-center text-2xl font-light tracking-[0.2em] uppercase text-foreground sm:text-3xl">
          {coupleNames.brideName}
        </p>
        <span className="my-1 text-base font-extralight tracking-[0.3em] text-primary/50">
          {coupleNames.separator}
        </span>
        <p className="text-center text-2xl font-light tracking-[0.2em] uppercase text-foreground sm:text-3xl">
          {coupleNames.groomName}
        </p>
        <div className="mt-4 h-px w-10 bg-primary/30" />
      </div>
    </section>
  )
}
