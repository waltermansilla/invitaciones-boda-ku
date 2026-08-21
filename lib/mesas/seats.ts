import {
  seatKeyIntegrante,
  seatKeyInvitado,
  type MesaSeatPerson,
  type MesaEstadoAsiento,
} from "./types"

type IntegranteLike = {
  id: string
  nombre: string
  estado: string
  es_colado?: boolean
}

type InvitadoLike = {
  id: string
  nombre: string
  tipo: string
  estado: string
  integrantes?: IntegranteLike[]
}

function asEstado(raw: string): MesaEstadoAsiento {
  if (raw === "confirmado" || raw === "no_asiste") return raw
  return "pendiente"
}

/**
 * Aplana invitados del panel a "personas" asignables a mesas.
 * Familia → cada integrante. Persona sola → el invitado.
 * Persona + colados → titular + cada colado.
 */
export function flattenSeatsFromInvitados(
  invitados: InvitadoLike[],
): MesaSeatPerson[] {
  const out: MesaSeatPerson[] = []
  for (const inv of invitados) {
    if (inv.tipo === "integrante") continue

    const integrantes = Array.isArray(inv.integrantes) ? inv.integrantes : []

    if (inv.tipo === "familia") {
      if (integrantes.length === 0) {
        out.push({
          seatKey: seatKeyInvitado(inv.id),
          kind: "invitado",
          nombre: inv.nombre,
          estado: asEstado(inv.estado),
          grupo: inv.nombre,
          invitadoId: inv.id,
        })
        continue
      }
      for (const int of integrantes) {
        out.push({
          seatKey: seatKeyIntegrante(int.id),
          kind: "integrante",
          nombre: int.nombre,
          estado: asEstado(int.estado),
          grupo: inv.nombre,
          invitadoId: inv.id,
          integranteId: int.id,
        })
      }
      continue
    }

    // persona
    out.push({
      seatKey: seatKeyInvitado(inv.id),
      kind: "invitado",
      nombre: inv.nombre,
      estado: asEstado(inv.estado),
      invitadoId: inv.id,
    })
    for (const int of integrantes) {
      out.push({
        seatKey: seatKeyIntegrante(int.id),
        kind: "integrante",
        nombre: int.nombre,
        estado: asEstado(int.estado),
        grupo: inv.nombre,
        invitadoId: inv.id,
        integranteId: int.id,
      })
    }
  }

  const collator = new Intl.Collator("es", { sensitivity: "base" })
  return out.sort((a, b) => collator.compare(a.nombre, b.nombre))
}

/** Mismos tonos que el panel de invitados. */
export const MESA_ESTADO_COLORS = {
  confirmado: { bg: "#d4edda", text: "#155724", border: "#bcdac4", dot: "#155724" },
  pendiente: { bg: "#f5f5f5", text: "#888888", border: "#e5e5e5", dot: "#888888" },
  no_asiste: { bg: "#f5d5d5", text: "#8b6b6b", border: "#e8c4c4", dot: "#8b6b6b" },
} as const

export function estadoSeatStyle(estado: MesaEstadoAsiento): {
  backgroundColor: string
  color: string
  borderColor: string
} {
  const c = MESA_ESTADO_COLORS[estado] || MESA_ESTADO_COLORS.pendiente
  return {
    backgroundColor: c.bg,
    color: c.text,
    borderColor: c.border,
  }
}

export function estadoSeatDotColor(estado: MesaEstadoAsiento): string {
  return (MESA_ESTADO_COLORS[estado] || MESA_ESTADO_COLORS.pendiente).dot
}

/** @deprecated preferí estadoSeatStyle; se mantiene por clases utilitarias. */
export function estadoSeatClass(estado: MesaEstadoAsiento): string {
  if (estado === "confirmado") {
    return "bg-[#d4edda] text-[#155724] border-[#bcdac4]"
  }
  if (estado === "no_asiste") {
    return "bg-[#f5d5d5] text-[#8b6b6b] border-[#e8c4c4]"
  }
  return "bg-[#f5f5f5] text-[#888] border-[#e5e5e5]"
}

export function estadoSeatDotClass(estado: MesaEstadoAsiento): string {
  if (estado === "confirmado") return "bg-[#155724]"
  if (estado === "no_asiste") return "bg-[#8b6b6b]"
  return "bg-[#888]"
}

export function estadoSeatLabel(estado: MesaEstadoAsiento): string {
  if (estado === "confirmado") return "Confirmado"
  if (estado === "no_asiste") return "No asiste"
  return "Pendiente"
}
