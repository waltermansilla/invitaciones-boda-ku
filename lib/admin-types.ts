/** Texto libre (ej. "Boda", "Baby shower", "Corporativo"); sugerencias en el modal admin. */
export type EventType = string
export type PlanType = "Esencial" | "Premium"
export type PaymentStatus = "Pendiente" | "Señado" | "Pagado completo"
export type ProjectStatus = "En proceso" | "Terminado" | "Terminado con detalles pendientes"

export interface Client {
    id: number
    eventType: EventType
    projectName: string
    plan: PlanType
    totalPrice: number
    depositPaid: number
    estimatedPaymentDate: string
    paymentStatus: PaymentStatus
    projectStatus: ProjectStatus
    startDate: string
    deliveryDate: string
    eventDate: string // Fecha del evento (sacada del JSON del cliente)
    realInvitationLink: string
    sampleInvitationLink: string
    notes: string
}

export interface Ad {
    id: number
    startDate: string
    endDate: string
    plannedBudget: number
    actualSpent: number
    views: number
    inquiries: number
    salesGenerated: number
    notes: string
}

export interface DetectedProject {
    /** Carpeta bajo data/clientes/ */
    tipo: string
    slug: string
    name: string
    realLink: string
    sampleLink: string
    eventDate?: string // Fecha del evento desde el JSON
}

export interface AdminData {
    clients: Client[]
    ads: Ad[]
    detectedProjects?: DetectedProject[]
}

export interface Metrics {
    totalRevenue: number
    totalCollected: number // Lo que efectivamente se cobro
    totalAdSpent: number
    grossProfit: number
    averageTicket: number
    costPerClient: number
    adPercentage: number // Porcentaje de anuncios sobre ganancia
    totalClients: number
    inProgressCount: number
    completedCount: number
}

export function calculateMetrics(clients: Client[], ads: Ad[]): Metrics {
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalPrice, 0)
    
    // Lo cobrado: si es "Pagado completo" se cuenta el total, sino solo la seña
    const totalCollected = clients.reduce((sum, c) => {
        if (c.paymentStatus === "Pagado completo") {
            return sum + c.totalPrice
        }
        return sum + c.depositPaid
    }, 0)
    
    const totalAdSpent = ads.reduce((sum, a) => sum + a.actualSpent, 0)
    const grossProfit = totalCollected - totalAdSpent
    const averageTicket = clients.length > 0 ? totalRevenue / clients.length : 0
    const costPerClient = clients.length > 0 ? totalAdSpent / clients.length : 0
    const adPercentage = totalCollected > 0 ? (totalAdSpent / totalCollected) * 100 : 0
    const inProgressCount = clients.filter(c => c.projectStatus === "En proceso").length
    const completedCount = clients.filter(c => c.projectStatus === "Terminado").length

    return {
        totalRevenue,
        totalCollected,
        totalAdSpent,
        grossProfit,
        averageTicket,
        costPerClient,
        adPercentage,
        totalClients: clients.length,
        inProgressCount,
        completedCount,
    }
}

export function calculateRemaining(client: Client): number {
    // Si esta pagado completo, no hay restante
    if (client.paymentStatus === "Pagado completo") {
        return 0
    }
    return client.totalPrice - client.depositPaid
}
