import type { Metadata } from "next"
import LandingTdyPage, { type LandingTdyData } from "@/components/landing/landing-tdy-page"
import landingTdyData from "@/data/landing-tdy.json"
import landingTdyDataEn from "@/data/landing-tdy.en.json"

export const metadata: Metadata = {
  title: "Momento Único | Invitaciones digitales",
  description: "Invitaciones digitales elegantes para bodas, XV y eventos. Elegí tu estilo y compartí tu link.",
}

export default function LandingTdyRoutePage() {
  return (
    <LandingTdyPage dataEs={landingTdyData as LandingTdyData} dataEn={landingTdyDataEn as LandingTdyData} />
  )
}
