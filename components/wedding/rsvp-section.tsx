"use client";

import { useState, useEffect, Fragment } from "react";
import { useIsMuestra } from "@/lib/config-context";

interface InvitadoData {
    id: string;
    nombre: string;
    tipo: "persona" | "familia";
    estado: "pendiente" | "confirmado" | "no_asiste";
    integrantes?: { id: string; nombre: string; estado: string; restricciones?: string }[];
    cancion?: string;
    mensaje?: string;
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
        confirmationMessage: string;
    };
}

interface GuestForm {
    id?: string;
    firstName: string;
    lastName: string;
    showLastName?: boolean;
    attendance: string;
    dietary: string;
    songRequest: string;
    extraValues?: Record<string, string>;
    panelEstado?: "pendiente" | "confirmado" | "no_asiste";
}

function buildWhatsAppMessage(template: string, guests: GuestForm[]): string {
    const lines = guests.map((g, i) => {
        const prefix = guests.length > 1 ? `${i + 1}:` : "1:";
        const attendance = g.attendance === "yes" ? "Asiste" : "No asiste";
        const fullName = `${g.firstName} ${g.lastName}`.trim();
        const detailLines: string[] = [
            `${prefix} *${fullName}*`,
            `*${attendance}*`,
        ];
        if (g.attendance === "no") return detailLines.join("\n");
        if (g.dietary && g.dietary !== "Ninguno") detailLines.push(`- Alimentacion: ${g.dietary}`);
        if (g.songRequest) detailLines.push(`- Cancion: ${g.songRequest}`);
        if (g.extraValues) {
            Object.entries(g.extraValues).forEach(([label, value]) => {
                if (value) detailLines.push(`- ${label}: ${value}`);
            });
        }
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

function applySingularPluralAdjustments(message: string, guestCount: number): string {
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
    extraInputs: { id: string; label: string; placeholder?: string; tituloPanel?: string }[],
): string | null {
    const rows: string[] = [];
    guests.forEach((guest) => {
        const fullName = `${guest.firstName} ${guest.lastName}`.trim();
        extraInputs.forEach((input) => {
            const value = guest.extraValues?.[input.label]?.trim();
            if (!value) return;
            const panelTitle = (input.tituloPanel || input.label || "").trim();
            if (!panelTitle) return;
            rows.push(
                guests.length > 1 && fullName
                    ? `${fullName} - ${panelTitle}: ${value}`
                    : `${panelTitle}: ${value}`,
            );
        });
    });
    if (rows.length === 0) return null;
    if (rows.length === 1) return rows[0];
    return rows.join(" | ");
}

export default function RSVPSection({
    title,
    deadline,
    guestCountLabel,
    guestCountOptions,
    fields,
    whatsapp,
    panel,
}: RSVPSectionProps) {
    const isMuestra = useIsMuestra();
    const [invitado, setInvitado] = useState<InvitadoData | null>(null);
    const [guestCount, setGuestCount] = useState(1);
    const extraInputs = fields.extraInputs ?? [];
    const showSongRequest = Boolean(fields.songRequest?.trim());
    const createEmptyExtraValues = () =>
        extraInputs.reduce<Record<string, string>>((acc, item) => {
            acc[item.label] = "";
            return acc;
        }, {});
    const [guests, setGuests] = useState<GuestForm[]>([
        { firstName: "", lastName: "", showLastName: true, attendance: "", dietary: "Ninguno", songRequest: "", extraValues: createEmptyExtraValues() },
    ]);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
    const [editing, setEditing] = useState(false);

    // Obtener datos del invitado cuando hay codigo
    useEffect(() => {
        if (panel?.enabled && panel?.codigo) {
            fetch(`/api/rsvp/${panel.codigo}`)
                .then(res => res.json())
                .then(data => {
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
                        if (inv.tipo === "familia" && inv.integrantes?.length > 0) {
                            setGuestCount(inv.integrantes.length);
                            setGuests(inv.integrantes.map((int: { id: string; nombre: string; estado: string; restricciones?: string }) => {
                                const [firstName, ...lastParts] = int.nombre.split(" ");
                                return {
                                    id: int.id,
                                    firstName,
                                    lastName: lastParts.join(" "),
                                    showLastName: lastParts.length > 0,
                                    attendance: int.estado === "confirmado" ? "yes" : int.estado === "no_asiste" ? "no" : "",
                                    dietary: int.restricciones || "Ninguno",
                                    songRequest: inv.cancion || "",
                                    extraValues: createEmptyExtraValues(),
                                    panelEstado:
                                        int.estado === "confirmado"
                                            ? "confirmado"
                                            : int.estado === "no_asiste"
                                              ? "no_asiste"
                                              : "pendiente",
                                };
                            }));
                        } else if (inv.tipo === "persona") {
                            const [firstName, ...lastParts] = inv.nombre.split(" ");
                            setGuests([{
                                firstName,
                                lastName: lastParts.join(" "),
                                showLastName: lastParts.length > 0,
                                attendance: inv.estado === "confirmado" ? "yes" : inv.estado === "no_asiste" ? "no" : "",
                                dietary: "Ninguno",
                                songRequest: inv.cancion || "",
                                extraValues: createEmptyExtraValues(),
                                panelEstado:
                                    inv.estado === "confirmado"
                                        ? "confirmado"
                                        : inv.estado === "no_asiste"
                                          ? "no_asiste"
                                          : "pendiente",
                            }]);
                        }
                    }
                })
                .catch(() => {});
        }
    }, [panel?.enabled, panel?.codigo, editing, fields.extraInputs]);

    const handleGuestCountChange = (count: number) => {
        setGuestCount(count);
        const newGuests: GuestForm[] = [];
        for (let i = 0; i < count; i++) {
            newGuests.push(guests[i] || { firstName: "", lastName: "", showLastName: true, attendance: "", dietary: "Ninguno", songRequest: "", extraValues: createEmptyExtraValues() });
        }
        setGuests(newGuests);
    };

    const updateGuest = (index: number, field: keyof GuestForm, value: string) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const updateGuestExtraValue = (index: number, label: string, value: string) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isMuestra) { setSubmitted(true); return; }
        const songSummary = buildSongRequestSummary(guests);
        const panelExtraSummary = buildPanelExtraSummary(guests, extraInputs);

        if (panel?.enabled && panel?.codigo) {
            setSubmitting(true);
            setError(null);
            try {
                const res = await fetch(`/api/rsvp/${panel.codigo}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        integrantes: guests.map((g) => ({
                            id: g.id,
                            nombre: `${g.firstName} ${g.lastName}`,
                            asiste: g.attendance === "yes",
                            restricciones: g.dietary !== "Ninguno" ? g.dietary : null,
                        })),
                        asiste: guests.some((g) => g.attendance === "yes"),
                        mensaje: panelExtraSummary,
                        cancion: songSummary,
                    }),
                });
                const responseData = await res.json().catch(() => ({} as { error?: string; invitado?: InvitadoData }));
                if (!res.ok) {
                    throw new Error(responseData.error || "Error al enviar confirmacion");
                }
                if (responseData.invitado) {
                    setInvitado(responseData.invitado);
                }
                setSubmitted(true);
                setAlreadyConfirmed(true);
                setEditing(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al enviar confirmacion");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (
            panel?.enabled &&
            !panel?.codigo &&
            panel?.panelId &&
            panel?.allowAnonymousToPanel
        ) {
            setSubmitting(true);
            setError(null);
            try {
                const principalName = `${guests[0]?.firstName || ""} ${guests[0]?.lastName || ""}`.trim();
                const createPayload =
                    guests.length > 1
                        ? {
                              nombre: principalName || "Invitado",
                              tipo: "familia",
                              integrantes: guests.map((g) =>
                                  `${g.firstName} ${g.lastName}`.trim(),
                              ),
                          }
                        : {
                              nombre: principalName || "Invitado",
                              tipo: "persona",
                          };

                const createRes = await fetch(`/api/panel/${panel.panelId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(createPayload),
                });
                const createData = await createRes
                    .json()
                    .catch(
                        () =>
                            ({} as {
                                error?: string;
                                invitado?: InvitadoData & { codigo?: string };
                            }),
                    );
                if (!createRes.ok || !createData.invitado?.codigo) {
                    const rawMsg =
                        createData.error ||
                        "No se pudo crear el invitado en el panel";
                    const friendlyMsg = /l[ií]mite de plazas|l[ií]mite/i.test(
                        rawMsg,
                    )
                        ? "Error al registrar confirmación. Contactá con el anfitrión del evento."
                        : rawMsg;
                    throw new Error(
                        friendlyMsg,
                    );
                }

                const invitadoCreado = createData.invitado;
                const confirmRes = await fetch(
                    `/api/rsvp/${invitadoCreado.codigo}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            integrantes: guests.map((g, idx) => ({
                                id: invitadoCreado.integrantes?.[idx]?.id,
                                nombre: `${g.firstName} ${g.lastName}`.trim(),
                                asiste: g.attendance === "yes",
                                restricciones:
                                    g.dietary !== "Ninguno" ? g.dietary : null,
                            })),
                            asiste: guests.some((g) => g.attendance === "yes"),
                            mensaje: panelExtraSummary,
                            cancion: songSummary,
                        }),
                    },
                );
                const confirmData = await confirmRes
                    .json()
                    .catch(
                        () =>
                            ({} as { error?: string; invitado?: InvitadoData }),
                    );
                if (!confirmRes.ok) {
                    throw new Error(
                        confirmData.error ||
                            "Error al guardar la confirmacion en el panel",
                    );
                }
                if (confirmData.invitado) {
                    setInvitado(confirmData.invitado);
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
            return;
        }

        if (whatsapp?.number && whatsapp?.messageTemplate) {
            const everyoneDeclined = guests.length > 0 && guests.every((g) => g.attendance === "no");
            const baseMessage =
                everyoneDeclined && whatsapp.noAttendanceMessageTemplate
                    ? whatsapp.noAttendanceMessageTemplate.replace("{resumen}", buildNamesOnlySummary(guests))
                    : buildWhatsAppMessage(whatsapp.messageTemplate, guests);
            const message = applySingularPluralAdjustments(baseMessage, guests.length);
            const url = `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
            setSubmitted(true);
        } else {
            setSubmitted(true);
        }
    };

    const handleEdit = () => {
        setEditing(true);
        setAlreadyConfirmed(false);
        setSubmitted(false);
    };

    // Mostrar mensaje de confirmacion si ya confirmo o acaba de enviar
    if ((alreadyConfirmed && !editing) || submitted) {
        const confirmMsg = panel?.enabled 
            ? (panel.confirmationMessage || "Gracias por confirmar tu asistencia!")
            : (isMuestra 
                ? "Confirmacion simulada. En la version real, los datos se envian." 
                : "Tu confirmacion ha sido enviada por WhatsApp.");
        
        // Resumen de lo que confirmaron
        const resumen = invitado && (
            <div className="mt-6 rounded-xl border border-current/15 bg-current/5 px-5 py-4 text-left">
                {invitado.tipo === "familia" && invitado.integrantes ? (
                    <div className="space-y-2">
                        {invitado.integrantes.map((int, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-inherit/80">{int.nombre}</span>
                                <span className={`text-xs font-medium ${int.estado === "confirmado" ? "text-green-600" : int.estado === "no_asiste" ? "text-red-500" : "text-inherit/50"}`}>
                                    {int.estado === "confirmado" ? "Asiste" : int.estado === "no_asiste" ? "No asiste" : "Pendiente"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-inherit/80">{invitado.nombre}</span>
                        <span className={`text-xs font-medium ${invitado.estado === "confirmado" ? "text-green-600" : invitado.estado === "no_asiste" ? "text-red-500" : "text-inherit/50"}`}>
                            {invitado.estado === "confirmado" ? "Asiste" : invitado.estado === "no_asiste" ? "No asiste" : "Pendiente"}
                        </span>
                    </div>
                )}
            </div>
        );

        return (
            <section className="px-6 py-16 text-center">
                <h2 className="mb-4 text-3xl font-semibold tracking-[0.15em] text-inherit/90">
                    {isMuestra ? "Modo muestra" : "Gracias!"}
                </h2>
                <p className="text-sm tracking-wide text-inherit/65">
                    {confirmMsg}
                </p>
                {resumen}
                {panel?.enabled && (
                    <button
                        onClick={handleEdit}
                        className="mt-6 text-xs font-medium tracking-wider text-inherit/50 underline underline-offset-4 transition-colors hover:text-inherit/80"
                    >
                        Editar mi confirmacion
                    </button>
                )}
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
                                onChange={(e) => handleGuestCountChange(Number(e.target.value))}
                                className="w-full rounded-md border border-current/15 bg-current/10 px-4 py-3 text-sm tracking-wide text-inherit/90 backdrop-blur-sm"
                                style={{ fontSize: "16px" }}
                            >
                                {guestCountOptions.map((n) => (
                                    <option key={n} value={n} className="bg-primary text-primary-foreground">
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

                    {guests.map((guest, index) => (
                        <Fragment key={index}>
                            {guestCount > 1 && (
                                <p className="mt-1 text-[11px] font-semibold tracking-[0.15em] uppercase text-inherit/65">
                                    Invitado {index + 1}
                                </p>
                            )}
                            <div className="flex flex-col gap-0 overflow-hidden rounded-md border border-current/15 bg-current/10 backdrop-blur-sm">
                                <input
                                    type="text"
                                    placeholder={fields.firstName + " *"}
                                    required
                                    value={guest.firstName}
                                    onChange={(e) => updateGuest(index, "firstName", e.target.value)}
                                    disabled={Boolean(invitado)}
                                    className="w-full border-b border-current/10 bg-transparent px-4 py-3 text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                    style={{ fontSize: "16px" }}
                                />
                                {guest.showLastName !== false && (
                                    <input
                                        type="text"
                                        placeholder={
                                            invitado
                                                ? fields.lastName
                                                : fields.lastName + " *"
                                        }
                                        required={!invitado}
                                        value={guest.lastName}
                                        onChange={(e) => updateGuest(index, "lastName", e.target.value)}
                                        disabled={Boolean(invitado)}
                                        className="w-full border-b border-current/10 bg-transparent px-4 py-3 text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                        style={{ fontSize: "16px" }}
                                    />
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
                                                checked={guest.attendance === "yes"}
                                                onChange={() => updateGuest(index, "attendance", "yes")}
                                                className="h-4 w-4 accent-current"
                                                required
                                            />
                                            {fields.attendanceYes}
                                        </label>
                                        <label className="flex items-center gap-2 text-sm tracking-wide text-inherit/80">
                                            <input
                                                type="radio"
                                                name={`attendance-${index}`}
                                                value="no"
                                                checked={guest.attendance === "no"}
                                                onChange={() => updateGuest(index, "attendance", "no")}
                                                className="h-4 w-4 accent-current"
                                            />
                                            {fields.attendanceNo}
                                        </label>
                                    </div>
                                </div>

                                <div className="border-b border-current/10 px-4 py-3">
                                    <label className="mb-2 block text-[11px] font-medium tracking-wide text-inherit/55">
                                        {fields.dietary}
                                    </label>
                                    <select
                                        value={guest.dietary}
                                        onChange={(e) => updateGuest(index, "dietary", e.target.value)}
                                        className="w-full bg-transparent text-sm tracking-wide text-inherit/80 focus:outline-none"
                                        style={{ fontSize: "16px" }}
                                    >
                                        {fields.dietaryOptions.map((opt) => (
                                            <option key={opt} value={opt} className="bg-primary text-primary-foreground">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {showSongRequest && (
                                    <div className="px-4 py-3">
                                        {fields.songRequestLabel && (
                                            <label className="mb-2 block text-[11px] font-medium tracking-wide text-inherit/55">
                                                {fields.songRequestLabel}
                                            </label>
                                        )}
                                        <input
                                            type="text"
                                            placeholder={fields.songRequest}
                                            value={guest.songRequest}
                                            onChange={(e) => updateGuest(index, "songRequest", e.target.value)}
                                            className="w-full bg-transparent text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none"
                                            style={{ fontSize: "16px" }}
                                        />
                                    </div>
                                )}
                                {extraInputs.map((extraInput) => (
                                    <div key={extraInput.id} className="border-t border-current/10 px-4 py-3">
                                        <label className="mb-2 block text-[11px] font-medium tracking-wide text-inherit/55">
                                            {extraInput.label}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={extraInput.placeholder || extraInput.label}
                                            value={guest.extraValues?.[extraInput.label] || ""}
                                            onChange={(e) => updateGuestExtraValue(index, extraInput.label, e.target.value)}
                                            className="w-full bg-transparent text-sm tracking-wide text-inherit/90 placeholder:text-inherit/40 focus:outline-none"
                                            style={{ fontSize: "16px" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Fragment>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-1 min-h-[48px] w-full rounded-md border border-current/25 bg-current/10 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-inherit/90 transition-colors hover:bg-current/20 disabled:opacity-50"
                    >
                        {submitting ? "Enviando..." : fields.submitButton}
                    </button>
                </form>
            </div>
        </section>
    );
}
