export type MesaEstadoAsiento = "pendiente" | "confirmado" | "no_asiste"

export type MesaSeatKind = "integrante" | "invitado"

/** Persona asignable a una mesa (integrante o titular persona). */
export type MesaSeatPerson = {
  seatKey: string
  kind: MesaSeatKind
  nombre: string
  estado: MesaEstadoAsiento
  grupo?: string
  invitadoId: string
  integranteId?: string
}

export type MesaForma = "redonda" | "cuadrada"

/** mesa = sillas; objeto = mueble/espacio gris; pista = pista de baile. */
export type MesaTipo = "mesa" | "objeto" | "pista"

export type MesaRecord = {
  id: string
  numero: number
  nombre: string
  /** Sillas (mesa) o escala visual (objeto/pista). 0–15. */
  capacidad: number
  orden: number
  posX: number
  posY: number
  forma: MesaForma
  tipo: MesaTipo
  /** Grados, 0–360. */
  rotacion?: number
  /** Escala de alto (mesa cuadrada). Si falta, usa capacidad. */
  escalaY?: number
  /** Cantidad de sillas fijada a mano (cuadrada). */
  sillasFijas?: number
  /** Posiciones de sillas relativas al cluster. */
  chairPts?: { x: number; y: number }[]
}

export function normalizeMesaForma(raw: unknown): MesaForma {
  if (raw === "cuadrada" || raw === "rectangular") return "cuadrada"
  return "redonda"
}

export function normalizeMesaTipo(raw: unknown): MesaTipo {
  if (raw === "objeto" || raw === "pista" || raw === "mesa") return raw
  return "mesa"
}

export type MesaAsientoRecord = {
  mesaId: string
  seatKey: string
  /** Índice de silla 0..capacidad-1 */
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
