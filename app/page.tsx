import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import LandingPageHome, {
    type LandingData,
} from "@/components/landing/landing-page-home";
import landingHomeData from "@/data/landing-2.json";
import landingHomeDataEn from "@/data/landing-2.en.json";

const landingPriceFont = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    variable: "--font-landing-price",
    display: "swap",
});

const landingHeroTitleFont = Lora({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-landing-hero",
    display: "swap",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
    themeColor: "#FDFBF7",
};

export const metadata: Metadata = {
    title: "Momento Único | Invitaciones digitales",
    description:
        "Invitaciones digitales elegantes para bodas, XV y eventos. Elegí tu estilo y compartí tu link.",
};

export default function HomePage() {
    return (
        <div
            className={`landing-home-shell ${landingPriceFont.variable} ${landingHeroTitleFont.variable}`}
        >
            <LandingPageHome
                dataEs={landingHomeData as LandingData}
                dataEn={landingHomeDataEn as LandingData}
                syncLocaleFromSearch
            />
        </div>
    );
}
