import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import LandingPageHome, {
    type LandingData,
} from "@/components/landing/landing-page-home";
import landingHomeDataEn from "@/data/landing/landing-2.en.json";
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
    title: "Momento Único | Digital wedding invitations",
    description:
        "Elegant digital invitations for weddings and events. Choose your style and share your link.",
    // Intentional: the landing exposes no preview image (og:image / twitter:image)
    // so sharing the link (WhatsApp, Instagram, etc.) shows no invitation thumbnail.
    openGraph: {
        title: "Momento Único | Digital wedding invitations",
        description:
            "Elegant digital invitations for weddings and events. Choose your style and share your link.",
        type: "website",
        images: [],
    },
    twitter: {
        card: "summary",
        title: "Momento Único | Digital wedding invitations",
        description:
            "Elegant digital invitations for weddings and events. Choose your style and share your link.",
        images: [],
    },
};

export default async function LandingEnPage({
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
                landingData={landingHomeDataEn as LandingData}
                language="en"
                syncCurrencyFromSearch
                initialCurrency={initialCurrency}
            />
        </div>
    );
}
