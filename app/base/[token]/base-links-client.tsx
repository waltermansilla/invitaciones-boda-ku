"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Copy, Send, X } from "lucide-react";
import FooterSection from "@/components/wedding/footer-section";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type BaseLinkItem = {
    id: string;
    label: string;
    url: string;
    allowSend: boolean;
};

const PANEL_UPSELL_IMAGE = "/landing/media/images/panel.PNG";
const PANEL_UPSELL_IMAGE_ALT =
    "Captura del panel de administración de invitados";
const DESIGNER_WA_NUMBER = "543456023759";
const PANEL_UPSELL_PRICE_LABEL = "por sólo $19.900";
const PANEL_UPSELL_INTRO =
    "Con WhatsApp recibís las confirmaciones, pero tenés que anotar y ordenar todo a mano. Con el panel, cada invitado confirma y el tablero se actualiza solo.";
const BASE_WA_MESSAGE_STORAGE_PREFIX = "base-wa-last-message:";

function readSavedWaMessage(baseToken: string): string | null {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(
            `${BASE_WA_MESSAGE_STORAGE_PREFIX}${baseToken}`,
        );
    } catch {
        return null;
    }
}

function saveWaMessage(baseToken: string, message: string) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(
            `${BASE_WA_MESSAGE_STORAGE_PREFIX}${baseToken}`,
            message,
        );
    } catch {
        // quota / modo privado
    }
}

const PANEL_UPSELL_POINTS = [
    "Tablero con confirmaciones en tiempo real: quién viene, pendientes y quienes no asisten.",
    "Filtros y totales claros para el día del evento.",
    "Podés ver requerimientos alimentarios (vegetariano, celíaco, etc.) y las canciones que sugieren los invitados, todo ordenado.",
    "Lista de invitados en vista A4 para guardar o imprimir en PDF.",
];

export function BaseLinksClient({
    title,
    subtitle,
    primaryColor,
    baseToken,
    defaultWhatsappMessage,
    invitationItems,
    panelItems,
    showPanelUpsell = false,
}: {
    title: string;
    subtitle: string;
    primaryColor: string;
    baseToken: string;
    defaultWhatsappMessage: string;
    invitationItems: BaseLinkItem[];
    panelItems: BaseLinkItem[];
    showPanelUpsell?: boolean;
}) {
    const [panelInfoOpen, setPanelInfoOpen] = useState(false);
    const [waModalOpen, setWaModalOpen] = useState(false);
    const [waDraft, setWaDraft] = useState("");
    const [pendingSendItem, setPendingSendItem] = useState<BaseLinkItem | null>(
        null,
    );
    const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
    const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const inviteBg = useMemo(() => `${primaryColor}22`, [primaryColor]);
    const inviteBorder = useMemo(() => `${primaryColor}88`, [primaryColor]);
    const panelBg = "#223A5A";
    const panelBorder = "#5F84B5";
    const hasPanel = panelItems.length > 0;

    const toAbsolute = (url: string) => {
        try {
            return new URL(url, window.location.origin).toString();
        } catch {
            return url;
        }
    };

    const openWhatsApp = (text: string) => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(text)}`,
            "_blank",
            "noopener,noreferrer",
        );
    };

    const openDesignerWhatsApp = (message: string) => {
        window.open(
            `https://wa.me/${DESIGNER_WA_NUMBER}?text=${encodeURIComponent(message)}`,
            "_blank",
            "noopener,noreferrer",
        );
    };

    const handleActivatePanel = () => {
        openDesignerWhatsApp(
            `Hola! Quiero activar el Panel de invitados para mi invitación (${title}).`,
        );
        setPanelInfoOpen(false);
    };

    const buildWaText = (link: string, message?: string) => {
        const trimmed = message?.trim();
        if (!trimmed) return link;
        return `${trimmed.replace(/\s+$/, "")}\n${link}`;
    };

    const sendInviteLink = (item: BaseLinkItem, message?: string) => {
        openWhatsApp(buildWaText(toAbsolute(item.url), message));
    };

    const copyInviteLink = async (item: BaseLinkItem) => {
        const url = toAbsolute(item.url);
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = url;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(textarea);
                if (!ok) throw new Error("copy failed");
            }
        } catch {
            return;
        }

        if (copyFeedbackTimeoutRef.current) {
            clearTimeout(copyFeedbackTimeoutRef.current);
        }
        setCopiedInviteId(item.id);
        copyFeedbackTimeoutRef.current = setTimeout(() => {
            setCopiedInviteId(null);
            copyFeedbackTimeoutRef.current = null;
        }, 4000);
    };

    const openSendModal = (item: BaseLinkItem) => {
        setPendingSendItem(item);
        const saved = readSavedWaMessage(baseToken)?.trim();
        setWaDraft(saved || defaultWhatsappMessage);
        setWaModalOpen(true);
    };

    const closeSendModal = () => {
        setWaModalOpen(false);
        setPendingSendItem(null);
        setWaDraft("");
    };

    const handleSendLinkOnly = () => {
        if (!pendingSendItem) return;
        sendInviteLink(pendingSendItem);
        closeSendModal();
    };

    const handleSendWithMessage = () => {
        if (!pendingSendItem) return;
        const trimmed = waDraft.trim();
        if (!trimmed) {
            sendInviteLink(pendingSendItem);
            closeSendModal();
            return;
        }
        saveWaMessage(baseToken, trimmed);
        sendInviteLink(pendingSendItem, trimmed);
        closeSendModal();
    };

    const renderBaseSendButtonHint = () => (
        <Send
            className="inline h-3.5 w-3.5 shrink-0 align-middle text-white"
            aria-hidden
        />
    );

    const renderInviteItem = (item: BaseLinkItem) => (
        <div key={item.id} className="flex items-stretch gap-1.5">
            <button
                type="button"
                onClick={() =>
                    window.open(
                        toAbsolute(item.url),
                        "_blank",
                        "noopener,noreferrer",
                    )
                }
                className="flex flex-1 items-center justify-between rounded-xl border p-3 text-left transition-opacity hover:opacity-95"
                style={{
                    backgroundColor: inviteBg,
                    borderColor: inviteBorder,
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
            {!hasPanel ? (
                <button
                    type="button"
                    onClick={() => openSendModal(item)}
                    aria-label={`Enviar ${item.label} por WhatsApp`}
                    className="flex h-auto min-h-[48px] w-12 shrink-0 items-center justify-center rounded-xl border transition-opacity hover:opacity-95"
                    style={{
                        backgroundColor: inviteBg,
                        borderColor: inviteBorder,
                    }}
                >
                    <Send className="h-4 w-4 text-white" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => copyInviteLink(item)}
                    aria-label={
                        copiedInviteId === item.id
                            ? `Enlace de ${item.label} copiado`
                            : `Copiar enlace de ${item.label}`
                    }
                    className="flex h-auto min-h-[48px] w-12 shrink-0 items-center justify-center rounded-xl border transition-opacity hover:opacity-95"
                    style={{
                        backgroundColor: inviteBg,
                        borderColor: inviteBorder,
                    }}
                >
                    {copiedInviteId === item.id ? (
                        <Check className="h-4 w-4 text-white" />
                    ) : (
                        <Copy className="h-4 w-4 text-white" />
                    )}
                </button>
            )}
        </div>
    );

    const renderPanelItem = (item: BaseLinkItem) => (
        <button
            key={item.id}
            type="button"
            onClick={() =>
                window.open(
                    toAbsolute(item.url),
                    "_blank",
                    "noopener,noreferrer",
                )
            }
            className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-opacity hover:opacity-95"
            style={{
                backgroundColor: panelBg,
                borderColor: panelBorder,
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
                                        {hasPanel ? (
                                            <>
                                                <li>
                                                    1. Para{" "}
                                                    <strong className="font-semibold text-white">
                                                        enviar las invitaciones
                                                    </strong>
                                                    , abrí el Panel, elegí un
                                                    invitado y tocá "Enviar
                                                    invitación".
                                                </li>

                                                <li>
                                                    2. Para{" "}
                                                    <strong className="font-semibold text-white">
                                                        ver tu invitación
                                                    </strong>
                                                    , tocá "Abrir" en la
                                                    invitación.
                                                </li>
                                            </>
                                        ) : (
                                            <>
                                                <li>
                                                    1. Para{" "}
                                                    <strong className="font-semibold text-white">
                                                        ver tu invitación
                                                    </strong>
                                                    , tocá "Abrir".
                                                </li>
                                                <li className="leading-relaxed">
                                                    2. Para{" "}
                                                    <strong className="font-semibold text-white">
                                                        enviar tu invitación
                                                    </strong>{" "}
                                                    por WhatsApp, tocá el botón{" "}
                                                    {renderBaseSendButtonHint()}
                                                    .
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </aside>

                        <div className="mt-6 space-y-5 md:mt-0 md:space-y-6">
                            {hasPanel && (
                                <div className="rounded-2xl border border-white/20 bg-black/10 p-4 md:p-5">
                                    <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                        Panel de invitados
                                    </h2>
                                    <p className="mt-2 text-[13px] leading-snug text-white/70">
                                        Ingresá para ver tu lista de invitados y
                                        enviar las invitaciones.
                                    </p>
                                    <div className="mt-3 space-y-3">
                                        {panelItems.map((item) =>
                                            renderPanelItem(item),
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl border border-white/20 bg-black/10 p-4 md:p-5">
                                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                    {invitationItems.length > 1
                                        ? "Invitaciones"
                                        : "Invitación"}
                                </h2>
                                {hasPanel && (
                                    <p className="mt-2 text-[13px] leading-snug text-white/70">
                                        Solo previsualización. El envío de las
                                        invitaciones se hacen desde el Panel.
                                    </p>
                                )}
                                <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                                    {invitationItems.map((item) =>
                                        renderInviteItem(item),
                                    )}
                                </div>
                            </div>

                            {showPanelUpsell && (
                                <div className="rounded-2xl border border-white/20 bg-black/10 p-4 md:p-5">
                                    <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                        Panel de invitados
                                    </h2>
                                    <div className="mt-3 flex items-stretch gap-1.5">
                                        <div
                                            className="pointer-events-none flex flex-1 items-center justify-between rounded-xl border p-3"
                                            style={{
                                                backgroundColor: panelBg,
                                                borderColor: panelBorder,
                                                opacity: 0.55,
                                            }}
                                            aria-disabled="true"
                                        >
                                            <span className="text-sm font-semibold text-white/75">
                                                Panel de invitados
                                            </span>
                                            <span className="inline-flex shrink-0 items-center gap-1.5 text-white/65">
                                                <span className="text-[12px] font-semibold leading-none tracking-wide">
                                                    ABRIR
                                                </span>
                                                <ChevronRight className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPanelInfoOpen(true)
                                            }
                                            aria-label="Qué es el panel de invitados"
                                            className="flex h-auto min-h-[48px] w-12 shrink-0 items-center justify-center rounded-xl border transition-opacity hover:opacity-95"
                                            style={{
                                                backgroundColor: panelBg,
                                                borderColor: panelBorder,
                                            }}
                                        >
                                            <span
                                                className="text-lg font-light leading-none text-white"
                                                aria-hidden
                                            >
                                                ?
                                            </span>
                                        </button>
                                    </div>
                                    <p className="mt-2.5 text-sm leading-relaxed text-white/80">
                                        ¿Querés ver quién confirmó sin revisar
                                        chats? Sumá panel de invitados.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Dialog
                open={waModalOpen}
                onOpenChange={(open) => {
                    if (!open) closeSendModal();
                    else setWaModalOpen(true);
                }}
            >
                <DialogContent
                    className="base-wa-modal border-white/20 shadow-2xl sm:max-w-md [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-80"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Enviar por WhatsApp
                        </DialogTitle>
                        <DialogDescription className="text-sm text-white/75">
                            Podés editar el mensaje para enviarlo junto con la
                            invitación.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        value={waDraft}
                        onChange={(e) => setWaDraft(e.target.value)}
                        placeholder="Mensaje para WhatsApp"
                        rows={4}
                        enterKeyHint="done"
                        className="w-full resize-none rounded-xl border border-white/20 bg-[#2a2a2a] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/25"
                    />
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <button
                            type="button"
                            onClick={handleSendWithMessage}
                            className="base-modal-primary-btn w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                        >
                            {waDraft.trim()
                                ? "Enviar con mensaje"
                                : "Enviar solo enlace"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSendLinkOnly}
                            className="base-modal-secondary-btn w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                        >
                            Sólo invitación
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={panelInfoOpen} onOpenChange={setPanelInfoOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="base-panel-modal !fixed !top-[max(0.375rem,env(safe-area-inset-top))] !bottom-[max(0.375rem,env(safe-area-inset-bottom))] !left-[1rem] !right-[1rem] !mx-auto !flex !h-auto !max-h-none !w-auto !max-w-none !translate-none flex-col gap-0 overflow-hidden border-white/20 !p-3.5 shadow-2xl"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="flex min-h-8 shrink-0 items-center pb-4">
                        <div className="w-8 shrink-0" aria-hidden />
                        <DialogTitle className="m-0 flex-1 text-center text-lg font-semibold leading-snug text-white">
                            Panel de invitados
                        </DialogTitle>
                        <DialogClose
                            aria-label="Cerrar"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs text-white opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        >
                            <X className="h-4 w-4" />
                        </DialogClose>
                    </div>

                    <div
                        data-slot="base-panel-modal-scroll"
                        className="base-panel-modal-scroll min-h-0 flex-1 px-3 pb-1"
                    >
                        <div className="space-y-3">
                            <p className="text-sm leading-relaxed text-white/80">
                                {PANEL_UPSELL_INTRO}
                            </p>

                            <div className="base-panel-modal-thumb-wrap flex w-full justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={PANEL_UPSELL_IMAGE}
                                    alt={PANEL_UPSELL_IMAGE_ALT}
                                    width={640}
                                    height={400}
                                    className="base-panel-modal-thumb block object-contain"
                                />
                            </div>

                            <ul className="list-disc space-y-2 pl-4 pb-2 text-[13px] leading-snug text-white/75">
                                {PANEL_UPSELL_POINTS.map((line) => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="base-panel-modal-footer shrink-0 border-t border-white/15 pt-3 text-center">
                        <button
                            type="button"
                            onClick={handleActivatePanel}
                            className="base-modal-primary-btn w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                        >
                            Activar Panel
                        </button>
                        <p className="mt-1.5 text-xs text-white/60">
                            {PANEL_UPSELL_PRICE_LABEL}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

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
