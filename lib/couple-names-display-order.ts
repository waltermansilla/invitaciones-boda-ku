/**
 * Orden visual de los nombres (sin cambiar quién es novia/novio en el JSON).
 * Por defecto: novia primero (convención actual del sitio).
 */
export type CoupleNamesDisplayOrder = "bride-first" | "groom-first";

export function coupleNamesDisplayPair(
    brideName: string,
    groomName: string,
    nameOrder?: CoupleNamesDisplayOrder,
): { first: string; second: string } {
    const b = (brideName ?? "").trim();
    const g = (groomName ?? "").trim();
    if ((nameOrder ?? "bride-first") === "groom-first") {
        return { first: g, second: b };
    }
    return { first: b, second: g };
}
