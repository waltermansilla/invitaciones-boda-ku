"use client"

import { calculateMetrics, type Client, type Ad } from "@/lib/admin-types"

interface MetricsCardsProps {
    clients: Client[]
    ads: Ad[]
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

export function MetricsCards({ clients, ads }: MetricsCardsProps) {
    const metrics = calculateMetrics(clients, ads)

    const cards = [
        {
            label: "Facturación Total",
            value: formatCurrency(metrics.totalRevenue),
            description: "Suma de todos los proyectos",
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        {
            label: "Señas Recibidas",
            value: formatCurrency(metrics.totalDeposits),
            description: "Dinero ya cobrado",
            color: "bg-blue-50 text-blue-700 border-blue-200",
        },
        {
            label: "Pendiente de Cobro",
            value: formatCurrency(metrics.totalPending),
            description: "Restante por cobrar",
            color: "bg-amber-50 text-amber-700 border-amber-200",
        },
        {
            label: "Gastado en Anuncios",
            value: formatCurrency(metrics.totalAdSpent),
            description: "Inversión en publicidad",
            color: "bg-purple-50 text-purple-700 border-purple-200",
        },
        {
            label: "Ganancia Bruta",
            value: formatCurrency(metrics.grossProfit),
            description: "Facturación - Anuncios",
            color: metrics.grossProfit >= 0 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200",
        },
        {
            label: "Ticket Promedio",
            value: formatCurrency(metrics.averageTicket),
            description: "Precio promedio por cliente",
            color: "bg-slate-50 text-slate-700 border-slate-200",
        },
        {
            label: "Costo por Cliente",
            value: formatCurrency(metrics.costPerClient),
            description: "Anuncios / Clientes",
            color: "bg-orange-50 text-orange-700 border-orange-200",
        },
        {
            label: "Total Clientes",
            value: metrics.totalClients.toString(),
            description: `${metrics.inProgressCount} en proceso, ${metrics.completedCount} terminados`,
            color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Métricas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className={`rounded-lg border p-4 ${card.color}`}
                    >
                        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                            {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                        <p className="mt-1 text-xs opacity-70">{card.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
