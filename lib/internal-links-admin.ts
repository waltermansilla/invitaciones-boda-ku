import { promises as fs } from "fs"
import path from "path"

type AccessBlock = {
  tokenEnabled?: boolean
  token?: string
  tokenHash?: string
  allowLegacyUntil?: string
}

export type InternalInviteRow = {
  fileId: number | null
  tipo: string
  slug: string
  nombre: string
  eventDate: string | null
  sampleUrl: string
  realBaseUrl: string
  realUrlWithToken: string | null
  tokenEnabled: boolean
  tokenPresent: boolean
  tokenHashPresent: boolean
  allowLegacyUntil: string | null
  panelEnabled: boolean
  panelId: string | null
}

function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/i, "").replace(/^\d+-/, "")
}

function idFromFileName(fileName: string): number | null {
  const m = fileName.match(/^(\d+)-/)
  if (!m) return null
  const n = Number.parseInt(m[1], 10)
  return Number.isFinite(n) ? n : null
}

function nameFromJson(json: Record<string, unknown>, slug: string): string {
  const meta = (json.meta || {}) as Record<string, unknown>
  const couple = (meta.coupleNames || {}) as Record<string, unknown>
  const q = meta.quinceaneraName
  const b = couple.brideName
  const g = couple.groomName
  if (typeof q === "string" && q.trim()) return q.trim()
  const duo = [b, g].filter((x) => typeof x === "string" && x.trim()).join(" & ")
  return duo || slug
}

export async function listInvitationsForInternalAdmin(): Promise<InternalInviteRow[]> {
  const root = path.join(process.cwd(), "data", "clientes")
  const out: InternalInviteRow[] = []
  const tipos = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
  for (const t of tipos) {
    if (!t.isDirectory()) continue
    const tipo = t.name
    const dir = path.join(root, tipo)
    const files = await fs.readdir(dir).catch(() => [])
    for (const file of files) {
      if (!file.endsWith(".json") || file.startsWith("_")) continue
      const slug = slugFromFileName(file)
      const raw = await fs.readFile(path.join(dir, file), "utf-8").catch(() => "")
      if (!raw) continue
      try {
        const json = JSON.parse(raw) as Record<string, unknown>
        const access = (json.access || {}) as AccessBlock
        const hero = (json.hero || {}) as Record<string, unknown>
        const rsvpPanel = (json.rsvpPanel || {}) as {
          enabled?: boolean
          panelId?: string
        }
        const panelId =
          typeof rsvpPanel.panelId === "string" && rsvpPanel.panelId.trim()
            ? rsvpPanel.panelId.trim()
            : null
        const panelEnabled = Boolean(rsvpPanel.enabled) && Boolean(panelId)
        const eventDateRaw = (typeof hero.eventDate === "string" && hero.eventDate) || ""
        const eventDate = eventDateRaw ? String(eventDateRaw).slice(0, 10) : null
        const realBaseUrl = `/${tipo}/${slug}`
        const token = typeof access.token === "string" ? access.token : ""
        out.push({
          fileId: idFromFileName(file),
          tipo,
          slug,
          nombre: nameFromJson(json, slug),
          eventDate,
          sampleUrl: `/m/${tipo}/${slug}`,
          realBaseUrl,
          realUrlWithToken:
            token && /^[A-Za-z0-9]{6}$/.test(token) ? `${realBaseUrl}?k=${token}` : null,
          tokenEnabled: Boolean(access.tokenEnabled),
          tokenPresent: Boolean(token),
          tokenHashPresent: typeof access.tokenHash === "string" && access.tokenHash.length > 0,
          allowLegacyUntil:
            typeof access.allowLegacyUntil === "string" && access.allowLegacyUntil
              ? access.allowLegacyUntil
              : null,
          panelEnabled,
          panelId,
        })
      } catch {
        // ignore invalid json
      }
    }
  }
  return out.sort((a, b) => {
    const aId = a.fileId ?? Number.MAX_SAFE_INTEGER
    const bId = b.fileId ?? Number.MAX_SAFE_INTEGER
    if (aId !== bId) return aId - bId
    return `${a.tipo}/${a.slug}`.localeCompare(`${b.tipo}/${b.slug}`)
  })
}
