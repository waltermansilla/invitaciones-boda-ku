"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CopyLinkButton } from "@/components/admin/copy-link-button";

const iconButtonClass =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors hover:brightness-95";

const iconButtonStyle = {
    borderColor: "#D9CBB9",
    backgroundColor: "#FFFFFF",
    color: "#7A5F45",
} as const;

async function fetchUnlocked(baseToken: string): Promise<boolean> {
    const res = await fetch(
        `/api/base-pin/session?baseToken=${encodeURIComponent(baseToken)}`,
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { unlocked?: boolean };
    return Boolean(data.unlocked);
}

export function BasePinLockButton({
    baseToken,
    pin,
    pinEnabled,
    eventName,
}: {
    baseToken: string | null;
    pin: string | null;
    pinEnabled: boolean;
    eventName: string;
}) {
    const [open, setOpen] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [toggling, setToggling] = useState(false);
    const active = pinEnabled && Boolean(pin) && Boolean(baseToken);

    const refreshUnlocked = useCallback(async () => {
        if (!baseToken || !active) {
            setUnlocked(false);
            return;
        }
        setUnlocked(await fetchUnlocked(baseToken));
    }, [active, baseToken]);

    useEffect(() => {
        void refreshUnlocked();
    }, [refreshUnlocked]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") void refreshUnlocked();
        };
        window.addEventListener("focus", onVisible);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.removeEventListener("focus", onVisible);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refreshUnlocked]);

    useEffect(() => {
        if (open) void refreshUnlocked();
    }, [open, refreshUnlocked]);

    const toggleSession = async () => {
        if (!baseToken || !active || toggling) return;
        setToggling(true);
        try {
            const res = await fetch("/api/base-pin/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    baseToken,
                    unlocked: !unlocked,
                }),
            });
            if (res.ok) {
                const data = (await res.json()) as { unlocked?: boolean };
                setUnlocked(Boolean(data.unlocked));
            }
        } finally {
            setToggling(false);
        }
    };

    const LockIcon = active && unlocked ? LockOpen : Lock;
    const buttonTitle = active
        ? unlocked
            ? "Desbloqueado en este dispositivo"
            : "Bloqueado en este dispositivo"
        : "Ver PIN";

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={buttonTitle}
                title={buttonTitle}
                className={iconButtonClass}
                style={iconButtonStyle}
            >
                <LockIcon className="h-3.5 w-3.5" />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xs border-[#DECDB8] bg-[#FFFDFB]">
                    <DialogHeader>
                        <DialogTitle className="text-base text-[#3F332B]">
                            PIN — {eventName}
                        </DialogTitle>
                    </DialogHeader>
                    {active && pin ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <p className="font-mono text-3xl font-semibold tracking-[0.35em] text-[#3F332B]">
                                {pin}
                            </p>
                            <CopyLinkButton value={pin} />
                        </div>
                    ) : (
                        <p className="py-2 text-center text-sm text-[#7A6A5B]">
                            PIN desactivado
                        </p>
                    )}
                    {active ? (
                        <>
                            <p className="text-center text-xs text-[#9A8B7C]">
                                Base y panel · solo en este dispositivo
                            </p>
                            <button
                                type="button"
                                disabled={toggling}
                                onClick={() => void toggleSession()}
                                className="mx-auto mt-2 flex flex-col items-center gap-1 rounded-xl border border-[#D9CBB9] bg-white px-6 py-4 transition-colors hover:bg-[#FFF8EE] disabled:opacity-50"
                            >
                                {unlocked ? (
                                    <LockOpen className="h-6 w-6 text-[#2F7E56]" />
                                ) : (
                                    <Lock className="h-6 w-6 text-[#7A5F45]" />
                                )}
                                <span className="text-xs font-medium text-[#5C4A38]">
                                    {toggling
                                        ? "…"
                                        : unlocked
                                          ? "Desbloqueado · tocar para bloquear"
                                          : "Bloqueado · tocar para desbloquear"}
                                </span>
                            </button>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
