import type { Metadata } from "next"
import type { EventConfig } from "@/lib/config-loader"
import { coupleNamesDisplayPair } from "@/lib/couple-names-display-order"

export const BASE_LINKS_SUBTITLE =
  "Desde acá podés abrir tu invitación, enviarla por WhatsApp y acceder al panel de invitados, sin tener que buscar links sueltos."

function joinCoupleDisplayNames(coupleNames: Record<string, unknown>): string {
  const brideName =
    typeof coupleNames.brideName === "string" ? coupleNames.brideName.trim() : ""
  const groomName =
    typeof coupleNames.groomName === "string" ? coupleNames.groomName.trim() : ""
  const separator =
    typeof coupleNames.separator === "string" && coupleNames.separator.trim()
      ? coupleNames.separator.trim()
      : "&"
  const order = coupleNames.nameOrder as "bride-first" | "groom-first" | undefined
  const { first, second } = coupleNamesDisplayPair(
    brideName,
    groomName,
    order,
  )
  return [first, second].filter(Boolean).join(` ${separator} `)
}

export function autoBaseEventTitle(config: EventConfig): string {
  return baseEventLabel(config, " - ")
}

function baseEventLabel(config: EventConfig, tipoSeparator: string): string {
  const tipo = (config.tipo || "").trim().toLowerCase()
  const meta = (config.meta || {}) as Record<string, unknown>
  const coupleNames =
    (meta.coupleNames as Record<string, unknown> | undefined) || {}
  const xvNameFromCouple =
    typeof coupleNames.name === "string" ? coupleNames.name.trim() : ""
  const quinceaneraName =
    typeof meta.quinceaneraName === "string" ? meta.quinceaneraName.trim() : ""

  if (tipo === "boda") {
    const names = joinCoupleDisplayNames(coupleNames)
    return names ? `Boda${tipoSeparator}${names}` : "Boda"
  }
  if (tipo === "xv") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `XV${tipoSeparator}${name}` : "XV"
  }
  if (tipo === "baby") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `Baby Shower${tipoSeparator}${name}` : "Baby Shower"
  }
  if (tipo === "cumple") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `Cumple${tipoSeparator}${name}` : "Cumple"
  }
  const names = joinCoupleDisplayNames(coupleNames)
  return names ? `Evento${tipoSeparator}${names}` : "Evento"
}

function metadataEventTitle(config: EventConfig): string {
  return baseEventLabel(config, " ")
}

export function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://momentounico.com.ar"
  ).replace(/\/+$/, "")
}

function baseMetadataDescription(config: EventConfig): string {
  const hasPanel = Boolean(
    config.rsvpPanel?.enabled && config.rsvpPanel?.panelId?.trim(),
  )
  if (hasPanel) {
    return "Ingresá para ver tu invitación y gestionar tus invitados"
  }
  return "Abrí y compartí tu invitación digital desde un solo lugar."
}

export function buildBaseLinksMetadata(
  config: EventConfig,
  token: string,
): Metadata {
  const siteUrl = getPublicSiteUrl()
  const eventTitle = metadataEventTitle(config)
  const title = `Tu perfil del evento - ${eventTitle}`
  const description = baseMetadataDescription(config)
  const canonicalUrl = `${siteUrl}/base/${encodeURIComponent(token)}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Momento Único",
      locale: "es_AR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}
