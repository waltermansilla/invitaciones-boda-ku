export const INVITADO_NOMBRE_MAX_LENGTH = 30;
export const FAMILIA_INTEGRANTES_MAX = 25;

export function validateInvitadoNombre(nombre: unknown): string | null {
    if (typeof nombre !== "string") return "Nombre inválido";
    const trimmed = nombre.trim();
    if (!trimmed) return "El nombre es obligatorio";
    if (trimmed.length > INVITADO_NOMBRE_MAX_LENGTH) {
        return `El nombre no puede superar ${INVITADO_NOMBRE_MAX_LENGTH} caracteres.`;
    }
    return null;
}

export function validateIntegranteNombre(nombre: unknown): string | null {
    const err = validateInvitadoNombre(nombre);
    if (!err) return null;
    if (err === "El nombre es obligatorio") {
        return "El nombre del integrante es obligatorio.";
    }
    if (err.includes("superar")) {
        return `El nombre del integrante no puede superar ${INVITADO_NOMBRE_MAX_LENGTH} caracteres.`;
    }
    return err;
}

export function validateIntegrantesNombres(integrantes: unknown): string | null {
    if (!Array.isArray(integrantes)) return null;
    for (const item of integrantes) {
        const nombre =
            typeof item === "string"
                ? item
                : (item as { nombre?: unknown } | null)?.nombre;
        const err = validateIntegranteNombre(nombre);
        if (err) return err;
    }
    return null;
}

export function validateFamiliaIntegrantesCount(
    integrantes: unknown,
): string | null {
    if (!Array.isArray(integrantes)) return null;
    if (integrantes.length > FAMILIA_INTEGRANTES_MAX) {
        return `Una familia no puede tener más de ${FAMILIA_INTEGRANTES_MAX} integrantes.`;
    }
    return null;
}

export function trimInvitadoNombre(nombre: string): string {
    return nombre.trim().slice(0, INVITADO_NOMBRE_MAX_LENGTH);
}
