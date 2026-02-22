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
    <section className="px-6 py-16">
      <h2 className="mb-10 text-center text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl">
        {title}
      </h2>

      <div className="mx-auto max-w-sm">
        {isFinished ? (
          /* Finish state */
          <div className="text-center transition-opacity duration-500">
            <p className="mb-8 text-base font-light leading-relaxed text-inherit/90">
              {finishText}
            </p>
            <button
              onClick={handleRestart}
              className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-current/40 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:bg-current/10"
            >
              Volver a jugar
            </button>
          </div>
        ) : (
          /* Question state */
          <div className="text-center">
            {/* Progress */}
            <p className="mb-8 text-[10px] font-medium tracking-[0.2em] uppercase text-inherit/50">
              {currentIndex + 1} / {questions.length}
            </p>

            {/* Question */}
            <p className="mb-8 text-lg font-light leading-relaxed text-inherit">
              {current.question}
            </p>

            {/* Options */}
            {!selectedOption ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSelect("A")}
                  className="min-h-[48px] w-full rounded-sm border border-current/30 px-6 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-inherit transition-all duration-200 hover:bg-current/10"
                >
                  {current.optionA}
                </button>
                <button
                  onClick={() => handleSelect("B")}
                  className="min-h-[48px] w-full rounded-sm border border-current/30 px-6 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-inherit transition-all duration-200 hover:bg-current/10"
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
                            ? "border-current bg-current/15 text-inherit"
                            : isSelected
                              ? "border-current/20 text-inherit/40"
                              : "border-current/20 text-inherit/40"
                        }`}
                      >
                        {label}
                      </div>
                    )
                  })}
                </div>

                {/* Reveal text */}
                <p className="mb-8 text-sm font-light italic leading-relaxed text-inherit/80">
                  {current.revealText}
                </p>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-sm border border-current/40 px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:bg-current/10"
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
