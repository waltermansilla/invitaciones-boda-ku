/** Fecha amigable para el mail (ej. 5 de agosto de 2026). */
export function formatExpiresFriendly(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export const DEFAULT_UNICO_MESSAGE = `Muchas gracias por rellenar el cuestionario. Eso me ayuda a entender mejor las necesidades de quienes estan planificando sus bodas y asi ofrecerles un mejor servicio 🤍

CUPÓN DE DESCUENTO: {{codigo}}

Para usar tu cupón de descuento, ingresa a https://momentounico.com.ar, toca "Reservar invitación". Justo antes de confirmar tu reserva, podrás ingresar tu cupón y se aplicará el {{descuento}}% de descuento sin importar el valor de tu reserva. Este cupón es de un solo uso.

Recordá que tenés tiempo hasta el {{vence}} inclusive para usarla, y con abonar la seña ya podés congelar el precio.

Suerte con tus planes 🙌🏼`

export const DEFAULT_SERIES_MESSAGES: Record<string, string> = {
  unico: DEFAULT_UNICO_MESSAGE,
}

/** Firma fija (todas las series). No se edita en el mensaje de la serie. */
export const COUPON_EMAIL_SIGNATURE_PLAIN =
  "Atentamente,\nWalter de Momento Único"

export function fillCouponMessage(
  template: string,
  opts: { codigo: string; descuento: number; vence: string | null },
): string {
  return template
    .replace(/\{\{codigo\}\}/gi, opts.codigo)
    .replace(/\{\{descuento\}\}/gi, String(opts.descuento))
    .replace(
      /\{\{vence\}\}/gi,
      opts.vence ? formatExpiresFriendly(opts.vence) : "la fecha indicada",
    )
}

/** Cuerpo listo para mailto: mensaje + salto + firma. */
export function composeCouponEmailBody(
  template: string,
  opts: { codigo: string; descuento: number; vence: string | null },
): string {
  const body = fillCouponMessage(template, opts).trimEnd()
  if (!body) return ""
  return `${body}\n\n${COUPON_EMAIL_SIGNATURE_PLAIN}`
}
