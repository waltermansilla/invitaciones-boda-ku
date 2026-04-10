import type { Viewport } from "next"
import { Cormorant_Garamond, Lora } from "next/font/google"

const landingPriceFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-landing-price",
  display: "swap",
})

/** Solo hero TDY: más baja en altura que Playfair a igual tamaño em. */
const landingHeroTitleFont = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-hero",
  display: "swap",
})

/** Pantalla completa en iPhone (área segura con env(safe-area-inset-*)). La raíz (/) no usa cover. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FDFBF7",
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`landing-tdy-shell ${landingPriceFont.variable} ${landingHeroTitleFont.variable}`}>
      {children}
    </div>
  )
}
