import Image from "next/image"

interface GallerySectionProps {
  images: string[]
}

export default function GallerySection({ images }: GallerySectionProps) {
  if (!images || images.length === 0) return null

  return (
    <section className="py-4">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {images.map((src, index) => (
          <div
            key={index}
            className={`relative overflow-hidden ${
              index === 0 ? "col-span-2 aspect-[16/10] md:col-span-2" : "aspect-square"
            }`}
          >
            <Image
              src={src}
              alt={`Foto de la pareja ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
