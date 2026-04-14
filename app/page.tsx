import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import LandingTdyPage, {
    type LandingTdyData,
} from "@/components/landing/landing-tdy-page";
import landingTdyData from "@/data/landing-tdy.json";
import landingTdyDataEn from "@/data/landing-tdy.en.json";

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
            className={`landing-tdy-shell ${landingPriceFont.variable} ${landingHeroTitleFont.variable}`}
        >
            <LandingTdyPage
                dataEs={landingTdyData as LandingTdyData}
                dataEn={landingTdyDataEn as LandingTdyData}
                syncLocaleFromSearch
            />
        </div>
    );
}
