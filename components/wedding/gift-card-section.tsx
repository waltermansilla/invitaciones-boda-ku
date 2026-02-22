"use client"

import { useState } from "react"
import Image from "next/image"
import { HelpCircle } from "lucide-react"
import WeddingModal, { CopyButton } from "./wedding-modal"

interface GiftCardSectionProps {
  icon: string
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
    suggestedValue: string
    description: string
    transferData: { label: string; value: string }[]
  }
}

export default function GiftCardSection({
  title,
  description,
  image,
  button,
  modal,
}: GiftCardSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="flex flex-col items-center bg-primary px-8 py-14 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-primary-foreground/30">
        <HelpCircle className="h-5 w-5 text-primary-foreground" strokeWidth={1.3} />
      </div>
      <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-primary-foreground md:text-2xl">
        {title}
      </h2>
      <p className="mb-6 max-w-sm text-sm font-light leading-relaxed text-primary-foreground/80">
        {description}
      </p>
      <div className="mb-8">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-primary-foreground/40 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
        >
          {button.text}
        </button>
      </div>
      <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden">
        <Image src={image} alt="Regalo" fill className="object-cover" />
      </div>

      <WeddingModal open={open} onClose={() => setOpen(false)}>
        <h3 className="mb-5 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
          {modal.title}
        </h3>
        <div className="mb-5 rounded-sm bg-primary-foreground/10 px-5 py-4 text-center">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
            Valor sugerido
          </p>
          <p className="mt-1 text-2xl font-light text-primary-foreground">
            {modal.suggestedValue}
          </p>
        </div>
        <p className="mb-6 text-sm font-light leading-relaxed text-primary-foreground/80">
          {modal.description}
        </p>
        <div className="space-y-3">
          {modal.transferData.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-sm border border-primary-foreground/15 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary-foreground/50">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-light text-primary-foreground">
                  {item.value}
                </p>
              </div>
              <CopyButton value={item.value} />
            </div>
          ))}
        </div>
      </WeddingModal>
    </section>
  )
}
