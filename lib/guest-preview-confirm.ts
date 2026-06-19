export function guestPreviewConfirmMessage(
    stateLabel: string,
    options: { isFamilia?: boolean } = {},
): string {
    if (options.isFamilia) {
        return "Estás por cambiar el estado de los invitados. Verás el estado nuevo en tu Panel. ¿Estás seguro que deseás continuar?";
    }
    return `Estás por cambiar el estado del invitado a '${stateLabel}'. Verás el estado nuevo en tu Panel. ¿Estás seguro que deseás continuar?`;
}

export function guestPreviewIsFamilia(
    invitado: { tipo?: string } | null | undefined,
): boolean {
    return invitado?.tipo === "familia";
}

export function guestPreviewStateLabelFromAttendance(
    guests: { attendance: string }[],
): string {
    if (guests.length === 0) return "Pendiente";
    const yesCount = guests.filter((g) => g.attendance === "yes").length;
    const noCount = guests.filter((g) => g.attendance === "no").length;
    if (yesCount === guests.length) return "Asiste";
    if (noCount === guests.length) return "No asiste";
    return "Asiste / No asiste";
}
