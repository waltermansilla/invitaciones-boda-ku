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

export function QuickAccess({ clients }: QuickAccessProps) {
    const sortedClients = [...clients].sort((a, b) => {
        return statusOrder[a.projectStatus] - statusOrder[b.projectStatus]
    })

    return (
        <div className="space-y-6">
            <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">Acceso Rapido</h2>

            {/* Encabezado de columnas */}
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
                <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                    Real
                </div>
                <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                    Muestra
                </div>
            </div>

            {/* Lista de proyectos */}
            <div className="space-y-2">
                {sortedClients.map((client) => (
                    <div
                        key={client.id}
                        className="rounded border border-neutral-100 bg-white p-3"
                    >
                        {/* Mobile */}
                        <div className="flex flex-col gap-2 sm:hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-900">
                                    {client.projectName}
                                </span>
                                <StatusDot status={client.projectStatus} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <LinkButton href={client.realInvitationLink} label="Real" />
                                <LinkButton href={client.sampleInvitationLink} label="Muestra" secondary />
                            </div>
                        </div>

                        {/* Desktop */}
                        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
                            <LinkButton
                                href={client.realInvitationLink}
                                label={client.projectName}
                                status={client.projectStatus}
                            />
                            <LinkButton
                                href={client.sampleInvitationLink}
                                label={client.projectName}
                                secondary
                            />
                        </div>
                    </div>
                ))}
            </div>

            {clients.length === 0 && (
                <div className="rounded border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
                    No hay clientes registrados
                </div>
            )}
        </div>
    )
}

function StatusDot({ status }: { status: ProjectStatus }) {
    const colors: Record<ProjectStatus, string> = {
        "En proceso": "bg-blue-500",
        "Terminado con detalles pendientes": "bg-amber-500",
        "Terminado": "bg-green-500",
    }
    return <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
}

interface LinkButtonProps {
    href: string
    label: string
    secondary?: boolean
    status?: ProjectStatus
}

function LinkButton({ href, label, secondary, status }: LinkButtonProps) {
    if (!href) {
        return (
            <div className="flex items-center justify-center gap-2 rounded border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-400">
                Sin link
            </div>
        )
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                secondary
                    ? "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
        >
            <span className="truncate">{label}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            {status && <StatusDot status={status} />}
        </a>
    )
}
