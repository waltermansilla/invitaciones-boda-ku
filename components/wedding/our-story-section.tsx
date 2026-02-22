"use client"

import { useFadeIn } from "@/hooks/use-fade-in"

interface Moment {
  image: string
  title: string
  text: string
}

interface OurStorySectionProps {
  title: string
  moments: Moment[]
  aspectRatio?: string
}

function StoryMoment({ moment, index, aspectRatio }: { moment: Moment; index: number; aspectRatio: string }) {
  const { ref, isVisible } = useFadeIn(0.15)
  const isEven = index % 2 === 0

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Mobile: always stacked. Desktop: alternating */}
      <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0`}>
        {/* Image */}
        <div className="w-full md:w-1/2">
          <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
            <img
              src={moment.image}
              alt={moment.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Text */}
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
    </div>
  )
}

export default function OurStorySection({ title, moments, aspectRatio = "4/3" }: OurStorySectionProps) {
  return (
    <section className="py-14">
      <h2 className="mb-10 text-center text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl">
        {title}
      </h2>
      <div className="flex flex-col gap-6">
        {moments.map((moment, i) => (
          <StoryMoment key={moment.title} moment={moment} index={i} aspectRatio={aspectRatio} />
        ))}
      </div>
    </section>
  )
}
