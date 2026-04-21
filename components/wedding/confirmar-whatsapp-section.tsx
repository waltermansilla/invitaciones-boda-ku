"use client"

import { useEffect, useState } from "react"
import { useIsMuestra } from "@/lib/config-context"

/** Datos mínimos del invitado (panel + link con ?c=) para mostrar nombre en la sección. */
interface InvitadoPanelShort {
  nombre: string
  tipo: "persona" | "familia"
  estado?: "pendiente" | "confirmado" | "no_asiste"
  integrantes?: {
    id: string
    nombre: string
    estado?: "pendiente" | "confirmado" | "no_asiste"
  }[]
}

/**
 * Seccion simple de confirmacion por WhatsApp (Plan Base).
 * Sin formulario: solo un boton que abre WhatsApp con un mensaje predefinido.
 *
 * Configurable desde JSON:
 *   title           -> Titulo de la seccion
 *   subtitle        -> (OPCIONAL) Texto entre titulo y boton (ej: "Confirmar antes del 15 de marzo")
 *   buttonText      -> Texto del boton
 *   whatsappNumber  -> Numero sin +, sin espacios (ej: "3456023759")
 *   message         -> Mensaje que se envia (default: "Confirmo mi asistencia")
 *
 * Opcional — `rsvpPanel.confirmacion: "comun"` + `?c=` en la URL:
 *   panelSync       -> GET del invitado para mostrar nombre (como en RSVP), y POST antes de abrir WA.
 */
interface ConfirmarWhatsappSectionProps {
  title: string
  subtitle?: string
  buttonText: string
  whatsappNumber: string
  message: string
  noAsiste?: {
    enabled: boolean
    buttonText: string
    message: string
  }
  panelSync?: {
    codigo: string
    confirmationMessage?: string
  }
}

export default function ConfirmarWhatsappSection({
  title,
  subtitle,
  buttonText,
  whatsappNumber,
  message,
  noAsiste,
  panelSync,
}: ConfirmarWhatsappSectionProps) {
  const isMuestra = useIsMuestra()
  const [submitting, setSubmitting] = useState<"si" | "no" | null>(null)
  const [invitadoPanel, setInvitadoPanel] = useState<InvitadoPanelShort | null>(
    null,
  )
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!panelSync?.codigo) return
    let cancelled = false
    fetch(`/api/rsvp/${panelSync.codigo}`)
      .then((res) => res.json())
      .then((data: { invitado?: InvitadoPanelShort }) => {
        if (cancelled || !data.invitado) return
        setInvitadoPanel(data.invitado)
        const yaConfirmo =
          data.invitado.estado !== "pendiente" ||
          Boolean(
            data.invitado.integrantes?.some((int) => int.estado !== "pendiente"),
          )
        if (yaConfirmo && !editing) {
          setAlreadyConfirmed(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [panelSync?.codigo, editing])

  const openWa = (msg: string) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`
    window.open(url, "_blank")
  }

  const handleClick = async (msg: string, asiste: boolean) => {
    if (isMuestra) {
      alert("Modo muestra: en la version real, esto registra en el panel (si aplica) y abre WhatsApp.")
      return
    }

    if (panelSync?.codigo) {
      setSubmitting(asiste ? "si" : "no")
      try {
        const res = await fetch(`/api/rsvp/${panelSync.codigo}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asiste }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          invitado?: InvitadoPanelShort
        }
        if (!res.ok) {
          throw new Error(data.error || "No se pudo registrar la confirmación")
        }
        if (data.invitado) setInvitadoPanel(data.invitado)
        setSubmitted(true)
        setAlreadyConfirmed(true)
        setEditing(false)
        return
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error al registrar confirmación")
        return
      } finally {
        setSubmitting(null)
      }
    }

    openWa(msg)
  }

  const handleEdit = () => {
    setEditing(true)
    setAlreadyConfirmed(false)
    setSubmitted(false)
  }

  if (panelSync?.codigo && (alreadyConfirmed || submitted) && !editing) {
    const confirmMsg =
      panelSync.confirmationMessage || "Gracias por confirmar tu asistencia!"
    return (
      <section className="px-6 py-16 text-center">
        <h2 className="mb-4 text-3xl font-semibold tracking-[0.15em] text-inherit/90">
          {isMuestra ? "Modo muestra" : "Gracias!"}
        </h2>
        <p className="text-sm tracking-wide text-inherit/65">{confirmMsg}</p>
        {invitadoPanel && (
          <div className="mt-6 rounded-xl border border-current/15 bg-current/5 px-5 py-4 text-left">
            {invitadoPanel.tipo === "familia" && invitadoPanel.integrantes ? (
              <div className="space-y-2">
                {invitadoPanel.integrantes.map((int, i) => (
                  <div
                    key={`${int.id || i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-inherit/80">{int.nombre}</span>
                    <span
                      className={`text-xs font-medium ${int.estado === "confirmado" ? "text-green-600" : int.estado === "no_asiste" ? "text-red-500" : "text-inherit/50"}`}
                    >
                      {int.estado === "confirmado"
                        ? "Asiste"
                        : int.estado === "no_asiste"
                          ? "No asiste"
                          : "Pendiente"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-inherit/80">{invitadoPanel.nombre}</span>
                <span
                  className={`text-xs font-medium ${invitadoPanel.estado === "confirmado" ? "text-green-600" : invitadoPanel.estado === "no_asiste" ? "text-red-500" : "text-inherit/50"}`}
                >
                  {invitadoPanel.estado === "confirmado"
                    ? "Asiste"
                    : invitadoPanel.estado === "no_asiste"
                      ? "No asiste"
                      : "Pendiente"}
                </span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleEdit}
          className="mt-6 text-xs font-medium tracking-wider text-inherit/50 underline underline-offset-4 transition-colors hover:text-inherit/80"
        >
          Editar mi confirmación
        </button>
      </section>
    )
  }

  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      {invitadoPanel && (
        <div className="mx-auto mb-8 w-full max-w-sm rounded-2xl border border-current/20 bg-current/5 px-6 py-5 md:max-w-md">
          <h3 className="text-lg font-semibold uppercase tracking-[0.15em] text-inherit/80">
            {invitadoPanel.nombre}
          </h3>
          <p className="mt-1 text-sm font-light tracking-wide text-inherit/60">
            {invitadoPanel.tipo === "familia" && invitadoPanel.integrantes
              ? `Hay ${invitadoPanel.integrantes.length} lugares reservados para ustedes`
              : "Hay un lugar reservado para ti"}
          </p>
        </div>
      )}
      <h2 className="mb-3 text-xl font-semibold tracking-[0.2em] uppercase text-inherit/90 md:text-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mb-6 max-w-sm text-sm font-light leading-relaxed opacity-70">
          {subtitle}
        </p>
      )}
      <div className={`flex flex-col gap-3 ${!subtitle ? "mt-3" : ""}`}>
        <button
          type="button"
          onClick={() => handleClick(message, true)}
          disabled={submitting !== null}
          className="inline-flex min-h-[48px] items-center rounded-full border border-current/40 px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase text-inherit transition-opacity hover:bg-current/10 disabled:opacity-50"
        >
          {submitting === "si" ? "Registrando…" : buttonText}
        </button>
        {noAsiste?.enabled && (
          <button
            type="button"
            onClick={() => handleClick(noAsiste.message, false)}
            disabled={submitting !== null}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-2 text-[10px] font-light tracking-[0.15em] uppercase text-inherit/60 transition-opacity hover:text-inherit/80 disabled:opacity-50"
          >
            {submitting === "no" ? "Registrando…" : noAsiste.buttonText}
          </button>
        )}
      </div>
    </section>
  )
}
