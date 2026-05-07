"use client";

import { useMemo } from "react";
import { ChevronRight, Send } from "lucide-react";
import FooterSection from "@/components/wedding/footer-section";

type BaseLinkItem = {
    id: string;
    label: string;
    url: string;
    allowSend: boolean;
};

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
    const inviteBg = useMemo(() => `${primaryColor}22`, [primaryColor]);
    const inviteBorder = useMemo(() => `${primaryColor}88`, [primaryColor]);
    const panelBg = "#223A5A";
    const panelBorder = "#5F84B5";

    const toAbsolute = (url: string) => {
        try {
            return new URL(url, window.location.origin).toString();
        } catch {
            return url;
        }
    };

    const renderItem = (item: BaseLinkItem, mode: "invite" | "panel") => {
        const sectionBg = mode === "invite" ? inviteBg : panelBg;
        const sectionBorder = mode === "invite" ? inviteBorder : panelBorder;
        const openLink = () =>
            window.open(toAbsolute(item.url), "_blank", "noopener,noreferrer");
        const sendByWhatsapp = () => {
            const msg = toAbsolute(item.url);
            window.open(
                `https://wa.me/?text=${encodeURIComponent(msg)}`,
                "_blank",
                "noopener,noreferrer",
            );
        };
        if (mode === "invite") {
            return (
                <div key={item.id} className="flex items-stretch gap-1.5">
                    <button
                        type="button"
                        onClick={openLink}
                        className="flex flex-1 items-center justify-between rounded-xl border p-3 text-left transition-opacity hover:opacity-95"
                        style={{
                            backgroundColor: sectionBg,
                            borderColor: sectionBorder,
                        }}
                    >
                        <span className="text-sm font-semibold text-white">
                            {item.label}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-white/90">
                            <span className="text-[12px] font-semibold leading-none tracking-wide">
                                ABRIR
                            </span>
                            <ChevronRight className="h-4 w-4" />
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={sendByWhatsapp}
                        aria-label={`Enviar ${item.label} por WhatsApp`}
                        className="flex h-auto min-h-[48px] w-12 shrink-0 items-center justify-center rounded-xl border transition-opacity hover:opacity-95"
                        style={{
                            backgroundColor: sectionBg,
                            borderColor: sectionBorder,
                        }}
                    >
                        <Send className="h-4 w-4 text-white" />
                    </button>
                </div>
            );
        }
        return (
            <button
                key={item.id}
                type="button"
                onClick={openLink}
                className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-opacity hover:opacity-95"
                style={{
                    backgroundColor: sectionBg,
                    borderColor: sectionBorder,
                }}
            >
                <span className="text-sm font-semibold text-white">
                    {item.label}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-white/90">
                    <span className="text-[12px] font-semibold leading-none tracking-wide">
                        ABRIR
                    </span>
                    <ChevronRight className="h-4 w-4" />
                </span>
            </button>
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
                <section className="mx-auto w-full max-w-2xl md:max-w-6xl">
                    <div className="md:grid md:grid-cols-[minmax(260px,320px)_1fr] md:gap-6 lg:gap-8">
                        <aside className="md:sticky md:top-6 md:self-start">
                            <h1 className="pb-2 pt-3 text-2xl font-semibold md:pt-0 md:text-3xl">
                                {title}
                            </h1>
                            <p className="mt-2 pb-3 text-sm text-white/80 md:pb-4 md:text-[15px] md:leading-relaxed">
                                {subtitle}
                            </p>

                            <div className="mt-5 space-y-3 md:mt-0">
                                <div className="rounded-2xl border border-white/20 bg-black/10 p-4 md:p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                                        Cómo usar
                                    </p>
                                    <ul className="mt-2 space-y-1.5 text-sm text-white/85 md:space-y-2 md:text-[13px]">
                                        <li>
                                            1. Tocá cualquier botón para abrir
                                            directo la invitación o el panel.
                                        </li>
                                        <li>
                                            2. En invitaciones, podés usar el
                                            botón con avioncito para enviar por
                                            WhatsApp.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </aside>

                        <div className="mt-6 space-y-5 md:mt-0 md:space-y-6">
                            <div className="rounded-2xl border border-white/20 bg-black/10 p-4 md:p-5">
                                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                    {invitationItems.length > 1
                                        ? "Invitaciones"
                                        : "Invitación"}
                                </h2>
                                <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                                    {invitationItems.map((item) =>
                                        renderItem(item, "invite"),
                                    )}
                                </div>
                            </div>

                            {!!panelItems.length && (
                                <div className="rounded-2xl border border-white/20 bg-black/10 p-4 md:p-5">
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
