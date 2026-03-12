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

    return (
        <div className="space-y-8">
            {/* Metricas principales - grandes y destacadas */}
            <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                        Ganancia
                    </p>
                    <p className={`mt-2 text-3xl font-light tracking-tight ${metrics.grossProfit >= 0 ? "text-neutral-900" : "text-red-600"}`}>
                        {formatCurrency(metrics.grossProfit)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                        Cobrado - Anuncios
                    </p>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                        Gasto Anuncios
                    </p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
                        {formatCurrency(metrics.totalAdSpent)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                        {metrics.adPercentage.toFixed(1)}% del cobrado
                    </p>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                        Proyectos
                    </p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
                        {metrics.totalClients}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                        {metrics.inProgressCount} en proceso
                    </p>
                </div>
            </div>

            {/* Metricas secundarias - pequeñas, discretas */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-neutral-100 pt-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Precio promedio:</span>
                    <span className="text-sm text-neutral-600">{formatCurrency(metrics.averageTicket)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Anuncio por cliente:</span>
                    <span className="text-sm text-neutral-600">{formatCurrency(metrics.costPerClient)}</span>
                    <span className="text-xs text-neutral-400">
                        ({metrics.averageTicket > 0 ? ((metrics.costPerClient / metrics.averageTicket) * 100).toFixed(1) : 0}%)
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-neutral-400">Cobrado total:</span>
                    <span className="text-sm text-neutral-600">{formatCurrency(metrics.totalCollected)}</span>
                </div>
            </div>
        </div>
    )
}
