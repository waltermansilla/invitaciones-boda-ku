import type { Metadata } from "next"
import LandingTdyPage, { type LandingTdyData } from "@/components/landing/landing-tdy-page"
import landingTdyData from "@/data/landing-tdy.json"
import landingTdyDataEn from "@/data/landing-tdy.en.json"

export const metadata: Metadata = {
  title: "Momento Único | Invitaciones digitales",
  description: "Invitaciones digitales elegantes para bodas, XV y eventos. Elegí tu estilo y compartí tu link.",
}

export default function Landing2Page() {
  const dataEs = structuredClone(landingTdyData) as LandingTdyData
  const dataEn = structuredClone(landingTdyDataEn) as LandingTdyData

  dataEs.header = {
    ...(dataEs.header ?? { brand: "Momento Único", nav: [] }),
    nav: [
      { label: "Inicio", anchor: "#" },
      { label: "Modelos", anchor: "#estilos" },
      { label: "Cómo funciona", anchor: "#proceso" },
      { label: "Precios", anchor: "#planes" },
    ],
  }
  dataEn.header = {
    ...(dataEn.header ?? { brand: "Momento Único", nav: [] }),
    nav: [
      { label: "Home", anchor: "#" },
      { label: "Styles", anchor: "#estilos" },
      { label: "How it works", anchor: "#proceso" },
      { label: "Pricing", anchor: "#planes" },
    ],
  }

  dataEs.sections.proceso = {
    ...dataEs.sections.proceso,
    title: "Cómo funciona la configuración",
    steps: [
      {
        number: "01",
        title: "Elegís tu plan",
        description: "Premium o Diseño único, según lo que necesites.",
        icon: "sparkles",
      },
      {
        number: "02",
        title: "Personalizás en minutos",
        description:
          "Definís secciones, idioma y extras. Si querés, tomamos uno de nuestros modelos como referencia.",
        icon: "layoutDashboard",
      },
      {
        number: "03",
        title: "Recibís tu invitación",
        description:
          "Enviás tu resumen por WhatsApp, reservás con seña y en 3 a 5 días hábiles tenés tu link listo para compartir.",
        icon: "link",
      },
    ],
  }

  dataEn.sections.proceso = {
    ...dataEn.sections.proceso,
    title: "How it works",
    steps: [
      {
        number: "01",
        title: "Pick your plan",
        description: "Choose Premium or Unique Design based on your needs.",
        icon: "sparkles",
      },
      {
        number: "02",
        title: "Customize in minutes",
        description:
          "Choose sections, language, and add-ons. You can also use one of our existing designs as your reference.",
        icon: "layoutDashboard",
      },
      {
        number: "03",
        title: "Receive your invitation",
        description:
          "Send your summary on WhatsApp, reserve with a deposit, and get your link ready to share in 3 to 5 business days.",
        icon: "link",
      },
    ],
  }

  return (
    <LandingTdyPage
      dataEs={dataEs}
      dataEn={dataEn}
      mode="landing2"
    />
  )
}

