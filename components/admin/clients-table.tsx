"use client"

import { useState } from "react"
import { 
    type Client, 
    type DetectedProject,
    type EventType, 
    type PlanType, 
    type PaymentStatus, 
    type ProjectStatus,
    calculateRemaining 
} from "@/lib/admin-types"
import { ClientModal } from "./client-modal"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"

interface ClientsTableProps {
    clients: Client[]
    detectedProjects: DetectedProject[]
    onUpdate: (client: Client) => void
    onAdd: (client: Omit<Client, "id">) => void
    onDelete: (id: number) => void
}

const paymentStatusColors: Record<PaymentStatus, string> = {
    "Pendiente": "bg-red-100 text-red-700",
    "Señado": "bg-amber-100 text-amber-700",
    "Pagado completo": "bg-green-100 text-green-700",
}

const projectStatusColors: Record<ProjectStatus, string> = {
    "En proceso": "bg-blue-100 text-blue-700",
    "Terminado": "bg-green-100 text-green-700",
    "Terminado con detalles pendientes": "bg-amber-100 text-amber-700",
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

export function ClientsTable({ clients, detectedProjects, onUpdate, onAdd, onDelete }: ClientsTableProps) {
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

    // Ordenar: En proceso primero, luego por ID desc
    const sortedClients = [...clients].sort((a, b) => {
        const statusOrder: Record<ProjectStatus, number> = {
            "En proceso": 0,
            "Terminado con detalles pendientes": 1,
            "Terminado": 2,
        }
        const statusDiff = statusOrder[a.projectStatus] - statusOrder[b.projectStatus]
        if (statusDiff !== 0) return statusDiff
        return b.id - a.id
    })

    // Proyectos detectados que no estan en la lista de clientes
    const unregisteredProjects = detectedProjects.filter(
        dp => !clients.some(c => 
            c.realInvitationLink === dp.realLink || 
            c.realInvitationLink.includes(dp.slug)
        )
    )

    const handleSave = (client: Client | Omit<Client, "id">) => {
        if ("id" in client) {
            onUpdate(client)
        } else {
            onAdd(client)
        }
        setEditingClient(null)
        setIsAdding(false)
    }

    const handleAddFromDetected = (project: DetectedProject) => {
        const newClient: Omit<Client, "id"> = {
            eventType: project.tipo === "boda" ? "Boda" : "XV",
            projectName: project.name,
            plan: "Esencial",
            totalPrice: 0,
            depositPaid: 0,
            estimatedPaymentDate: "",
            paymentStatus: "Pendiente",
            projectStatus: "En proceso",
            startDate: new Date().toISOString().split("T")[0],
            deliveryDate: "",
            realInvitationLink: project.realLink,
            sampleInvitationLink: project.sampleLink,
            notes: "Agregado automaticamente desde archivos detectados",
        }
        onAdd(newClient)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Clientes / Invitaciones</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Cliente
                </button>
            </div>

            {/* Proyectos detectados no registrados */}
            {unregisteredProjects.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="mb-2 text-sm font-medium text-blue-800">
                        Proyectos detectados sin registrar ({unregisteredProjects.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {unregisteredProjects.map((project) => (
                            <button
                                key={project.slug}
                                onClick={() => handleAddFromDetected(project)}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                            >
                                <Plus className="h-3 w-3" />
                                {project.name} ({project.tipo})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Proyecto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Precio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Seña</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Restante</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pago</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Links</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedClients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                    {client.id}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">{client.projectName}</div>
                                    <div className="text-xs text-gray-500">{client.eventType}</div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {client.plan}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(client.totalPrice)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(client.depositPaid)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-amber-600">
                                    {formatCurrency(calculateRemaining(client))}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${paymentStatusColors[client.paymentStatus]}`}>
                                        {client.paymentStatus}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${projectStatusColors[client.projectStatus]}`}>
                                        {client.projectStatus === "Terminado con detalles pendientes" ? "Con detalles" : client.projectStatus}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex gap-1">
                                        {client.realInvitationLink && (
                                            <a
                                                href={client.realInvitationLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                title="Ver invitación real"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingClient(client)}
                                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                            title="Editar"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        {confirmDelete === client.id ? (
                                            <button
                                                onClick={() => {
                                                    onDelete(client.id)
                                                    setConfirmDelete(null)
                                                }}
                                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                                title="Confirmar eliminación"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(client.id)}
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

            {/* Modal de edición */}
            {(editingClient || isAdding) && (
                <ClientModal
                    client={editingClient}
                    onSave={handleSave}
                    onClose={() => {
                        setEditingClient(null)
                        setIsAdding(false)
                    }}
                />
            )}
        </div>
    )
}
