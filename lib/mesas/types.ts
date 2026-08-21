export type MesaEstadoAsiento = "pendiente" | "confirmado" | "no_asiste"

export type MesaSeatKind = "integrante" | "invitado"

/** Persona asignable a una mesa (integrante o titular persona). */
export type MesaSeatPerson = {
  seatKey: string
  kind: MesaSeatKind
  nombre: string
  estado: MesaEstadoAsiento
  /** Nombre del grupo (familia) si aplica. */
  grupo?: string
  invitadoId: string
  integranteId?: string
}

export type MesaRecord = {
  id: string
  numero: number
  nombre: string
  capacidad: number
  orden: number
  /** Croquis: 0–100 */
  posX: number
  posY: number
}

export type MesaAsientoRecord = {
  mesaId: string
  seatKey: string
  orden: number
}

export type MesasPlanPayload = {
  mesas: MesaRecord[]
  asientos: MesaAsientoRecord[]
}

export function seatKeyIntegrante(integranteId: string): string {
  return `integrante:${integranteId}`
}

export function seatKeyInvitado(invitadoId: string): string {
  return `invitado:${invitadoId}`
}

export function parseSeatKey(
  seatKey: string,
): { kind: MesaSeatKind; id: string } | null {
  const i = seatKey.indexOf(":")
  if (i <= 0) return null
  const kind = seatKey.slice(0, i)
  const id = seatKey.slice(i + 1)
  if ((kind !== "integrante" && kind !== "invitado") || !id) return null
  return { kind, id }
}
