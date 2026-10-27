"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useConfig } from "@/lib/config-context";

export type BeveragePreferenceRootConfig = {
    /** true = exige bebida al confirmar asistencia (confirmarWhatsapp / rsvp). */
    enabled?: boolean;
    /** id de la sección `beveragePreference` (debe coincidir con section.id). */
    sectionId?: string;
};

type SectionLike = {
    type?: string;
    id?: string;
    enabled?: boolean;
    data?: Record<string, unknown>;
};

export type BeveragePreferenceBinding = {
    enabled: true;
    sectionId: string;
    whatsappLabel: string;
};

/** Raíz `beveragePreference.enabled` + sección; label en section.data.whatsappLabel. */
export function resolveBeveragePreferenceBinding(
    config: Record<string, unknown>,
): BeveragePreferenceBinding | null {
    const root = config.beveragePreference as
        | BeveragePreferenceRootConfig
        | undefined;
    if (root?.enabled !== true) return null;

    const sections = (config.sections as SectionLike[]) ?? [];
    const sid = root.sectionId?.trim();
    const section = sid
        ? sections.find(
              (s) => s.type === "beveragePreference" && s.id === sid,
          )
        : sections.find((s) => s.type === "beveragePreference");

    if (!section || section.enabled === false) return null;

    const sectionId = (section.id ?? sid ?? "").trim();
    if (!sectionId) return null;

    const data = section.data ?? {};
    const whatsappLabel =
        typeof data.whatsappLabel === "string" && data.whatsappLabel.trim()
            ? data.whatsappLabel.trim()
            : "Preferencia de bebida";

    return { enabled: true, sectionId, whatsappLabel };
}

export function scrollToBeverageSection(
    sectionId: string,
    behavior: ScrollBehavior = "smooth",
) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    try {
        el.scrollIntoView({ behavior, block: "center" });
    } catch {
        el.scrollIntoView({ block: "center" });
    }
}

type BeveragePreferenceContextValue = {
    binding: BeveragePreferenceBinding | null;
    selection: string | null;
    highlightMissing: boolean;
    setSelection: (value: string) => void;
    clearHighlight: () => void;
    /** Si falta bebida cuando hace falta, hace scroll y devuelve false. */
    requireSelectionForAttendance: () => boolean;
    whatsappLine: () => string | null;
    panelRestricciones: () => string | null;
};

const BeveragePreferenceContext =
    createContext<BeveragePreferenceContextValue | null>(null);

export function useBeveragePreference() {
    return useContext(BeveragePreferenceContext);
}

export function useBeveragePreferenceRequired() {
    const ctx = useBeveragePreference();
    if (!ctx?.binding) {
        return {
            enabled: false as const,
            requireSelectionForAttendance: () => true,
            whatsappLine: () => null as string | null,
            panelRestricciones: () => null as string | null,
        };
    }
    return {
        enabled: true as const,
        requireSelectionForAttendance: ctx.requireSelectionForAttendance,
        whatsappLine: ctx.whatsappLine,
        panelRestricciones: ctx.panelRestricciones,
    };
}

export function BeveragePreferenceProvider({
    children,
}: {
    children: ReactNode;
}) {
    const config = useConfig();
    const binding = useMemo(
        () => resolveBeveragePreferenceBinding(config as Record<string, unknown>),
        [config],
    );
    const enabled = Boolean(binding);

    const [selection, setSelectionState] = useState<string | null>(null);
    const [highlightMissing, setHighlightMissing] = useState(false);
    const [scrollNonce, setScrollNonce] = useState(0);

    const setSelection = useCallback((value: string) => {
        setSelectionState(value);
        setHighlightMissing(false);
    }, []);

    const clearHighlight = useCallback(() => setHighlightMissing(false), []);

    const sectionId = binding?.sectionId ?? "";

    useEffect(() => {
        if (!scrollNonce || !sectionId) return;
        scrollToBeverageSection(sectionId, "auto");
        const id = window.requestAnimationFrame(() => {
            scrollToBeverageSection(sectionId, "auto");
        });
        return () => window.cancelAnimationFrame(id);
    }, [scrollNonce, sectionId]);

    const requireSelectionForAttendance = useCallback(() => {
        if (!enabled) return true;
        if (selection?.trim()) return true;
        setHighlightMissing(true);
        setScrollNonce((n) => n + 1);
        return false;
    }, [enabled, selection]);

    const label = binding?.whatsappLabel ?? "Preferencia de bebida";

    const whatsappLine = useCallback(() => {
        if (!enabled || !selection?.trim()) return null;
        return `${label}: ${selection.trim()}`;
    }, [enabled, selection, label]);

    const panelRestricciones = useCallback(() => {
        if (!enabled || !selection?.trim()) return null;
        return selection.trim();
    }, [enabled, selection]);

    const value = useMemo(
        (): BeveragePreferenceContextValue => ({
            binding,
            selection,
            highlightMissing,
            setSelection,
            clearHighlight,
            requireSelectionForAttendance,
            whatsappLine,
            panelRestricciones,
        }),
        [
            binding,
            selection,
            highlightMissing,
            setSelection,
            clearHighlight,
            requireSelectionForAttendance,
            whatsappLine,
            panelRestricciones,
        ],
    );

    return (
        <BeveragePreferenceContext.Provider value={value}>
            {children}
        </BeveragePreferenceContext.Provider>
    );
}

export function appendBeverageLineToMessage(
    message: string,
    line: string | null,
): string {
    if (!line?.trim()) return message;
    const trimmed = message.trimEnd();
    return trimmed ? `${trimmed}\n\n${line.trim()}` : line.trim();
}
