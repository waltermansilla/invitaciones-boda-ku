"use client";

import { useState, useEffect, Fragment, useRef, useMemo } from "react";
import { useGuestPreview } from "@/lib/guest-preview";
import { useGuestPreviewConfirmModal } from "./guest-preview-confirm-modal";
import {
    guestPreviewIsFamilia,
    guestPreviewStateLabelFromAttendance,
} from "@/lib/guest-preview-confirm";
import { useIsMuestra } from "@/lib/config-context";
import { Trash2 } from "lucide-react";
import { useModal } from "./modal-provider";
import {
    coladoPlural,
    coladoTitleSingular,
    normalizeColadoSingular,
} from "@/lib/colado-label";

const GROUP_NAME_MAX_LENGTH = 30;

type AutoConfirmEntry = {
    nombre: string;
    estado: "confirmado" | "no_asiste";
    es_colado?: boolean;
};

type AutoConfirmSummary = {
    displayName: string;
    tipo: "persona" | "familia";
    entries: AutoConfirmEntry[];
};

function autoConfirmStorageKey(panelId: string): string {
    return `rsvp-auto-confirm:${panelId}`;
}

function loadAutoConfirmSummary(
    panelId: string,
): AutoConfirmSummary | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(autoConfirmStorageKey(panelId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as AutoConfirmSummary;
        if (
            !parsed ||
            typeof parsed.displayName !== "string" ||
            !Array.isArray(parsed.entries)
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function saveAutoConfirmSummary(
    panelId: string,
    summary: AutoConfirmSummary,
): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(
            autoConfirmStorageKey(panelId),
            JSON.stringify(summary),
        );
    } catch {
        /* quota / private mode */
    }
}

function friendlyPanelApiError(raw: string, fallback: string): string {
    if (/l[ií]mite de plazas|l[ií]mite/i.test(raw)) {
        return "Error al registrar confirmación. Contactá con el anfitrión del evento.";
    }
    if (/syntaxerror|unexpected token|unexpected identifier/i.test(raw)) {
        return "No se pudo guardar en el panel. Recargá la página e intentá de nuevo.";
    }
    return raw.trim() || fallback;
}

interface InvitadoData {
    id: string;
    nombre: string;
    tipo: "persona" | "familia";
    estado: "pendiente" | "confirmado" | "no_asiste";
    cupo_colados?: number;
    integrantes?: {
        id: string;
        nombre: string;
        estado: string;
        restricciones?: string;
        es_colado?: boolean;
    }[];
    cancion?: string;
    mensaje?: string;
    restricciones?: string;
}

interface RSVPSectionProps {
    title: string;
    deadline: string;
    guestCountLabel: string;
    guestCountOptions: number[];
    fields: {
        firstName: string;
        lastName: string;
        attendance: string;
        attendanceYes: string;
        attendanceNo: string;
        dietary: string;
        dietaryOptions: string[];
        songRequestLabel?: string;
        songRequest?: string;
        extraInputs?: {
            id: string;
            label: string;
            placeholder?: string;
            tituloPanel?: string;
            /**
             * A4 lista/PDF del panel: `label` columna en la tabla,
             * `bottom` bloque después de la planilla (título `${tituloPanel}s` + nombre + texto).
             * Compat: `labelA4: true` = `label`.
             */
            a4?: "label" | "bottom";
            /** @deprecated Usar `a4: \"label\"`. */
            labelA4?: boolean;
            required?: boolean;
        }[];
        submitButton: string;
    };
    whatsapp?: {
        number: string;
        messageTemplate: string;
        noAttendanceMessageTemplate?: string;
    };
    panel?: {
        enabled: boolean;
        codigo?: string;
        panelId?: string;
        allowAnonymousToPanel?: boolean;
        allowColados?: boolean;
        /** Desde JSON; plural = + "s" por palabra (separadas por espacios). */
        coladoLabel?: string;
        confirmationMessage: string;
    };
    /** Con `?rsvpForm=1`: siempre muestra el formulario (ignora localStorage). */
    previewRsvpForm?: boolean;
}

interface GuestForm {
    id?: string;
    isColado?: boolean;
    firstName: string;
    lastName: string;
    showLastName?: boolean;
    attendance: string;
    dietary: string;
    songRequest: string;
    extraValues?: Record<string, string>;
    panelEstado?: "pendiente" | "confirmado" | "no_asiste";
}

function guestDisplayName(g: GuestForm): string {
    return `${g.firstName || ""} ${g.lastName || ""}`.trim();
}

function buildAutoConfirmSummary(
    guestsForSubmit: GuestForm[],
    groupName: string,
    guestCount: number,
): AutoConfirmSummary {
    const entries: AutoConfirmEntry[] = guestsForSubmit.map((g) => ({
        nombre: guestDisplayName(g),
        estado: g.attendance === "yes" ? "confirmado" : "no_asiste",
        ...(g.isColado ? { es_colado: true } : {}),
    }));
    const displayName =
        guestCount > 1
            ? groupName.trim()
            : guestDisplayName(
                  guestsForSubmit[0] || { firstName: "", lastName: "" },
              );
    return {
        displayName,
        tipo: guestCount > 1 ? "familia" : "persona",
        entries,
    };
}

/** Sin ?i= y alta en panel: apellido obligatorio solo con 1 persona (evita "Juan" sueltos). */
function guestLastNameRequired(
    guest: GuestForm,
    opts: {
        invitadoLoaded: boolean;
        allowAnonymousToPanel: boolean;
        guestCount: number;
    },
): boolean {
    if (guest.isColado) return false;
    if (opts.invitadoLoaded) return false;
    if (!opts.allowAnonymousToPanel) return false;
    return opts.guestCount === 1;
}

/** Colados sin nombre ni apellido: no se envían (equivale a quitarlos). */
function dropEmptyColados(guests: GuestForm[]): GuestForm[] {
    return guests.filter((g) => {
        if (!g.isColado) return true;
        return guestDisplayName(g).length > 0;
    });
}

/** Comparación estable para saber si hubo cambios al editar una confirmación ya guardada. */
function serializeGuestForms(guests: GuestForm[]): string {
    return JSON.stringify(
        guests.map((g) => ({
            id: g.id,
            isColado: Boolean(g.isColado),
            firstName: g.firstName,
            lastName: g.lastName,
            attendance: g.attendance,
            dietary: g.dietary,
            songRequest: g.songRequest,
            extraValues: g.extraValues ?? {},
        })),
    );
}

function extraInputWhatsAppTitle(input: {
    label: string;
    tituloPanel?: string;
}): string {
    if (typeof input.tituloPanel === "string" && input.tituloPanel.trim()) {
        return input.tituloPanel.trim();
    }
    return (input.label || "").trim();
}

function buildWhatsAppMessage(
    template: string,
    guests: GuestForm[],
    extraInputs: NonNullable<RSVPSectionProps["fields"]["extraInputs"]> = [],
): string {
    const lines = guests.map((g, i) => {
        const prefix = guests.length > 1 ? `${i + 1}:` : "1:";
        const attendance = g.attendance === "yes" ? "Asiste" : "No asiste";
        const fullName = `${g.firstName} ${g.lastName}`.trim();
        const detailLines: string[] = [
            `${prefix} *${fullName}*`,
            `*${attendance}*`,
        ];
        if (g.attendance === "no") return detailLines.join("\n");
        if (g.dietary && g.dietary !== "Ninguno")
            detailLines.push(`- Alimentacion: ${g.dietary}`);
        if (g.songRequest) detailLines.push(`- Cancion: ${g.songRequest}`);
        extraInputs.forEach((input) => {
            const value = g.extraValues?.[input.label]?.trim();
            if (!value) return;
            detailLines.push(`- ${extraInputWhatsAppTitle(input)}: ${value}`);
        });
        return detailLines.join("\n");
    });
    return template.replace("{resumen}", lines.join("\n\n"));
}

function buildNamesOnlySummary(guests: GuestForm[]): string {
    return guests
        .map((g) => `${g.firstName} ${g.lastName}`.trim())
        .filter(Boolean)
        .map((name) => `*${name}*`)
        .join("\n");
}

function applySingularPluralAdjustments(
    message: string,
    guestCount: number,
): string {
    if (guestCount > 1) {
        return message
            .replace(/\bConfirmo\b/g, "Confirmamos")
            .replace(/\bconfirmo\b/g, "confirmamos")
            .replace(/\bPodre\b/g, "Podremos")
            .replace(/\bpodre\b/g, "podremos");
    }

    return message
        .replace(/\bConfirmamos\b/g, "Confirmo")
        .replace(/\bconfirmamos\b/g, "confirmo")
        .replace(/\bPodremos\b/g, "Podre")
        .replace(/\bpodremos\b/g, "podre");
}

function buildSongRequestSummary(guests: GuestForm[]): string | null {
    const entries = guests
        .map((g) => {
            const song = g.songRequest?.trim();
            if (!song) return null;
            const fullName = `${g.firstName} ${g.lastName}`.trim();
            return fullName ? `${fullName}: ${song}` : song;
        })
        .filter((value): value is string => Boolean(value));

    if (entries.length === 0) return null;
    if (entries.length === 1) return entries[0];
    return entries.join(" | ");
}

function buildPanelExtraSummary(
    guests: GuestForm[],
    extraInputs: {
        id: string;
        label: string;
        placeholder?: string;
        tituloPanel?: string;
        required?: boolean;
    }[],
): string | null {
    const rows: string[] = [];
    guests.forEach((guest) => {
        const fullName = `${guest.firstName} ${guest.lastName}`.trim();
        extraInputs.forEach((input) => {
            const value = guest.extraValues?.[input.label]?.trim();
            if (!value) return;
            const hasCustomPanelTitle = typeof input.tituloPanel === "string";
            const panelTitle = hasCustomPanelTitle
                ? input.tituloPanel.trim()
                : (input.label || "").trim();
            rows.push(
                panelTitle
                    ? guests.length > 1 && fullName
                        ? `${fullName} - ${panelTitle}: ${value}`
                        : `${panelTitle}: ${value}`
                    : value,
            );
        });
    });
    if (rows.length === 0) return null;
    if (rows.length === 1) return rows[0];
    return rows.join(" | ");
}

/** Canción por persona cuando `cancion` viene como "Nombre: tema | ..." */
function songForMemberFromRaw(
    raw: string | undefined,
    memberName: string,
): string {
    const entries = parsePerMemberEntries(raw);
    const hit = entries.find((e) => e.memberName.trim() === memberName.trim());
    return hit?.value?.trim() || "";
}

function parsePerMemberEntries(
    raw: string | undefined,
): Array<{ memberName: string; label?: string; value: string }> {
    if (!raw) return [];
    const entries: Array<{
        memberName: string;
        label?: string;
        value: string;
    }> = [];
    raw.split("|")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .forEach((chunk) => {
            const colonIdx = chunk.indexOf(":");
            if (colonIdx <= 0) return;
            const left = chunk.slice(0, colonIdx).trim();
            const value = chunk.slice(colonIdx + 1).trim();
            if (!left || !value) return;
            if (left.includes(" - ")) {
                const [memberNameRaw, labelRaw] = left.split(" - ");
                const memberName = memberNameRaw?.trim();
                const label = labelRaw?.trim();
                if (!memberName) return;
                entries.push({ memberName, label: label || undefined, value });
                return;
            }
            entries.push({ memberName: left, value });
        });
    return entries;
}

export default function RSVPSection({
    title,
    deadline,
    guestCountLabel,
    guestCountOptions,
    fields,
    whatsapp,
    panel,
    previewRsvpForm = false,
}: RSVPSectionProps) {
    const isMuestra = useIsMuestra();
    const isGuestPreview = useGuestPreview();
    const { openGuestPreviewConfirmModal } = useGuestPreviewConfirmModal();
    const { openModal, closeModal } = useModal();
    const anonymousSubmitLockRef = useRef(false);
    const [invitado, setInvitado] = useState<InvitadoData | null>(null);
    const [guestCount, setGuestCount] = useState(1);
    const canUseColados = Boolean(panel?.enabled && panel?.allowColados);
    const coladoWordSingular = normalizeColadoSingular(panel?.coladoLabel);
    const coladoWordPlural = coladoPlural(coladoWordSingular);
    const extraInputs = fields.extraInputs ?? [];
    const showSongRequest = Boolean(fields.songRequest?.trim());
    const createEmptyExtraValues = () =>
        extraInputs.reduce<Record<string, string>>((acc, item) => {
            acc[item.label] = "";
            return acc;
        }, {});
    const [guests, setGuests] = useState<GuestForm[]>([
        {
            firstName: "",
            lastName: "",
            showLastName: true,
            attendance: "",
            dietary: "Ninguno",
            songRequest: "",
            extraValues: createEmptyExtraValues(),
        },
    ]);
    const [submitted, setSubmitted] = useState(false);
    const [autoConfirmSummary, setAutoConfirmSummary] =
        useState<AutoConfirmSummary | null>(null);
    const isAnonymousPanelFlow = Boolean(
        panel?.allowAnonymousToPanel && !panel?.codigo,
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [groupName, setGroupName] = useState("");
    const showGroupNameField =
        !invitado && Boolean(panel?.allowAnonymousToPanel) && guestCount > 1;
    const getCupoColados = (): number => {
        const raw = invitado?.cupo_colados;
        if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
        const n = Math.floor(raw);
        return n > 0 ? n : 0;
    };
    const currentColadosCount = guests.filter((g) => g.isColado).length;
    const maxColados = canUseColados ? getCupoColados() : 0;
    const canAddMoreColados = currentColadosCount < maxColados;
    const visibleColadosCupoMessage =
        canUseColados &&
        Boolean(invitado) &&
        maxColados > 0 &&
        canAddMoreColados;

    const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
    const [editing, setEditing] = useState(false);
    /** Snapshot JSON de `guests` al abrir edición (tras cargar desde API). */
    const [editBaselineJson, setEditBaselineJson] = useState<string | null>(
        null,
    );
    const editingRef = useRef(false);
    editingRef.current = editing;
    const extraTextareaRefs = useRef<
        Record<string, HTMLTextAreaElement | null>
    >({});
    const confirmationSectionRef = useRef<HTMLElement | null>(null);

    const guestsSerialized = useMemo(
        () => serializeGuestForms(guests),
        [guests],
    );
    const confirmEditDisabled =
        editing &&
        (editBaselineJson === null || guestsSerialized === editBaselineJson);

    useEffect(() => {
        if (!editing) setEditBaselineJson(null);
    }, [editing]);

    useEffect(() => {
        if (isGuestPreview) return;
        const showThanks =
            (alreadyConfirmed && !editing) || submitted || Boolean(autoConfirmSummary);
        if (!showThanks || typeof window === "undefined") return;
        confirmationSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }, [alreadyConfirmed, autoConfirmSummary, editing, isGuestPreview, submitted]);

    useEffect(() => {
        if (previewRsvpForm || !isAnonymousPanelFlow || !panel?.panelId) {
            return;
        }
        const stored = loadAutoConfirmSummary(panel.panelId);
        if (stored) {
            setAutoConfirmSummary(stored);
            setSubmitted(true);
        }
    }, [isAnonymousPanelFlow, panel?.panelId, previewRsvpForm]);

    // Obtener datos del invitado cuando hay codigo
    useEffect(() => {
        if (panel?.enabled && panel?.codigo) {
            fetch(`/api/rsvp/${panel.codigo}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.invitado) {
                        const inv = data.invitado;
                        setInvitado(inv);

                        // Verificar si ya confirmo (estado no es pendiente)
                        const yaConfirmo =
                            inv.tipo === "familia" && inv.integrantes?.length
                                ? inv.integrantes.every(
                                      (int: { estado: string }) =>
                                          int.estado !== "pendiente",
                                  )
                                : inv.estado !== "pendiente";

                        if (yaConfirmo && !editing) {
                            setAlreadyConfirmed(true);
                        } else {
                            setAlreadyConfirmed(false);
                        }

                        // Si es familia, precargar integrantes con sus datos guardados
                        if (
                            inv.tipo === "familia" &&
                            inv.integrantes?.length > 0
                        ) {
                            const songEntries = parsePerMemberEntries(
                                inv.cancion,
                            );
                            const extraEntries = parsePerMemberEntries(
                                inv.mensaje,
                            );
                            const builtGuests = inv.integrantes.map(
                                (int: {
                                    id: string;
                                    nombre: string;
                                    estado: string;
                                    restricciones?: string;
                                    es_colado?: boolean;
                                }) => {
                                    const [firstName, ...lastParts] =
                                        int.nombre.split(" ");
                                    const songForMember =
                                        songEntries.find(
                                            (entry) =>
                                                entry.memberName === int.nombre,
                                        )?.value || "";
                                    const extraValues =
                                        createEmptyExtraValues();
                                    extraInputs.forEach((input) => {
                                        const panelTitle = (
                                            input.tituloPanel ||
                                            input.label ||
                                            ""
                                        ).trim();
                                        const matched = extraEntries.find(
                                            (entry) =>
                                                entry.memberName ===
                                                    int.nombre &&
                                                entry.label &&
                                                (entry.label === panelTitle ||
                                                    entry.label ===
                                                        input.label),
                                        );
                                        if (matched) {
                                            extraValues[input.label] =
                                                matched.value;
                                        }
                                    });
                                    return {
                                        id: int.id,
                                        isColado: Boolean(int.es_colado),
                                        firstName,
                                        lastName: lastParts.join(" "),
                                        showLastName: lastParts.length > 0,
                                        attendance:
                                            int.estado === "confirmado"
                                                ? "yes"
                                                : int.estado === "no_asiste"
                                                  ? "no"
                                                  : "",
                                        dietary: int.restricciones || "Ninguno",
                                        songRequest: songForMember,
                                        extraValues,
                                        panelEstado:
                                            int.estado === "confirmado"
                                                ? "confirmado"
                                                : int.estado === "no_asiste"
                                                  ? "no_asiste"
                                                  : "pendiente",
                                    };
                                },
                            );
                            setGuestCount(inv.integrantes.length);
                            setGuests(builtGuests);
                            if (editingRef.current) {
                                setEditBaselineJson(
                                    serializeGuestForms(builtGuests),
                                );
                            }
                        } else if (inv.tipo === "persona") {
                            const [firstName, ...lastParts] =
                                inv.nombre.split(" ");
                            const titularNombre = inv.nombre.trim();
                            const songEntries = parsePerMemberEntries(
                                inv.cancion,
                            );
                            const extraEntries = parsePerMemberEntries(
                                inv.mensaje,
                            );
                            let titularSong = songForMemberFromRaw(
                                inv.cancion,
                                titularNombre,
                            );
                            if (
                                !titularSong &&
                                inv.cancion?.trim() &&
                                !inv.cancion.includes("|")
                            ) {
                                titularSong = inv.cancion.trim();
                            }
                            const titularExtras = createEmptyExtraValues();
                            extraInputs.forEach((input) => {
                                const panelTitle = (
                                    input.tituloPanel ||
                                    input.label ||
                                    ""
                                ).trim();
                                const matched = extraEntries.find(
                                    (entry) =>
                                        entry.memberName.trim() ===
                                            titularNombre &&
                                        entry.label &&
                                        (entry.label === panelTitle ||
                                            entry.label === input.label),
                                );
                                if (matched) {
                                    titularExtras[input.label] = matched.value;
                                }
                            });
                            const colados = (inv.integrantes || [])
                                .filter((int: { es_colado?: boolean }) =>
                                    Boolean(int.es_colado),
                                )
                                .map(
                                    (int: {
                                        id: string;
                                        nombre: string;
                                        estado: string;
                                        restricciones?: string;
                                    }) => {
                                        const [cf, ...cl] =
                                            int.nombre.split(" ");
                                        const nombreColado = int.nombre.trim();
                                        const ev = createEmptyExtraValues();
                                        extraInputs.forEach((input) => {
                                            const panelTitle = (
                                                input.tituloPanel ||
                                                input.label ||
                                                ""
                                            ).trim();
                                            const matched = extraEntries.find(
                                                (entry) =>
                                                    entry.memberName.trim() ===
                                                        nombreColado &&
                                                    entry.label &&
                                                    (entry.label ===
                                                        panelTitle ||
                                                        entry.label ===
                                                            input.label),
                                            );
                                            if (matched) {
                                                ev[input.label] = matched.value;
                                            }
                                        });
                                        return {
                                            id: int.id,
                                            isColado: true,
                                            firstName: cf,
                                            lastName: cl.join(" "),
                                            showLastName: cl.length > 0,
                                            attendance:
                                                int.estado === "confirmado"
                                                    ? "yes"
                                                    : int.estado === "no_asiste"
                                                      ? "no"
                                                      : "",
                                            dietary:
                                                int.restricciones || "Ninguno",
                                            songRequest: songForMemberFromRaw(
                                                inv.cancion,
                                                nombreColado,
                                            ),
                                            extraValues: ev,
                                            panelEstado:
                                                int.estado === "confirmado"
                                                    ? "confirmado"
                                                    : int.estado === "no_asiste"
                                                      ? "no_asiste"
                                                      : "pendiente",
                                        };
                                    },
                                );
                            const builtGuests = [
                                {
                                    firstName,
                                    lastName: lastParts.join(" "),
                                    showLastName: lastParts.length > 0,
                                    attendance:
                                        inv.estado === "confirmado"
                                            ? "yes"
                                            : inv.estado === "no_asiste"
                                              ? "no"
                                              : "",
                                    dietary: inv.restricciones || "Ninguno",
                                    songRequest: titularSong,
                                    extraValues: titularExtras,
                                    panelEstado:
                                        inv.estado === "confirmado"
                                            ? "confirmado"
                                            : inv.estado === "no_asiste"
                                              ? "no_asiste"
                                              : "pendiente",
                                },
                                ...colados,
                            ];
                            setGuests(builtGuests);
                            setGuestCount(1 + colados.length);
                            if (editingRef.current) {
                                setEditBaselineJson(
                                    serializeGuestForms(builtGuests),
                                );
                            }
                        }
                    }
                })
                .catch(() => {});
        }
    }, [panel?.enabled, panel?.codigo, editing, fields.extraInputs]);

    const handleGuestCountChange = (count: number) => {
        setGuestCount(count);
        if (count <= 1) setGroupName("");
        const newGuests: GuestForm[] = [];
        for (let i = 0; i < count; i++) {
            newGuests.push(
                guests[i] || {
                    firstName: "",
                    lastName: "",
                    showLastName: true,
                    attendance: "",
                    dietary: "Ninguno",
                    songRequest: "",
                    extraValues: createEmptyExtraValues(),
                },
            );
        }
        setGuests(newGuests);
    };

    const updateGuest = (
        index: number,
        field: keyof GuestForm,
        value: string,
    ) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const updateGuestExtraValue = (
        index: number,
        label: string,
        value: string,
    ) => {
        const newGuests = [...guests];
        const prevExtraValues = newGuests[index].extraValues || {};
        newGuests[index] = {
            ...newGuests[index],
            extraValues: {
                ...prevExtraValues,
                [label]: value,
            },
        };
        setGuests(newGuests);
    };

    const handleAddColado = () => {
        if (!canAddMoreColados) return;
        const row: GuestForm = {
            id: `new-colado-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            isColado: true,
            firstName: "",
            lastName: "",
            showLastName: true,
            attendance: "",
            dietary: "Ninguno",
            songRequest: "",
            extraValues: createEmptyExtraValues(),
            panelEstado: "pendiente",
        };
        const next = [...guests, row];
        setGuests(next);
        setGuestCount(next.length);
        setError(null);
    };

    const handleRemoveColado = (index: number) => {
        if (!guests[index]?.isColado) return;
        const next = guests.filter((_, i) => i !== index);
        setGuests(next);
        setGuestCount(next.length);
        setError(null);
    };

    useEffect(() => {
        Object.values(extraTextareaRefs.current).forEach((textarea) => {
            if (!textarea) return;
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
    }, [guests]);

    const submitAnonymousToPanel = async (
        guestsForSubmit: GuestForm[],
        trimmedGroupName: string,
        songSummary: string | null,
        panelExtraSummary: string | null,
    ) => {
        if (
            !panel?.panelId ||
            anonymousSubmitLockRef.current ||
            !panel.allowAnonymousToPanel
        ) {
            return;
        }
        anonymousSubmitLockRef.current = true;
        setSubmitting(true);
        setError(null);
        try {
            const principalName =
                `${guestsForSubmit[0]?.firstName || ""} ${guestsForSubmit[0]?.lastName || ""}`.trim();
            const createPayload =
                guestsForSubmit.length > 1
                    ? {
                          nombre: trimmedGroupName,
                          tipo: "familia",
                          integrantes: guestsForSubmit.map((g) =>
                              `${g.firstName} ${g.lastName}`.trim(),
                          ),
                          registro_auto_rsvp: true,
                      }
                    : {
                          nombre: principalName || "Invitado",
                          tipo: "persona",
                          registro_auto_rsvp: true,
                      };

            const createRes = await fetch(`/api/panel/${panel.panelId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createPayload),
            });
            const createData = await createRes.json().catch(
                () =>
                    ({}) as {
                        error?: string;
                        invitado?: InvitadoData & { codigo?: string };
                    },
            );
            if (!createRes.ok || !createData.invitado?.codigo) {
                const rawMsg =
                    createData.error ||
                    "No se pudo crear el invitado en el panel";
                throw new Error(
                    friendlyPanelApiError(
                        rawMsg,
                        "No se pudo crear el invitado en el panel",
                    ),
                );
            }

            const invitadoCreado = createData.invitado;
            const confirmRes = await fetch(
                `/api/rsvp/${invitadoCreado.codigo}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        integrantes: guestsForSubmit.map((g, idx) => ({
                            id: invitadoCreado.integrantes?.[idx]?.id,
                            nombre: `${g.firstName} ${g.lastName}`.trim(),
                            asiste: g.attendance === "yes",
                            restricciones:
                                g.dietary !== "Ninguno" ? g.dietary : null,
                            es_colado: Boolean(g.isColado),
                        })),
                        asiste: guestsForSubmit.some(
                            (g) => g.attendance === "yes",
                        ),
                        mensaje: panelExtraSummary,
                        cancion: songSummary,
                    }),
                },
            );
            const confirmData = await confirmRes
                .json()
                .catch(
                    () => ({}) as { error?: string; invitado?: InvitadoData },
                );
            if (!confirmRes.ok) {
                throw new Error(
                    friendlyPanelApiError(
                        confirmData.error || "",
                        "Error al guardar la confirmacion en el panel",
                    ),
                );
            }
            const summary = buildAutoConfirmSummary(
                guestsForSubmit,
                trimmedGroupName,
                guestsForSubmit.length,
            );
            saveAutoConfirmSummary(panel.panelId, summary);
            setAutoConfirmSummary(summary);
            setSubmitted(true);
            setEditing(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al enviar confirmacion",
            );
        } finally {
            setSubmitting(false);
            anonymousSubmitLockRef.current = false;
        }
    };

    const openAnonymousReviewModal = (
        guestsForSubmit: GuestForm[],
        trimmedGroupName: string,
        songSummary: string | null,
        panelExtraSummary: string | null,
    ) => {
        const modalGuestCount = guestsForSubmit.length;
        openModal(
            <>
                <h3 className="mb-3 pr-8 text-lg font-semibold tracking-wide uppercase text-primary-foreground">
                    Revisá tu confirmación
                </h3>
                <p className="mb-6 text-left text-sm font-light leading-relaxed text-primary-foreground/85">
                    Verificá que todos los datos sean correctos. Si algo no
                    coincide, volvé a editar antes de confirmar.
                </p>
                <div className="space-y-4 text-left">
                    {modalGuestCount > 1 && (
                        <div>
                            <h4 className="mb-1 text-xs font-medium tracking-[0.15em] uppercase text-primary-foreground/60">
                                Grupo / familia
                            </h4>
                            <p className="text-sm font-light text-primary-foreground/85">
                                {trimmedGroupName}
                            </p>
                        </div>
                    )}
                    {guestsForSubmit.map((guest, index) => {
                        const fullName = guestDisplayName(guest);
                        const attendanceLabel =
                            guest.attendance === "yes"
                                ? "Confirmado"
                                : "No asiste";
                        return (
                            <div
                                key={`review-${index}`}
                                className="rounded-sm border border-primary-foreground/15 px-4 py-4"
                            >
                                <h4 className="text-center text-base font-semibold tracking-wide text-primary-foreground">
                                    {fullName}
                                    {guest.isColado && (
                                        <span className="ml-1 text-sm font-normal text-primary-foreground/65">
                                            ({coladoWordSingular})
                                        </span>
                                    )}
                                </h4>
                                <div className="mt-3 space-y-1.5 text-left text-sm font-light text-primary-foreground/85">
                                    <p>
                                        <span className="font-semibold text-primary-foreground">
                                            Estado:{" "}
                                        </span>
                                        {attendanceLabel}
                                    </p>
                                    {guest.dietary !== "Ninguno" && (
                                        <p>
                                            <span className="font-semibold text-primary-foreground">
                                                {fields.dietary}:{" "}
                                            </span>
                                            {guest.dietary}
                                        </p>
                                    )}
                                    {showSongRequest &&
                                        guest.songRequest?.trim() && (
                                            <p>
                                                <span className="font-semibold text-primary-foreground">
                                                    {fields.songRequestLabel ||
                                                        fields.songRequest}
                                                    :{" "}
                                                </span>
                                                {guest.songRequest.trim()}
                                            </p>
                                        )}
                                    {extraInputs.map((input) => {
                                        const value =
                                            guest.extraValues?.[
                                                input.label
                                            ]?.trim();
                                        if (!value) return null;
                                        return (
                                            <p key={input.id}>
                                                <span className="font-semibold text-primary-foreground">
                                                    {extraInputWhatsAppTitle(
                                                        input,
                                                    )}
                                                    :{" "}
                                                </span>
                                                {value}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="w-full rounded-sm border border-primary-foreground/30 px-5 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground transition-all hover:bg-primary-foreground/10"
                    >
                        Volver a editar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            closeModal();
                            void submitAnonymousToPanel(
                                guestsForSubmit,
                                trimmedGroupName,
                                songSummary,
                                panelExtraSummary,
                            );
                        }}
                        className="flex min-h-[52px] w-full items-center justify-center rounded-sm border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-4 text-[11px] font-medium tracking-[0.15em] uppercase text-primary-foreground transition-all hover:bg-primary-foreground/20"
                    >
                        Confirmar
                    </button>
                </div>
            </>,
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isMuestra) {
            setSubmitted(true);
            return;
        }

        const guestsForSubmit = dropEmptyColados(guests);
        if (guestsForSubmit.length !== guests.length) {
            setGuests(guestsForSubmit);
            setGuestCount(guestsForSubmit.length);
        }
        setError(null);

        const coladoSinAsistencia = guestsForSubmit.find(
            (g) =>
                g.isColado &&
                guestDisplayName(g).length > 0 &&
                g.attendance !== "yes" &&
                g.attendance !== "no",
        );
        if (coladoSinAsistencia) {
            setError("Indicá si asiste cada colado que tenga nombre cargado.");
            return;
        }

        const missingRequiredExtra = guestsForSubmit.find(
            (guest) =>
                guest.attendance === "yes" &&
                extraInputs.some(
                    (input) =>
                        input.required &&
                        !(guest.extraValues?.[input.label] || "").trim(),
                ),
        );
        if (missingRequiredExtra) {
            setError(
                "Completa los campos obligatorios para confirmar asistencia.",
            );
            return;
        }
        const needsGroupName =
            panel?.enabled &&
            !panel?.codigo &&
            panel?.allowAnonymousToPanel &&
            guestsForSubmit.length > 1;
        const trimmedGroupName = groupName.trim();
        if (needsGroupName) {
            if (!trimmedGroupName) {
                setError("Indicá el nombre del grupo o familia.");
                return;
            }
            if (trimmedGroupName.length > GROUP_NAME_MAX_LENGTH) {
                setError(
                    `El nombre del grupo o familia no puede superar ${GROUP_NAME_MAX_LENGTH} caracteres.`,
                );
                return;
            }
        }
        const needsSingleGuestLastName =
            panel?.enabled &&
            !panel?.codigo &&
            panel?.allowAnonymousToPanel &&
            guestsForSubmit.length === 1;
        if (
            needsSingleGuestLastName &&
            guestsForSubmit.some((g) => !g.isColado && !g.lastName.trim())
        ) {
            setError("Indicá el apellido.");
            return;
        }
        const titularGuest =
            guestsForSubmit.find((g) => !g.isColado) ?? guestsForSubmit[0];
        const songSummary = buildSongRequestSummary(guestsForSubmit);
        const panelExtraSummary = buildPanelExtraSummary(
            guestsForSubmit,
            extraInputs,
        );

        if (panel?.enabled && panel?.codigo) {
            const submitPanelCodigo = async () => {
                setSubmitting(true);
                setError(null);
                try {
                    const titularIndex = guestsForSubmit.findIndex(
                        (g) => !g.isColado,
                    );
                    const integrantesPayload = guestsForSubmit
                        .filter((g, idx) =>
                            invitado?.tipo === "familia"
                                ? true
                                : g.isColado ||
                                  (invitado?.tipo === "persona" &&
                                      idx !== titularIndex),
                        )
                        .map((g) => ({
                            id: g.id,
                            nombre: `${g.firstName} ${g.lastName}`.trim(),
                            asiste: g.attendance === "yes",
                            restricciones:
                                g.dietary !== "Ninguno" ? g.dietary : null,
                            es_colado:
                                invitado?.tipo === "persona"
                                    ? true
                                    : Boolean(g.isColado),
                        }));
                    const res = await fetch(`/api/rsvp/${panel.codigo}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            integrantes: integrantesPayload,
                            asiste: guestsForSubmit.some(
                                (g) => g.attendance === "yes",
                            ),
                            mensaje: panelExtraSummary,
                            cancion: songSummary,
                            ...(invitado?.tipo === "persona"
                                ? {
                                      restricciones:
                                          titularGuest &&
                                          titularGuest.dietary !== "Ninguno"
                                              ? titularGuest.dietary
                                              : null,
                                  }
                                : {}),
                        }),
                    });
                    const responseData = await res
                        .json()
                        .catch(
                            () =>
                                ({}) as {
                                    error?: string;
                                    invitado?: InvitadoData;
                                },
                        );
                    if (!res.ok) {
                        throw new Error(
                            responseData.error ||
                                "Error al enviar confirmacion",
                        );
                    }
                    if (responseData.invitado) {
                        setInvitado(responseData.invitado);
                    }
                    setSubmitted(true);
                    setAlreadyConfirmed(true);
                    setEditing(false);
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Error al enviar confirmacion",
                    );
                } finally {
                    setSubmitting(false);
                }
            };

            if (isGuestPreview) {
                openGuestPreviewConfirmModal({
                    stateLabel:
                        guestPreviewStateLabelFromAttendance(guestsForSubmit),
                    isFamilia: guestPreviewIsFamilia(invitado),
                    onConfirm: submitPanelCodigo,
                });
                return;
            }

            await submitPanelCodigo();
            return;
        }

        if (
            panel?.enabled &&
            !panel?.codigo &&
            panel?.panelId &&
            panel?.allowAnonymousToPanel
        ) {
            openAnonymousReviewModal(
                guestsForSubmit,
                trimmedGroupName,
                songSummary,
                panelExtraSummary,
            );
            return;
        }

        if (whatsapp?.number && whatsapp?.messageTemplate) {
            const everyoneDeclined =
                guestsForSubmit.length > 0 &&
                guestsForSubmit.every((g) => g.attendance === "no");
            const baseMessage =
                everyoneDeclined && whatsapp.noAttendanceMessageTemplate
                    ? whatsapp.noAttendanceMessageTemplate.replace(
                          "{resumen}",
                          buildNamesOnlySummary(guestsForSubmit),
                      )
                    : buildWhatsAppMessage(
                          whatsapp.messageTemplate,
                          guestsForSubmit,
                          extraInputs,
                      );
            const message = applySingularPluralAdjustments(
                baseMessage,
                guestsForSubmit.length,
            );
            const url = `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
            setSubmitted(true);
        } else {
            setSubmitted(true);
        }
    };

    const handleEdit = () => {
        setEditBaselineJson(null);
        setEditing(true);
        setAlreadyConfirmed(false);
        setSubmitted(false);
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setAlreadyConfirmed(true);
        setError(null);
    };

    const showConfirmationScreen =
        (alreadyConfirmed && !editing) ||
        submitted ||
        (Boolean(autoConfirmSummary) && !previewRsvpForm);

    // Mostrar mensaje de confirmacion si ya confirmo o acaba de enviar
    if (showConfirmationScreen) {
        const confirmMsg = panel?.enabled
            ? panel.confirmationMessage ||
              "Gracias por confirmar tu asistencia!"
            : isMuestra
              ? "Confirmacion simulada. En la version real, los datos se envian."
              : "Tu confirmacion ha sido enviada por WhatsApp.";

        const estadoLabel = (estado: string) =>
            estado === "confirmado"
                ? "Asiste"
                : estado === "no_asiste"
                  ? "No asiste"
                  : "Pendiente";
        const estadoClass = (estado: string) =>
            estado === "confirmado"
                ? "text-green-600"
                : estado === "no_asiste"
                  ? "text-red-500"
                  : "text-inherit/50";

        const resumen =
            autoConfirmSummary || invitado ? (
                <div className="mt-6 rounded-xl border border-current/15 bg-current/5 px-5 py-4 text-left">
                    {autoConfirmSummary ? (
                        <div className="space-y-2">
                            {autoConfirmSummary.entries.map((entry, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-inherit/80">
                                        {entry.nombre}
                                        {entry.es_colado
                                            ? ` (${coladoWordSingular})`
                                            : ""}
                                    </span>
                                    <span
                                        className={`text-xs font-medium ${estadoClass(entry.estado)}`}
                                    >
                                        {estadoLabel(entry.estado)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : invitado &&
                      (invitado.integrantes?.length || 0) > 0 ? (
                        <div className="space-y-2">
                            {invitado.tipo === "persona" && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-inherit/80">
                                        {invitado.nombre}
                                    </span>
                                    <span
                                        className={`text-xs font-medium ${estadoClass(invitado.estado)}`}
                                    >
                                        {estadoLabel(invitado.estado)}
                                    </span>
                                </div>
                            )}
                            {invitado.integrantes?.map((int, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-inherit/80">
                                        {int.nombre}
                                        {int.es_colado
                                            ? ` (${coladoWordSingular})`
                                            : ""}
                                    </span>
                                    <span
                                        className={`text-xs font-medium ${estadoClass(int.estado)}`}
                                    >
                                        {estadoLabel(int.estado)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : invitado ? (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-inherit/80">
                                {invitado.nombre}
                            </span>
                            <span
                                className={`text-xs font-medium ${estadoClass(invitado.estado)}`}
                            >
                                {estadoLabel(invitado.estado)}
                            </span>
                        </div>
                    ) : null}
                </div>
            ) : null;

        return (
            <section
                ref={confirmationSectionRef}
                className="flex flex-col justify-start px-6 py-8 text-center md:min-h-[min(85dvh,920px)] md:justify-center md:py-12"
            >
                <div className="mx-auto w-full max-w-md">
                    <h2 className="mb-4 text-3xl font-semibold tracking-[0.15em] text-inherit/90">
                        {isMuestra ? "Modo muestra" : "Confirmación enviada"}
                    </h2>
                    <p className="text-sm tracking-wide text-inherit/65">
                        {confirmMsg}
                    </p>
                    {resumen}
                    {panel?.enabled && panel?.codigo && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="mt-6 text-xs font-medium tracking-wider text-inherit/50 underline underline-offset-4 transition-colors hover:text-inherit/80"
                        >
                            Editar mi confirmacion
                        </button>
                    )}
                </div>
            </section>
        );
    }

    // Nombre tal cual esta en el panel (sin prefijos)
    const displayName = invitado?.nombre || null;

    return (
        <section className="px-6 py-14">
            <div className="mx-auto max-w-sm md:max-w-md">
                {/* Caja con nombre del invitado */}
                {invitado && (
                    <div className="mb-8 rounded-2xl border border-current/20 bg-current/5 px-6 py-5 text-center">
                        <h3 className="text-lg font-semibold uppercase tracking-[0.15em] text-inherit/80">
                            {displayName}
                        </h3>
                        <p className="mt-1 text-sm font-light tracking-wide text-inherit/60">
                            {invitado.tipo === "familia" && invitado.integrantes
                                ? `Hay ${invitado.integrantes.length} lugares reservados para ustedes`
                                : "Hay un lugar reservado para ti"}
                        </p>
                    </div>
                )}

                <h2 className="mb-1 text-center text-xl font-semibold tracking-[0.2em] uppercase text-inherit/90 md:text-2xl">
                    {title}
                </h2>
                <p className="mb-8 text-center text-[11px] font-medium tracking-[0.15em] uppercase text-inherit/55">
                    {deadline}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Guest count - solo si no hay panel (invitado sin codigo) */}
                    {!invitado && (
                        <div>
                            <label className="mb-2 block text-[11px] font-medium tracking-[0.1em] text-inherit/65">
                                {guestCountLabel}
                            </label>
                            <select
                                value={guestCount}
                                onChange={(e) =>
                                    handleGuestCountChange(
                                        Number(e.target.value),
                                    )
                                }
                                className="w-full rounded-md border border-current/15 bg-current/10 px-4 py-3 text-sm tracking-wide text-inherit/90 backdrop-blur-sm"
                                style={{ fontSize: "16px" }}
                            >
                                {guestCountOptions.map((n) => (
                                    <option
                                        key={n}
                                        value={n}
                                        className="bg-primary text-primary-foreground"
                                    >
                                        {n} {n === 1 ? "persona" : "personas"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {guests.map((guest, index) => {
                        const coladoPosition = guest.isColado
                            ? guests
                                  .slice(0, index + 1)
                                  .filter((g) => g.isColado).length
                            : 0;
                        const invitadoPosition = guest.isColado
                            ? 0
                            : guests
                                  .slice(0, index + 1)
                                  .filter((g) => !g.isColado).length;
                        const lastNameRequired = guestLastNameRequired(guest, {
                            invitadoLoaded: Boolean(invitado),
                            allowAnonymousToPanel: Boolean(
                                panel?.allowAnonymousToPanel,
                            ),
                            guestCount,
                        });
                        return (
                            <Fragment key={guest.id ?? `guest-${index}`}>
                                {guests.length > 1 && (
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-inherit/65">
                                            {guest.isColado
                                                ? `${coladoTitleSingular(coladoWordSingular)} ${coladoPosition}`
                                                : `Invitado ${invitadoPosition}`}
                                        </p>
                                        {guest.isColado && canUseColados && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveColado(index)
                                                }
                                                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-current/20 bg-current/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-inherit/65 shadow-sm transition-all hover:border-red-400/35 hover:bg-red-500/[0.09] hover:text-red-700 active:scale-[0.98]"
                                                aria-label={`Quitar ${coladoWordSingular}`}
                                            >
                                                <Trash2
                                                    className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100"
                                                    aria-hidden
                                                />
                                                Quitar
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="flex flex-col gap-0 overflow-hidden rounded-md border border-current/15 bg-current/10 backdrop-blur-sm">
                                    <input
                                        type="text"
                                        placeholder={
                                            guest.isColado
                                                ? fields.firstName
                                                : fields.firstName + " *"
                                        }
                                        required={!guest.isColado}
                                        value={guest.firstName}
                                        onChange={(e) =>
                                            updateGuest(
                                                index,
                                                "firstName",
                                                e.target.value,
                                            )
                                        }
                                        disabled={
                                            Boolean(invitado) && !guest.isColado
                                        }
                                        className="w-full border-b border-current/10 bg-transparent px-4 py-3 text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                        style={{ fontSize: "16px" }}
                                    />
                                    {guest.showLastName !== false && (
                                        <input
                                            type="text"
                                            placeholder={
                                                lastNameRequired
                                                    ? `${fields.lastName} *`
                                                    : fields.lastName
                                            }
                                            required={lastNameRequired}
                                            value={guest.lastName}
                                            onChange={(e) =>
                                                updateGuest(
                                                    index,
                                                    "lastName",
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                Boolean(invitado) &&
                                                !guest.isColado
                                            }
                                            className="w-full border-b border-current/10 bg-transparent px-4 py-3 text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                            style={{ fontSize: "16px" }}
                                        />
                                    )}

                                    <div className="border-b border-current/10 px-4 py-3">
                                        <label className="mb-2 block text-[11px] font-medium tracking-wide text-inherit/55">
                                            {fields.dietary}
                                        </label>
                                        <select
                                            value={guest.dietary}
                                            onChange={(e) =>
                                                updateGuest(
                                                    index,
                                                    "dietary",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full bg-transparent text-sm tracking-wide text-inherit/80 focus:outline-none"
                                            style={{ fontSize: "16px" }}
                                        >
                                            {fields.dietaryOptions.map(
                                                (opt) => (
                                                    <option
                                                        key={opt}
                                                        value={opt}
                                                        className="bg-primary text-primary-foreground"
                                                    >
                                                        {opt}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    {showSongRequest && (
                                        <div className="border-b border-current/10 px-4 py-3">
                                            {fields.songRequestLabel && (
                                                <label className="mb-2 block text-[11px] font-medium tracking-wide text-inherit/55">
                                                    {fields.songRequestLabel}
                                                </label>
                                            )}
                                            <input
                                                type="text"
                                                placeholder={fields.songRequest}
                                                value={guest.songRequest}
                                                onChange={(e) =>
                                                    updateGuest(
                                                        index,
                                                        "songRequest",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full bg-transparent text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none"
                                                style={{ fontSize: "16px" }}
                                            />
                                        </div>
                                    )}

                                    <div className="border-b border-current/10 px-4 py-3">
                                        <p className="mb-2 text-[11px] font-medium tracking-wide text-inherit/55">
                                            {fields.attendance}
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 text-sm tracking-wide text-inherit/80">
                                                <input
                                                    type="radio"
                                                    name={`attendance-${index}`}
                                                    value="yes"
                                                    checked={
                                                        guest.attendance ===
                                                        "yes"
                                                    }
                                                    onChange={() =>
                                                        updateGuest(
                                                            index,
                                                            "attendance",
                                                            "yes",
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-current"
                                                    required={
                                                        !guest.isColado ||
                                                        guestDisplayName(guest)
                                                            .length > 0
                                                    }
                                                />
                                                {fields.attendanceYes}
                                            </label>
                                            <label className="flex items-center gap-2 text-sm tracking-wide text-inherit/80">
                                                <input
                                                    type="radio"
                                                    name={`attendance-${index}`}
                                                    value="no"
                                                    checked={
                                                        guest.attendance ===
                                                        "no"
                                                    }
                                                    onChange={() =>
                                                        updateGuest(
                                                            index,
                                                            "attendance",
                                                            "no",
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-current"
                                                />
                                                {fields.attendanceNo}
                                            </label>
                                        </div>
                                    </div>

                                    {extraInputs.map((extraInput) => (
                                        <div
                                            key={extraInput.id}
                                            className="border-t border-current/10 px-4 py-3"
                                        >
                                            <label className="mb-2 block text-[11px] font-medium tracking-wide text-inherit/55">
                                                {extraInput.label}
                                                {extraInput.required
                                                    ? " *"
                                                    : ""}
                                            </label>
                                            <textarea
                                                ref={(el) => {
                                                    extraTextareaRefs.current[
                                                        `${index}-${extraInput.id}`
                                                    ] = el;
                                                }}
                                                placeholder={
                                                    extraInput.placeholder ||
                                                    extraInput.label
                                                }
                                                value={
                                                    guest.extraValues?.[
                                                        extraInput.label
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    updateGuestExtraValue(
                                                        index,
                                                        extraInput.label,
                                                        e.target.value,
                                                    )
                                                }
                                                onInput={(e) => {
                                                    const target =
                                                        e.currentTarget;
                                                    target.style.height =
                                                        "auto";
                                                    target.style.height = `${target.scrollHeight}px`;
                                                }}
                                                required={
                                                    Boolean(
                                                        extraInput.required,
                                                    ) &&
                                                    guest.attendance === "yes"
                                                }
                                                rows={1}
                                                className="w-full resize-none overflow-hidden bg-transparent text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none"
                                                style={{ fontSize: "16px" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Fragment>
                        );
                    })}

                    {showGroupNameField && (
                        <div>
                            <label className="mb-2 block text-[11px] font-medium tracking-[0.1em] text-inherit/65">
                                Nombre del grupo o familia{" "}
                                <span className="text-inherit/50">*</span>
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) =>
                                    setGroupName(
                                        e.target.value.slice(
                                            0,
                                            GROUP_NAME_MAX_LENGTH,
                                        ),
                                    )
                                }
                                placeholder="Ej: Flia Díaz"
                                required
                                maxLength={GROUP_NAME_MAX_LENGTH}
                                className="w-full rounded-md border border-current/15 bg-current/10 px-4 py-3 text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-current/20"
                                style={{ fontSize: "16px" }}
                            />
                        </div>
                    )}

                    {visibleColadosCupoMessage && (
                        <div className="rounded-md border border-current/15 bg-current/5 px-4 py-3">
                            <p className="text-[11px] font-medium tracking-wide text-inherit/70">
                                {maxColados === 1
                                    ? `Tenés 1 lugar adicional para sumar a 1 ${coladoWordSingular}. ¿Deseás agregarlo?`
                                    : `Tenés ${maxColados} lugares adicionales para sumar ${maxColados} ${coladoWordPlural}. ¿Deseás agregarlos?`}
                            </p>
                            <p className="mt-1 text-[11px] text-inherit/50">
                                {currentColadosCount} / {maxColados} agregado
                                {maxColados === 1 ? "" : "s"}.
                            </p>
                            {canAddMoreColados && (
                                <button
                                    type="button"
                                    onClick={handleAddColado}
                                    className="mt-3 rounded-md border border-current/25 bg-current/10 px-3 py-2 text-[11px] font-medium tracking-wide uppercase text-inherit/85 transition-colors hover:bg-current/20"
                                >
                                    + Sumar {coladoWordSingular}
                                </button>
                            )}
                        </div>
                    )}

                    {editing ? (
                        <div className="mt-1 flex w-full gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex min-h-[48px] flex-1 items-center justify-center rounded-md border border-current/25 bg-transparent px-5 py-2.5 text-center text-[11px] font-medium uppercase leading-snug tracking-[0.12em] text-inherit/75 transition-colors hover:bg-current/[0.06] sm:px-3 sm:py-3 sm:tracking-[0.2em]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || confirmEditDisabled}
                                className="flex min-h-[48px] flex-1 items-center justify-center rounded-md border border-current/25 bg-current/10 px-5 py-2.5 text-center text-[11px] font-medium uppercase leading-snug tracking-[0.12em] text-inherit/90 transition-colors hover:bg-current/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-3 sm:tracking-[0.2em]"
                            >
                                {submitting
                                    ? "Enviando..."
                                    : "Confirmar cambios"}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-1 min-h-[48px] w-full rounded-md border border-current/25 bg-current/10 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit/90 transition-colors hover:bg-current/20 disabled:opacity-50"
                        >
                            {submitting ? "Enviando..." : fields.submitButton}
                        </button>
                    )}
                </form>
            </div>
        </section>
    );
}
