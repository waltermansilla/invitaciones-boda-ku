"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Send } from "lucide-react";
import FooterSection from "@/components/wedding/footer-section";

type BaseLinkItem = {
    id: string;
    label: string;
    url: string;
    allowSend: boolean;
};

function actionButtonClass() {
    return "inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors";
}

export function BaseLinksClient({
    title,
    subtitle,
    primaryColor,
    invitationItems,
    panelItems,
}: {
    title: string;
    subtitle: string;
    primaryColor: string;
    invitationItems: BaseLinkItem[];
    panelItems: BaseLinkItem[];
}) {
    const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
    const [openItemId, setOpenItemId] = useState<string | null>(null);

    const inviteBg = useMemo(() => `${primaryColor}22`, [primaryColor]);
    const inviteBorder = useMemo(() => `${primaryColor}88`, [primaryColor]);
    const panelBg = "#223A5A";
    const panelBorder = "#5F84B5";
    const solidActionBg = "rgba(255,255,255,0.12)";
    const solidActionText = "#FFFFFF";

    const toAbsolute = (url: string) => {
        try {
            return new URL(url, window.location.origin).toString();
        } catch {
            return url;
        }
    };

    const copyText = async (text: string) => {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!ok) {
            throw new Error("copy-failed");
        }
    };

    const handleCopy = async (item: BaseLinkItem) => {
        try {
            await copyText(toAbsolute(item.url));
            setCopiedMap((prev) => ({ ...prev, [item.id]: true }));
            window.setTimeout(() => {
                setCopiedMap((prev) => ({ ...prev, [item.id]: false }));
            }, 3000);
        } catch {
            alert("No se pudo copiar el link");
        }
    };

    const handleSend = (item: BaseLinkItem) => {
        const msg = toAbsolute(item.url);
        window.open(
            `https://wa.me/?text=${encodeURIComponent(msg)}`,
            "_blank",
            "noopener,noreferrer",
        );
    };

    const toRelative = (url: string) => {
        try {
            const u = new URL(url, window.location.origin);
            return `${u.pathname}${u.search}${u.hash}`;
        } catch {
            return url;
        }
    };

    const renderItem = (item: BaseLinkItem, mode: "invite" | "panel") => {
        const copied = Boolean(copiedMap[item.id]);
        const isOpen = openItemId === item.id;
        const sectionBg = mode === "invite" ? inviteBg : panelBg;
        const sectionBorder = mode === "invite" ? inviteBorder : panelBorder;
        return (
            <div
                key={item.id}
                className="rounded-xl border p-3"
                style={{
                    backgroundColor: sectionBg,
                    borderColor: sectionBorder,
                }}
            >
                <button
                    type="button"
                    onClick={() =>
                        setOpenItemId((prev) =>
                            prev === item.id ? null : item.id,
                        )
                    }
                    className="flex w-full items-center justify-between"
                >
                    <span className="text-sm font-semibold text-white">
                        {item.label}
                    </span>
                    <ChevronRight
                        className={`h-4 w-4 text-white/80 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                </button>
                <div
                    className="grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out"
                    style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0.65,
                        marginTop: isOpen ? "0.75rem" : "0rem",
                    }}
                >
                    <div className="min-h-0 overflow-hidden">
                        <button
                            type="button"
                            onClick={() =>
                                window.open(
                                    toAbsolute(item.url),
                                    "_blank",
                                    "noopener,noreferrer",
                                )
                            }
                            className="inline-flex min-h-[50px] w-full items-center justify-between rounded-lg border px-3 py-4 text-xs font-semibold"
                            style={{
                                borderColor: "rgba(255,255,255,0.28)",
                                backgroundColor: solidActionBg,
                                color: solidActionText,
                            }}
                        >
                            <span className="truncate pr-2">
                                {toRelative(item.url)}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1.5">
                                <span className="text-[12px] font-semibold tracking-wide opacity-85">
                                    ABRIR
                                </span>
                                <ChevronRight className="h-4 w-4" />
                            </span>
                        </button>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {item.allowSend ? (
                                <button
                                    type="button"
                                    onClick={() => handleSend(item)}
                                    className={actionButtonClass()}
                                    style={{
                                        borderColor: "rgba(255,255,255,0.28)",
                                        backgroundColor: solidActionBg,
                                        color: solidActionText,
                                    }}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Enviar
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => handleCopy(item)}
                                className={actionButtonClass()}
                                style={{
                                    borderColor: "rgba(255,255,255,0.28)",
                                    backgroundColor: solidActionBg,
                                    color: solidActionText,
                                }}
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                                {copied ? "Copiado" : "Copiar link"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <main
                className="relative min-h-[100dvh] px-4 text-white"
                style={{
                    paddingTop:
                        "max(1.5rem, calc(env(safe-area-inset-top,0px) + 0.75rem))",
                    paddingBottom:
                        "calc(max(1.5rem, calc(env(safe-area-inset-bottom,0px) + 0.75rem)) + 50px)",
                }}
            >
                <section className="mx-auto w-full max-w-2xl">
                <h1 className="pb-2 pt-3 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 pb-3 text-sm text-white/80">{subtitle}</p>

                    <div className="mt-5 space-y-3">
                        <div className="rounded-2xl border border-white/20 bg-black/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                                Cómo usar
                            </p>
                            <ul className="mt-2 space-y-1.5 text-sm text-white/85">
                                <li>
                                    1. Para abrir la invitación o el panel de
                                    invitados, tocá el link correspondiente.
                                </li>
                                <li>
                                    2. Para enviar la invitación por WhatsApp,
                                    tocá el botón "Enviar".
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 space-y-10">
                        <div className="rounded-2xl border border-white/20 bg-black/10 p-4">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                {invitationItems.length > 1
                                    ? "Invitaciones"
                                    : "Invitación"}
                            </h2>
                            <div className="mt-3 space-y-3">
                                {invitationItems.map((item) =>
                                    renderItem(item, "invite"),
                                )}
                            </div>
                        </div>

                        {!!panelItems.length && (
                            <div className="mt-6 rounded-2xl border border-white/20 bg-black/10 p-4">
                                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                    Panel de invitados
                                </h2>
                                <div className="mt-3 space-y-3">
                                    {panelItems.map((item) =>
                                        renderItem(item, "panel"),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <div
                className="border-t border-white/20"
                style={
                    {
                        "--primary": "transparent",
                        "--primary-foreground": "#FFFFFF",
                    } as React.CSSProperties
                }
            >
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                          #footer-credits {
                            background: transparent !important;
                          }
                        `,
                    }}
                />
                <FooterSection />
            </div>
        </>
    );
}
