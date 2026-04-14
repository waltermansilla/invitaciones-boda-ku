import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { AdminData, Client } from "@/lib/admin-types"

const DATA_PATH = path.join(process.cwd(), "data", "admin", "admin.json")

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

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
    try {
        const client: Omit<Client, "id"> = await request.json()
        const data = await getAdminData()

        const newId = data.clients.length > 0
            ? Math.max(...data.clients.map(c => c.id)) + 1
            : 1

        const newClient: Client = { ...client, id: newId }
        data.clients.push(newClient)

        await saveAdminData(data)

        return NextResponse.json(newClient, { status: 201 })
    } catch (error) {
        console.error("Error creating client:", error)
        return NextResponse.json({ error: "Error creating client" }, { status: 500 })
    }
}

// PUT - Actualizar cliente
export async function PUT(request: NextRequest) {
    try {
        const updatedClient: Client = await request.json()
        const data = await getAdminData()

        const index = data.clients.findIndex(c => c.id === updatedClient.id)
        if (index === -1) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 })
        }

        data.clients[index] = updatedClient
        await saveAdminData(data)

        return NextResponse.json(updatedClient)
    } catch (error) {
        console.error("Error updating client:", error)
        return NextResponse.json({ error: "Error updating client" }, { status: 500 })
    }
}

// DELETE - Eliminar cliente
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = parseInt(searchParams.get("id") || "0")

        const data = await getAdminData()
        data.clients = data.clients.filter(c => c.id !== id)

        await saveAdminData(data)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting client:", error)
        return NextResponse.json({ error: "Error deleting client" }, { status: 500 })
    }
}
