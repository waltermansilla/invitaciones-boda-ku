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
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg text-gray-500">Cargando...</div>
            </div>
        )
    }

    const tabs = [
        { id: "dashboard" as const, label: "Dashboard" },
        { id: "clients" as const, label: "Clientes" },
        { id: "quick" as const, label: "Acceso Rápido" },
        { id: "ads" as const, label: "Anuncios" },
    ]

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                            <p className="text-sm text-gray-500">Momento Único</p>
                        </div>
                        <ExcelActions data={data} onImport={handleImport} />
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "border-b-2 border-gray-900 text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
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
