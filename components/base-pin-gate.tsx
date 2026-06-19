"use client";

import { useCallback, useState, type ReactNode } from "react";

type BasePinGateProps = {
    children: ReactNode;
    /** Token de 8 caracteres de `base.token`. */
    baseToken?: string | null;
    /** Alternativa: resolver por panelId (misma sesión que la base). */
    panelId?: string | null;
    /** Si el servidor ya validó la cookie. */
    initialUnlocked?: boolean;
    primaryColor?: string;
    title?: string;
};

export function BasePinGate({
    children,
    baseToken,
    panelId,
    initialUnlocked = false,
    primaryColor = "#7A5F45",
    title = "Acceso al evento",
}: BasePinGateProps) {
    const [unlocked, setUnlocked] = useState(initialUnlocked);
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const submitPin = useCallback(
        async (pin: string) => {
            if (!/^\d{6}$/.test(pin)) return;
            setSubmitting(true);
            setError(null);
            try {
                const res = await fetch("/api/base-pin/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pin,
                        baseToken: baseToken || undefined,
                        panelId: panelId || undefined,
                    }),
                });
                if (!res.ok) {
                    setError("PIN incorrecto");
                    setDigits(["", "", "", "", "", ""]);
                    return;
                }
                setUnlocked(true);
            } catch {
                setError("No se pudo verificar. Intentá de nuevo.");
            } finally {
                setSubmitting(false);
            }
        },
        [baseToken, panelId],
    );

    const handleDigitChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        setError(null);
        if (digit && index < 5) {
            const el = document.getElementById(`base-pin-${index + 1}`);
            el?.focus();
        }
        const pin = next.join("");
        if (pin.length === 6) void submitPin(pin);
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            const el = document.getElementById(`base-pin-${index - 1}`);
            el?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);
        if (!pasted) return;
        const next = ["", "", "", "", "", ""];
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] || "";
        setDigits(next);
        if (pasted.length === 6) void submitPin(pasted);
    };

    if (unlocked) return <>{children}</>;

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] px-4 py-10">
            <div className="w-full max-w-sm rounded-2xl border border-[#E8DFD4] bg-white p-6 shadow-[0_8px_24px_rgba(71,45,22,0.08)]">
                <p className="text-center text-lg font-semibold text-[#3F332B]">
                    {title}
                </p>
                <p className="mt-2 text-center text-sm text-[#7A6A5B]">
                    Ingresá el PIN de 6 dígitos
                </p>
                <div
                    className="mt-6 flex justify-center gap-2"
                    onPaste={handlePaste}
                >
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            id={`base-pin-${i}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            maxLength={1}
                            value={d}
                            disabled={submitting}
                            onChange={(e) => handleDigitChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="h-12 w-10 rounded-lg border border-[#D9CBB9] bg-[#FFFDF9] text-center text-lg font-semibold text-[#3F332B] outline-none focus:border-[#BDA587]"
                            style={
                                d
                                    ? {
                                          borderColor: primaryColor,
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>
                {error ? (
                    <p className="mt-4 text-center text-sm text-[#C45C5C]">
                        {error}
                    </p>
                ) : null}
                <p className="mt-4 text-center text-xs text-[#9A8B7C]">
                    Al ingresar, te guardaremos la sesión por 90 días.
                </p>
            </div>
        </div>
    );
}
