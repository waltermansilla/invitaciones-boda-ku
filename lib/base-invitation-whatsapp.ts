import { eventTypeLabelFromFolderTipo } from "@/lib/client-helpers-shared";
import {
    getEventDataFromConfig,
    type EventConfig,
} from "@/lib/config-loader";

/** Mensaje genérico para enviar invitación desde la base (sin nombre de invitado). */
export function defaultBaseWhatsappMessageFromConfig(
    config: EventConfig,
): string {
    const tipo = String(config.tipo || "boda").toLowerCase();
    const { nombre_evento: nombreEvento } = getEventDataFromConfig(config);
    const eventoTexto = eventTypeLabelFromFolderTipo(tipo);

    let eventoFrase = `a nuestra ${eventoTexto}`;
    if (tipo === "boda") eventoFrase = "a nuestra boda";
    if (tipo === "xv") eventoFrase = "a mis XV";
    if (tipo === "cumple") {
        eventoFrase = `al cumple de ${nombreEvento || "nombre a definir"}`;
    }
    if (tipo === "baby") {
        eventoFrase = `al Baby Shower de ${nombreEvento || "nombre a definir"}`;
    }

    const detalleEvento = nombreEvento
        ? `${eventoTexto} ${nombreEvento} ♥️`
        : `${eventoTexto} ♥️`;

    return `¡Hola! Estás invitado/a ${eventoFrase} 🫶🏼\nIngresá al enlace para ver tu invitación:\n\n${detalleEvento}`;
}
