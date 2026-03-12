export type EventType = "Boda" | "XV" | "Otro"
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
    // remaining se calcula automaticamente
    estimatedPaymentDate: string
    paymentStatus: PaymentStatus
    projectStatus: ProjectStatus
    startDate: string
    deliveryDate: string
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
    tipo: "boda" | "xv"
    slug: string
    name: string
    realLink: string
    sampleLink: string
}

export interface AdminData {
    clients: Client[]
    ads: Ad[]
    detectedProjects?: DetectedProject[]
}

export interface Metrics {
    totalRevenue: number
    totalDeposits: number
    totalPending: number
    totalAdSpent: number
    grossProfit: number
    averageTicket: number
    costPerClient: number
    totalClients: number
    inProgressCount: number
    completedCount: number
}

export function calculateMetrics(clients: Client[], ads: Ad[]): Metrics {
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalPrice, 0)
    const totalDeposits = clients.reduce((sum, c) => sum + c.depositPaid, 0)
    const totalPending = clients.reduce((sum, c) => sum + (c.totalPrice - c.depositPaid), 0)
    const totalAdSpent = ads.reduce((sum, a) => sum + a.actualSpent, 0)
    const grossProfit = totalRevenue - totalAdSpent
    const averageTicket = clients.length > 0 ? totalRevenue / clients.length : 0
    const costPerClient = clients.length > 0 ? totalAdSpent / clients.length : 0
    const inProgressCount = clients.filter(c => c.projectStatus === "En proceso").length
    const completedCount = clients.filter(c => c.projectStatus === "Terminado").length

    return {
        totalRevenue,
        totalDeposits,
        totalPending,
        totalAdSpent,
        grossProfit,
        averageTicket,
        costPerClient,
        totalClients: clients.length,
        inProgressCount,
        completedCount,
    }
}

export function calculateRemaining(client: Client): number {
    return client.totalPrice - client.depositPaid
}
