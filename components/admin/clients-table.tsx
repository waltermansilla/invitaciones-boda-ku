"use client"

import { useState } from "react"
import { 
    type Client, 
    type DetectedProject,
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

const paymentStatusStyles: Record<PaymentStatus, string> = {
    "Pendiente": "text-red-600",
    "Señado": "text-amber-600",
    "Pagado completo": "text-green-600",
}

const projectStatusStyles: Record<ProjectStatus, string> = {
    "En proceso": "text-blue-600",
    "Terminado": "text-green-600",
    "Terminado con detalles pendientes": "text-amber-600",
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
        month: "short",
        year: "numeric"
    })
}

export function ClientsTable({ clients, detectedProjects, onUpdate, onAdd, onDelete }: ClientsTableProps) {
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

    // Ordenar: En proceso primero, luego por fecha de evento (mas cercano primero), luego por ID desc
    const sortedClients = [...clients].sort((a, b) => {
        const statusOrder: Record<ProjectStatus, number> = {
            "En proceso": 0,
            "Terminado con detalles pendientes": 1,
            "Terminado": 2,
        }
        const statusDiff = statusOrder[a.projectStatus] - statusOrder[b.projectStatus]
        if (statusDiff !== 0) return statusDiff
        
        // Si ambos tienen fecha de evento, ordenar por fecha
        if (a.eventDate && b.eventDate) {
            return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        }
        
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
            eventDate: project.eventDate || "",
            realInvitationLink: project.realLink,
            sampleInvitationLink: project.sampleLink,
            notes: "",
        }
        onAdd(newClient)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">Clientes</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo
                </button>
            </div>

            {/* Proyectos detectados no registrados */}
            {unregisteredProjects.length > 0 && (
                <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Proyectos sin registrar ({unregisteredProjects.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {unregisteredProjects.map((project) => (
                            <button
                                key={project.slug}
                                onClick={() => handleAddFromDetected(project)}
                                className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                            >
                                <Plus className="h-3 w-3" />
                                {project.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
                <table className="min-w-full divide-y divide-neutral-100">
                    <thead>
                        <tr className="bg-neutral-50">
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">ID</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Proyecto</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Evento</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Precio</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Restante</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Pago</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado</th>
                            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {sortedClients.map((client) => (
                            <tr key={client.id} className="hover:bg-neutral-50">
                                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-400">
                                    {client.id}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-neutral-900">{client.projectName}</div>
                                    <div className="text-[10px] text-neutral-400">{client.eventType} · {client.plan}</div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-600">
                                    {formatDate(client.eventDate)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900">
                                    {formatCurrency(client.totalPrice)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-500">
                                    {formatCurrency(calculateRemaining(client))}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className={`text-xs font-medium ${paymentStatusStyles[client.paymentStatus]}`}>
                                        {client.paymentStatus}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className={`text-xs ${projectStatusStyles[client.projectStatus]}`}>
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
                                                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => setEditingClient(client)}
                                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        {confirmDelete === client.id ? (
                                            <button
                                                onClick={() => {
                                                    onDelete(client.id)
                                                    setConfirmDelete(null)
                                                }}
                                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(client.id)}
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
