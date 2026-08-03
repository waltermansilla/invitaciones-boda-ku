"use client"

import { Fragment, type CSSProperties } from "react"
import { useFadeIn } from "@/hooks/use-fade-in"
import { useConfig } from "@/lib/config-context"
import {
  sectionTextStyleToCss,
  type SectionTextStyle,
} from "@/lib/section-text-style"

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
  /** Separadores ♡ entre párrafos (simple). Default true. */
  showHearts?: boolean
  aspectRatio?: string
  /** Fondo de la sección (modo de texto: primary/background). */
  sectionBgColor?: string
  /**
   * Color de fondo real (hex/CSS). Si está, pinta el fondo con ese color;
   * el contraste del texto sigue `sectionBgColor` (primary → texto claro, etc.).
   */
  bgColorTheme?: string
  /** Imagen de fondo (aplica sobre todo en `variant: "simple"`). */
  bgImage?: string
  /** Tipografía opcional del título de sección (y títulos de momentos en classic). */
  titleStyle?: SectionTextStyle | null
  /** Tipografía opcional de párrafos (simple) / texto de momentos (classic). */
  bodyStyle?: SectionTextStyle | null
}

function resolveStoryBg(
  mode: string | undefined,
  paint?: string,
): { className: string; style?: CSSProperties } {
  if (mode === "transparent") {
    return { className: "bg-transparent" }
  }
  if (paint) {
    return { className: "", style: { backgroundColor: paint } }
  }
  if (mode === "primary") return { className: "bg-primary" }
  return { className: "bg-background" }
}

function hasImage(image?: string): boolean {
  return Boolean(image && image.trim())
}

function StoryMoment({
  moment,
  index,
  aspectRatio,
  sectionBgColor,
  sectionBgPaint,
  lightText,
  darkText,
  titleCss,
  bodyCss,
}: {
  moment: Moment
  index: number
  aspectRatio: string
  sectionBgColor?: string
  /** Paint solo si el momento hereda el fondo de la sección (sin bgColor propio). */
  sectionBgPaint?: string
  lightText: string
  darkText: string
  titleCss?: CSSProperties
  bodyCss?: CSSProperties
}) {
  const { ref, isVisible } = useFadeIn(0.15)
  const isEven = index % 2 === 0
  const isFreeAspect = aspectRatio === "libre"
  const showImage = hasImage(moment.image)
  const hasOwnBg = Boolean(moment.bgColor)
  const momentBg = moment.bgColor || sectionBgColor || "background"
  const isPrimaryBg = momentBg === "primary"
  const textColor = isPrimaryBg ? darkText : lightText
  const paint = !hasOwnBg ? sectionBgPaint : undefined
  const { className: bgClass, style: bgStyle } = resolveStoryBg(momentBg, paint)

  return (
    <div
      ref={ref}
      className={`${bgClass} transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{
        color: textColor,
        transitionDelay: `${index * 150}ms`,
        ...bgStyle,
      }}
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
            <h3
              className="mb-4 text-xl font-semibold tracking-wide uppercase text-inherit"
              style={titleCss}
            >
              {moment.title}
            </h3>
            <p
              className="text-sm font-light leading-relaxed text-inherit/70"
              style={bodyCss}
            >
              {moment.text}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col justify-center px-8 py-8 md:px-10 md:py-10">
          <p className="mb-3 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/50">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            className="mb-4 text-xl font-semibold tracking-wide uppercase text-inherit"
            style={titleCss}
          >
            {moment.title}
          </h3>
          <p
            className="max-w-xl text-sm font-light leading-relaxed text-inherit/70"
            style={bodyCss}
          >
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
  bgColorTheme,
  bgImage,
  lightText,
  darkText,
  titleCss,
  bodyCss,
  showHearts = true,
}: {
  title: string
  paragraphs: string[]
  sectionBgColor?: string
  bgColorTheme?: string
  bgImage?: string
  lightText: string
  darkText: string
  titleCss?: CSSProperties
  bodyCss?: CSSProperties
  showHearts?: boolean
}) {
  const { ref, isVisible } = useFadeIn(0.12)
  const isPrimary = sectionBgColor === "primary"
  const textColor = isPrimary ? darkText : lightText
  const { className: bgClass, style: bgPaintStyle } = resolveStoryBg(
    sectionBgColor,
    bgImage ? undefined : bgColorTheme,
  )
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
      className={`${bgImage ? "" : bgClass} px-8 py-16 transition-all duration-700 ease-out md:px-10 md:py-20 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
      style={{ color: textColor, ...bgPaintStyle, ...bgImageStyle }}
    >
      <div className="mx-auto max-w-md">
        <div
          className="mx-auto mb-7 w-10 border-t"
          style={{ borderColor: "currentColor", opacity: 0.22 }}
          aria-hidden
        />
        <h2
          className="mb-12 text-center text-2xl font-semibold tracking-[0.18em] uppercase text-inherit md:mb-10 md:text-3xl"
          style={titleCss}
        >
          {title}
        </h2>
        <div className="flex flex-col gap-7 md:gap-6">
          {paragraphs.map((paragraph, i) => (
            <Fragment key={i}>
              {showHearts && i > 0 && (
                <p
                  className="-my-1 text-center text-base font-light leading-none text-inherit/35"
                  aria-hidden
                >
                  ♡
                </p>
              )}
              <p
                className="text-start text-[15px] font-light leading-[1.85] tracking-wide text-inherit/75 md:text-base"
                style={bodyCss}
              >
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
  bgColorTheme,
  bgImage,
  titleStyle,
  bodyStyle,
  showHearts = true,
}: OurStorySectionProps) {
  const config = useConfig()
  const theme = config.theme as Record<string, unknown>
  const lightText =
    (theme.lightBgTextColor as string) ||
    (theme.primaryColor as string) ||
    "#6B7F5E"
  const darkText = (theme.darkBgTextColor as string) || "#FFFFFF"
  const titleCss = sectionTextStyleToCss(titleStyle)
  const bodyCss = sectionTextStyleToCss(bodyStyle)

  if (variant === "simple") {
    return (
      <SimpleStory
        title={title}
        paragraphs={paragraphs.filter((p) => p.trim())}
        sectionBgColor={sectionBgColor}
        bgColorTheme={bgColorTheme}
        bgImage={bgImage}
        lightText={lightText}
        darkText={darkText}
        titleCss={titleCss}
        bodyCss={bodyCss}
        showHearts={showHearts}
      />
    )
  }

  const isPrimarySection = sectionBgColor === "primary"
  const titleColor = isPrimarySection ? darkText : lightText
  const { className: titleBgClass, style: titleBgStyle } = resolveStoryBg(
    sectionBgColor,
    bgColorTheme,
  )

  return (
    <section>
      <div
        className={`${titleBgClass} px-6 pb-6 pt-14`}
        style={{ color: titleColor, ...titleBgStyle }}
      >
        <h2
          className="text-center text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl"
          style={titleCss}
        >
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
            sectionBgPaint={bgColorTheme}
            lightText={lightText}
            darkText={darkText}
            titleCss={titleCss}
            bodyCss={bodyCss}
          />
        ))}
      </div>
    </section>
  )
}
