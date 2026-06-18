"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BasePinGate } from "@/components/base-pin-gate";

type PanelPinGateProps = {
    panelId: string | null;
    children: ReactNode;
    primaryColor?: string;
    title?: string;
};

export function PanelPinGate({
    panelId,
    children,
    primaryColor = "#7A5F45",
    title = "Panel de invitados",
}: PanelPinGateProps) {
    const [ready, setReady] = useState(false);
    const [pinRequired, setPinRequired] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [baseToken, setBaseToken] = useState<string | null>(null);

    useEffect(() => {
        if (!panelId) return;
        let cancelled = false;
        void fetch(
            `/api/base-pin/status?panelId=${encodeURIComponent(panelId)}`,
        )
            .then((r) => r.json())
            .then((data: {
                required?: boolean;
                unlocked?: boolean;
                baseToken?: string;
            }) => {
                if (cancelled) return;
                setPinRequired(Boolean(data.required));
                setUnlocked(Boolean(data.unlocked));
                setBaseToken(
                    typeof data.baseToken === "string" ? data.baseToken : null,
                );
                setReady(true);
            })
            .catch(() => {
                if (cancelled) return;
                setPinRequired(false);
                setReady(true);
            });
        return () => {
            cancelled = true;
        };
    }, [panelId]);

    if (!panelId || !ready) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] text-sm text-[#7A6A5B]">
                Cargando…
            </div>
        );
    }

    if (!pinRequired) return <>{children}</>;

    return (
        <BasePinGate
            panelId={panelId}
            baseToken={baseToken}
            initialUnlocked={unlocked}
            primaryColor={primaryColor}
            title={title}
        >
            {children}
        </BasePinGate>
    );
}
