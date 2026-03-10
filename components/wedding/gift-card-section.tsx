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

function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
    button: { text: string; url: string; variant: "primary" | "secondary" };
    modal: {
        title: string;
        suggestedValue: string;
        description: string;
        transferData: { label: string; value: string }[];
    };
}

export default function GiftCardSection({
    icon,
    title,
    description,
    button,
    modal,
}: GiftCardSectionProps) {
    const { openModal } = useModal();
    const isMuestra = useIsMuestra();

    const IconComponent = icon ? ICON_MAP[icon] || Gift : Gift;

    const handleOpen = () => {
        const maskedData = isMuestra
            ? modal.transferData.map((item) => ({
                  ...item,
                  value: "XXXX-XXXX-XXXX",
              }))
            : modal.transferData;

        openModal(
            <>
                <h3 className="mb-5 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
                    {modal.title}
                </h3>
                {/* Valor sugerido: SOLO para giftCard, solo si tiene valor */}
                {modal.suggestedValue && (
                    <div className="mb-5 rounded-sm bg-primary-foreground/10 px-5 py-4 text-center">
                        <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                            Valor tarjeta por persona
                        </p>
                        <p className="mt-1 text-2xl font-light text-primary-foreground">
                            {isMuestra ? "$XX.XXX" : modal.suggestedValue}
                        </p>
                    </div>
                )}
                <p className="mb-6 text-sm font-light leading-relaxed text-primary-foreground/80">
                    {modal.description}
                </p>
                <div className="space-y-3">
                    {maskedData.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center justify-between rounded-sm border border-primary-foreground/15 px-4 py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary-foreground/50">
                                    {item.label}
                                </p>
                                <p className="mt-0.5 truncate text-sm font-light text-primary-foreground">
                                    {item.value}
                                </p>
                            </div>
                            {!isMuestra && <CopyBtn value={item.value} />}
                        </div>
                    ))}
                </div>
            </>,
        );
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
            <button
                onClick={handleOpen}
                className="inline-flex min-h-[48px] items-center justify-center rounded-sm border px-7 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit transition-all duration-200 hover:opacity-70"
                style={{ borderColor: "currentColor", borderOpacity: 0.4 }}
            >
                {button.text}
            </button>
        </section>
    );
}
