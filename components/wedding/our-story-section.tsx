"use client"

import { useFadeIn } from "@/hooks/use-fade-in"
import { useConfig } from "@/lib/config-context"

interface Moment {
  image?: string
  title: string
  text: string
  /** Fondo de este momento: 'primary' | 'background'. Si no se setea, hereda el de la sección. */
  bgColor?: "primary" | "background" | string
}

interface OurStorySectionProps {
  title: string
  moments: Moment[]
  aspectRatio?: string
  /** Fondo de la sección (título + default de momentos sin bgColor propio). */
  sectionBgColor?: string
}

function hasImage(image?: string): boolean {
  return Boolean(image && image.trim())
}

function StoryMoment({
  moment,
  index,
  aspectRatio,
  sectionBgColor,
  lightText,
  darkText,
}: {
  moment: Moment
  index: number
  aspectRatio: string
  sectionBgColor?: string
  lightText: string
  darkText: string
}) {
  const { ref, isVisible } = useFadeIn(0.15)
  const isEven = index % 2 === 0
  const isFreeAspect = aspectRatio === "libre"
  const showImage = hasImage(moment.image)
  const momentBg = moment.bgColor || sectionBgColor || "background"
  const isPrimaryBg = momentBg === "primary"
  const textColor = isPrimaryBg ? darkText : lightText
  const bgClass = isPrimaryBg
    ? "bg-primary"
    : momentBg === "transparent"
      ? "bg-transparent"
      : "bg-background"

  return (
    <div
      ref={ref}
      className={`${bgClass} transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ color: textColor, transitionDelay: `${index * 150}ms` }}
    >
      {showImage ? (
        <div
          className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0`}
        >
          <div className="w-full md:w-1/2">
            {isFreeAspect ? (
              <img
                src={moment.image}
                alt={moment.title}
                className="block h-auto w-full"
              />
            ) : (
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio }}
              >
                <img
                  src={moment.image}
                  alt={moment.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex w-full flex-col justify-center px-8 py-8 md:w-1/2 md:px-10 md:py-10">
            <p className="mb-3 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/50">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mb-4 text-xl font-semibold tracking-wide uppercase text-inherit">
              {moment.title}
            </h3>
            <p className="text-sm font-light leading-relaxed text-inherit/70">
              {moment.text}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col justify-center px-8 py-8 md:px-10 md:py-10">
          <p className="mb-3 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/50">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mb-4 text-xl font-semibold tracking-wide uppercase text-inherit">
            {moment.title}
          </h3>
          <p className="max-w-xl text-sm font-light leading-relaxed text-inherit/70">
            {moment.text}
          </p>
        </div>
      )}
    </div>
  )
}

export default function OurStorySection({
  title,
  moments,
  aspectRatio = "4/3",
  sectionBgColor = "background",
}: OurStorySectionProps) {
  const config = useConfig()
  const theme = config.theme as Record<string, unknown>
  const lightText =
    (theme.lightBgTextColor as string) ||
    (theme.primaryColor as string) ||
    "#6B7F5E"
  const darkText = (theme.darkBgTextColor as string) || "#FFFFFF"
  const isPrimarySection = sectionBgColor === "primary"
  const titleColor = isPrimarySection ? darkText : lightText
  const titleBgClass = isPrimarySection
    ? "bg-primary"
    : sectionBgColor === "transparent"
      ? "bg-transparent"
      : "bg-background"

  return (
    <section>
      <div
        className={`${titleBgClass} px-6 pb-6 pt-14`}
        style={{ color: titleColor }}
      >
        <h2 className="text-center text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="flex flex-col">
        {moments.map((moment, i) => (
          <StoryMoment
            key={`${moment.title}-${i}`}
            moment={moment}
            index={i}
            aspectRatio={aspectRatio}
            sectionBgColor={sectionBgColor}
            lightText={lightText}
            darkText={darkText}
          />
        ))}
      </div>
    </section>
  )
}
