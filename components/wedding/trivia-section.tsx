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
      <div className="flex flex-col items-center text-center">
        <p className="mb-2 text-4xl font-light">
          {score}/{questions.length}
        </p>
        <h3 className="mb-2 text-lg font-semibold tracking-wide">
          {finishTitle}
        </h3>
        <p className="mb-6 text-sm leading-relaxed tracking-wide opacity-70">
          {finishText}
        </p>
        <button
          onClick={onClose}
          className="min-h-[44px] rounded-sm border border-current/25 px-7 py-2.5 text-xs font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <p className="mb-1.5 text-center text-xs tracking-[0.15em] uppercase opacity-50">
        {current + 1} / {questions.length}
      </p>
      <div className="mb-5 h-[2px] w-full bg-current/10">
        <div
          className="h-full bg-current/40 transition-all duration-500"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="mb-5 text-center text-base font-semibold leading-snug tracking-wide">
        {q.question}
      </h3>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt, idx) => {
          let optStyle = "border-current/20 hover:border-current/40"
          if (selected !== null) {
            if (idx === q.correctIndex) {
              optStyle = "border-emerald-300/60 bg-emerald-300/15"
            } else if (idx === selected && idx !== q.correctIndex) {
              optStyle = "border-red-300/50 bg-red-300/10 opacity-60"
            } else {
              optStyle = "border-current/10 opacity-40"
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`rounded-md border px-4 py-2.5 text-left text-sm tracking-wide transition-all duration-300 ${optStyle}`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Explanation + next */}
      {selected !== null && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-center text-xs leading-relaxed tracking-wide opacity-60 italic">
            {q.explanation}
          </p>
          <button
            onClick={handleNext}
            className="min-h-[44px] rounded-sm border border-current/25 px-7 py-2.5 text-xs font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
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
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <h2 className="mb-2 text-2xl font-semibold tracking-[0.15em] text-inherit md:text-3xl">
        {title}
      </h2>
      <p className="mb-6 text-sm font-light tracking-wide text-inherit/60">
        {subtitle}
      </p>
      <button
        onClick={handleOpen}
        className="inline-flex min-h-[48px] items-center rounded-full border border-current/40 px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-inherit transition-opacity hover:bg-current/10"
      >
        {button.text}
      </button>
    </section>
  )
}
