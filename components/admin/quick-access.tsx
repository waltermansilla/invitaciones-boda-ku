"use client"

import { ExternalLink } from "lucide-react"
import type { Client, ProjectStatus } from "@/lib/admin-types"

interface QuickAccessProps {
    clients: Client[]
}

const statusOrder: Record<ProjectStatus, number> = {
    "En proceso": 0,
    "Terminado con detalles pendientes": 1,
    "Terminado": 2,
}

const statusColors: Record<ProjectStatus, string> = {
    "En proceso": "border-blue-300 bg-blue-50",
    "Terminado con detalles pendientes": "border-amber-300 bg-amber-50",
    "Terminado": "border-green-300 bg-green-50",
}

const statusBadgeColors: Record<ProjectStatus, string> = {
    "En proceso": "bg-blue-100 text-blue-700",
    "Terminado con detalles pendientes": "bg-amber-100 text-amber-700",
    "Terminado": "bg-green-100 text-green-700",
}

export function QuickAccess({ clients }: QuickAccessProps) {
    // Ordenar por estado
    const sortedClients = [...clients].sort((a, b) => {
        return statusOrder[a.projectStatus] - statusOrder[b.projectStatus]
    })

    // Agrupar por estado
    const groupedClients = {
        "En proceso": sortedClients.filter(c => c.projectStatus === "En proceso"),
        "Terminado con detalles pendientes": sortedClients.filter(c => c.projectStatus === "Terminado con detalles pendientes"),
        "Terminado": sortedClients.filter(c => c.projectStatus === "Terminado"),
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Acceso Rápido a Invitaciones</h2>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-400"></div>
                    <span className="text-gray-600">En proceso</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <span className="text-gray-600">Con detalles pendientes</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    <span className="text-gray-600">Terminado</span>
                </div>
            </div>

            {/* Encabezado de columnas */}
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
                <div className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-600">
                    INVITACIÓN REAL
                </div>
                <div className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-600">
                    INVITACIÓN MUESTRA
                </div>
            </div>

            {/* Lista de proyectos */}
            <div className="space-y-3">
                {sortedClients.map((client) => (
                    <div
                        key={client.id}
                        className={`rounded-lg border-2 ${statusColors[client.projectStatus]} p-4`}
                    >
                        {/* Mobile: Stack vertical */}
                        <div className="flex flex-col gap-3 sm:hidden">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                    {client.projectName} - {client.eventType}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeColors[client.projectStatus]}`}>
                                    {client.projectStatus === "Terminado con detalles pendientes" ? "Detalles" : client.projectStatus}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <LinkButton
                                    href={client.realInvitationLink}
                                    label="Real"
                                    variant="primary"
                                />
                                <LinkButton
                                    href={client.sampleInvitationLink}
                                    label="Muestra"
                                    variant="secondary"
                                />
                            </div>
                        </div>

                        {/* Desktop: Two columns */}
                        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
                            <LinkButton
                                href={client.realInvitationLink}
                                label={`${client.projectName} - ${client.eventType}`}
                                variant="primary"
                                showBadge
                                status={client.projectStatus}
                            />
                            <LinkButton
                                href={client.sampleInvitationLink}
                                label={`${client.projectName} - ${client.eventType}`}
                                variant="secondary"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {clients.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No hay clientes registrados
                </div>
            )}
        </div>
    )
}

interface LinkButtonProps {
    href: string
    label: string
    variant: "primary" | "secondary"
    showBadge?: boolean
    status?: ProjectStatus
}

function LinkButton({ href, label, variant, showBadge, status }: LinkButtonProps) {
    const isDisabled = !href

    const baseStyles = "flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all"
    const variantStyles = variant === "primary"
        ? "bg-gray-900 text-white hover:bg-gray-800"
        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    const disabledStyles = "opacity-50 cursor-not-allowed"

    if (isDisabled) {
        return (
            <div className={`${baseStyles} ${variantStyles} ${disabledStyles}`}>
                <span>{label}</span>
                <span className="text-xs opacity-70">(sin link)</span>
            </div>
        )
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseStyles} ${variantStyles}`}
        >
            <span className="truncate">{label}</span>
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            {showBadge && status && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusBadgeColors[status]}`}>
                    {status === "En proceso" ? "WIP" : status === "Terminado" ? "OK" : "..."}
                </span>
            )}
        </a>
    )
}
