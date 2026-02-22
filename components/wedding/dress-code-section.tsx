"use client"

import { useModal } from "./modal-provider"

interface DressCodeSectionProps {
  title: string
  subtitle: string
  button: { text: string; url: string; variant: "primary" | "secondary" }
  modal: {
    title: string
    sections: { heading: string; text: string }[]
  }
}

export default function DressCodeSection({ title, subtitle, button, modal }: DressCodeSectionProps) {
  const { openModal } = useModal()

  const handleOpen = () => {
    openModal(
      <>
        <h3 className="mb-6 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
          {modal.title}
        </h3>
        <div className="space-y-5">
          {modal.sections.map((section) => (
            <div key={section.heading} className="text-left">
              <h4 className="mb-2 text-xs font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                {section.heading}
              </h4>
              <p className="text-sm font-light leading-relaxed text-primary-foreground/85">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <h2 className="mb-2 text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl">
        {title}
      </h2>
      <p className="mb-5 text-sm font-medium tracking-[0.1em] uppercase text-inherit/60">
        {subtitle}
      </p>
      <button
        onClick={handleOpen}
        className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-current/30 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:bg-current/5"
      >
        {button.text}
      </button>
    </section>
  )
}
