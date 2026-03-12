"use client"

import { useRef } from "react"
import { Download, Upload } from "lucide-react"
import * as XLSX from "xlsx"
import type { AdminData, Client, Ad } from "@/lib/admin-types"

interface ExcelActionsProps {
    data: AdminData | null
    onImport: (data: AdminData) => void
}

export function ExcelActions({ data, onImport }: ExcelActionsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = () => {
        if (!data) return

        const wb = XLSX.utils.book_new()

        // Hoja de Clientes
        const clientsData = data.clients.map((c) => ({
            ID: c.id,
            "Tipo Evento": c.eventType,
            "Nombre Proyecto": c.projectName,
            Plan: c.plan,
            "Precio Total": c.totalPrice,
            "Seña Pagada": c.depositPaid,
            "Estado Pago": c.paymentStatus,
            "Estado Proyecto": c.projectStatus,
            "Fecha Evento": c.eventDate || "",
            "Fecha Inicio": c.startDate,
            "Fecha Entrega": c.deliveryDate,
            "Link Real": c.realInvitationLink,
            "Link Muestra": c.sampleInvitationLink,
            Notas: c.notes,
        }))
        const clientsSheet = XLSX.utils.json_to_sheet(clientsData)
        XLSX.utils.book_append_sheet(wb, clientsSheet, "Clientes")

        // Hoja de Anuncios
        const adsData = data.ads.map((a) => ({
            ID: a.id,
            "Fecha Inicio": a.startDate,
            "Fecha Fin": a.endDate,
            "Presupuesto": a.plannedBudget,
            "Gastado": a.actualSpent,
            Vistas: a.views,
            Consultas: a.inquiries,
            Ventas: a.salesGenerated,
            Notas: a.notes,
        }))
        const adsSheet = XLSX.utils.json_to_sheet(adsData)
        XLSX.utils.book_append_sheet(wb, adsSheet, "Anuncios")

        const fileName = `admin-${new Date().toISOString().split("T")[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = event.target?.result
                const wb = XLSX.read(data, { type: "binary" })

                const clientsSheet = wb.Sheets["Clientes"]
                const clientsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(clientsSheet)
                const clients: Client[] = clientsRaw.map((row) => ({
                    id: Number(row["ID"]) || 0,
                    eventType: (row["Tipo Evento"] as Client["eventType"]) || "Boda",
                    projectName: String(row["Nombre Proyecto"] || ""),
                    plan: (row["Plan"] as Client["plan"]) || "Esencial",
                    totalPrice: Number(row["Precio Total"]) || 0,
                    depositPaid: Number(row["Seña Pagada"]) || 0,
                    estimatedPaymentDate: String(row["Fecha Est. Pago"] || ""),
                    paymentStatus: (row["Estado Pago"] as Client["paymentStatus"]) || "Pendiente",
                    projectStatus: (row["Estado Proyecto"] as Client["projectStatus"]) || "En proceso",
                    startDate: String(row["Fecha Inicio"] || ""),
                    deliveryDate: String(row["Fecha Entrega"] || ""),
                    eventDate: String(row["Fecha Evento"] || ""),
                    realInvitationLink: String(row["Link Real"] || ""),
                    sampleInvitationLink: String(row["Link Muestra"] || ""),
                    notes: String(row["Notas"] || ""),
                }))

                const adsSheet = wb.Sheets["Anuncios"]
                const adsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(adsSheet)
                const ads: Ad[] = adsRaw.map((row) => ({
                    id: Number(row["ID"]) || 0,
                    startDate: String(row["Fecha Inicio"] || ""),
                    endDate: String(row["Fecha Fin"] || ""),
                    plannedBudget: Number(row["Presupuesto"]) || 0,
                    actualSpent: Number(row["Gastado"]) || 0,
                    views: Number(row["Vistas"]) || 0,
                    inquiries: Number(row["Consultas"]) || 0,
                    salesGenerated: Number(row["Ventas"]) || 0,
                    notes: String(row["Notas"] || ""),
                }))

                onImport({ clients, ads })
                alert("Importado correctamente")
            } catch (error) {
                console.error("Error importing Excel:", error)
                alert("Error al importar")
            }
        }
        reader.readAsBinaryString(file)

        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExport}
                disabled={!data}
                className="inline-flex items-center gap-2 rounded border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
                <Download className="h-3 w-3" />
                Excel
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                <Upload className="h-3 w-3" />
                Importar
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                />
            </label>
        </div>
    )
}
