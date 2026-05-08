/** Posición vertical al abrir `/configurador` desde la home (restaurar al volver). */
export const MU_LANDING_RETURN_SCROLL_KEY = "mu-landing-return-scroll";

/**
 * Flag de que el configurador se abrió desde la landing (captura click en home).
 * "Cerrar" usa `history.back()` para que el siguiente "atrás" del navegador sea coherente.
 */
export const MU_CONFIG_FROM_LANDING_KEY = "mu-config-from-landing-history";
