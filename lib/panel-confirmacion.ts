/**
 * Cómo la invitación confirma asistencia cuando hay panel (`rsvpPanel.enabled`).
 * - formulario: bloque `rsvp` + API del panel (incluye familias con integrantes).
 * - comun: bloque `confirmarWhatsapp` + mismo POST `/api/rsvp/[codigo]` antes de abrir WA (solo invitados tipo persona en el panel).
 */
export type PanelConfirmacionInvitacion = "formulario" | "comun"

export function panelConfirmacionFromConfig(
    raw: string | undefined,
): PanelConfirmacionInvitacion {
    return raw === "comun" ? "comun" : "formulario"
}

export function rsvpFormUsesPanelApi(
    rsvpPanel: { enabled?: boolean; confirmacion?: string } | undefined,
): boolean {
    return (
        Boolean(rsvpPanel?.enabled) &&
        panelConfirmacionFromConfig(rsvpPanel.confirmacion) === "formulario"
    )
}

export function confirmarComunUsesPanelApi(
    rsvpPanel: { enabled?: boolean; confirmacion?: string } | undefined,
): boolean {
    return (
        Boolean(rsvpPanel?.enabled) &&
        panelConfirmacionFromConfig(rsvpPanel.confirmacion) === "comun"
    )
}
