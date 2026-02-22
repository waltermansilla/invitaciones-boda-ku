"use client"

import { useState, useCallback } from "react"
import { useModal } from "./modal-provider"

interface TriviaQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface TriviaSectionProps {
  title: string
  subtitle: string
  button: {
    text: string
    variant: "primary" | "secondary"
  }
  modal: {
    questions: TriviaQuestion[]
    finishTitle: string
    finishText: string
  }
}

function TriviaGame({
  questions,
  finishTitle,
  finishText,
  onClose,
}: {
  questions: TriviaQuestion[]
  finishTitle: string
  finishText: string
  onClose: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[current]

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === q.correctIndex) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center pt-4 text-center">
        <p className="mb-2 text-4xl font-light text-white/90">
          {score}/{questions.length}
        </p>
        <h3 className="mb-3 text-lg font-semibold tracking-wide text-white/90">
          {finishTitle}
        </h3>
        <p className="mb-6 text-sm leading-relaxed tracking-wide text-white/65">
          {finishText}
        </p>
        <button
          onClick={onClose}
          className="min-h-[48px] rounded-sm border border-white/25 px-8 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-white/90 transition-colors hover:bg-white/10"
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col pt-4">
      {/* Progress */}
      <p className="mb-1 text-center text-[11px] tracking-[0.15em] uppercase text-white/50">
        {current + 1} / {questions.length}
      </p>
      <div className="mb-6 h-[2px] w-full bg-white/10">
        <div
          className="h-full bg-white/40 transition-all duration-500"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="mb-6 text-center text-base font-semibold leading-relaxed tracking-wide text-white/90">
        {q.question}
      </h3>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {q.options.map((opt, idx) => {
          let optStyle = "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
          if (selected !== null) {
            if (idx === q.correctIndex) {
              optStyle = "border-emerald-400/50 bg-emerald-400/15 text-white/90"
            } else if (idx === selected && idx !== q.correctIndex) {
              optStyle = "border-red-400/40 bg-red-400/10 text-white/60"
            } else {
              optStyle = "border-white/10 bg-white/5 text-white/40"
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`rounded-md border px-4 py-3 text-left text-sm tracking-wide transition-all duration-300 ${optStyle}`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Explanation + next */}
      {selected !== null && (
        <div className="mt-5 flex flex-col items-center gap-4">
          <p className="text-center text-sm leading-relaxed tracking-wide text-white/60 italic">
            {q.explanation}
          </p>
          <button
            onClick={handleNext}
            className="min-h-[48px] rounded-sm border border-white/25 px-8 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-white/90 transition-colors hover:bg-white/10"
          >
            {current + 1 >= questions.length ? "Ver resultado" : "Siguiente"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function TriviaSection({
  title,
  subtitle,
  button,
  modal,
}: TriviaSectionProps) {
  const { openModal, closeModal } = useModal()

  const handleOpen = useCallback(() => {
    openModal(
      <TriviaGame
        questions={modal.questions}
        finishTitle={modal.finishTitle}
        finishText={modal.finishText}
        onClose={closeModal}
      />
    )
  }, [openModal, closeModal, modal])

  return (
    <section className="flex flex-col items-center bg-background px-6 py-14 text-center">
      <h2 className="mb-2 text-2xl font-semibold tracking-[0.15em] text-foreground md:text-3xl">
        {title}
      </h2>
      <p className="mb-6 text-sm font-light tracking-wide text-foreground/60">
        {subtitle}
      </p>
      <button
        onClick={handleOpen}
        className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
      >
        {button.text}
      </button>
    </section>
  )
}
