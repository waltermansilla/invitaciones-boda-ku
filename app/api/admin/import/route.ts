import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { AdminData } from "@/lib/admin-types"

const DATA_PATH = path.join(process.cwd(), "data", "admin.json")

// POST - Importar datos desde Excel
export async function POST(request: NextRequest) {
    try {
        const importedData: AdminData = await request.json()

        // Validar estructura basica
        if (!importedData.clients || !importedData.ads) {
            return NextResponse.json({ error: "Invalid data structure" }, { status: 400 })
        }

        // Guardar datos
        await fs.writeFile(DATA_PATH, JSON.stringify(importedData, null, 4), "utf-8")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error importing data:", error)
        return NextResponse.json({ error: "Error importing data" }, { status: 500 })
    }
}
