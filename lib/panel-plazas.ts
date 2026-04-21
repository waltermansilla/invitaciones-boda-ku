/** Fila mínima para contar plazas (persona = 1; familia = cantidad de integrantes, mínimo 1). */
export type InvitadoPlazasRow = {
    id?: string
    tipo?: string | null
    integrantes?: unknown[] | null
}

export function plazasDeUnInvitado(inv: InvitadoPlazasRow): number {
    if (inv.tipo === "familia") {
        const k = Array.isArray(inv.integrantes) ? inv.integrantes.length : 0
        return k > 0 ? k : 1
    }
    return 1
}

export function plazasOcupadasPorInvitados(invitados: InvitadoPlazasRow[]): number {
    return invitados.reduce((acc, inv) => acc + plazasDeUnInvitado(inv), 0)
}

/** Plazas que ocupa un alta nueva (POST) según tipo e integrantes enviados. */
export function plazasDelAltaInvitado(
    tipo: string | undefined,
    integrantes: unknown[] | undefined,
): number {
    if (tipo === "familia") {
        const k = Array.isArray(integrantes) ? integrantes.length : 0
        return k > 0 ? k : 1
    }
    return 1
}

/** `limiteInvitados` en JSON del cliente: entero ≥ 1; ausente o inválido = sin tope. */
export function limiteInvitadosPanelFromConfig(
    rsvpPanel: { limiteInvitados?: number } | undefined,
): number | null {
    const n = rsvpPanel?.limiteInvitados
    if (typeof n !== "number" || !Number.isFinite(n)) return null
    const f = Math.floor(n)
    return f >= 1 ? f : null
}
