/** % desde arriba donde queda el centro vertical del bloque de contenido del overlay. */
export function parseOverlayContentCenterY(
    value?: number | string | null,
): string | null {
    if (value === undefined || value === null || value === "") return null;
    const n =
        typeof value === "number"
            ? value
            : Number(String(value).trim().replace(/%$/, ""));
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return `${n}%`;
}
