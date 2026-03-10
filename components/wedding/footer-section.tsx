"use client";

import landingConfig from "@/data/landing.json";

/* ───────────────────────────────────────────────
 * DATOS DE MARCA - Se leen desde landing.json (seccion "brand").
 * Para modificar la marca, editar landing.json -> brand
 *
 * La marca es igual en TODAS las invitaciones y en la landing.
 * Solo cambia el color de fondo que se adapta al tema de cada invitacion.
 * ─────────────────────────────────────────────── */

// Leer configuracion de marca desde landing.json
const brandConfig = (landingConfig as Record<string, unknown>).brand as {
    name: string;
    font: string;
    size: string;
    style: string;
    icon: string | null;
    socialLinks: { icon: "instagram" | "whatsapp"; url: string; label: string }[];
    iconSize: number;
} | undefined;

// Fallback values si no existe la config en landing.json
const BRAND_NAME = brandConfig?.name || "Momento Único";
const BRAND_FONT = brandConfig?.font || "font-serif";
const BRAND_SIZE = brandConfig?.size || "text-lg";
const BRAND_STYLE = brandConfig?.style || "italic";
const BRAND_ICON: string | null = brandConfig?.icon || null;
const ICON_SIZE = brandConfig?.iconSize || 30;

const SOCIAL_LINKS = brandConfig?.socialLinks || [
    {
        icon: "instagram" as const,
        url: "https://instagram.com/waltermansilla.web",
        label: "Instagram",
    },
    { icon: "whatsapp" as const, url: "https://wa.me/3456023759", label: "WhatsApp" },
];
/* ─────────────────────────────────────────────── */

function InstagramIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

function WhatsAppIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
    );
}

const iconMap: Record<string, () => React.JSX.Element> = {
    instagram: InstagramIcon,
    whatsapp: WhatsAppIcon,
};

/**
 * Footer fijo de marca. Igual en TODAS las invitaciones y la landing.
 * El color se adapta automaticamente via CSS variables (bg-primary / text-primary-foreground).
 * Los datos de marca se leen desde landing.json -> brand
 */
export default function FooterSection() {
    return (
        <footer className="bg-primary px-6 py-16 text-center">
            <div className="mb-6 flex items-center justify-center gap-7">
                {SOCIAL_LINKS.map((link) => {
                    const Icon = iconMap[link.icon];
                    if (!Icon) return null;
                    return (
                        <a
                            key={link.icon}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center text-primary-foreground/70 transition-opacity hover:opacity-60"
                            aria-label={link.label}
                        >
                            <Icon />
                        </a>
                    );
                })}
            </div>
            <a
                href="/"
                className={`${BRAND_FONT} ${BRAND_SIZE} ${BRAND_STYLE === "italic" ? "italic" : ""} inline-flex items-center gap-2 tracking-[0.1em] text-primary-foreground/40 transition-opacity hover:text-primary-foreground/60`}
            >
                {BRAND_ICON && (
                    <img
                        src={BRAND_ICON}
                        alt=""
                        className="h-5 w-5 opacity-60"
                    />
                )}
                {BRAND_NAME}
            </a>
        </footer>
    );
}
