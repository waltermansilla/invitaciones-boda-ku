"use client";

import { useSearchParams } from "next/navigation";

export const GUEST_PREVIEW_PARAM = "previewInvitado";

export function isGuestPreviewParam(value: string | null): boolean {
    return value === "1" || value === "true";
}

/** Vista previa del anfitrión: invitación con estado real del invitado, sin guardar RSVP. */
export function useGuestPreview(): boolean {
    const searchParams = useSearchParams();
    return isGuestPreviewParam(searchParams.get(GUEST_PREVIEW_PARAM));
}
