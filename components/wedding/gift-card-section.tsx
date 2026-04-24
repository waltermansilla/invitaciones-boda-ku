"use client";

import { useState } from "react";
import {
    Copy,
    Check,
    Gift,
    CreditCard,
    Heart,
    Star,
    Sparkles,
    HandHeart,
    DollarSign,
} from "lucide-react";
import { useModal } from "./modal-provider";
import { useIsMuestra } from "@/lib/config-context";

/**
 * ICONOS DISPONIBLES para giftCard:
 * "gift"       -> Caja de regalo (default)
 * "creditCard" -> Tarjeta (pago / transferencia)
 * "heart"      -> Corazon (contribucion emotiva)
 * "star"       -> Estrella (regalo especial)
 * "sparkles"   -> Brillos (celebracion)
 * "handHeart"  -> Mano con corazon (donacion)
 * "dollar"     -> Signo pesos (valor monetario)
 *
 * Se elige desde el JSON: data.icon = "gift" | "creditCard" | "heart" | etc.
 */
const ICON_MAP: Record<string, React.ElementType> = {
    gift: Gift,
    creditCard: CreditCard,
    heart: Heart,
    star: Star,
    sparkles: Sparkles,
    handHeart: HandHeart,
    dollar: DollarSign,
};

interface GiftCardPriceItem {
    label: string;
    value: string;
}

interface GiftCardDateRange {
    label: string;
    helperText?: string;
    suggestedValue?: string;
    suggestedValues?: GiftCardPriceItem[];
}

interface GiftCardModalData {
    title: string;
    suggestedValueLabel?: string;
    suggestedValue?: string; // Un solo valor (retrocompatible)
    suggestedValues?: GiftCardPriceItem[]; // Multiples valores (hasta 4)
    dateRanges?: GiftCardDateRange[]; // Tramos de fecha con importes propios
    description: string;
    transferData: { label: string; value: string }[];
}

function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const fallbackCopy = (text: string) => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        let ok = false;
        try {
            ok = document.execCommand("copy");
        } catch {
            ok = false;
        }
        document.body.removeChild(ta);
        return ok;
    };
    const handleCopy = async () => {
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
            } else {
                const ok = fallbackCopy(value);
                if (!ok) throw new Error("copy-failed");
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            /* noop */
        }
    };
    return (
        <button
            onClick={handleCopy}
            className="ml-2 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-primary-foreground/20 text-primary-foreground/50 transition-colors hover:text-primary-foreground"
            aria-label="Copiar"
        >
            {copied ? (
                <Check
                    className="h-3 w-3 text-primary-foreground"
                    strokeWidth={2}
                />
            ) : (
                <Copy className="h-3 w-3" strokeWidth={1.5} />
            )}
        </button>
    );
}

interface GiftCardSectionProps {
    icon: string;
    title: string;
    description: string;
    showButton?: boolean;
    button?: { text: string; url: string; variant: "primary" | "secondary" };
    modal?: GiftCardModalData;
}

function GiftCardModalContent({
    modal,
    isMuestra,
}: {
    modal: GiftCardModalData;
    isMuestra: boolean;
}) {
    const hasDateRanges = Boolean(modal.dateRanges && modal.dateRanges.length > 0);
    const [activeDateRangeIdx, setActiveDateRangeIdx] = useState(0);
    const activeDateRange = hasDateRanges
        ? modal.dateRanges?.[activeDateRangeIdx] || modal.dateRanges?.[0]
        : null;
    const activeSuggestedValues = activeDateRange
        ? activeDateRange.suggestedValues
        : modal.suggestedValues;
    const activeSuggestedValue = activeDateRange
        ? activeDateRange.suggestedValue
        : modal.suggestedValue;

    const hasMultipleValues =
        activeSuggestedValues && activeSuggestedValues.length > 0;
    const hasSingleValue = activeSuggestedValue && !hasMultipleValues;
    const valueLabel = modal.suggestedValueLabel || "Valor tarjeta por persona";

    return (
        <>
            <h3 className="mb-5 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
                {modal.title}
            </h3>

            {hasDateRanges && (
                <div className="mb-4 rounded-sm border border-primary-foreground/20 bg-primary-foreground/5 p-2">
                    <p className="mb-2 text-center text-[10px] font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                        Selecciona el tramo de fecha
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {modal.dateRanges!.map((range, index) => (
                            <button
                                key={`${range.label}-${index}`}
                                type="button"
                                onClick={() => setActiveDateRangeIdx(index)}
                                className={`rounded-full border px-3 py-1.5 text-[10px] font-medium tracking-[0.1em] uppercase transition-colors ${
                                    activeDateRangeIdx === index
                                        ? "border-primary-foreground/60 bg-primary-foreground/20 text-primary-foreground"
                                        : "border-primary-foreground/25 text-primary-foreground/70 hover:bg-primary-foreground/10"
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    {activeDateRange?.helperText && (
                        <p className="mt-2 text-center text-[11px] font-light text-primary-foreground/80">
                            {activeDateRange.helperText}
                        </p>
                    )}
                </div>
            )}

            {hasSingleValue && (
                <div className="mb-5 rounded-sm bg-primary-foreground/10 px-5 py-4 text-center">
                    <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                        {valueLabel}
                    </p>
                    <p className="mt-1 text-2xl font-light text-primary-foreground">
                        {isMuestra ? "$XX.XXX" : activeSuggestedValue}
                    </p>
                </div>
            )}

            {hasMultipleValues && (
                <div className="mb-5 rounded-sm bg-primary-foreground/10 px-4 py-3">
                    <p className="mb-2 text-center text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                        {valueLabel}
                    </p>
                    <div className="space-y-1.5">
                        {activeSuggestedValues!.map((item, index) => (
                            <div
                                key={`${item.label}-${index}`}
                                className="flex items-center justify-between py-1"
                            >
                                <span className="text-xs font-light text-primary-foreground/70">
                                    {item.label}
                                </span>
                                <span className="text-sm font-medium text-primary-foreground">
                                    {isMuestra ? "$XX.XXX" : item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="mb-6 text-sm font-light leading-relaxed text-primary-foreground/80">
                {modal.description}
            </p>
            <div className="space-y-3">
                {modal.transferData.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between rounded-sm border border-primary-foreground/15 px-4 py-3"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary-foreground/50">
                                {item.label}
                            </p>
                            <p className="mt-0.5 truncate text-sm font-light text-primary-foreground">
                                {isMuestra ? "XXXX-XXXX-XXXX" : item.value}
                            </p>
                        </div>
                        {!isMuestra && <CopyBtn value={item.value} />}
                    </div>
                ))}
            </div>
        </>
    );
}

export default function GiftCardSection({
    icon,
    title,
    description,
    showButton = true,
    button,
    modal,
}: GiftCardSectionProps) {
    const { openModal } = useModal();
    const isMuestra = useIsMuestra();

    const IconComponent = icon ? ICON_MAP[icon] || Gift : Gift;

    const handleOpen = () => {
        if (!modal) return;
        openModal(<GiftCardModalContent modal={modal} isMuestra={isMuestra} />);
    };

    return (
        <section className="flex flex-col items-center px-8 py-14 text-center">
            <IconComponent
                className="mb-5 h-9 w-9 opacity-70"
                strokeWidth={1}
            />
            <h2 className="mb-3 text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
                {title}
            </h2>
            <p className="mb-6 max-w-sm text-sm font-light leading-relaxed opacity-80">
                {description}
            </p>
            {showButton && button && modal && (
                <button
                    onClick={handleOpen}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:opacity-70"
                    style={{ borderColor: "currentColor", borderOpacity: 0.4 }}
                >
                    {button.text}
                </button>
            )}
        </section>
    );
}
