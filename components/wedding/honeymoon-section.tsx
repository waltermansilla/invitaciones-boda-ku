"use client"

import { useState } from "react"
import Image from "next/image"
import WeddingModal, { CopyButton } from "./wedding-modal"

interface HoneymoonSectionProps {
  title: string
  description: string
  image: string
  button: {
    text: string
    url: string
    variant: "primary" | "secondary"
  }
  modal: {
    title: string
    description: string
    bankData: { label: string; value: string }[]
    thankYouText: string
  }
}

export default function HoneymoonSection({
  title,
  description,
  image,
  button,
  modal,
}: HoneymoonSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="flex flex-col items-center bg-background text-center">
      <div className="relative aspect-[4/3] w-full">
        <Image src={image} alt="Luna de miel" fill className="object-cover" />
      </div>
      <div className="flex flex-col items-center px-8 py-14">
        <h2 className="mb-3 text-2xl font-semibold tracking-wide uppercase text-foreground md:text-3xl">
          {title}
        </h2>
        <p className="mb-6 max-w-sm text-sm font-light leading-relaxed text-foreground/70">
          {description}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm bg-primary px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          {button.text}
        </button>
      </div>

      <WeddingModal open={open} onClose={() => setOpen(false)}>
        <h3 className="mb-5 text-lg font-semibold tracking-wide uppercase text-foreground">
          {modal.title}
        </h3>
        <div className="mb-5 space-y-3">
          {modal.bankData.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-sm border border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-foreground/50">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-light text-foreground">
                  {item.value}
                </p>
              </div>
              <CopyButton value={item.value} />
            </div>
          ))}
        </div>
        <p className="mb-4 text-sm font-light leading-relaxed text-foreground/70">
          {modal.description}
        </p>
        <p className="text-xs font-light italic text-foreground/50">
          {modal.thankYouText}
        </p>
      </WeddingModal>
    </section>
  )
}
