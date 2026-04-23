import type { Metadata } from "next";
import { Suspense } from "react";
import { getClientConfig, getAllClientParams } from "@/lib/get-client-config";
import { ConfigProvider } from "@/lib/config-context";
import WeddingInvitation from "@/components/wedding/wedding-invitation";

interface PageProps {
    params: Promise<{ tipo: string; slug: string }>;
    searchParams: Promise<{ v?: string }>;
}

function getPublicSiteUrl() {
    return (
        process.env.NEXT_PUBLIC_SITE_URL || "https://momentounico.com.ar"
    ).replace(/\/+$/, "");
}

function resolveOgImage(config: ReturnType<typeof getClientConfig>) {
    const heroImage =
        typeof config.hero?.coupleImage === "string"
            ? config.hero.coupleImage
            : null;
    if (!heroImage) return null;
    if (/^https?:\/\//i.test(heroImage)) return heroImage;
    return `${getPublicSiteUrl()}${heroImage.startsWith("/") ? heroImage : `/${heroImage}`}`;
}

export async function generateMetadata({
    params,
    searchParams,
}: PageProps): Promise<Metadata> {
    const { tipo, slug } = await params;
    const { v } = await searchParams;
    const config = getClientConfig(tipo, slug, v);
    const siteUrl = getPublicSiteUrl();
    const canonicalUrl = `${siteUrl}/m/${tipo}/${slug}`;
    const ogImage = resolveOgImage(config);

    return {
        title: `${config.meta.title} - Muestra`,
        description: config.meta.description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: `${config.meta.title} - Muestra`,
            description: config.meta.description,
            url: canonicalUrl,
            type: "website",
            images: ogImage
                ? [{ url: ogImage, width: 1200, height: 630 }]
                : undefined,
        },
        twitter: {
            card: ogImage ? "summary_large_image" : "summary",
            title: `${config.meta.title} - Muestra`,
            description: config.meta.description,
            images: ogImage ? [ogImage] : undefined,
        },
    };
}

export function generateStaticParams() {
    return getAllClientParams();
}

export default async function MuestraPage({ params, searchParams }: PageProps) {
    const { tipo, slug } = await params;
    const { v } = await searchParams;
    const config = getClientConfig(tipo, slug, v);

    return (
        <ConfigProvider config={config} isMuestra={true}>
            <Suspense fallback={null}>
                <WeddingInvitation />
            </Suspense>
        </ConfigProvider>
    );
}
