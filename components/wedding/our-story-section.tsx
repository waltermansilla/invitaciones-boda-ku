"use client"

import { Fragment } from "react"
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
  moments?: Moment[]
  /**
   * `classic` (default): momentos numerados con título + texto (+ imagen opcional).
   * `simple`: solo título de sección + párrafos corridos (sin números ni subtítulos).
   */
  variant?: "classic" | "simple"
  /** Párrafos para `variant: "simple"`. */
  paragraphs?: string[]
  aspectRatio?: string
  /** Fondo de la sección (título + default de momentos sin bgColor propio). */
  sectionBgColor?: string
  /** Imagen de fondo (aplica sobre todo en `variant: "simple"`). */
  bgImage?: string
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

function SimpleStory({
  title,
  paragraphs,
  sectionBgColor,
  bgImage,
  lightText,
  darkText,
}: {
  title: string
  paragraphs: string[]
  sectionBgColor?: string
  bgImage?: string
  lightText: string
  darkText: string
}) {
  const { ref, isVisible } = useFadeIn(0.12)
  const isPrimary = sectionBgColor === "primary"
  const textColor = isPrimary ? darkText : lightText
  const bgClass = bgImage
    ? ""
    : isPrimary
      ? "bg-primary"
      : sectionBgColor === "transparent"
        ? "bg-transparent"
        : "bg-background"
  const bgImageStyle = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "repeat",
        backgroundSize: "100% auto",
        backgroundPosition: "top center",
      }
    : undefined

  return (
    <section
      ref={ref}
      className={`${bgClass} px-8 py-16 transition-all duration-700 ease-out md:px-10 md:py-20 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
      style={{ color: textColor, ...bgImageStyle }}
    >
      <div className="mx-auto max-w-md">
        <div
          className="mx-auto mb-7 w-10 border-t"
          style={{ borderColor: "currentColor", opacity: 0.22 }}
          aria-hidden
        />
        <h2 className="mb-12 text-center text-2xl font-semibold tracking-[0.18em] uppercase text-inherit md:mb-10 md:text-3xl">
          {title}
        </h2>
        <div className="flex flex-col gap-7 md:gap-6">
          {paragraphs.map((paragraph, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <p
                  className="-my-1 text-center text-base font-light leading-none text-inherit/35"
                  aria-hidden
                >
                  ♡
                </p>
              )}
              <p className="text-start text-[15px] font-light leading-[1.85] tracking-wide text-inherit/75 md:text-base">
                {paragraph}
              </p>
            </Fragment>
          ))}
        </div>
        <div
          className="mx-auto mt-10 w-10 border-t"
          style={{ borderColor: "currentColor", opacity: 0.22 }}
          aria-hidden
        />
      </div>
    </section>
  )
}

export default function OurStorySection({
  title,
  moments = [],
  variant = "classic",
  paragraphs = [],
  aspectRatio = "4/3",
  sectionBgColor = "background",
  bgImage,
}: OurStorySectionProps) {
  const config = useConfig()
  const theme = config.theme as Record<string, unknown>
  const lightText =
    (theme.lightBgTextColor as string) ||
    (theme.primaryColor as string) ||
    "#6B7F5E"
  const darkText = (theme.darkBgTextColor as string) || "#FFFFFF"

  if (variant === "simple") {
    return (
      <SimpleStory
        title={title}
        paragraphs={paragraphs.filter((p) => p.trim())}
        sectionBgColor={sectionBgColor}
        bgImage={bgImage}
        lightText={lightText}
        darkText={darkText}
      />
    )
  }

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
