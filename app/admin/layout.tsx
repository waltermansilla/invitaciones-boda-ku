import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Admin | Momento Único",
    description: "Panel de administración",
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`${inter.className} min-h-screen bg-[#FAFAFA]`}>
            {children}
        </div>
    )
}
