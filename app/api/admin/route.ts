import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { AdminData, DetectedProject } from "@/lib/admin-types"
import {
  displayNameFromClientJson,
  listClienteTipoDirNames,
} from "@/lib/client-json-helpers"

const DATA_PATH = path.join(process.cwd(), "data", "admin", "admin.json")
const CLIENTS_PATH = path.join(process.cwd(), "data", "clientes")

function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/i, "").replace(/^\d+-/, "")
}

async function getAdminData(): Promise<AdminData> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8")
    return JSON.parse(data)
  } catch {
    return { clients: [], ads: [] }
  }
}

// Detecta automaticamente los proyectos en data/clientes/*/
async function detectProjects(): Promise<DetectedProject[]> {
  const projects: DetectedProject[] = []

  try {
    for (const tipo of listClienteTipoDirNames()) {
      const tipoPath = path.join(CLIENTS_PATH, tipo)
      let files: string[]
      try {
        files = await fs.readdir(tipoPath)
      } catch {
        continue
      }
      for (const file of files) {
        if (!file.endsWith(".json") || file.startsWith("_")) continue
        try {
          const slug = slugFromFileName(file)
          const filePath = path.join(tipoPath, file)
          const content = await fs.readFile(filePath, "utf-8")
          const json = JSON.parse(content) as Record<string, unknown>
          const name = displayNameFromClientJson(json)
          const hero = json.hero as { eventDate?: string } | undefined
          const eventDate = hero?.eventDate ? hero.eventDate.split("T")[0] : ""
          projects.push({
            tipo,
            slug,
            name: name || slug,
            realLink: `/${tipo}/${slug}`,
            sampleLink: `/m/${tipo}/${slug}`,
            eventDate,
          })
        } catch {
          /* ignore bad json */
        }
      }
    }
  } catch (error) {
    console.error("Error detecting projects:", error)
  }

  return projects
}

export async function GET() {
  const adminData = await getAdminData()
  const detectedProjects = await detectProjects()

  return NextResponse.json({
    ...adminData,
    detectedProjects,
  })
}
