"use client";

import { useState } from "react";

interface TruthQuestion {
    question: string;
    optionA: string;
    optionB: string;
    correctOption: "A" | "B";
    revealText: string;
}

interface TruthsSectionProps {
    title: string;
    questions: TruthQuestion[];
    finishText: string;
    sectionBgColor?: "primary" | "background" | "transparent" | string;
}

export default function TruthsSection({
    title,
    questions,
    finishText,
    sectionBgColor = "background",
}: TruthsSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(
        null,
    );
    const [isFinished, setIsFinished] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [answerResults, setAnswerResults] = useState<boolean[]>([]);

    const isLast = currentIndex === questions.length - 1;
    const current = questions[currentIndex];

    const handleSelect = (option: "A" | "B") => {
        if (selectedOption) return;
        const isCorrect = option === current.correctOption;
        if (isCorrect) {
            setCorrectCount((prev) => prev + 1);
        }
        setAnswerResults((prev) => [...prev, isCorrect]);
        setSelectedOption(option);
    };

    const handleNext = () => {
        if (isLast) {
            setIsFinished(true);
            return;
        }
        setSelectedOption(null);
        setCurrentIndex((prev) => prev + 1);
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsFinished(false);
        setCorrectCount(0);
        setAnswerResults([]);
    };

    return (
        <section
            className={`px-6 py-16 ${
                sectionBgColor === "primary"
                    ? "bg-primary"
                    : sectionBgColor === "transparent"
                      ? "bg-transparent"
                      : "bg-background"
            }`}
        >
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-wide uppercase text-inherit md:text-3xl">
                {title}
            </h2>

            <div className="mx-auto max-w-sm">
                {isFinished ? (
                    /* Finish state */
                    <div className="text-center transition-opacity duration-500">
                        <p className="mb-2 text-3xl font-light text-inherit md:text-4xl">
                            {correctCount}/{questions.length} correctas
                        </p>
                        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                            {answerResults.map((ok, idx) => (
                                <span
                                    key={idx}
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ${
                                        ok
                                            ? "border-emerald-300/80 bg-emerald-300/40 text-emerald-900"
                                            : "border-red-300/90 bg-red-300/40 text-red-900"
                                    }`}
                                    title={
                                        ok
                                            ? "Respuesta correcta"
                                            : "Respuesta incorrecta"
                                    }
                                >
                                    {ok ? "✓" : "✕"}
                                </span>
                            ))}
                        </div>
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
                                        const isCorrect =
                                            current.correctOption === opt;
                                        const isSelected =
                                            selectedOption === opt;
                                        const label =
                                            opt === "A"
                                                ? current.optionA
                                                : current.optionB;
                                        let optionStyle =
                                            "border-current/10 text-inherit/40";
                                        if (isCorrect) {
                                            optionStyle =
                                                "border-emerald-300/60 bg-emerald-300/40 text-inherit";
                                        } else if (isSelected && !isCorrect) {
                                            optionStyle =
                                                "border-red-300/100 bg-red-300/40 text-inherit opacity-70";
                                        }

                                        return (
                                            <div
                                                key={opt}
                                                className={`flex min-h-[48px] w-full items-center justify-center rounded-sm border px-6 py-3 text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 ${optionStyle}`}
                                            >
                                                {label}
                                            </div>
                                        );
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
    );
}
