/**
 * Helpers que usan el filesystem (solo servidor).
 * Funciones puras: `client-helpers-shared.ts`.
 */

import fs from "fs"
import path from "path"

export {
  displayNameFromClientJson,
  eventTypeLabelFromFolderTipo,
  invitationPathFromPanelIdSlug,
} from "./client-helpers-shared"

/** Nombres de carpeta: una carpeta por tipo bajo data/clientes/ */
export function listClienteTipoDirNames(): string[] {
  const root = path.join(process.cwd(), "data", "clientes")
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
}

/**
 * Si el panel_id es `{slug}-{tipo}` y `tipo` es carpeta real en data/clientes/.
 */
export function inferInvitationPathFromPanelId(panelId: string): string | null {
  const last = panelId.lastIndexOf("-")
  if (last <= 0) return null
  const slug = panelId.slice(0, last)
  const tipo = panelId.slice(last + 1)
  if (!slug || !tipo) return null
  if (!listClienteTipoDirNames().includes(tipo)) return null
  return `/${tipo}/${slug}`
}
