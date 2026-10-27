"use client";

import {
    Martini,
    Sparkles,
    Info,
    type LucideIcon,
} from "lucide-react";
import { useFadeIn } from "@/hooks/use-fade-in";
import { RevealContent } from "./animated-section";
import { useBeveragePreference } from "@/lib/beverage-preference-context";

const ICON_MAP: Record<string, LucideIcon> = {
    drink: Martini,
    sparkles: Sparkles,
    info: Info,
};

function SelectableOption({
    text,
    icon,
    index,
    selected,
    onSelect,
    optionHeightPx,
}: {
    text: string;
    icon?: string;
    index: number;
    selected: boolean;
    onSelect: () => void;
    optionHeightPx?: number;
}) {
    const { ref, isVisible } = useFadeIn(0.15);
    const ItemIcon = (icon && ICON_MAP[icon]) || Martini;

    return (
        <li>
            <div ref={ref}>
                <RevealContent
                    isVisible={isVisible}
                    style={{ transitionDelay: `${index * 80}ms` }}
                >
                    <button
                        type="button"
                        onClick={onSelect}
                        aria-pressed={selected}
                        style={
                            optionHeightPx && optionHeightPx > 0
                                ? { minHeight: `${optionHeightPx}px` }
                                : undefined
                        }
                        className={`flex w-full items-center gap-4 rounded-2xl border px-5 text-left shadow-sm transition-all sm:px-6 ${
                            optionHeightPx && optionHeightPx > 0
                                ? "py-3"
                                : "py-5 sm:py-6"
                        } ${
                            selected
                                ? "border-current bg-current/15 ring-2 ring-current/40"
                                : "border-current/12 bg-current/[0.05] hover:border-current/25 hover:bg-current/[0.08]"
                        }`}
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-current/10">
                            <ItemIcon
                                className="h-5 w-5 opacity-80"
                                strokeWidth={1.5}
                            />
                        </span>
                        <span className="text-base font-medium leading-snug tracking-wide text-inherit sm:text-lg">
                            {text}
                        </span>
                    </button>
                </RevealContent>
            </div>
        </li>
    );
}

export interface BeveragePreferenceSectionProps {
    sectionId: string;
    icon?: string;
    title?: string;
    description?: string;
    descriptionSize?: "normal" | "large";
    /** Opciones concretas (Fernet, Cerveza, …). */
    options?: string[];
    /** Opción válida si no quieren elegir (default: Me da lo mismo). */
    neutralOption?: string;
    /** Icono por opción (misma longitud que options + neutral). Opcional. */
    optionIcons?: string[];
    /** Alto mínimo de cada opción en px (opcional). Sin valor = padding por defecto. */
    optionHeightPx?: number;
}

export default function BeveragePreferenceSection({
    sectionId,
    icon = "drink",
    title,
    description,
    descriptionSize = "normal",
    options = [],
    neutralOption = "Me da lo mismo",
    optionIcons,
    optionHeightPx,
}: BeveragePreferenceSectionProps) {
    const ctx = useBeveragePreference();
    const IconComponent = ICON_MAP[icon] || Martini;
    const highlight =
        ctx?.binding?.sectionId === sectionId && ctx.highlightMissing;

    const neutral = neutralOption.trim() || "Me da lo mismo";
    const choices = [...options.filter(Boolean), neutral];

    const descriptionSizeClasses =
        descriptionSize === "large" ? "text-base md:text-lg" : "text-sm";

    const selection = ctx?.selection ?? null;
    const setSelection = ctx?.setSelection;

    return (
        <section
            className={`flex flex-col items-center px-6 py-14 text-center sm:px-8 ${
                highlight
                    ? "rounded-lg ring-2 ring-red-400/80 ring-offset-2 ring-offset-transparent"
                    : ""
            }`}
            aria-labelledby={`${sectionId}-title`}
        >
            {highlight && (
                <p
                    className="mb-4 max-w-sm text-sm font-medium text-red-500"
                    role="alert"
                >
                    Elegí una opción antes de confirmar tu asistencia.
                </p>
            )}
            <IconComponent
                className="mb-5 h-9 w-9 opacity-70"
                strokeWidth={1}
            />
            {title && (
                <h2
                    id={`${sectionId}-title`}
                    className="mb-6 text-xl font-semibold uppercase tracking-wide text-inherit md:text-2xl"
                >
                    {title}
                </h2>
            )}
            {description && (
                <p
                    className={`max-w-sm ${descriptionSizeClasses} mb-6 font-light leading-relaxed opacity-80`}
                >
                    {description}
                </p>
            )}
            <ul className="mx-auto w-full max-w-md space-y-4">
                {choices.map((text, i) => (
                    <SelectableOption
                        key={text}
                        text={text}
                        icon={optionIcons?.[i]}
                        index={i}
                        selected={selection === text}
                        onSelect={() => setSelection?.(text)}
                        optionHeightPx={optionHeightPx}
                    />
                ))}
            </ul>
        </section>
    );
}
