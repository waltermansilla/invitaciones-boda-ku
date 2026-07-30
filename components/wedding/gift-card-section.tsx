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
import { copyValueForBankField } from "@/lib/copy-bank-field-value";

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
    /**
     * Botón opcional para enviar el comprobante por WhatsApp.
     * Si number está vacío o falta, no se muestra.
     */
    comprobanteWhatsapp?: {
        number: string;
        text?: string;
        message?: string;
        /** Texto chico opcional arriba del botón. */
        hint?: string;
    };
}

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "");
}

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
    );
}

function CopyBtn({ value, label }: { value: string; label: string }) {
    const copyText = copyValueForBankField(label, value);
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
                await navigator.clipboard.writeText(copyText);
            } else {
                const ok = fallbackCopy(copyText);
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
                        className="flex items-start justify-between gap-2 rounded-sm border border-primary-foreground/15 px-4 py-3"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary-foreground/50">
                                {item.label}
                            </p>
                            <p className="mt-0.5 break-words text-sm font-light leading-snug text-primary-foreground">
                                {isMuestra ? "XXXX-XXXX-XXXX" : item.value}
                            </p>
                        </div>
                        {!isMuestra && (
                            <CopyBtn value={item.value} label={item.label} />
                        )}
                    </div>
                ))}
            </div>

            {(() => {
                const wa = modal.comprobanteWhatsapp;
                const phone = wa?.number ? digitsOnly(wa.number) : "";
                if (!phone) return null;
                const label = wa?.text?.trim() || "Enviar comprobante";
                const hint = wa?.hint?.trim() || "";
                const message =
                    wa?.message?.trim() ||
                    "Hola! Te envío el comprobante de pago de la tarjeta.";
                const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                const buttonClass =
                    "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm border border-primary-foreground/40 px-7 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10";

                const buttonEl = isMuestra ? (
                    <button
                        type="button"
                        onClick={() =>
                            alert(
                                "Este enlace esta deshabilitado en la version de muestra.",
                            )
                        }
                        className={buttonClass}
                    >
                        <WhatsAppIcon className="h-4 w-4" />
                        {label}
                    </button>
                ) : (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass}
                    >
                        <WhatsAppIcon className="h-4 w-4" />
                        {label}
                    </a>
                );

                return (
                    <div className="mt-6">
                        {hint ? (
                            <p className="mb-3 text-center text-[11px] font-light leading-relaxed text-primary-foreground/70">
                                {hint}
                            </p>
                        ) : null}
                        {buttonEl}
                    </div>
                );
            })()}
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

    const buttonVariantClasses =
        button?.variant === "primary"
            ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
            : "border-current/30 text-inherit hover:bg-current/5";

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
                    type="button"
                    onClick={handleOpen}
                    className={`inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 ${buttonVariantClasses}`}
                >
                    {button.text}
                </button>
            )}
        </section>
    );
}
