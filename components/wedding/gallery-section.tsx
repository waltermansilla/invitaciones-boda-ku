import Image from "next/image"

interface GallerySectionProps {
  images: string[]
}

export default function GallerySection({ images }: GallerySectionProps) {
  if (!images || images.length === 0) return null

  return (
    <section className="flex flex-col gap-0">
      {images.map((src, index) => (
        <div key={index} className="relative aspect-[4/3] w-full">
          <Image
            src={src}
            alt={`Foto de la pareja ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </section>
  )
}
