/** Imágenes del paso Panel del configurador (reutilizables en base / upsell). */

export const PANEL_SHOWCASE_MAIN = {
    src: "/landing/media/images/panel.PNG",
    alt: "Ejemplo del panel de invitados",
} as const;

export const PANEL_SHOWCASE_NAMED_INVITE = {
    src: "/landing/media/images/panel-invitacion-nombre.jpg",
    alt: "Invitación personalizada con el nombre del invitado",
} as const;

export const PANEL_SHOWCASE_FAMILY = {
    src: "/landing/media/images/panel-familia-detalle.jpg",
    alt: "Detalle de familia e integrantes en el panel",
} as const;

export const PANEL_SHOWCASE_PDF_HEADER = {
    src: "/landing/media/images/panel-pdf-header.jpg",
    alt: "Botón para descargar el resumen PDF del panel",
    width: 868,
    height: 501,
} as const;

export const PANEL_SHOWCASE_PDF_TABLE = {
    src: "/landing/media/images/panel-pdf-tabla.jpg",
    alt: "Ejemplo de resumen PDF con lista de invitados",
    width: 1024,
    height: 499,
} as const;

export const PANEL_SHOWCASE_FRAME = {
    portrait: { width: 132, height: 220 },
    /** Primera imagen (panel.PNG) en upsell base — más grande, sin marco. */
    mainPlain: { width: 188, height: 312 },
    family: { width: 228 },
} as const;
