"use client"

import { useState } from "react"
import type { Ad } from "@/lib/admin-types"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface AdsTableProps {
    ads: Ad[]
    onUpdate: (ad: Ad) => void
    onAdd: (ad: Omit<Ad, "id">) => void
    onDelete: (id: number) => void
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("es-AR")
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("es-AR").format(value)
}

export function AdsTable({ ads, onUpdate, onAdd, onDelete }: AdsTableProps) {
    const [editingAd, setEditingAd] = useState<Ad | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

    // Ordenar por fecha mas reciente
    const sortedAds = [...ads].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )

    // Totales
    const totals = ads.reduce((acc, ad) => ({
        plannedBudget: acc.plannedBudget + ad.plannedBudget,
        actualSpent: acc.actualSpent + ad.actualSpent,
        views: acc.views + ad.views,
        inquiries: acc.inquiries + ad.inquiries,
        salesGenerated: acc.salesGenerated + ad.salesGenerated,
    }), { plannedBudget: 0, actualSpent: 0, views: 0, inquiries: 0, salesGenerated: 0 })

    const handleSave = (ad: Ad | Omit<Ad, "id">) => {
        if ("id" in ad) {
            onUpdate(ad)
        } else {
            onAdd(ad)
        }
        setEditingAd(null)
        setIsAdding(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Campañas de Anuncios</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Campaña
                </button>
            </div>

            {/* Resumen de totales */}
            <div className="grid gap-3 sm:grid-cols-5">
                <div className="rounded-lg bg-purple-50 p-3 text-center">
                    <p className="text-xs font-medium text-purple-600">Presupuesto Total</p>
                    <p className="text-lg font-semibold text-purple-700">{formatCurrency(totals.plannedBudget)}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center">
                    <p className="text-xs font-medium text-red-600">Gastado Total</p>
                    <p className="text-lg font-semibold text-red-700">{formatCurrency(totals.actualSpent)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xs font-medium text-blue-600">Vistas Totales</p>
                    <p className="text-lg font-semibold text-blue-700">{formatNumber(totals.views)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-xs font-medium text-amber-600">Consultas</p>
                    <p className="text-lg font-semibold text-amber-700">{formatNumber(totals.inquiries)}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-xs font-medium text-green-600">Ventas</p>
                    <p className="text-lg font-semibold text-green-700">{formatNumber(totals.salesGenerated)}</p>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Período</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Presupuesto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gastado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vistas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Consultas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ventas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedAds.map((ad) => (
                            <tr key={ad.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    <div>{formatDate(ad.startDate)}</div>
                                    <div className="text-xs text-gray-500">a {formatDate(ad.endDate)}</div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(ad.plannedBudget)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-red-600">
                                    {formatCurrency(ad.actualSpent)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatNumber(ad.views)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatNumber(ad.inquiries)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-green-600">
                                    {formatNumber(ad.salesGenerated)}
                                </td>
                                <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-500" title={ad.notes}>
                                    {ad.notes || "-"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingAd(ad)}
                                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                            title="Editar"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        {confirmDelete === ad.id ? (
                                            <button
                                                onClick={() => {
                                                    onDelete(ad.id)
                                                    setConfirmDelete(null)
                                                }}
                                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                                title="Confirmar eliminación"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(ad.id)}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {ads.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No hay campañas de anuncios registradas
                </div>
            )}

            {/* Modal de edición */}
            {(editingAd || isAdding) && (
                <AdModal
                    ad={editingAd}
                    onSave={handleSave}
                    onClose={() => {
                        setEditingAd(null)
                        setIsAdding(false)
                    }}
                />
            )}
        </div>
    )
}

// Modal para editar/crear anuncios
interface AdModalProps {
    ad: Ad | null
    onSave: (ad: Ad | Omit<Ad, "id">) => void
    onClose: () => void
}

function AdModal({ ad, onSave, onClose }: AdModalProps) {
    const [form, setForm] = useState({
        startDate: ad?.startDate || new Date().toISOString().split("T")[0],
        endDate: ad?.endDate || "",
        plannedBudget: ad?.plannedBudget || 0,
        actualSpent: ad?.actualSpent || 0,
        views: ad?.views || 0,
        inquiries: ad?.inquiries || 0,
        salesGenerated: ad?.salesGenerated || 0,
        notes: ad?.notes || "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (ad) {
            onSave({ ...form, id: ad.id })
        } else {
            onSave(form)
        }
    }

    const handleChange = (field: string, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {ad ? "Editar Campaña" : "Nueva Campaña"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha inicio</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha fin</label>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Presupuesto planeado</label>
                            <input
                                type="number"
                                value={form.plannedBudget}
                                onChange={(e) => handleChange("plannedBudget", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Dinero gastado</label>
                            <input
                                type="number"
                                value={form.actualSpent}
                                onChange={(e) => handleChange("actualSpent", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Vistas</label>
                            <input
                                type="number"
                                value={form.views}
                                onChange={(e) => handleChange("views", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Consultas</label>
                            <input
                                type="number"
                                value={form.inquiries}
                                onChange={(e) => handleChange("inquiries", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Ventas generadas</label>
                            <input
                                type="number"
                                value={form.salesGenerated}
                                onChange={(e) => handleChange("salesGenerated", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => handleChange("notes", e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
