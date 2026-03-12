"use client"

import { useState, useEffect } from "react"
import { MetricsCards } from "@/components/admin/metrics-cards"
import { ClientsTable } from "@/components/admin/clients-table"
import { QuickAccess } from "@/components/admin/quick-access"
import { AdsTable } from "@/components/admin/ads-table"
import { ExcelActions } from "@/components/admin/excel-actions"
import type { Client, Ad, AdminData } from "@/lib/admin-types"

export default function AdminPage() {
    const [data, setData] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"dashboard" | "clients" | "quick" | "ads">("dashboard")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin")
            const json = await res.json()
            setData(json)
        } catch (error) {
            console.error("Error fetching admin data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateClient = async (client: Client) => {
        try {
            await fetch("/api/admin/clients", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(client),
            })
            fetchData()
        } catch (error) {
            console.error("Error updating client:", error)
        }
    }

    const handleAddClient = async (client: Omit<Client, "id">) => {
        try {
            await fetch("/api/admin/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(client),
            })
            fetchData()
        } catch (error) {
            console.error("Error adding client:", error)
        }
    }

    const handleDeleteClient = async (id: number) => {
        try {
            await fetch(`/api/admin/clients?id=${id}`, {
                method: "DELETE",
            })
            fetchData()
        } catch (error) {
            console.error("Error deleting client:", error)
        }
    }

    const handleUpdateAd = async (ad: Ad) => {
        try {
            await fetch("/api/admin/ads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ad),
            })
            fetchData()
        } catch (error) {
            console.error("Error updating ad:", error)
        }
    }

    const handleAddAd = async (ad: Omit<Ad, "id">) => {
        try {
            await fetch("/api/admin/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ad),
            })
            fetchData()
        } catch (error) {
            console.error("Error adding ad:", error)
        }
    }

    const handleDeleteAd = async (id: number) => {
        try {
            await fetch(`/api/admin/ads?id=${id}`, {
                method: "DELETE",
            })
            fetchData()
        } catch (error) {
            console.error("Error deleting ad:", error)
        }
    }

    const handleImport = async (importedData: AdminData) => {
        try {
            await fetch("/api/admin/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(importedData),
            })
            fetchData()
        } catch (error) {
            console.error("Error importing data:", error)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                <div className="text-sm text-neutral-400">Cargando...</div>
            </div>
        )
    }

    const tabs = [
        { id: "dashboard" as const, label: "Inicio" },
        { id: "clients" as const, label: "Clientes" },
        { id: "quick" as const, label: "Links" },
        { id: "ads" as const, label: "Anuncios" },
    ]

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
                <div className="mx-auto max-w-5xl px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-sm font-medium uppercase tracking-widest text-neutral-900">Admin</h1>
                        </div>
                        <ExcelActions data={data} onImport={handleImport} />
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="border-b border-neutral-100 bg-white">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                                    activeTab === tab.id
                                        ? "border-b-2 border-neutral-900 text-neutral-900"
                                        : "text-neutral-400 hover:text-neutral-600"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="mx-auto max-w-5xl px-4 py-8">
                {activeTab === "dashboard" && data && (
                    <MetricsCards clients={data.clients} ads={data.ads} />
                )}

                {activeTab === "clients" && data && (
                    <ClientsTable
                        clients={data.clients}
                        detectedProjects={data.detectedProjects || []}
                        onUpdate={handleUpdateClient}
                        onAdd={handleAddClient}
                        onDelete={handleDeleteClient}
                    />
                )}

                {activeTab === "quick" && data && (
                    <QuickAccess clients={data.clients} />
                )}

                {activeTab === "ads" && data && (
                    <AdsTable
                        ads={data.ads}
                        onUpdate={handleUpdateAd}
                        onAdd={handleAddAd}
                        onDelete={handleDeleteAd}
                    />
                )}
            </main>
        </div>
    )
}
