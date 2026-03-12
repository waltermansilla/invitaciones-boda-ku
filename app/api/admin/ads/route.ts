import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { AdminData, Ad } from "@/lib/admin-types"

const DATA_PATH = path.join(process.cwd(), "data", "admin.json")

async function getAdminData(): Promise<AdminData> {
    try {
        const data = await fs.readFile(DATA_PATH, "utf-8")
        return JSON.parse(data)
    } catch {
        return { clients: [], ads: [] }
    }
}

async function saveAdminData(data: AdminData): Promise<void> {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 4), "utf-8")
}

// POST - Crear nuevo anuncio
export async function POST(request: NextRequest) {
    try {
        const ad: Omit<Ad, "id"> = await request.json()
        const data = await getAdminData()

        const newId = data.ads.length > 0
            ? Math.max(...data.ads.map(a => a.id)) + 1
            : 1

        const newAd: Ad = { ...ad, id: newId }
        data.ads.push(newAd)

        await saveAdminData(data)

        return NextResponse.json(newAd, { status: 201 })
    } catch (error) {
        console.error("Error creating ad:", error)
        return NextResponse.json({ error: "Error creating ad" }, { status: 500 })
    }
}

// PUT - Actualizar anuncio
export async function PUT(request: NextRequest) {
    try {
        const updatedAd: Ad = await request.json()
        const data = await getAdminData()

        const index = data.ads.findIndex(a => a.id === updatedAd.id)
        if (index === -1) {
            return NextResponse.json({ error: "Ad not found" }, { status: 404 })
        }

        data.ads[index] = updatedAd
        await saveAdminData(data)

        return NextResponse.json(updatedAd)
    } catch (error) {
        console.error("Error updating ad:", error)
        return NextResponse.json({ error: "Error updating ad" }, { status: 500 })
    }
}

// DELETE - Eliminar anuncio
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = parseInt(searchParams.get("id") || "0")

        const data = await getAdminData()
        data.ads = data.ads.filter(a => a.id !== id)

        await saveAdminData(data)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting ad:", error)
        return NextResponse.json({ error: "Error deleting ad" }, { status: 500 })
    }
}
