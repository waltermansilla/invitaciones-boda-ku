import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import MetaPixelPageView from "@/components/analytics/meta-pixel-page-view";
import "./globals.css";

const _playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: "Momento Único | Invitaciones Digitales",
    description: "Invitaciones digitales para bodas, XV y eventos especiales.",
    manifest: "/manifest.json",
    other: {
        "facebook-domain-verification": "k3cml5epxptco67r97d2ypxvd0jr51",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

    return (
        <html lang="es">
            <body className="font-sans antialiased">
                {children}
                {metaPixelId && (
                    <>
                        <Script id="meta-pixel" strategy="afterInteractive">
                            {`
                            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
                            'script','https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${metaPixelId}');
                            fbq('track', 'PageView');
                            `}
                        </Script>
                        <noscript>
                            <img
                                height="1"
                                width="1"
                                style={{ display: "none" }}
                                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                                alt=""
                            />
                        </noscript>
                        <Suspense fallback={null}>
                            <MetaPixelPageView />
                        </Suspense>
                    </>
                )}
                <Analytics />
            </body>
        </html>
    );
}
