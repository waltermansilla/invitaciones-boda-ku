import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { AdminData, DetectedProject } from "@/lib/admin-types"

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

// Detecta automaticamente los proyectos en data/clientes/
async function detectProjects(): Promise<DetectedProject[]> {
    const projects: DetectedProject[] = []

    try {
        // Revisar carpeta boda
        const bodaPath = path.join(CLIENTS_PATH, "boda")
        try {
            const bodaFiles = await fs.readdir(bodaPath)
            for (const file of bodaFiles) {
                if (file.endsWith(".json") && !file.startsWith("_")) {
                    const slug = slugFromFileName(file)
                    const filePath = path.join(bodaPath, file)
                    const content = await fs.readFile(filePath, "utf-8")
                    const json = JSON.parse(content)
                    const name = json.meta?.coupleNames
                        ? `${json.meta.coupleNames.brideName} y ${json.meta.coupleNames.groomName}`
                        : slug
                    // Extraer fecha del evento desde hero.eventDate
                    const eventDate = json.hero?.eventDate 
                        ? json.hero.eventDate.split("T")[0] 
                        : ""
                    projects.push({
                        tipo: "boda",
                        slug,
                        name,
                        realLink: `/boda/${slug}`,
                        sampleLink: `/m/boda/${slug}`,
                        eventDate,
                    })
                }
            }
        } catch {
            // Carpeta no existe
        }

        // Revisar carpeta xv
        const xvPath = path.join(CLIENTS_PATH, "xv")
        try {
            const xvFiles = await fs.readdir(xvPath)
            for (const file of xvFiles) {
                if (file.endsWith(".json") && !file.startsWith("_")) {
                    const slug = slugFromFileName(file)
                    const filePath = path.join(xvPath, file)
                    const content = await fs.readFile(filePath, "utf-8")
                    const json = JSON.parse(content)
                    const name = json.meta?.coupleNames?.brideName || slug
                    // Extraer fecha del evento desde hero.eventDate
                    const eventDate = json.hero?.eventDate 
                        ? json.hero.eventDate.split("T")[0] 
                        : ""
                    projects.push({
                        tipo: "xv",
                        slug,
                        name,
                        realLink: `/xv/${slug}`,
                        sampleLink: `/m/xv/${slug}`,
                        eventDate,
                    })
                }
            }
        } catch {
            // Carpeta no existe
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
