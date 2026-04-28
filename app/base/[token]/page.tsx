import { notFound } from "next/navigation"
import type { Viewport } from "next"
import {
  findConfigByBaseToken,
  invitationAccessTokenFromConfig,
  invitationPublicPathFromConfig,
  panelVariantesFromConfig,
} from "@/lib/config-loader"
import { BaseLinksClient } from "./base-links-client"

export const dynamic = "force-dynamic"
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#111111",
}

const DEFAULT_BASE_SUBTITLE =
  "Desde esta base podés entrar rápido a cada versión de la invitación y al panel de invitados, sin tener que buscar links sueltos."

interface PageProps {
  params: Promise<{ token: string }>
}

function autoInvitationTitle(config: ReturnType<typeof findConfigByBaseToken>) {
  const tipo = (config?.tipo || "").trim().toLowerCase()
  const meta = (config?.meta || {}) as Record<string, unknown>
  const coupleNames =
    (meta.coupleNames as Record<string, unknown> | undefined) || {}
  const brideName =
    typeof coupleNames.brideName === "string" ? coupleNames.brideName.trim() : ""
  const groomName =
    typeof coupleNames.groomName === "string" ? coupleNames.groomName.trim() : ""
  const separator =
    typeof coupleNames.separator === "string" && coupleNames.separator.trim()
      ? coupleNames.separator.trim()
      : "&"
  const xvNameFromCouple =
    typeof coupleNames.name === "string" ? coupleNames.name.trim() : ""
  const quinceaneraName =
    typeof meta.quinceaneraName === "string" ? meta.quinceaneraName.trim() : ""

  if (tipo === "xv") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `XV de ${name}` : "XV"
  }
  if (tipo === "boda") {
    const names = [brideName, groomName].filter(Boolean).join(` ${separator} `)
    return names ? `Boda ${names}` : "Boda"
  }
  if (tipo === "baby") {
    return "Baby Shower"
  }
  if (tipo === "cumple") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `Cumple de ${name}` : "Cumple"
  }
  const fallbackNames = [brideName, groomName].filter(Boolean).join(` ${separator} `)
  return fallbackNames ? `Invitación ${fallbackNames}` : "Invitación"
}

function autoBaseTitle(config: ReturnType<typeof findConfigByBaseToken>) {
  const tipo = (config?.tipo || "").trim().toLowerCase()
  const meta = (config?.meta || {}) as Record<string, unknown>
  const coupleNames =
    (meta.coupleNames as Record<string, unknown> | undefined) || {}
  const brideName =
    typeof coupleNames.brideName === "string" ? coupleNames.brideName.trim() : ""
  const groomName =
    typeof coupleNames.groomName === "string" ? coupleNames.groomName.trim() : ""
  const separator =
    typeof coupleNames.separator === "string" && coupleNames.separator.trim()
      ? coupleNames.separator.trim()
      : "&"
  const xvNameFromCouple =
    typeof coupleNames.name === "string" ? coupleNames.name.trim() : ""
  const quinceaneraName =
    typeof meta.quinceaneraName === "string" ? meta.quinceaneraName.trim() : ""

  if (tipo === "boda") {
    const names = [brideName, groomName].filter(Boolean).join(` ${separator} `)
    return names ? `Boda - ${names}` : "Boda"
  }
  if (tipo === "xv") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `XV - ${name}` : "XV"
  }
  if (tipo === "baby") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `Baby Shower - ${name}` : "Baby Shower"
  }
  if (tipo === "cumple") {
    const name = xvNameFromCouple || quinceaneraName
    return name ? `Cumple - ${name}` : "Cumple"
  }
  const names = [brideName, groomName].filter(Boolean).join(` ${separator} `)
  return names ? `Evento - ${names}` : "Evento"
}

function buildUrl(path: string, query?: Record<string, string | null | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(query || {})) {
    if (typeof v === "string" && v.trim()) q.set(k, v.trim())
  }
  const qs = q.toString()
  return qs ? `${path}?${qs}` : path
}

export default async function BaseLinksPage({ params }: PageProps) {
  const { token } = await params
  const config = findConfigByBaseToken(token)
  if (!config) notFound()

  const invitationPath = invitationPublicPathFromConfig(config)
  const invitationToken = invitationAccessTokenFromConfig(config)
  const panelId = config.rsvpPanel?.panelId?.trim() || ""
  const { variantes } = panelVariantesFromConfig(config)
  const primaryColorRaw = (config.theme as Record<string, unknown> | undefined)?.primaryColor
  const primaryColor =
    typeof primaryColorRaw === "string" && primaryColorRaw.trim()
      ? primaryColorRaw.trim()
      : "#7A5F45"

  const title = autoBaseTitle(config)
  const subtitle =
    config.base?.subtitle?.trim() || DEFAULT_BASE_SUBTITLE
  const hasCustomVariants = variantes.length > 1
  const singleInvitationTitle = autoInvitationTitle(config)

  const invitationItems = invitationPath
    ? variantes.map((variant) => ({
        id: `inv-${variant.id}`,
        label:
          !hasCustomVariants && variant.id === "default"
            ? singleInvitationTitle
            : variant.label,
        url: buildUrl(invitationPath, {
          t: invitationToken,
          v:
            variant.id === "default"
              ? undefined
              : variant.invitationVariant || variant.id,
        }),
        allowSend: true,
      }))
    : []

  const panelItems = panelId
    ? [
        {
          id: "panel-default",
          label: "Panel de invitados",
          url: `/panel/${panelId}`,
          allowSend: false,
        },
      ]
    : []

  return (
    <BaseLinksClient
      title={title}
      subtitle={subtitle}
      primaryColor={primaryColor}
      invitationItems={invitationItems}
      panelItems={panelItems}
    />
  )
}
