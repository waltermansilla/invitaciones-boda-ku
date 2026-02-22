"use client"

import { useState } from "react"

interface TruthQuestion {
  question: string
  optionA: string
  optionB: string
  correctOption: "A" | "B"
  revealText: string
}

interface TruthsSectionProps {
  title: string
  questions: TruthQuestion[]
  finishText: string
}

export default function TruthsSection({ title, questions, finishText }: TruthsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null)
  const [isFinished, setIsFinished] = useState(false)

  const isLast = currentIndex === questions.length - 1
  const current = questions[currentIndex]

  const handleSelect = (option: "A" | "B") => {
    if (selectedOption) return
    setSelectedOption(option)
  }

  const handleNext = () => {
    if (isLast) {
      setIsFinished(true)
      return
    }
    setSelectedOption(null)
    setCurrentIndex((prev) => prev + 1)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsFinished(false)
  }

  return (
    <section className="bg-primary px-6 py-16">
      <h2 className="mb-10 text-center text-2xl font-semibold tracking-wide uppercase text-primary-foreground md:text-3xl">
        {title}
      </h2>

      <div className="mx-auto max-w-sm">
        {isFinished ? (
          /* Finish state */
          <div className="text-center transition-opacity duration-500">
            <p className="mb-8 text-base font-light leading-relaxed text-primary-foreground/90">
              {finishText}
            </p>
            <button
              onClick={handleRestart}
              className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-primary-foreground/40 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
            >
              Volver a jugar
            </button>
          </div>
        ) : (
          /* Question state */
          <div className="text-center">
            {/* Progress */}
            <p className="mb-8 text-[10px] font-medium tracking-[0.2em] uppercase text-primary-foreground/50">
              {currentIndex + 1} / {questions.length}
            </p>

            {/* Question */}
            <p className="mb-8 text-lg font-light leading-relaxed text-primary-foreground">
              {current.question}
            </p>

            {/* Options */}
            {!selectedOption ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSelect("A")}
                  className="min-h-[48px] w-full rounded-sm border border-primary-foreground/30 px-6 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
                >
                  {current.optionA}
                </button>
                <button
                  onClick={() => handleSelect("B")}
                  className="min-h-[48px] w-full rounded-sm border border-primary-foreground/30 px-6 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
                >
                  {current.optionB}
                </button>
              </div>
            ) : (
              /* Reveal */
              <div className="transition-opacity duration-500">
                {/* Show which was correct */}
                <div className="mb-6 flex flex-col gap-3">
                  {(["A", "B"] as const).map((opt) => {
                    const isCorrect = current.correctOption === opt
                    const isSelected = selectedOption === opt
                    const label = opt === "A" ? current.optionA : current.optionB

                    return (
                      <div
                        key={opt}
                        className={`flex min-h-[48px] w-full items-center justify-center rounded-sm border px-6 py-3 text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                          isCorrect
                            ? "border-primary-foreground bg-primary-foreground/15 text-primary-foreground"
                            : isSelected
                              ? "border-primary-foreground/20 text-primary-foreground/40"
                              : "border-primary-foreground/20 text-primary-foreground/40"
                        }`}
                      >
                        {label}
                      </div>
                    )
                  })}
                </div>

                {/* Reveal text */}
                <p className="mb-8 text-sm font-light italic leading-relaxed text-primary-foreground/80">
                  {current.revealText}
                </p>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-primary-foreground/40 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
                >
                  {isLast ? "Finalizar" : "Siguiente"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
