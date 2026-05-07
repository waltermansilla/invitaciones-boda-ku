/** Datos de deuda efectivos para el panel (respuesta GET / api + tipos cliente). */

import { PANEL_DEUDA_DATOS_COBRO } from "@/lib/panel-deuda-datos-cobro"

export type PanelDebtPagoHints = {
  alias: string
  titular: string
  banco: string
}

export function getPanelDeudaDatosCobro(): PanelDebtPagoHints {
  return { ...PANEL_DEUDA_DATOS_COBRO }
}

export type PanelDebtGatePayload = {
  deuda: boolean
  /** Monto pendiente para mostrar; null si viene inválido en JSON */
  deudaMonto: number | null
  /** Umbral de plazas ocupadas en el evento (misma cuenta que `plazasOcupadas` en la API) */
  deudaInvitados: number | null
  deudaPago: PanelDebtPagoHints
}

function coerceBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v
  if (v === "true" || v === "1") return true
  if (v === "false" || v === "0") return false
  return null
}

function coerceNonNegativeInt(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null
  const n = Math.floor(v)
  return n >= 0 ? n : null
}

function coercePositiveAmount(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null
  return v >= 0 ? v : null
}

/**
 * Interpreta campos opcionales de `rsvpPanel` desde el JSON del cliente.
 * Los datos de cobro (alias, titular, banco) no vienen del JSON: ver
 * `lib/panel-deuda-datos-cobro.ts`.
 */
export function panelDebtGateFromRsvp(
  rsvpPanel:
    | {
        deuda?: unknown
        deudaMonto?: unknown
        deudaInvitados?: unknown
      }
    | undefined,
): PanelDebtGatePayload {
  const deudaBool = coerceBool(rsvpPanel?.deuda)
  const deuda = deudaBool === true

  const deudaMonto = coercePositiveAmount(rsvpPanel?.deudaMonto)
  const deudaInvitados = coerceNonNegativeInt(rsvpPanel?.deudaInvitados)

  return {
    deuda,
    deudaMonto,
    deudaInvitados,
    deudaPago: getPanelDeudaDatosCobro(),
  }
}

/**
 * ¿Interrumpimos la acción? Solo si `deuda`, umbral válido y plazas ocupadas en el evento ≥ umbral.
 * `plazasOcupadas` es el conteo de plazas del panel (mismo criterio que `plazasOcupadas` en la API
 * y la fila “Plazas en panel”): persona=1, familia=integrantes, persona+colados=1+colados, etc.
 */
export function panelDebtShouldIntercept(
  gate: PanelDebtGatePayload | undefined,
  plazasOcupadas: number,
): boolean {
  if (!gate?.deuda) return false
  if (gate.deudaInvitados === null || gate.deudaInvitados === undefined)
    return false
  const t = gate.deudaInvitados
  if (!Number.isFinite(plazasOcupadas) || plazasOcupadas < 0) return false
  return plazasOcupadas >= t
}

export function formatDeudaMontoAr(monto: number | null | undefined): string {
  const n =
    typeof monto === "number" && Number.isFinite(monto) ? monto : Number.NaN
  if (!Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}
