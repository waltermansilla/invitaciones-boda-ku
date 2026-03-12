"use client"

import { useState } from "react"
import type { Ad } from "@/lib/admin-types"
import { Plus, Pencil, Trash2, X } from "lucide-react"

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
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short"
    })
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("es-AR").format(value)
}

export function AdsTable({ ads, onUpdate, onAdd, onDelete }: AdsTableProps) {
    const [editingAd, setEditingAd] = useState<Ad | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

    const sortedAds = [...ads].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )

    const totals = ads.reduce((acc, ad) => ({
        actualSpent: acc.actualSpent + ad.actualSpent,
        views: acc.views + ad.views,
        inquiries: acc.inquiries + ad.inquiries,
        salesGenerated: acc.salesGenerated + ad.salesGenerated,
    }), { actualSpent: 0, views: 0, inquiries: 0, salesGenerated: 0 })

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
                <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">Anuncios</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                    <Plus className="h-4 w-4" />
                    Nueva
                </button>
            </div>

            {/* Totales - simplificado */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-neutral-100 pb-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Gastado:</span>
                    <span className="text-sm text-neutral-600">{formatCurrency(totals.actualSpent)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Vistas:</span>
                    <span className="text-sm text-neutral-600">{formatNumber(totals.views)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Consultas:</span>
                    <span className="text-sm text-neutral-600">{formatNumber(totals.inquiries)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Ventas:</span>
                    <span className="text-sm text-neutral-600">{formatNumber(totals.salesGenerated)}</span>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
                <table className="min-w-full divide-y divide-neutral-100">
                    <thead>
                        <tr className="bg-neutral-50">
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Periodo</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Gastado</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Vistas</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Consultas</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ventas</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {sortedAds.map((ad) => (
                            <tr key={ad.id} className="hover:bg-neutral-50">
                                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-600">
                                    {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900">
                                    {formatCurrency(ad.actualSpent)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                                    {formatNumber(ad.views)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                                    {formatNumber(ad.inquiries)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                                    {formatNumber(ad.salesGenerated)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingAd(ad)}
                                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        {confirmDelete === ad.id ? (
                                            <button
                                                onClick={() => {
                                                    onDelete(ad.id)
                                                    setConfirmDelete(null)
                                                }}
                                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(ad.id)}
                                                className="rounded p-1 text-neutral-300 hover:bg-neutral-100 hover:text-red-500"
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
                <div className="rounded border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
                    No hay campañas registradas
                </div>
            )}

            {/* Modal */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded border border-neutral-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-neutral-600">
                        {ad ? "Editar Campaña" : "Nueva Campaña"}
                    </h3>
                    <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Inicio</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Fin</label>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Presupuesto</label>
                            <input
                                type="number"
                                value={form.plannedBudget}
                                onChange={(e) => handleChange("plannedBudget", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Gastado</label>
                            <input
                                type="number"
                                value={form.actualSpent}
                                onChange={(e) => handleChange("actualSpent", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Vistas</label>
                            <input
                                type="number"
                                value={form.views}
                                onChange={(e) => handleChange("views", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Consultas</label>
                            <input
                                type="number"
                                value={form.inquiries}
                                onChange={(e) => handleChange("inquiries", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Ventas</label>
                            <input
                                type="number"
                                value={form.salesGenerated}
                                onChange={(e) => handleChange("salesGenerated", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Notas</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => handleChange("notes", e.target.value)}
                                rows={2}
                                className="w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
