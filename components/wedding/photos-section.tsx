import ActionButton from "./action-button"
import { Camera, Zap, Images } from "lucide-react"

const iconMap: Record<string, React.ReactNode> = {
  camera: <Camera className="h-10 w-10" strokeWidth={1} />,
  flash: <Zap className="h-10 w-10" strokeWidth={1} />,
  images: <Images className="h-10 w-10" strokeWidth={1} />,
}

interface PhotosSectionProps {
  icon?: string
  title: string
  description: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary" | "background"
  }
}

export default function PhotosSection({
  icon,
  title,
  description,
  button,
}: PhotosSectionProps) {
  return (
    <section className="flex flex-col items-center px-8 py-14 text-center">
      {icon && iconMap[icon] && (
        <div className="mb-4 text-inherit/70">
          {iconMap[icon]}
        </div>
      )}
      <h2
        className="mb-3 text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl"
      >
        {title}
      </h2>
      <p
        className="mb-6 max-w-xs text-sm font-light leading-relaxed text-inherit/70"
      >
        {description}
      </p>
      <ActionButton text={button.text} url={button.url} variant={button.variant} />
    </section>
  )
}
