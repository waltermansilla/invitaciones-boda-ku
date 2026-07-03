import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import LandingPageHome, {
    type LandingData,
} from "@/components/landing/landing-page-home";
import landingHomeData from "@/data/landing/landing-2.json";
import { landingCurrencyFromSearchParam } from "@/lib/landing/landing-public";

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
    // Intencional: la landing no expone imagen de preview (og:image / twitter:image)
    // para que al compartir el link (WhatsApp, Instagram, etc.) no aparezca ninguna
    // imagen de invitación como miniatura.
    openGraph: {
        title: "Momento Único | Invitaciones digitales",
        description:
            "Invitaciones digitales elegantes para bodas, XV y eventos. Elegí tu estilo y compartí tu link.",
        type: "website",
        images: [],
    },
    twitter: {
        card: "summary",
        title: "Momento Único | Invitaciones digitales",
        description:
            "Invitaciones digitales elegantes para bodas, XV y eventos. Elegí tu estilo y compartí tu link.",
        images: [],
    },
};

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ currency?: string | string[] }>;
}) {
    const sp = await searchParams;
    const initialCurrency = landingCurrencyFromSearchParam(sp.currency);

    return (
        <div
            className={`landing-home-shell ${landingPriceFont.variable} ${landingHeroTitleFont.variable}`}
        >
            <LandingPageHome
                landingData={landingHomeData as LandingData}
                language="es"
                syncCurrencyFromSearch
                initialCurrency={initialCurrency}
            />
        </div>
    );
}
