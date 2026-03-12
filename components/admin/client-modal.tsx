"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { 
    Client, 
    EventType, 
    PlanType, 
    PaymentStatus, 
    ProjectStatus 
} from "@/lib/admin-types"

interface ClientModalProps {
    client: Client | null
    onSave: (client: Client | Omit<Client, "id">) => void
    onClose: () => void
}

const eventTypes: EventType[] = ["Boda", "XV", "Otro"]
const planTypes: PlanType[] = ["Esencial", "Premium"]
const paymentStatuses: PaymentStatus[] = ["Pendiente", "Señado", "Pagado completo"]
const projectStatuses: ProjectStatus[] = ["En proceso", "Terminado", "Terminado con detalles pendientes"]

export function ClientModal({ client, onSave, onClose }: ClientModalProps) {
    const [form, setForm] = useState({
        eventType: client?.eventType || "Boda" as EventType,
        projectName: client?.projectName || "",
        plan: client?.plan || "Esencial" as PlanType,
        totalPrice: client?.totalPrice || 0,
        depositPaid: client?.depositPaid || 0,
        estimatedPaymentDate: client?.estimatedPaymentDate || "",
        paymentStatus: client?.paymentStatus || "Pendiente" as PaymentStatus,
        projectStatus: client?.projectStatus || "En proceso" as ProjectStatus,
        startDate: client?.startDate || new Date().toISOString().split("T")[0],
        deliveryDate: client?.deliveryDate || "",
        realInvitationLink: client?.realInvitationLink || "",
        sampleInvitationLink: client?.sampleInvitationLink || "",
        notes: client?.notes || "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (client) {
            onSave({ ...form, id: client.id })
        } else {
            onSave(form)
        }
    }

    const handleChange = (field: string, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {client ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Nombre del proyecto */}
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Nombre del proyecto
                            </label>
                            <input
                                type="text"
                                value={form.projectName}
                                onChange={(e) => handleChange("projectName", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Tipo de evento */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Tipo de evento
                            </label>
                            <select
                                value={form.eventType}
                                onChange={(e) => handleChange("eventType", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            >
                                {eventTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Plan */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Plan contratado
                            </label>
                            <select
                                value={form.plan}
                                onChange={(e) => handleChange("plan", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            >
                                {planTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Precio total */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Precio total
                            </label>
                            <input
                                type="number"
                                value={form.totalPrice}
                                onChange={(e) => handleChange("totalPrice", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Seña pagada */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Seña pagada
                            </label>
                            <input
                                type="number"
                                value={form.depositPaid}
                                onChange={(e) => handleChange("depositPaid", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Fecha estimada de pago */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Fecha estimada pago restante
                            </label>
                            <input
                                type="date"
                                value={form.estimatedPaymentDate}
                                onChange={(e) => handleChange("estimatedPaymentDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Estado de pago */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Estado de pago
                            </label>
                            <select
                                value={form.paymentStatus}
                                onChange={(e) => handleChange("paymentStatus", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            >
                                {paymentStatuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Estado del proyecto */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Estado del proyecto
                            </label>
                            <select
                                value={form.projectStatus}
                                onChange={(e) => handleChange("projectStatus", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            >
                                {projectStatuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha de inicio */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Fecha de inicio
                            </label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Fecha de entrega */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Fecha de entrega
                            </label>
                            <input
                                type="date"
                                value={form.deliveryDate}
                                onChange={(e) => handleChange("deliveryDate", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Link invitación real */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Link invitación real
                            </label>
                            <input
                                type="text"
                                value={form.realInvitationLink}
                                onChange={(e) => handleChange("realInvitationLink", e.target.value)}
                                placeholder="/boda/nombre"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Link invitación muestra */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Link invitación muestra
                            </label>
                            <input
                                type="text"
                                value={form.sampleInvitationLink}
                                onChange={(e) => handleChange("sampleInvitationLink", e.target.value)}
                                placeholder="/m/boda/nombre"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                        </div>

                        {/* Notas */}
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Notas
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => handleChange("notes", e.target.value)}
                                rows={3}
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
