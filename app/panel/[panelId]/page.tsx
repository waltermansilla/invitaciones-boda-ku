"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import {
    Trash2,
    Edit2,
    Plus,
    Download,
    Users,
    User,
    Check,
    X,
    Utensils,
    Music,
    MessageSquare,
    Send,
    ArrowLeftRight,
    Search,
    AlertTriangle,
    Copy,
    Eye,
} from "lucide-react";
import {
    eventTypeLabelFromFolderTipo,
    invitationPathFromPanelIdSlug,
} from "@/lib/client-helpers-shared";
import { GUEST_PREVIEW_PARAM } from "@/lib/guest-preview";
import {
    FAMILIA_INTEGRANTES_MAX,
    INVITADO_NOMBRE_MAX_LENGTH,
    trimInvitadoNombre,
    validateFamiliaIntegrantesCount,
    validateIntegranteNombre,
    validateIntegrantesNombres,
    validateInvitadoNombre,
} from "@/lib/invitado-nombre";
import {
    coladoPlural,
    coladoTitlePlural,
    coladoTitleSingular,
    normalizeColadoSingular,
} from "@/lib/colado-label";
import { DEFAULT_LIMITE_COLADOS_PANEL } from "@/lib/panel-plazas";
import { PanelPinGate } from "@/components/panel-pin-gate";
import {
    formatDeudaMontoAr,
    panelDebtGateFromRsvp,
    panelDebtShouldIntercept,
    type PanelDebtGatePayload,
} from "@/lib/panel-deuda";
import { panelExtraLinesForMember } from "@/lib/panel-a4-extras";

interface Integrante {
    id: string;
    nombre: string;
    estado: "pendiente" | "confirmado" | "no_asiste";
    restricciones?: string;
    fecha_confirmacion?: string;
    es_colado?: boolean;
}

function integrantesColadoDe(inv: Invitado): Integrante[] {
    return (inv.integrantes ?? []).filter((i) => i.es_colado);
}

function integranteNombresDe(inv: Invitado): string[] {
    return (inv.integrantes ?? []).map((i) => i.nombre);
}

function hasPanelExtraInfo(inv: Invitado): boolean {
    const names = integranteNombresDe(inv);
    if (panelExtraLinesForMember(inv.mensaje, inv.nombre, names).length) {
        return true;
    }
    return names.some((n) =>
        panelExtraLinesForMember(inv.mensaje, n, [
            inv.nombre,
            ...names.filter((x) => x !== n),
        ]).length,
    );
}

interface Invitado {
    id: string;
    nombre: string;
    codigo?: string;
    tipo: "persona" | "familia" | "integrante";
    estado: "pendiente" | "confirmado" | "no_asiste";
    pago_tarjeta?: boolean;
    confirmado_manual?: boolean;
    restricciones?: string;
    mensaje?: string;
    cancion?: string;
    fecha_confirmacion?: string;
    integrantes?: Integrante[];
    familiaId?: string;
    familiaNombre?: string;
    pago?: boolean;
    panel_variant?: string;
    cupo_colados?: number;
    registro_auto_rsvp?: boolean;
}
interface Evento {
    id: string;
    panel_id: string;
    fecha_evento?: string;
    nombre_evento?: string;
    tipo_evento?: string;
}
interface PanelTheme {
    primaryColor?: string;
    backgroundColor?: string;
}
interface PanelLabels {
    title?: string;
    totalLabel?: string;
    confirmedLabel?: string;
    pendingLabel?: string;
    declinedLabel?: string;
    paymentPending?: string;
    addGuest?: string;
    copyLink?: string;
    sendInvite?: string;
    manualConfirm?: string;
    paidButton?: string;
    unpaidButton?: string;
}
interface PanelVariantConfig {
    id: string;
    label: string;
    invitationVariant?: string;
    eventTypeLabel?: string;
    eventName?: string;
}
interface PanelData {
    evento: Evento;
    invitados: Invitado[];
    stats: { confirmados: number; noAsisten: number; pendientes: number };
    /** Ruta invitación pública, ej. `/baby/maxima` (viene de la API). */
    invitationPath?: string | null;
    /** Token de acceso público de la invitación (`?k=`), si aplica. */
    invitationToken?: string | null;
    panelConfig?: {
        theme?: PanelTheme;
        labels?: PanelLabels;
        /** Del JSON del cliente: `comun` = solo personas al agregar invitados. */
        confirmacion?: "formulario" | "comun";
        /** Tope de plazas (null = sin límite). */
        limiteInvitados?: number | null;
        plazasOcupadas?: number;
        variantes?: PanelVariantConfig[];
        defaultVariante?: string;
        activeVariante?: string;
        coladosEnabled?: boolean;
        /** Desde JSON (`rsvpPanel.coladoLabel`); plural = + "s" a cada palabra. */
        coladoLabel?: string;
        /** Máx. cupo de colados por invitado en el panel (`rsvpPanel.limiteColados`, default 5). */
        limiteColados?: number;
        deuda?: boolean;
        deudaMonto?: number | null;
        deudaInvitados?: number | null;
        /** Alias/titular/banco: solo desde código (`panel-deuda-datos-cobro`). */
        deudaPago?: {
            alias?: string;
            titular?: string;
            banco?: string;
        };
    };
}

/** Plazas ya cargadas en el evento (igual que `panelConfig.plazasOcupadas` en la API). */
function plazasOcupadasFromPanelData(
    panelConfig: PanelData["panelConfig"] | undefined,
): number {
    const n = panelConfig?.plazasOcupadas;
    if (typeof n !== "number" || !Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
}

/** Reutiliza la misma lógica que en el JSON (`rsvpPanel`) para leer desde `panelConfig` de la API. */
function debtGateFromPanelConfig(
    panelConfig: PanelData["panelConfig"] | undefined,
): PanelDebtGatePayload {
    return panelDebtGateFromRsvp(
        panelConfig
            ? {
                  deuda: panelConfig.deuda,
                  deudaMonto: panelConfig.deudaMonto ?? undefined,
                  deudaInvitados: panelConfig.deudaInvitados ?? undefined,
              }
            : undefined,
    );
}

function canTransferInvitado(inv: Invitado): boolean {
    if (inv.tipo === "integrante") return false;
    if (inv.tipo === "familia" && inv.integrantes?.length) {
        return inv.integrantes.every((int) => int.estado === "pendiente");
    }
    return inv.estado === "pendiente";
}

const fetcher = async (url: string): Promise<PanelData> => {
    const res = await fetch(url);
    const raw = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
        json = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
        throw new Error(
            !res.ok
                ? `Error HTTP ${res.status}. El servidor no devolvió JSON (¿Supabase o .env.local?).`
                : "Respuesta del servidor no es JSON válido.",
        );
    }
    if (!res.ok) {
        const msg =
            (typeof json?.error === "string" && json.error) ||
            (typeof json?.message === "string" && json.message) ||
            `HTTP ${res.status}`;
        throw new Error(msg);
    }
    if (!json) {
        throw new Error("Respuesta vacía del servidor.");
    }
    return json as unknown as PanelData;
};
const filterToEstado: Record<string, string> = {
    confirmados: "confirmado",
    pendientes: "pendiente",
    no_asiste: "no_asiste",
};
const NEW_MARK_MS = 3 * 60 * 1000;

// Helper para obtener texto del estado
const getEstadoTexto = (estado: string, plural: boolean) => {
    if (estado === "confirmado") return plural ? "Confirmados" : "Confirmado";
    if (estado === "no_asiste") return plural ? "No asisten" : "No asiste";
    return plural ? "Pendientes" : "Pendiente";
};

function parsePerMemberValues(
    raw: string | undefined,
): Record<string, string[]> {
    if (!raw) return {};
    const out: Record<string, string[]> = {};
    raw.split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((chunk) => {
            // Formato esperado:
            // 1) "Nombre Apellido: valor"
            // 2) "Nombre Apellido - Etiqueta: valor"
            const idxColon = chunk.indexOf(":");
            if (idxColon <= 0) return;
            const left = chunk.slice(0, idxColon).trim();
            const value = chunk.slice(idxColon + 1).trim();
            if (!value) return;
            const hasPanelLabel = left.includes(" - ");
            const memberName = hasPanelLabel
                ? left.split(" - ")[0].trim()
                : left;
            if (!memberName) return;
            const displayValue = hasPanelLabel
                ? `${left.split(" - ")[1]?.trim() || ""}: ${value}`.trim()
                : value;
            if (!out[memberName]) out[memberName] = [];
            out[memberName].push(displayValue);
        });
    return out;
}

export default function PanelPage({
    params,
}: {
    params: Promise<{ panelId: string }>;
}) {
    const [panelId, setPanelId] = useState<string | null>(null);
    const [filter, setFilter] = useState<
        | "todos"
        | "confirmados"
        | "pendientes"
        | "no_asiste"
        | "pago_pendiente"
        | "con_alimentacion"
        | "con_musica"
        | "con_extra"
        | "colados"
    >("todos");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(
        null,
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [panelVariant, setPanelVariant] = useState<string>("default");
    const [showLimitHelpModal, setShowLimitHelpModal] = useState(false);
    const [showUsageHelpModal, setShowUsageHelpModal] = useState(false);
    const [transferInvitado, setTransferInvitado] = useState<Invitado | null>(
        null,
    );
    const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const giftCardEnabled = true;
    const [debtModalPhase, setDebtModalPhase] = useState<
        "closed" | "summary" | "detail"
    >("closed");

    useEffect(() => {
        params.then((p) => setPanelId(p.panelId));
    }, [params]);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const pv = new URLSearchParams(window.location.search).get("pv");
        if (pv?.trim()) setPanelVariant(pv.trim());
    }, []);
    useEffect(() => {
        const id = window.setInterval(() => setNowMs(Date.now()), 10000);
        return () => window.clearInterval(id);
    }, []);
    const panelApiUrl = panelId
        ? `/api/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`
        : null;
    const { data, error, mutate } = useSWR<PanelData>(panelApiUrl, fetcher, {
        refreshInterval: 30000,
    });
    useEffect(() => {
        if (!data?.panelConfig?.activeVariante) return;
        const next = data.panelConfig.activeVariante;
        if (next !== panelVariant) {
            setPanelVariant(next);
        }
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("pv", next);
            window.history.replaceState({}, "", url.toString());
        }
    }, [data?.panelConfig?.activeVariante, panelVariant]);

    // Configuración del panel desde el JSON del cliente
    const theme = data?.panelConfig?.theme;
    const labels = data?.panelConfig?.labels;
    const primaryColor = theme?.primaryColor || "#b8a88a";
    const variantes = data?.panelConfig?.variantes || [];
    const activeVariantConfig =
        variantes.find((v) => v.id === panelVariant) ||
        variantes.find((v) => v.id === data?.panelConfig?.activeVariante) ||
        variantes[0];

    const handleChangePanelVariant = useCallback((nextVariant: string) => {
        setExpandedId(null);
        setPanelVariant(nextVariant);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("pv", nextVariant);
            window.history.replaceState({}, "", url.toString());
        }
    }, []);
    const targetVariants = variantes.filter((v) => v.id !== panelVariant);

    const handleSendInvitation = useCallback(
        (invitado: Invitado) => {
            const debtGate = debtGateFromPanelConfig(data?.panelConfig);
            const plazas = plazasOcupadasFromPanelData(data?.panelConfig);
            if (panelDebtShouldIntercept(debtGate, plazas)) {
                setDebtModalPhase("summary");
                return;
            }
            const path =
                data?.invitationPath?.trim() ||
                (panelId ? invitationPathFromPanelIdSlug(panelId) : null) ||
                "";
            const query = new URLSearchParams();
            if (data?.invitationToken?.trim()) {
                query.set("t", data.invitationToken.trim());
            }
            query.set("i", invitado.codigo || "");
            if (activeVariantConfig?.invitationVariant) {
                query.set("v", activeVariantConfig.invitationVariant);
            }
            const queryString = query.toString();
            const link = path
                ? `${window.location.origin}${path}?${queryString}`
                : `${window.location.origin}?${queryString}`;
            const tipoEvento = String(
                data?.evento?.tipo_evento || "boda",
            ).toLowerCase();
            const nombreEvento = data?.evento?.nombre_evento?.trim() || "";
            const eventoTexto =
                activeVariantConfig?.eventTypeLabel?.trim() ||
                eventTypeLabelFromFolderTipo(tipoEvento);
            const eventoNombre =
                activeVariantConfig?.eventName?.trim() || nombreEvento;
            const isGroupInvite =
                invitado.tipo === "familia" &&
                (invitado.integrantes?.length || 0) > 1;
            const invitacionTexto = isGroupInvite
                ? "Están invitados"
                : "Estás invitado/a";
            let eventoFrase = `a nuestra ${eventoTexto}`;
            if (tipoEvento === "boda") eventoFrase = "a nuestra boda";
            if (tipoEvento === "xv") eventoFrase = "a mis XV";
            if (tipoEvento === "cumple") {
                eventoFrase = `al cumple de ${eventoNombre || "nombre a definir"}`;
            }
            if (tipoEvento === "baby") {
                eventoFrase = `al Baby Shower de ${eventoNombre || "nombre a definir"}`;
            }
            const detalleEvento = eventoNombre
                ? `${eventoTexto} ${eventoNombre} ♥️`
                : `${eventoTexto} ♥️`;
            const message = `¡Hola, ${invitado.nombre}! ${invitacionTexto} ${eventoFrase} 🫶🏼\nIngresá al enlace para ver tu invitación:\n\n${detalleEvento}\n${link}`;
            window.open(
                `https://wa.me/?text=${encodeURIComponent(message)}`,
                "_blank",
                "noopener,noreferrer",
            );
        },
        [
            panelId,
            data?.invitationPath,
            data?.invitationToken,
            data?.evento?.nombre_evento,
            data?.evento?.tipo_evento,
            activeVariantConfig?.invitationVariant,
            activeVariantConfig?.eventName,
            activeVariantConfig?.eventTypeLabel,
            data?.panelConfig,
        ],
    );

    const handlePreviewGuestInvitation = useCallback(
        (invitado: Invitado) => {
            const path =
                data?.invitationPath?.trim() ||
                (panelId ? invitationPathFromPanelIdSlug(panelId) : null) ||
                "";
            if (!path || !invitado.codigo) return;
            const query = new URLSearchParams();
            if (data?.invitationToken?.trim()) {
                query.set("t", data.invitationToken.trim());
            }
            query.set("i", invitado.codigo);
            if (activeVariantConfig?.invitationVariant) {
                query.set("v", activeVariantConfig.invitationVariant);
            }
            query.set(GUEST_PREVIEW_PARAM, "1");
            const link = `${window.location.origin}${path}?${query.toString()}`;
            window.open(link, "_blank", "noopener,noreferrer");
        },
        [
            panelId,
            data?.invitationPath,
            data?.invitationToken,
            activeVariantConfig?.invitationVariant,
        ],
    );

    const handleDelete = useCallback(
        async (invitadoId: string) => {
            if (!confirm("¿Eliminar este invitado?")) return;
            await fetch(`/api/panel/${panelId}/invitado/${invitadoId}`, {
                method: "DELETE",
            });
            mutate();
        },
        [panelId, mutate],
    );

    const handleTogglePago = useCallback(
        async (invitado: Invitado) => {
            await fetch(`/api/panel/${panelId}/invitado/${invitado.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pago_tarjeta: !invitado.pago_tarjeta }),
            });
            mutate();
        },
        [panelId, mutate],
    );

    const handleTransferInvitados = useCallback(
        async (invitadoIds: string[], nextVariant: string) => {
            if (!panelId || !invitadoIds.length) return;
            const requests = invitadoIds.map((invitadoId) =>
                fetch(`/api/panel/${panelId}/invitado/${invitadoId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ panel_variant: nextVariant }),
                }).then(async (res) => {
                    if (!res.ok) {
                        const payload = (await res
                            .json()
                            .catch(() => ({}))) as { error?: string };
                        throw new Error(
                            payload.error || "No se pudo cambiar de lista",
                        );
                    }
                }),
            );
            await Promise.all(requests);
            await mutate();
        },
        [panelId, mutate],
    );

    const applyFilter = useCallback(
        (
            next:
                | "todos"
                | "confirmados"
                | "pendientes"
                | "no_asiste"
                | "pago_pendiente"
                | "con_alimentacion"
                | "con_musica"
                | "con_extra"
                | "colados",
        ) => {
            setExpandedId(null);
            setFilter(next);
        },
        [],
    );
    useEffect(() => {
        setExpandedId(null);
    }, [filter]);

    if (error)
        return (
            <PanelPinGate panelId={panelId}>
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf9f7] p-4">
                <p className="text-red-500 font-medium">
                    Error al cargar el panel
                </p>
                <p className="text-xs text-neutral-500 text-center max-w-sm">
                    {error?.message || String(error)}
                </p>
                <button
                    onClick={() => mutate()}
                    className="mt-2 rounded-lg px-4 py-2 text-sm text-white"
                    style={{ backgroundColor: primaryColor }}
                >
                    Reintentar
                </button>
            </div>
            </PanelPinGate>
        );
    if (!panelId || !data)
        return (
            <PanelPinGate panelId={panelId}>
            <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
                <p className="text-neutral-500">Cargando...</p>
            </div>
            </PanelPinGate>
        );

    const { evento, invitados, stats } = data;
    const total = stats.confirmados + stats.noAsisten + stats.pendientes;
    const coladosConfirmados = invitados.reduce((acc, inv) => {
        const confirmadosColadosInvitado =
            inv.integrantes?.filter(
                (integrante) =>
                    Boolean(integrante.es_colado) &&
                    integrante.estado === "confirmado",
            ).length ?? 0;
        return acc + confirmadosColadosInvitado;
    }, 0);
    const confirmadosSinColados = Math.max(
        stats.confirmados - coladosConfirmados,
        0,
    );
    const limitePlazas = data.panelConfig?.limiteInvitados;
    const plazasOcupadas = data.panelConfig?.plazasOcupadas ?? 0;
    const cupoPanelLleno =
        typeof limitePlazas === "number" && plazasOcupadas >= limitePlazas;
    let diasRestantes: number | null = null;
    if (evento.fecha_evento) {
        diasRestantes = Math.ceil(
            (new Date(evento.fecha_evento).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
        );
    }

    // Nombre del evento (sin "La boda de" ni "Los XV de")
    const tipoEvento = String(evento.tipo_evento || "boda").toLowerCase();
    const nombreEvento = evento.nombre_evento || "Anto & Walter";
    const tituloEvento =
        `${eventTypeLabelFromFolderTipo(tipoEvento)} ${nombreEvento}`.trim();

    const hasDietary = (inv: Invitado) =>
        Boolean(
            inv.restricciones ||
            inv.integrantes?.some((i) => Boolean(i.restricciones)),
        );
    const hasMusic = (inv: Invitado) => Boolean(inv.cancion?.trim());
    const hasExtra = (inv: Invitado) => hasPanelExtraInfo(inv);
    /** Integrantes marcados como colado (agregados desde el RSVP). */
    const hasColadosRegistrados = (inv: Invitado) =>
        Boolean(inv.integrantes?.some((i) => i.es_colado));
    const getEstadoOrdenLista = (
        inv: Invitado,
    ): "pendiente" | "no_asiste" | "confirmado" => {
        if (inv.tipo === "familia" && inv.integrantes?.length) {
            const estados = inv.integrantes.map((int) => int.estado);
            if (estados.includes("no_asiste")) return "no_asiste";
            if (estados.includes("pendiente")) return "pendiente";
            return "confirmado";
        }
        if (inv.tipo === "persona") {
            const colados = integrantesColadoDe(inv);
            if (!colados.length) {
                if (inv.estado === "no_asiste") return "no_asiste";
                if (inv.estado === "pendiente") return "pendiente";
                return "confirmado";
            }
            const estados = [inv.estado, ...colados.map((int) => int.estado)];
            if (estados.includes("no_asiste")) return "no_asiste";
            if (estados.includes("pendiente")) return "pendiente";
            return "confirmado";
        }
        if (inv.estado === "no_asiste") return "no_asiste";
        if (inv.estado === "pendiente") return "pendiente";
        return "confirmado";
    };
    const getLatestConfirmationMs = (inv: Invitado) => {
        const times: number[] = [];
        if (inv.fecha_confirmacion) {
            const t = new Date(inv.fecha_confirmacion).getTime();
            if (!Number.isNaN(t)) times.push(t);
        }
        if (inv.tipo === "familia" && inv.integrantes?.length) {
            inv.integrantes.forEach((int) => {
                if (!int.fecha_confirmacion) return;
                const t = new Date(int.fecha_confirmacion).getTime();
                if (!Number.isNaN(t)) times.push(t);
            });
        }
        if (inv.tipo === "persona") {
            integrantesColadoDe(inv).forEach((int) => {
                if (!int.fecha_confirmacion) return;
                const t = new Date(int.fecha_confirmacion).getTime();
                if (!Number.isNaN(t)) times.push(t);
            });
        }
        if (!times.length) return null;
        return Math.max(...times);
    };
    const isNewInvitado = (inv: Invitado) => {
        const latest = getLatestConfirmationMs(inv);
        return latest !== null && nowMs - latest <= NEW_MARK_MS;
    };
    const canFilterDietary = invitados.some((inv) => hasDietary(inv));
    const canFilterMusic = invitados.some((inv) => hasMusic(inv));
    const canFilterExtra = invitados.some((inv) => hasExtra(inv));
    const canFilterColados = invitados.some((inv) =>
        hasColadosRegistrados(inv),
    );
    const estadoFilter = filterToEstado[filter] || filter;
    let itemsToDisplay: Invitado[] = [];

    if (filter === "todos") {
        // Orden:
        // 1) Nuevos (última confirmación más reciente primero)
        // 2) Lista estándar por estado (pendiente, no_asiste, confirmado) y alfabético
        const ordenEstado: Record<string, number> = {
            pendiente: 0,
            no_asiste: 1,
            confirmado: 2,
        };
        const collator = new Intl.Collator("es", { sensitivity: "base" });
        const invitadosBase = invitados.map((inv) => ({ ...inv }));
        const nuevos = invitadosBase
            .filter((inv) => isNewInvitado(inv))
            .sort(
                (a, b) =>
                    (getLatestConfirmationMs(b) ?? 0) -
                    (getLatestConfirmationMs(a) ?? 0),
            );
        const estandarBase = invitadosBase.filter((inv) => !isNewInvitado(inv));
        const sortByNombre = (a: Invitado, b: Invitado) =>
            collator.compare(a.nombre, b.nombre);
        const estandarPendientes = estandarBase
            .filter((inv) => getEstadoOrdenLista(inv) === "pendiente")
            .sort(sortByNombre);
        const estandarNoAsisten = estandarBase
            .filter((inv) => getEstadoOrdenLista(inv) === "no_asiste")
            .sort(sortByNombre);
        const estandarConfirmados = estandarBase
            .filter((inv) => getEstadoOrdenLista(inv) === "confirmado")
            .sort(sortByNombre);
        const estandarOtros = estandarBase
            .filter((inv) => !(inv.estado in ordenEstado))
            .sort(sortByNombre);
        const estandar = [
            ...estandarPendientes,
            ...estandarNoAsisten,
            ...estandarConfirmados,
            ...estandarOtros,
        ];
        itemsToDisplay = [...nuevos, ...estandar];
    } else if (filter === "pago_pendiente") {
        // Mostrar solo los que no pagaron tarjeta
        itemsToDisplay = invitados
            .filter((inv) => !inv.pago_tarjeta)
            .map((inv) => ({ ...inv }));
    } else if (filter === "con_alimentacion") {
        itemsToDisplay = invitados
            .filter((inv) => hasDietary(inv))
            .map((inv) => ({ ...inv }));
    } else if (filter === "con_musica") {
        itemsToDisplay = invitados
            .filter((inv) => hasMusic(inv))
            .map((inv) => ({ ...inv }));
    } else if (filter === "con_extra") {
        itemsToDisplay = invitados
            .filter((inv) => hasExtra(inv))
            .map((inv) => ({ ...inv }));
    } else if (filter === "colados") {
        itemsToDisplay = invitados
            .filter((inv) => hasColadosRegistrados(inv))
            .map((inv) => ({ ...inv }));
    } else {
        for (const inv of invitados) {
            if (
                inv.tipo === "familia" &&
                inv.integrantes &&
                inv.integrantes.length > 0
            ) {
                const estados = new Set(
                    inv.integrantes.map((int) => int.estado),
                );
                if (estados.size > 1) {
                    for (const int of inv.integrantes) {
                        if (int.estado === estadoFilter) {
                            itemsToDisplay.push({
                                id: int.id,
                                nombre: int.nombre,
                                tipo: "integrante",
                                estado: int.estado,
                                restricciones: int.restricciones,
                                es_colado: Boolean(int.es_colado),
                                familiaId: inv.id,
                                familiaNombre: inv.nombre,
                                codigo: inv.codigo,
                                pago: inv.pago_tarjeta,
                            });
                        }
                    }
                } else if (estados.has(estadoFilter as Invitado["estado"])) {
                    itemsToDisplay.push({ ...inv });
                }
            } else if (
                inv.tipo === "persona" &&
                integrantesColadoDe(inv).length > 0
            ) {
                const titularEstado = inv.estado;
                const ints = integrantesColadoDe(inv);
                const uniq = new Set([
                    titularEstado,
                    ...ints.map((x) => x.estado),
                ]);
                if (uniq.size > 1) {
                    if (titularEstado === estadoFilter) {
                        itemsToDisplay.push({
                            id: `${inv.id}-titular`,
                            nombre: inv.nombre,
                            tipo: "integrante",
                            estado: titularEstado,
                            restricciones: inv.restricciones,
                            familiaId: inv.id,
                            familiaNombre: inv.nombre,
                            codigo: inv.codigo,
                            pago: inv.pago_tarjeta,
                            es_colado: false,
                        });
                    }
                    for (const int of ints) {
                        if (int.estado === estadoFilter) {
                            itemsToDisplay.push({
                                id: int.id,
                                nombre: int.nombre,
                                tipo: "integrante",
                                estado: int.estado,
                                restricciones: int.restricciones,
                                es_colado: Boolean(int.es_colado),
                                familiaId: inv.id,
                                familiaNombre: inv.nombre,
                                codigo: inv.codigo,
                                pago: inv.pago_tarjeta,
                            });
                        }
                    }
                } else if ([...uniq][0] === estadoFilter) {
                    itemsToDisplay.push({ ...inv });
                }
            } else {
                if (inv.estado === estadoFilter) {
                    itemsToDisplay.push({ ...inv });
                }
            }
        }
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const invitadosFiltrados = itemsToDisplay.filter((item) => {
        if (!normalizedSearch) return true;
        if (item.nombre.toLowerCase().includes(normalizedSearch)) return true;
        if (
            item.familiaNombre &&
            item.familiaNombre.toLowerCase().includes(normalizedSearch)
        ) {
            return true;
        }
        if (item.tipo === "familia" && item.integrantes?.length) {
            return item.integrantes.some((int) =>
                int.nombre.toLowerCase().includes(normalizedSearch),
            );
        }
        return false;
    });

    const desktopConfirmados = invitadosFiltrados.filter(
        (inv) => getEstadoOrdenLista(inv as Invitado) === "confirmado",
    );
    const desktopPendientes = invitadosFiltrados.filter(
        (inv) => getEstadoOrdenLista(inv as Invitado) === "pendiente",
    );
    const desktopNoAsisten = invitadosFiltrados.filter(
        (inv) => getEstadoOrdenLista(inv as Invitado) === "no_asiste",
    );
    const personasRepresentadasEnLista = (items: Invitado[]) =>
        items.reduce((acc, inv) => {
            if (inv.tipo === "familia")
                return acc + (inv.integrantes?.length || 0);
            if (inv.tipo === "persona")
                return acc + 1 + (inv.integrantes?.length || 0);
            return acc + 1;
        }, 0);

    return (
        <PanelPinGate
            panelId={panelId}
            primaryColor={primaryColor}
            title={labels?.title || "Panel de invitados"}
        >
        <div className="min-h-screen bg-[#faf9f7]">
            <header
                className="relative px-5 py-8 text-center text-white"
                style={{ backgroundColor: primaryColor }}
            >
                <h1 className="text-lg font-semibold tracking-[0.2em] uppercase">
                    {labels?.title || "Panel de Invitados"}
                </h1>
                <p className="mt-1 text-sm font-light opacity-90">
                    {tituloEvento}
                </p>
                {diasRestantes !== null && diasRestantes > 0 && (
                    <p className="mt-1 text-xs font-light opacity-80">
                        Faltan {diasRestantes} días
                    </p>
                )}
                <div className="absolute bottom-3 left-5">
                    <button
                        type="button"
                        onClick={() => {
                            const dg = debtGateFromPanelConfig(
                                data.panelConfig,
                            );
                            if (
                                panelDebtShouldIntercept(
                                    dg,
                                    plazasOcupadasFromPanelData(
                                        data.panelConfig,
                                    ),
                                )
                            ) {
                                setDebtModalPhase("summary");
                                return;
                            }
                            const url = `/panel/${panelId}/print?pv=${encodeURIComponent(panelVariant)}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                        aria-label="Guardar lista en PDF"
                        title="Lista A4 para guardar en PDF"
                        className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-white backdrop-blur-sm transition-opacity hover:opacity-90"
                    >
                        <Download className="h-4 w-4" aria-hidden />
                    </button>
                </div>
                <div className="absolute bottom-3 right-5">
                    <button
                        type="button"
                        onClick={() => setShowUsageHelpModal(true)}
                        className="rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm"
                    >
                        ¿Cómo usar?
                    </button>
                </div>
            </header>

            <div className="px-5 py-6">
                <div className="md:hidden">
                    <div className="mb-3">
                        <div className="rounded-lg bg-white px-4 py-6 text-center shadow-sm">
                            <p className="text-4xl font-bold text-neutral-700">
                                {total}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                                {labels?.totalLabel || "Total invitados"}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className="flex min-h-[106px] flex-col items-center justify-center rounded-lg px-3 py-3 text-center"
                            style={{ backgroundColor: "#d4edda" }}
                        >
                            <p
                                className="text-2xl font-bold"
                                style={{ color: "#155724" }}
                            >
                                {stats.confirmados}
                            </p>
                            <p
                                className="mt-1 text-[10px] uppercase tracking-wide"
                                style={{ color: "#155724", opacity: 0.8 }}
                            >
                                {labels?.confirmedLabel || "Confirmados"}
                            </p>
                            {coladosConfirmados > 0 && (
                                <p
                                    className="mt-1 text-[10px]"
                                    style={{ color: "#155724", opacity: 0.8 }}
                                >
                                    ({confirmadosSinColados} +{" "}
                                    {coladosConfirmados} colados)
                                </p>
                            )}
                        </div>
                        <div className="flex min-h-[106px] flex-col items-center justify-center rounded-lg bg-neutral-100 px-3 py-3 text-center">
                            <p className="text-2xl font-bold text-neutral-600">
                                {stats.pendientes}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">
                                {labels?.pendingLabel || "Pendientes"}
                            </p>
                        </div>
                        <div
                            className="flex min-h-[106px] flex-col items-center justify-center rounded-lg px-3 py-3 text-center"
                            style={{ backgroundColor: "#f5d5d5" }}
                        >
                            <p
                                className="text-2xl font-bold"
                                style={{ color: "#8b6b6b" }}
                            >
                                {stats.noAsisten}
                            </p>
                            <p
                                className="mt-1 text-[10px] uppercase tracking-wide"
                                style={{ color: "#8b6b6b", opacity: 0.8 }}
                            >
                                {labels?.declinedLabel || "No asisten"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="hidden grid-cols-4 gap-4 md:grid">
                    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                            {labels?.totalLabel || "Total invitados"}
                        </p>
                        <p className="mt-1 text-3xl font-bold text-neutral-700">
                            {total}
                        </p>
                    </div>
                    <div
                        className="rounded-xl border px-4 py-3 shadow-sm"
                        style={{
                            backgroundColor: "#d4edda",
                            borderColor: "#bcdac4",
                        }}
                    >
                        <p className="text-xs uppercase tracking-wide text-[#155724]/80">
                            {labels?.confirmedLabel || "Confirmados"}
                        </p>
                        <p className="mt-1 text-3xl font-bold text-[#155724]">
                            {stats.confirmados}
                        </p>
                        {coladosConfirmados > 0 && (
                            <p className="mt-1 text-[11px] text-[#155724]/80">
                                {confirmadosSinColados} + {coladosConfirmados}{" "}
                                colados
                            </p>
                        )}
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                            {labels?.pendingLabel || "Pendientes"}
                        </p>
                        <p className="mt-1 text-3xl font-bold text-neutral-600">
                            {stats.pendientes}
                        </p>
                    </div>
                    <div
                        className="rounded-xl border px-4 py-3 shadow-sm"
                        style={{
                            backgroundColor: "#f5d5d5",
                            borderColor: "#e9c0c0",
                        }}
                    >
                        <p className="text-xs uppercase tracking-wide text-[#8b6b6b]/80">
                            {labels?.declinedLabel || "No asisten"}
                        </p>
                        <p className="mt-1 text-3xl font-bold text-[#8b6b6b]">
                            {stats.noAsisten}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-4">
                {variantes.length > 1 && (
                    <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Elegir lista
                        </p>
                        <div className="rounded-xl border border-neutral-200 bg-white p-1.5">
                            <div
                                className="grid gap-1.5"
                                style={{
                                    gridTemplateColumns: `repeat(${Math.min(2, variantes.length)}, minmax(0, 1fr))`,
                                }}
                            >
                                {variantes.map((variant) => {
                                    const selected =
                                        variant.id === panelVariant;
                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={() =>
                                                handleChangePanelVariant(
                                                    variant.id,
                                                )
                                            }
                                            className="rounded-lg px-3 py-3 text-xs font-semibold transition-colors"
                                            style={{
                                                backgroundColor: selected
                                                    ? primaryColor
                                                    : "#F7F7F7",
                                                color: selected
                                                    ? "#fff"
                                                    : "#4A4A4A",
                                                border: selected
                                                    ? "1px solid transparent"
                                                    : "1px solid #E5E5E5",
                                                boxShadow: selected
                                                    ? "0 1px 3px rgba(0,0,0,0.12)"
                                                    : "none",
                                            }}
                                        >
                                            {variant.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Buscar invitado o familia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm focus:border-neutral-400 focus:outline-none"
                    />
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 opacity-70" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            "todos",
                            "confirmados",
                            "pendientes",
                            "no_asiste",
                            "pago_pendiente",
                        ] as const
                    ).map((f) => (
                        <button
                            key={f}
                            onClick={() => applyFilter(f)}
                            className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
                            style={{
                                backgroundColor:
                                    filter === f ? primaryColor : "#fff",
                                color: filter === f ? "#fff" : "#666",
                                border:
                                    filter === f ? "none" : "1px solid #e5e5e5",
                            }}
                        >
                            {f === "no_asiste"
                                ? "No asisten"
                                : f === "todos"
                                  ? "Todos"
                                  : f === "pago_pendiente"
                                    ? labels?.paymentPending || "Pago pendiente"
                                    : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                    {canFilterColados && (
                        <button
                            type="button"
                            onClick={() => applyFilter("colados")}
                            title="Solo invitados que sumaron colados desde el RSVP"
                            className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
                            style={{
                                backgroundColor:
                                    filter === "colados"
                                        ? primaryColor
                                        : "#fff",
                                color: filter === "colados" ? "#fff" : "#666",
                                border:
                                    filter === "colados"
                                        ? "none"
                                        : "1px solid #e5e5e5",
                            }}
                        >
                            Colados
                        </button>
                    )}
                    {canFilterDietary && (
                        <button
                            onClick={() => applyFilter("con_alimentacion")}
                            title="Filtrar por alimentación"
                            className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                            style={{
                                backgroundColor:
                                    filter === "con_alimentacion"
                                        ? primaryColor
                                        : "#fff",
                                color:
                                    filter === "con_alimentacion"
                                        ? "#fff"
                                        : "#666",
                                border:
                                    filter === "con_alimentacion"
                                        ? "none"
                                        : "1px solid #e5e5e5",
                            }}
                        >
                            <Utensils className="h-3 w-3" />
                        </button>
                    )}
                    {canFilterMusic && (
                        <button
                            onClick={() => applyFilter("con_musica")}
                            title="Filtrar por música"
                            className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                            style={{
                                backgroundColor:
                                    filter === "con_musica"
                                        ? primaryColor
                                        : "#fff",
                                color:
                                    filter === "con_musica" ? "#fff" : "#666",
                                border:
                                    filter === "con_musica"
                                        ? "none"
                                        : "1px solid #e5e5e5",
                            }}
                        >
                            <Music className="h-3 w-3" />
                        </button>
                    )}
                    {canFilterExtra && (
                        <button
                            onClick={() => applyFilter("con_extra")}
                            title="Filtrar por datos extra"
                            className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                            style={{
                                backgroundColor:
                                    filter === "con_extra"
                                        ? primaryColor
                                        : "#fff",
                                color: filter === "con_extra" ? "#fff" : "#666",
                                border:
                                    filter === "con_extra"
                                        ? "none"
                                        : "1px solid #e5e5e5",
                            }}
                        >
                            <MessageSquare className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {typeof limitePlazas === "number" && (
                <div className="px-5 pb-2 text-center">
                    <p className="text-xs text-neutral-600">
                        Plazas en panel:{" "}
                        <span className="font-semibold tabular-nums">
                            {plazasOcupadas} / {limitePlazas}
                        </span>
                    </p>
                    {cupoPanelLleno && (
                        <p className="mt-1 text-[11px] text-red-700">
                            Límite alcanzado: no podés agregar más invitados
                            hasta liberar plazas o aumentar el cupo.{" "}
                            <button
                                type="button"
                                onClick={() => setShowLimitHelpModal(true)}
                                className="underline underline-offset-2"
                            >
                                Ver más
                            </button>
                        </p>
                    )}
                </div>
            )}

            <div className="px-5 pb-4">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => !cupoPanelLleno && setShowAddModal(true)}
                        disabled={cupoPanelLleno}
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus className="h-5 w-5" />
                        {labels?.addGuest || "Agregar Invitado"}
                    </button>
                    {variantes.length > 1 && (
                        <button
                            type="button"
                            onClick={() => setShowBulkTransferModal(true)}
                            className="inline-flex h-[52px] w-[56px] shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
                            title="Cambiar invitados de lista"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 pb-8 md:hidden">
                {invitadosFiltrados.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 bg-white py-12 text-center">
                        <p className="text-neutral-500">
                            {searchTerm
                                ? "No se encontraron resultados"
                                : filter === "colados"
                                  ? "No hay colados registrados"
                                  : "No hay invitados"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                        {invitadosFiltrados.map((inv, idx) => (
                            <InvitadoRow
                                key={inv.id}
                                invitado={inv}
                                isLast={idx === invitadosFiltrados.length - 1}
                                isNew={
                                    inv.tipo !== "integrante" &&
                                    isNewInvitado(inv)
                                }
                                hasVariantLists={variantes.length > 1}
                                canTransfer={canTransferInvitado(inv)}
                                giftCardEnabled={giftCardEnabled}
                                primaryColor={primaryColor}
                                coladoLabel={data.panelConfig?.coladoLabel}
                                labels={labels}
                                expanded={expandedId === inv.id}
                                onToggleExpand={() =>
                                    setExpandedId(
                                        expandedId === inv.id ? null : inv.id,
                                    )
                                }
                                onSendInvitation={handleSendInvitation}
                                onPreviewGuestInvitation={
                                    handlePreviewGuestInvitation
                                }
                                onDelete={handleDelete}
                                onEdit={() => setEditingInvitado(inv)}
                                onTogglePago={handleTogglePago}
                                onOpenTransfer={() => setTransferInvitado(inv)}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="hidden px-5 pb-8 md:block">
                {invitadosFiltrados.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 bg-white py-12 text-center">
                        <p className="text-neutral-500">
                            {searchTerm
                                ? "No se encontraron resultados"
                                : filter === "colados"
                                  ? "No hay colados registrados"
                                  : "No hay invitados"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            {
                                id: "confirmado",
                                title: labels?.confirmedLabel || "Confirmados",
                                items: desktopConfirmados,
                                personas:
                                    personasRepresentadasEnLista(
                                        desktopConfirmados,
                                    ),
                                border: "#bcdac4",
                                bg: "#eef8f1",
                            },
                            {
                                id: "pendiente",
                                title: labels?.pendingLabel || "Pendientes",
                                items: desktopPendientes,
                                personas:
                                    personasRepresentadasEnLista(
                                        desktopPendientes,
                                    ),
                                border: "#e5e7eb",
                                bg: "#f7f7f7",
                            },
                            {
                                id: "no_asiste",
                                title: labels?.declinedLabel || "No asisten",
                                items: desktopNoAsisten,
                                personas:
                                    personasRepresentadasEnLista(
                                        desktopNoAsisten,
                                    ),
                                border: "#e9c0c0",
                                bg: "#fbefef",
                            },
                        ].map((col) => (
                            <section
                                key={col.id}
                                className="overflow-hidden rounded-xl border bg-white shadow-sm"
                                style={{ borderColor: col.border }}
                            >
                                <header
                                    className="flex items-center justify-between border-b px-4 py-3"
                                    style={{
                                        backgroundColor: col.bg,
                                        borderColor: col.border,
                                    }}
                                >
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
                                        {col.title}
                                    </h3>
                                    <span className="rounded bg-white/85 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                                        {col.personas}
                                    </span>
                                </header>
                                <div className="max-h-[68vh] overflow-y-auto bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {col.items.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-sm text-neutral-500">
                                            Sin invitados
                                        </p>
                                    ) : (
                                        col.items.map((inv, idx) => (
                                            <InvitadoRow
                                                key={`${col.id}-${inv.id}`}
                                                invitado={inv}
                                                isLast={
                                                    idx === col.items.length - 1
                                                }
                                                isNew={
                                                    inv.tipo !== "integrante" &&
                                                    isNewInvitado(inv)
                                                }
                                                hasVariantLists={
                                                    variantes.length > 1
                                                }
                                                canTransfer={canTransferInvitado(
                                                    inv,
                                                )}
                                                giftCardEnabled={
                                                    giftCardEnabled
                                                }
                                                primaryColor={primaryColor}
                                                coladoLabel={
                                                    data.panelConfig
                                                        ?.coladoLabel
                                                }
                                                labels={labels}
                                                expanded={expandedId === inv.id}
                                                onToggleExpand={() =>
                                                    setExpandedId(
                                                        expandedId === inv.id
                                                            ? null
                                                            : inv.id,
                                                    )
                                                }
                                                onSendInvitation={
                                                    handleSendInvitation
                                                }
                                                onPreviewGuestInvitation={
                                                    handlePreviewGuestInvitation
                                                }
                                                onDelete={handleDelete}
                                                onEdit={() =>
                                                    setEditingInvitado(inv)
                                                }
                                                onTogglePago={handleTogglePago}
                                                onOpenTransfer={() =>
                                                    setTransferInvitado(inv)
                                                }
                                            />
                                        ))
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddInvitadoModal
                    panelId={panelId}
                    panelVariant={panelVariant}
                    primaryColor={primaryColor}
                    soloPersona={data.panelConfig?.confirmacion === "comun"}
                    coladosEnabled={Boolean(data.panelConfig?.coladosEnabled)}
                    coladoLabel={data.panelConfig?.coladoLabel}
                    limiteColadosMax={
                        data.panelConfig?.limiteColados ??
                        DEFAULT_LIMITE_COLADOS_PANEL
                    }
                    onLimitReached={() => setShowLimitHelpModal(true)}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        mutate();
                    }}
                    shouldInterceptDebt={() => {
                        const dg = debtGateFromPanelConfig(data.panelConfig);
                        const plazasActuales = plazasOcupadasFromPanelData(
                            data.panelConfig,
                        );
                        if (!panelDebtShouldIntercept(dg, plazasActuales))
                            return false;
                        setDebtModalPhase("summary");
                        return true;
                    }}
                />
            )}
            {debtModalPhase !== "closed" && (
                <PanelDebtInterceptModals
                    phase={debtModalPhase}
                    gate={debtGateFromPanelConfig(data.panelConfig)}
                    primaryColor={primaryColor}
                    onCloseAll={() => setDebtModalPhase("closed")}
                    onShowDetail={() => setDebtModalPhase("detail")}
                />
            )}
            {showLimitHelpModal && (
                <LimitHelpModal onClose={() => setShowLimitHelpModal(false)} />
            )}
            {showUsageHelpModal && (
                <PanelUsageHelpModal
                    onClose={() => setShowUsageHelpModal(false)}
                    confirmacion={data.panelConfig?.confirmacion}
                />
            )}
            {editingInvitado && editingInvitado.tipo !== "integrante" && (
                <EditInvitadoModal
                    panelId={panelId}
                    invitado={editingInvitado}
                    primaryColor={primaryColor}
                    coladosEnabled={Boolean(data.panelConfig?.coladosEnabled)}
                    coladoLabel={data.panelConfig?.coladoLabel}
                    limiteColadosMax={
                        data.panelConfig?.limiteColados ??
                        DEFAULT_LIMITE_COLADOS_PANEL
                    }
                    onClose={() => setEditingInvitado(null)}
                    onSuccess={() => {
                        setEditingInvitado(null);
                        mutate();
                    }}
                />
            )}
            {transferInvitado && (
                <TransferListModal
                    invitado={transferInvitado}
                    variants={targetVariants}
                    primaryColor={primaryColor}
                    onClose={() => setTransferInvitado(null)}
                    onConfirm={async (nextVariant) => {
                        await handleTransferInvitados(
                            [transferInvitado.id],
                            nextVariant,
                        );
                        setTransferInvitado(null);
                    }}
                />
            )}
            {showBulkTransferModal && (
                <BulkTransferListModal
                    invitados={invitados.filter(
                        (inv) => inv.tipo !== "integrante",
                    )}
                    canTransfer={canTransferInvitado}
                    variants={targetVariants}
                    primaryColor={primaryColor}
                    onClose={() => setShowBulkTransferModal(false)}
                    onConfirm={async (ids, nextVariant) => {
                        await handleTransferInvitados(ids, nextVariant);
                        setShowBulkTransferModal(false);
                    }}
                />
            )}
        </div>
        </PanelPinGate>
    );
}

function PanelDebtInterceptModals({
    phase,
    gate,
    primaryColor,
    onCloseAll,
    onShowDetail,
}: {
    phase: "summary" | "detail";
    gate: PanelDebtGatePayload;
    primaryColor: string;
    onCloseAll: () => void;
    onShowDetail: () => void;
}) {
    const pago = gate.deudaPago;
    const montoStr = `$${formatDeudaMontoAr(gate.deudaMonto)}`;
    /** Misma idea que modales de invitación (valor tarjeta / alias): fondo primary, texto claro */
    const fg = "#FFFCF8";

    const backdropStyle: React.CSSProperties = {
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
    };

    if (phase === "summary") {
        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 px-5 py-8"
                style={backdropStyle}
                onClick={onCloseAll}
                role="presentation"
            >
                <div
                    className="relative w-full max-w-sm rounded-sm px-7 py-8 shadow-xl"
                    style={{ backgroundColor: primaryColor, color: fg }}
                    role="dialog"
                    aria-labelledby="panel-deuda-titulo"
                    aria-modal="true"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div
                            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: "rgba(255,252,248,0.12)",
                                boxShadow: "0 0 0 1px rgba(255,252,248,0.18)",
                            }}
                        >
                            <AlertTriangle
                                className="h-7 w-7"
                                strokeWidth={2}
                                style={{ color: fg }}
                                aria-hidden
                            />
                        </div>
                        <h2
                            id="panel-deuda-titulo"
                            className="text-lg font-semibold uppercase tracking-wide"
                            style={{ color: fg }}
                        >
                            Usted registra una deuda
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCloseAll}
                            className="flex-1 rounded-sm border border-white/25 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                            style={{ color: fg }}
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            onClick={onShowDetail}
                            className="flex-1 rounded-sm py-3 text-sm font-semibold shadow-md transition-opacity hover:opacity-95"
                            style={{
                                backgroundColor: fg,
                                color: primaryColor,
                            }}
                        >
                            Ver detalle
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 px-5 py-8"
            style={backdropStyle}
            onClick={onCloseAll}
            role="presentation"
        >
            <div
                className="relative max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-sm px-7 py-8 shadow-xl"
                style={{ backgroundColor: primaryColor, color: fg }}
                role="dialog"
                aria-label="Detalle para abonar"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="mb-5 rounded-sm px-5 py-4 text-center"
                    style={{ backgroundColor: "rgba(255,252,248,0.1)" }}
                >
                    <p
                        className="text-[11px] font-medium uppercase tracking-[0.15em]"
                        style={{ color: `${fg}99` }}
                    >
                        Monto
                    </p>
                    <p
                        className="mt-1 text-2xl font-light tabular-nums"
                        style={{ color: fg }}
                    >
                        {montoStr}
                    </p>
                </div>

                <div className="space-y-3">
                    <DebtTransferRow label="Alias" value={pago.alias} mono />
                    <DebtTransferRow label="Titular" value={pago.titular} />
                    <DebtTransferRow label="Banco" value={pago.banco} />
                </div>

                <p
                    className="mt-6 text-center text-xs font-light leading-relaxed"
                    style={{ color: `${fg}CC` }}
                >
                    Después del pago, no olvide enviarnos el comprobante
                </p>
                <button
                    type="button"
                    onClick={onCloseAll}
                    className="mt-6 w-full rounded-sm border border-white/25 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                    style={{ color: fg }}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}

function DebtTransferRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    const fg = "#FFFCF8";
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* noop */
        }
    };

    return (
        <div
            className="flex items-center justify-between rounded-sm border px-4 py-3"
            style={{ borderColor: "rgba(255,252,248,0.15)" }}
        >
            <div className="min-w-0 flex-1">
                <p
                    className="text-[10px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: `${fg}80` }}
                >
                    {label}
                </p>
                <p
                    className={`mt-0.5 text-sm font-light ${mono ? "break-all font-mono" : ""}`}
                    style={{ color: fg }}
                >
                    {value}
                </p>
            </div>
            {mono ? (
                <button
                    type="button"
                    onClick={handleCopy}
                    className="ml-2 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border transition-colors hover:bg-white/10"
                    style={{
                        borderColor: "rgba(255,252,248,0.2)",
                        color: `${fg}80`,
                    }}
                    aria-label="Copiar alias"
                >
                    {copied ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                </button>
            ) : null}
        </div>
    );
}

function InvitadoRow({
    invitado,
    isLast,
    isNew,
    hasVariantLists,
    canTransfer,
    giftCardEnabled,
    primaryColor,
    coladoLabel,
    labels,
    expanded,
    onToggleExpand,
    onSendInvitation,
    onPreviewGuestInvitation,
    onDelete,
    onEdit,
    onTogglePago,
    onOpenTransfer,
}: {
    invitado: Invitado;
    isLast: boolean;
    isNew?: boolean;
    hasVariantLists: boolean;
    canTransfer: boolean;
    giftCardEnabled: boolean;
    primaryColor: string;
    coladoLabel?: string;
    labels?: PanelLabels;
    expanded: boolean;
    onToggleExpand: () => void;
    onSendInvitation: (inv: Invitado) => void;
    onPreviewGuestInvitation: (inv: Invitado) => void;
    onDelete: (id: string) => void;
    onEdit: () => void;
    onTogglePago: (inv: Invitado) => void;
    onOpenTransfer: () => void;
}) {
    const rowRef = useRef<HTMLDivElement | null>(null);
    const estadoBg: Record<string, string> = {
        confirmado: "#d4edda",
        pendiente: "#f5f5f5",
        no_asiste: "#f5d5d5",
    };
    const estadoText: Record<string, string> = {
        confirmado: "#155724",
        pendiente: "#888",
        no_asiste: "#8b6b6b",
    };
    const bgColor = estadoBg[invitado.estado] || "#f5f5f5";
    const txtColor = estadoText[invitado.estado] || "#888";

    const colSing = normalizeColadoSingular(coladoLabel);
    const colPlur = coladoPlural(colSing);

    const integrantesRow = invitado.integrantes ?? [];
    const coladosRow = integrantesRow.filter((i) => i.es_colado);
    const personaConColados =
        invitado.tipo === "persona" && coladosRow.length > 0;
    const esFamiliaConInts =
        invitado.tipo === "familia" && integrantesRow.length > 0;

    /** Estados del grupo: familia = solo integrantes; persona+colados = titular + colados */
    const estadosGrupo: string[] | null = esFamiliaConInts
        ? integrantesRow.map((i) => i.estado)
        : personaConColados
          ? [invitado.estado, ...coladosRow.map((i) => i.estado)]
          : null;

    let familiaEstadoUnico: string | null = null;
    let estadosMixtos = false;
    if (estadosGrupo && estadosGrupo.length > 0) {
        const estados = new Set(estadosGrupo);
        if (estados.size === 1) {
            familiaEstadoUnico = estadosGrupo[0];
        } else {
            estadosMixtos = true;
        }
    }

    // Color del ícono (familia o persona con colados)
    let iconBg = bgColor,
        iconTxt = txtColor;
    if (estadosGrupo && estadosGrupo.length > 0) {
        if (estadosMixtos) {
            iconBg = "#e5e5e5";
            iconTxt = "#666";
        } else if (familiaEstadoUnico === "confirmado") {
            iconBg = estadoBg.confirmado;
            iconTxt = estadoText.confirmado;
        } else if (familiaEstadoUnico === "no_asiste") {
            iconBg = estadoBg.no_asiste;
            iconTxt = estadoText.no_asiste;
        } else {
            iconBg = estadoBg.pendiente;
            iconTxt = estadoText.pendiente;
        }
    }

    const renderEstadoBadge = () => {
        if (estadosGrupo && estadosGrupo.length > 0) {
            if (estadosMixtos) {
                const e = { confirmado: 0, pendiente: 0, no_asiste: 0 };
                estadosGrupo.forEach((s) => {
                    e[s as keyof typeof e]++;
                });
                return (
                    <div className="flex gap-1">
                        {e.confirmado > 0 && (
                            <span
                                className="rounded px-2 py-1 text-[10px] font-medium"
                                style={{
                                    backgroundColor: estadoBg.confirmado,
                                    color: estadoText.confirmado,
                                }}
                            >
                                {e.confirmado}
                            </span>
                        )}
                        {e.pendiente > 0 && (
                            <span
                                className="rounded px-2 py-1 text-[10px] font-medium"
                                style={{
                                    backgroundColor: estadoBg.pendiente,
                                    color: estadoText.pendiente,
                                }}
                            >
                                {e.pendiente}
                            </span>
                        )}
                        {e.no_asiste > 0 && (
                            <span
                                className="rounded px-2 py-1 text-[10px] font-medium"
                                style={{
                                    backgroundColor: estadoBg.no_asiste,
                                    color: estadoText.no_asiste,
                                }}
                            >
                                {e.no_asiste}
                            </span>
                        )}
                    </div>
                );
            }
            const color =
                familiaEstadoUnico === "confirmado"
                    ? estadoBg.confirmado
                    : familiaEstadoUnico === "no_asiste"
                      ? estadoBg.no_asiste
                      : estadoBg.pendiente;
            const txt =
                familiaEstadoUnico === "confirmado"
                    ? estadoText.confirmado
                    : familiaEstadoUnico === "no_asiste"
                      ? estadoText.no_asiste
                      : estadoText.pendiente;
            return (
                <span
                    className="rounded px-2 py-1 text-[10px] font-medium"
                    style={{ backgroundColor: color, color: txt }}
                >
                    {getEstadoTexto(
                        familiaEstadoUnico!,
                        estadosGrupo.length > 1,
                    )}
                </span>
            );
        }

        return (
            <span
                className="rounded px-2 py-1 text-[10px] font-medium"
                style={{ backgroundColor: bgColor, color: txtColor }}
            >
                {getEstadoTexto(invitado.estado, false)}
            </span>
        );
    };

    const songsByMember = parsePerMemberValues(invitado.cancion);
    const integranteNombres = integrantesRow.map((i) => i.nombre);
    const titularExtraLines = panelExtraLinesForMember(
        invitado.mensaje && invitado.mensaje !== invitado.cancion
            ? invitado.mensaje
            : undefined,
        invitado.nombre,
        integranteNombres,
    );
    const hasDietaryInfo = Boolean(
        invitado.restricciones ||
        invitado.integrantes?.some((i) => Boolean(i.restricciones)),
    );
    const hasSongInfo = Boolean(
        invitado.cancion?.trim() ||
        (invitado.integrantes?.length &&
            invitado.integrantes.some((i) => songsByMember[i.nombre]?.length)),
    );
    const hasExtraInfo = Boolean(
        titularExtraLines.length ||
        integrantesRow.some((i) =>
            panelExtraLinesForMember(
                invitado.mensaje && invitado.mensaje !== invitado.cancion
                    ? invitado.mensaje
                    : undefined,
                i.nombre,
                [invitado.nombre, ...integranteNombres.filter((n) => n !== i.nombre)],
            ).length,
        ),
    );

    useEffect(() => {
        if (!expanded) return;
        const node = rowRef.current;
        if (!node) return;
        const raf = window.requestAnimationFrame(() => {
            const rect = node.getBoundingClientRect();
            const fullyVisible =
                rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (!fullyVisible) {
                node.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
        return () => window.cancelAnimationFrame(raf);
    }, [expanded]);

    return (
        <div
            ref={rowRef}
            className={!isLast ? "border-b border-neutral-100" : ""}
        >
            <div
                className="relative flex cursor-pointer items-center gap-3 px-4 py-3 md:gap-2 md:px-3 md:py-2"
                onClick={onToggleExpand}
            >
                {isNew && (
                    <span
                        className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full shadow-sm"
                        style={{
                            left: "3px",
                            backgroundColor: "#2563eb",
                            opacity: 1,
                        }}
                    />
                )}
                <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full md:h-7 md:w-7"
                    style={{ backgroundColor: iconBg }}
                >
                    {invitado.tipo === "familia" || personaConColados ? (
                        <Users className="h-4 w-4" style={{ color: iconTxt }} />
                    ) : (
                        <User className="h-4 w-4" style={{ color: iconTxt }} />
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-neutral-800 md:text-[13px]">
                        {invitado.nombre}
                    </p>
                    {invitado.tipo === "familia" &&
                        integrantesRow.length > 0 && (
                            <p className="text-xs text-neutral-500">
                                {integrantesRow.length} integrantes
                                {integrantesRow.some((i) => i.es_colado)
                                    ? ` (${integrantesRow.filter((i) => i.es_colado).length} ${
                                          integrantesRow.filter(
                                              (i) => i.es_colado,
                                          ).length === 1
                                              ? colSing
                                              : colPlur
                                      })`
                                    : ""}
                            </p>
                        )}
                    {personaConColados && (
                        <p className="text-xs text-neutral-500">
                            {coladosRow.length}{" "}
                            {coladosRow.length === 1 ? colSing : colPlur}
                        </p>
                    )}
                    {invitado.tipo === "integrante" &&
                        invitado.familiaNombre && (
                            <p className="text-xs text-neutral-500">
                                de {invitado.familiaNombre}
                                {invitado.es_colado ? ` · ${colSing}` : ""}
                            </p>
                        )}
                </div>
                {(hasDietaryInfo || hasSongInfo || hasExtraInfo) && (
                    <div className="flex items-center gap-1 text-neutral-500">
                        {hasDietaryInfo && <Utensils className="h-3.5 w-3.5" />}
                        {hasSongInfo && <Music className="h-3.5 w-3.5" />}
                        {hasExtraInfo && (
                            <MessageSquare className="h-3.5 w-3.5" />
                        )}
                    </div>
                )}
                <div className="flex items-center gap-1">
                    {invitado.tipo !== "integrante" &&
                        (invitado.cupo_colados ?? 0) > 0 && (
                            <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                                +{invitado.cupo_colados}
                            </span>
                        )}
                    {renderEstadoBadge()}
                </div>
                {invitado.tipo !== "integrante" && (
                    <div className="hidden">
                        {invitado.codigo && !invitado.registro_auto_rsvp && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSendInvitation(invitado);
                                }}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white"
                                style={{ backgroundColor: primaryColor }}
                                title="Enviar invitación"
                            >
                                <Send className="h-3 w-3" />
                                Enviar
                            </button>
                        )}
                        {hasVariantLists && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canTransfer) onOpenTransfer();
                                }}
                                disabled={!canTransfer}
                                className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-45"
                                title="Cambiar de lista"
                            >
                                <ArrowLeftRight className="h-3 w-3" />
                                Lista
                            </button>
                        )}
                        {giftCardEnabled && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePago(invitado);
                                }}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${invitado.pago_tarjeta ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-700"}`}
                                title={
                                    invitado.pago_tarjeta
                                        ? labels?.paidButton || "Ya pagó"
                                        : labels?.unpaidButton ||
                                          "¿Pagó tarjeta?"
                                }
                            >
                                <Check className="h-3 w-3" />
                                {invitado.pago_tarjeta ? "Pagó" : "Tarjeta"}
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700"
                            title="Editar"
                        >
                            <Edit2 className="h-3 w-3" />
                            Editar
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(invitado.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[11px] font-medium text-red-600"
                            title="Eliminar"
                        >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                        </button>
                    </div>
                )}
            </div>
            {expanded && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3 md:px-3 md:py-2">
                    {invitado.tipo !== "familia" && invitado.restricciones && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-neutral-600">
                            <Utensils className="h-3 w-3" />
                            <span>{invitado.restricciones}</span>
                        </div>
                    )}
                    {invitado.tipo !== "familia" &&
                    personaConColados &&
                    songsByMember[invitado.nombre]?.length ? (
                        <div className="mb-2 flex items-start gap-2 text-xs text-neutral-600">
                            <Music className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="whitespace-pre-wrap break-words">
                                {songsByMember[invitado.nombre]!.join(" | ")}
                            </span>
                        </div>
                    ) : invitado.tipo !== "familia" &&
                      !personaConColados &&
                      invitado.cancion ? (
                        <div className="mb-2 flex items-start gap-2 text-xs text-neutral-600">
                            <Music className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="whitespace-pre-wrap break-words">
                                {invitado.cancion}
                            </span>
                        </div>
                    ) : null}
                    {invitado.tipo !== "familia" &&
                    titularExtraLines.length ? (
                        <div className="mb-3 flex items-start gap-2 text-xs text-neutral-600">
                            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="whitespace-pre-wrap break-words">
                                {titularExtraLines.join(" | ")}
                            </span>
                        </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                        {invitado.codigo && !invitado.registro_auto_rsvp && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSendInvitation(invitado);
                                }}
                                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white md:px-2 md:py-1 md:text-[11px]"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Send className="h-3 w-3" />
                                {labels?.sendInvite || "Enviar invitación"}
                            </button>
                        )}
                        {invitado.codigo && !invitado.registro_auto_rsvp && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreviewGuestInvitation(invitado);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 md:px-2 md:py-1 md:text-[11px]"
                            >
                                <Eye className="h-3 w-3" />
                                Ver
                            </button>
                        )}
                        {invitado.tipo !== "integrante" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                className="flex items-center gap-1 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 md:px-2 md:py-1 md:text-[11px]"
                            >
                                <Edit2 className="h-3 w-3" />
                                Editar
                            </button>
                        )}
                        {giftCardEnabled && invitado.tipo !== "integrante" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePago(invitado);
                                }}
                                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium md:px-2 md:py-1 md:text-[11px] ${invitado.pago_tarjeta ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}
                            >
                                <Check className="h-3 w-3" />
                                {invitado.pago_tarjeta
                                    ? labels?.paidButton || "Ya pagó"
                                    : labels?.unpaidButton || "¿Pagó tarjeta?"}
                            </button>
                        )}
                        {invitado.tipo !== "integrante" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(invitado.id);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-600 md:px-2 md:py-1 md:text-[11px]"
                            >
                                <Trash2 className="h-3 w-3" />
                                Eliminar
                            </button>
                        )}
                        {hasVariantLists && invitado.tipo !== "integrante" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canTransfer) onOpenTransfer();
                                }}
                                disabled={!canTransfer}
                                className="flex items-center gap-1 rounded-lg bg-neutral-200 px-2 py-1.5 text-[10px] font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-45 md:px-1.5 md:py-1 md:text-[10px]"
                            >
                                <ArrowLeftRight className="h-3 w-3 shrink-0" />
                                <span className="leading-[1] text-left">
                                    Cambiar
                                    <br />
                                    de lista
                                </span>
                            </button>
                        )}
                    </div>
                    {(esFamiliaConInts || personaConColados) && (
                        <div className="mt-3">
                            <p className="mb-2 text-xs font-medium text-neutral-700">
                                {personaConColados
                                    ? `${coladoTitlePlural(colSing)}:`
                                    : "Integrantes:"}
                            </p>
                            <div className="space-y-1">
                                {(personaConColados ? coladosRow : integrantesRow).map((i) => {
                                    const integranteExtraLines =
                                        panelExtraLinesForMember(
                                            invitado.mensaje &&
                                                invitado.mensaje !==
                                                    invitado.cancion
                                                ? invitado.mensaje
                                                : undefined,
                                            i.nombre,
                                            [
                                                invitado.nombre,
                                                ...integranteNombres.filter(
                                                    (n) => n !== i.nombre,
                                                ),
                                            ],
                                        );
                                    return (
                                    <div
                                        key={i.id}
                                        className="flex items-start justify-between gap-2 rounded bg-white px-2 py-1"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="text-xs text-neutral-700">
                                                {i.nombre}
                                            </span>
                                            {i.es_colado && (
                                                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                                    {coladoTitleSingular(
                                                        colSing,
                                                    )}
                                                </span>
                                            )}
                                            {songsByMember[i.nombre]?.length ? (
                                                <div className="mt-0.5 flex items-start gap-1 text-[10px] text-neutral-600">
                                                    <Music className="mt-0.5 h-3 w-3 shrink-0" />
                                                    <span className="whitespace-pre-wrap break-words">
                                                        {songsByMember[
                                                            i.nombre
                                                        ].join(" | ")}
                                                    </span>
                                                </div>
                                            ) : null}
                                            {integranteExtraLines.length ? (
                                                <div className="mt-0.5 flex items-start gap-1 text-[10px] text-neutral-600">
                                                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                                                    <span className="whitespace-pre-wrap break-words">
                                                        {integranteExtraLines.join(
                                                            " | ",
                                                        )}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="flex shrink-0 items-start gap-2">
                                            {i.restricciones && (
                                                <span className="flex items-start gap-1 text-[10px] text-neutral-500">
                                                    <Utensils className="mt-0.5 h-3 w-3 shrink-0" />
                                                    <span className="whitespace-pre-wrap break-words">
                                                        {i.restricciones}
                                                    </span>
                                                </span>
                                            )}
                                            <span
                                                className="rounded px-2 py-0.5 text-[10px] font-medium"
                                                style={{
                                                    backgroundColor:
                                                        estadoBg[i.estado],
                                                    color: estadoText[i.estado],
                                                }}
                                            >
                                                {getEstadoTexto(
                                                    i.estado,
                                                    false,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                            {esFamiliaConInts && invitado.restricciones && (
                                <div className="mt-2 rounded bg-white px-2 py-2">
                                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                                        <Utensils className="h-3 w-3" />
                                        <span>{invitado.restricciones}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CounterInput({
    value,
    min,
    max,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) {
    const safe = Math.max(min, Math.min(max, Math.floor(value || 0)));
    const canDown = safe > min;
    const canUp = safe < max;
    return (
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
            <button
                type="button"
                onClick={() => canDown && onChange(safe - 1)}
                disabled={!canDown}
                className="h-8 w-8 rounded-md bg-neutral-100 text-lg leading-none text-neutral-700 disabled:opacity-40"
            >
                -
            </button>
            <span className="min-w-[40px] text-center text-base font-semibold text-neutral-800">
                {safe}
            </span>
            <button
                type="button"
                onClick={() => canUp && onChange(safe + 1)}
                disabled={!canUp}
                className="h-8 w-8 rounded-md bg-neutral-100 text-lg leading-none text-neutral-700 disabled:opacity-40"
            >
                +
            </button>
        </div>
    );
}

function AddInvitadoModal({
    panelId,
    panelVariant,
    primaryColor,
    soloPersona,
    coladosEnabled,
    coladoLabel,
    limiteColadosMax = DEFAULT_LIMITE_COLADOS_PANEL,
    onClose,
    onSuccess,
    onLimitReached,
    shouldInterceptDebt,
}: {
    panelId: string;
    panelVariant: string;
    primaryColor: string;
    soloPersona?: boolean;
    coladosEnabled?: boolean;
    coladoLabel?: string;
    /** Máximo cupo de colados por invitado (desde `rsvpPanel.limiteColados`). */
    limiteColadosMax?: number;
    onClose: () => void;
    onSuccess: () => void;
    onLimitReached?: () => void;
    /**
     * Si devuelve true, no se ejecuta el guardado (p. ej. modal de deuda).
     * Se evalúa con plazas actuales antes de guardar.
     */
    shouldInterceptDebt?: () => boolean;
}) {
    const [tipo, setTipo] = useState<"persona" | "familia">("persona");
    const [nombre, setNombre] = useState("");
    const [integrantes, setIntegrantes] = useState<string[]>([]);
    const [newIntegrante, setNewIntegrante] = useState("");
    const [saving, setSaving] = useState(false);
    const [cupoColados, setCupoColados] = useState(0);
    const colSing = normalizeColadoSingular(coladoLabel);
    const colPlur = coladoPlural(colSing);
    const integranteInputRef = useRef<HTMLInputElement>(null);
    const focusIntegranteInput = useCallback(() => {
        window.requestAnimationFrame(() => {
            integranteInputRef.current?.focus();
        });
    }, []);
    const handleAddIntegrante = () => {
        if (integrantes.length >= FAMILIA_INTEGRANTES_MAX) return;
        const trimmed = trimInvitadoNombre(newIntegrante);
        if (!trimmed) {
            focusIntegranteInput();
            return;
        }
        const integranteError = validateIntegranteNombre(trimmed);
        if (integranteError) {
            alert(integranteError);
            return;
        }
        setIntegrantes([...integrantes, trimmed]);
        setNewIntegrante("");
        focusIntegranteInput();
    };
    const handleRemoveIntegrante = (idx: number) =>
        setIntegrantes(integrantes.filter((_, i) => i !== idx));
    const handleSave = async () => {
        const nombreError = validateInvitadoNombre(nombre);
        if (nombreError) {
            alert(nombreError);
            return;
        }
        if (!nombre.trim()) return;
        const finalIntegrantes = [...integrantes];
        const effectiveTipo = soloPersona ? "persona" : tipo;
        if (
            effectiveTipo === "familia" &&
            integranteInputRef.current?.value.trim() &&
            finalIntegrantes.length < FAMILIA_INTEGRANTES_MAX
        )
            finalIntegrantes.push(
                trimInvitadoNombre(integranteInputRef.current.value),
            );
        if (effectiveTipo === "familia") {
            const countError = validateFamiliaIntegrantesCount(finalIntegrantes);
            if (countError) {
                alert(countError);
                return;
            }
            const integrantesError =
                validateIntegrantesNombres(finalIntegrantes);
            if (integrantesError) {
                alert(integrantesError);
                return;
            }
        }
        if (shouldInterceptDebt?.()) return;
        setSaving(true);
        try {
            const res = await fetch(
                `/api/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        tipo: effectiveTipo,
                        cupo_colados: coladosEnabled
                            ? Math.max(
                                  0,
                                  Math.min(limiteColadosMax, cupoColados),
                              )
                            : 0,
                        integrantes:
                            effectiveTipo === "familia"
                                ? finalIntegrantes
                                : undefined,
                    }),
                },
            );
            const j = (await res.json().catch(() => ({}))) as {
                error?: string;
            };
            if (!res.ok) {
                if (
                    typeof j.error === "string" &&
                    /l[ií]mite de plazas|l[ií]mite/i.test(j.error)
                ) {
                    onLimitReached?.();
                }
                alert(
                    typeof j.error === "string" ? j.error : "Error al guardar",
                );
                return;
            }
            onSuccess();
        } catch {
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };
    const atMaxIntegrantes = integrantes.length >= FAMILIA_INTEGRANTES_MAX;
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-t-2xl bg-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-4 text-lg font-semibold">Agregar Invitado</h2>
                {!soloPersona && (
                    <div className="mb-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setTipo("persona")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium ${tipo === "persona" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"}`}
                        >
                            Persona
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo("familia")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium ${tipo === "familia" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"}`}
                        >
                            Familia
                        </button>
                    </div>
                )}
                <input
                    type="text"
                    placeholder={
                        soloPersona || tipo === "persona"
                            ? "Nombre completo"
                            : "Nombre de la familia (Ej: 'Flia Díaz')"
                    }
                    value={nombre}
                    maxLength={INVITADO_NOMBRE_MAX_LENGTH}
                    onChange={(e) =>
                        setNombre(
                            e.target.value.slice(0, INVITADO_NOMBRE_MAX_LENGTH),
                        )
                    }
                    className="mb-4 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
                />
                {!soloPersona && tipo === "familia" && (
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-neutral-700">
                            Integrantes:
                        </p>
                        <div className="mb-2 flex flex-wrap gap-2">
                            {integrantes.map((i, idx) => (
                                <span
                                    key={idx}
                                    className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm"
                                >
                                    {i}
                                    <button
                                        onClick={() =>
                                            handleRemoveIntegrante(idx)
                                        }
                                        className="text-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                ref={integranteInputRef}
                                type="text"
                                placeholder="Nombre del integrante"
                                value={newIntegrante}
                                disabled={atMaxIntegrantes}
                                maxLength={INVITADO_NOMBRE_MAX_LENGTH}
                                onChange={(e) =>
                                    setNewIntegrante(
                                        trimInvitadoNombre(e.target.value),
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    !atMaxIntegrantes &&
                                    handleAddIntegrante()
                                }
                                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                                type="button"
                                disabled={atMaxIntegrantes}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleAddIntegrante}
                                className="rounded-lg bg-neutral-100 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                {coladosEnabled && (
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-neutral-700">
                            Cupo de {colPlur}
                        </label>
                        <CounterInput
                            value={cupoColados}
                            min={0}
                            max={limiteColadosMax}
                            onChange={setCupoColados}
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                            Cantidad máxima de personas extra que pueden sumar
                            desde el RSVP (0 a {limiteColadosMax}).
                        </p>
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-600"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !nombre.trim()}
                        className="flex-1 rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function LimitHelpModal({ onClose }: { onClose: () => void }) {
    const waText = encodeURIComponent(
        "Hola! Necesito solicitar cupo de más invitados para el panel de mi evento.",
    );
    const waUrl = `https://wa.me/543456023759?text=${waText}`;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-2 text-lg font-semibold text-center">
                    Límite del panel alcanzado
                </h2>
                <p className="mb-6 text-sm text-neutral-600 text-center">
                    Para habilitar más invitados, contactá a Momento Único y
                    solicitá ampliación de cupo.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-700"
                    >
                        Cerrar
                    </button>
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-lg bg-emerald-600 py-3 text-center text-sm font-medium text-white"
                    >
                        Pedir más cupo
                    </a>
                </div>
            </div>
        </div>
    );
}

function PanelUsageHelpModal({
    onClose,
    confirmacion,
}: {
    onClose: () => void;
    confirmacion?: "formulario" | "comun";
}) {
    const isComun = confirmacion === "comun";
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-2 text-lg font-semibold">
                    Cómo usar el panel
                </h2>
                <p className="mb-4 text-sm text-neutral-600">
                    Guía rápida para gestionar invitados sin complicarte.
                </p>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm text-neutral-700">
                    <div>
                        <p className="font-semibold">1) Agregar invitados</p>
                        <p>
                            {isComun ? (
                                <>
                                    Tocá <strong>Agregar Invitado</strong>,
                                    cargá el nombre y guardá.
                                </>
                            ) : (
                                <>
                                    Tocá <strong>Agregar Invitado</strong>,
                                    elegí <strong>Persona</strong> o{" "}
                                    <strong>Familia</strong>, completá los datos
                                    y guardá. En familia, sumá integrantes con{" "}
                                    <strong>+</strong>.
                                </>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">
                            2) Enviar o ver la invitación
                        </p>
                        <p>
                            Tocá un invitado para expandirlo. Con{" "}
                            <strong>Enviar invitación</strong> abrís WhatsApp
                            con el link. Con <strong>Ver</strong> abrís la
                            invitación de esa persona para revisarla.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">3) Ver quién respondió</p>
                        <p>
                            Usá los filtros arriba: confirmados, pendientes, no
                            asisten y pago pendiente.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">
                            4) Corregir o borrar
                        </p>
                        <p>
                            <strong>Editar</strong> cambia nombres y estados.{" "}
                            <strong>Eliminar</strong> saca al invitado del
                            panel.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">5) Pagos de tarjeta</p>
                        <p>
                            Marcá <strong>¿Pagó tarjeta?</strong> si querés
                            llevar registro de quién va pagando y quién no. Con
                            el filtro <strong>Pago pendiente</strong> ves quién
                            todavía no pagó.
                        </p>
                    </div>
                    {!isComun && (
                        <div>
                            <p className="font-semibold">6) Íconos en la fila</p>
                            <p>
                                Si ves íconos junto al nombre, el invitado dejó
                                alimentación, canción u otro dato extra.
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">
                            {isComun ? "6" : "7"}) Sin cupo
                        </p>
                        <p>
                            Si aparece límite alcanzado, usá{" "}
                            <strong>Pedir más cupo</strong> para contactarnos.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full shrink-0 rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-700"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}

function TransferListModal({
    invitado,
    variants,
    primaryColor,
    onClose,
    onConfirm,
}: {
    invitado: Invitado;
    variants: PanelVariantConfig[];
    primaryColor: string;
    onClose: () => void;
    onConfirm: (nextVariant: string) => Promise<void>;
}) {
    const [selectedVariant, setSelectedVariant] = useState(
        variants[0]?.id || "",
    );
    const [saving, setSaving] = useState(false);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-neutral-800">
                    Cambiar de lista
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                    {invitado.nombre}
                </p>
                <div className="mt-4 space-y-2">
                    {variants.map((variant) => (
                        <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariant(variant.id)}
                            className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm"
                            style={{
                                borderColor:
                                    selectedVariant === variant.id
                                        ? primaryColor
                                        : "#E5E7EB",
                                backgroundColor:
                                    selectedVariant === variant.id
                                        ? "rgba(0,0,0,0.03)"
                                        : "#FFF",
                            }}
                        >
                            <span>{variant.label}</span>
                            {selectedVariant === variant.id ? (
                                <Check
                                    className="h-4 w-4"
                                    style={{ color: primaryColor }}
                                />
                            ) : null}
                        </button>
                    ))}
                </div>
                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-700"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={!selectedVariant || saving}
                        onClick={async () => {
                            if (!selectedVariant) return;
                            const targetLabel =
                                variants.find((v) => v.id === selectedVariant)
                                    ?.label || selectedVariant;
                            const ok = window.confirm(
                                `¿Seguro que quieres cambiar a este invitado a la lista "${targetLabel}"?`,
                            );
                            if (!ok) return;
                            setSaving(true);
                            try {
                                await onConfirm(selectedVariant);
                            } catch (error) {
                                alert(
                                    error instanceof Error
                                        ? error.message
                                        : "No se pudo cambiar de lista",
                                );
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="flex-1 rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

function BulkTransferListModal({
    invitados,
    canTransfer,
    variants,
    primaryColor,
    onClose,
    onConfirm,
}: {
    invitados: Invitado[];
    canTransfer: (inv: Invitado) => boolean;
    variants: PanelVariantConfig[];
    primaryColor: string;
    onClose: () => void;
    onConfirm: (invitadoIds: string[], nextVariant: string) => Promise<void>;
}) {
    const [selectedVariant, setSelectedVariant] = useState(
        variants[0]?.id || "",
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const transferibles = invitados.filter(canTransfer);
    const bloqueados = invitados.length - transferibles.length;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-neutral-800">
                    Cambiar invitados de lista
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                    Seleccioná invitados o familias y movelos a otra lista.
                </p>
                <div className="mt-3 space-y-2">
                    {variants.map((variant) => (
                        <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariant(variant.id)}
                            className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm"
                            style={{
                                borderColor:
                                    selectedVariant === variant.id
                                        ? primaryColor
                                        : "#E5E7EB",
                                backgroundColor:
                                    selectedVariant === variant.id
                                        ? "rgba(0,0,0,0.03)"
                                        : "#FFF",
                            }}
                        >
                            <span>Mover a: {variant.label}</span>
                            {selectedVariant === variant.id ? (
                                <Check
                                    className="h-4 w-4"
                                    style={{ color: primaryColor }}
                                />
                            ) : null}
                        </button>
                    ))}
                </div>
                <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-neutral-200">
                    {transferibles.map((inv) => {
                        const selected = selectedIds.includes(inv.id);
                        return (
                            <button
                                key={inv.id}
                                type="button"
                                onClick={() =>
                                    setSelectedIds((prev) =>
                                        selected
                                            ? prev.filter((id) => id !== inv.id)
                                            : [...prev, inv.id],
                                    )
                                }
                                className="flex w-full items-center justify-between border-b border-neutral-100 px-3 py-2 text-left last:border-b-0"
                                style={{
                                    backgroundColor: selected
                                        ? "rgba(122,95,69,0.12)"
                                        : "#FFF",
                                    borderLeft: selected
                                        ? `3px solid ${primaryColor}`
                                        : "3px solid transparent",
                                }}
                            >
                                <span
                                    className="text-sm"
                                    style={{
                                        color: selected ? "#2F2A26" : "#262626",
                                        fontWeight: 500,
                                    }}
                                >
                                    {inv.nombre}
                                </span>
                                {selected ? (
                                    <span
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white"
                                        style={{
                                            backgroundColor: primaryColor,
                                        }}
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                    {selectedIds.length} seleccionado(s)
                    {bloqueados > 0
                        ? ` · ${bloqueados} bloqueado(s) por estado`
                        : ""}
                </div>
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-700"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={
                            !selectedVariant || !selectedIds.length || saving
                        }
                        onClick={async () => {
                            if (!selectedVariant || !selectedIds.length) return;
                            const targetLabel =
                                variants.find((v) => v.id === selectedVariant)
                                    ?.label || selectedVariant;
                            const ok = window.confirm(
                                `¿Seguro que quieres cambiar a los invitados seleccionados a la lista "${targetLabel}"?`,
                            );
                            if (!ok) return;
                            setSaving(true);
                            try {
                                await onConfirm(selectedIds, selectedVariant);
                            } catch (error) {
                                alert(
                                    error instanceof Error
                                        ? error.message
                                        : "No se pudo cambiar de lista",
                                );
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="flex-1 rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditInvitadoModal({
    panelId,
    invitado,
    primaryColor,
    coladosEnabled,
    coladoLabel,
    limiteColadosMax = DEFAULT_LIMITE_COLADOS_PANEL,
    onClose,
    onSuccess,
}: {
    panelId: string;
    invitado: Invitado;
    primaryColor: string;
    coladosEnabled?: boolean;
    coladoLabel?: string;
    limiteColadosMax?: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [nombre, setNombre] = useState(invitado.nombre);
    const [estado, setEstado] = useState<
        "pendiente" | "confirmado" | "no_asiste"
    >(invitado.estado);
    const [integrantes, setIntegrantes] = useState<
        Array<{
            id: string;
            nombre: string;
            estado: "pendiente" | "confirmado" | "no_asiste";
            es_colado?: boolean;
        }>
    >(
        invitado.integrantes?.map((i) => ({
            id: i.id,
            nombre: i.nombre,
            estado: i.estado,
            es_colado: Boolean(i.es_colado),
        })) || [],
    );
    const [editingIntegranteIdx, setEditingIntegranteIdx] = useState<
        number | null
    >(null);
    const [newIntegrante, setNewIntegrante] = useState("");
    const [cupoColados, setCupoColados] = useState(
        typeof invitado.cupo_colados === "number"
            ? Math.max(
                  0,
                  Math.min(limiteColadosMax, Math.floor(invitado.cupo_colados)),
              )
            : 0,
    );
    const colSing = normalizeColadoSingular(coladoLabel);
    const colPlur = coladoPlural(colSing);
    const [saving, setSaving] = useState(false);
    const integranteInputRef = useRef<HTMLInputElement>(null);
    const focusIntegranteInput = useCallback(() => {
        window.requestAnimationFrame(() => {
            integranteInputRef.current?.focus();
        });
    }, []);
    const handleAddIntegrante = () => {
        if (integrantes.length >= FAMILIA_INTEGRANTES_MAX) return;
        const trimmed = trimInvitadoNombre(newIntegrante);
        if (!trimmed) {
            focusIntegranteInput();
            return;
        }
        const integranteError = validateIntegranteNombre(trimmed);
        if (integranteError) {
            alert(integranteError);
            return;
        }
        setIntegrantes([
            ...integrantes,
            {
                id: `new-${Date.now()}`,
                nombre: trimmed,
                estado: "pendiente",
                es_colado: false,
            },
        ]);
        setNewIntegrante("");
        focusIntegranteInput();
    };
    const handleRemoveIntegrante = (idx: number) =>
        setIntegrantes(integrantes.filter((_, i) => i !== idx));
    const handleUpdateIntegrante = (idx: number, newNombre: string) => {
        const u = [...integrantes];
        u[idx] = {
            ...u[idx],
            nombre: trimInvitadoNombre(newNombre),
        };
        setIntegrantes(u);
    };
    const handleUpdateIntegranteEstado = (
        idx: number,
        newEstado: "pendiente" | "confirmado" | "no_asiste",
    ) => {
        if (integrantes[idx]?.estado === newEstado) return;
        const ok = confirm(
            "¿Confirmás cambiar el estado de asistencia de este integrante?",
        );
        if (!ok) return;
        const u = [...integrantes];
        u[idx] = { ...u[idx], estado: newEstado };
        setIntegrantes(u);
    };
    const handleUpdateEstadoPersona = (
        newEstado: "pendiente" | "confirmado" | "no_asiste",
    ) => {
        if (estado === newEstado) return;
        const ok = confirm(
            "¿Confirmás cambiar el estado de asistencia de este invitado?",
        );
        if (!ok) return;
        setEstado(newEstado);
    };
    const handleSave = async () => {
        const nombreError = validateInvitadoNombre(nombre);
        if (nombreError) {
            alert(nombreError);
            return;
        }
        if (!nombre.trim()) return;
        const finalIntegrantes = [...integrantes];
        if (
            invitado.tipo === "familia" &&
            integranteInputRef.current?.value.trim() &&
            finalIntegrantes.length < FAMILIA_INTEGRANTES_MAX
        )
            finalIntegrantes.push({
                id: `new-${Date.now()}`,
                nombre: trimInvitadoNombre(integranteInputRef.current.value),
                estado: "pendiente",
                es_colado: false,
            });
        if (invitado.tipo === "familia") {
            const countError = validateFamiliaIntegrantesCount(finalIntegrantes);
            if (countError) {
                alert(countError);
                return;
            }
            const integrantesError =
                validateIntegrantesNombres(finalIntegrantes);
            if (integrantesError) {
                alert(integrantesError);
                return;
            }
        }
        setSaving(true);
        try {
            const res = await fetch(
                `/api/panel/${panelId}/invitado/${invitado.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        estado:
                            invitado.tipo === "persona" ? estado : undefined,
                        cupo_colados: coladosEnabled
                            ? Math.max(
                                  0,
                                  Math.min(limiteColadosMax, cupoColados),
                              )
                            : 0,
                        integrantes:
                            invitado.tipo === "familia"
                                ? finalIntegrantes
                                : undefined,
                    }),
                },
            );
            const j = (await res.json().catch(() => ({}))) as {
                error?: string;
            };
            if (!res.ok) {
                alert(
                    typeof j.error === "string" ? j.error : "Error al guardar",
                );
                return;
            }
            onSuccess();
        } catch {
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };
    const atMaxIntegrantes = integrantes.length >= FAMILIA_INTEGRANTES_MAX;
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-t-2xl bg-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-4 text-lg font-semibold">Editar Invitado</h2>
                <input
                    type="text"
                    placeholder="Nombre"
                    value={nombre}
                    maxLength={INVITADO_NOMBRE_MAX_LENGTH}
                    onChange={(e) =>
                        setNombre(
                            e.target.value.slice(0, INVITADO_NOMBRE_MAX_LENGTH),
                        )
                    }
                    className="mb-4 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none"
                />
                {invitado.tipo === "persona" && (
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-neutral-700">
                            Estado de asistencia:
                        </p>
                        <div className="flex gap-2">
                            {(
                                [
                                    "pendiente",
                                    "confirmado",
                                    "no_asiste",
                                ] as const
                            ).map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => handleUpdateEstadoPersona(e)}
                                    title={
                                        e === "confirmado"
                                            ? "Asiste"
                                            : e === "no_asiste"
                                              ? "No asiste"
                                              : "Pendiente"
                                    }
                                    className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-[10px] font-medium ${estado === e ? "" : "bg-neutral-100 text-neutral-500"}`}
                                    style={
                                        estado === e
                                            ? {
                                                  backgroundColor:
                                                      e === "confirmado"
                                                          ? "#d4edda"
                                                          : e === "no_asiste"
                                                            ? "#f5d5d5"
                                                            : "#9ca3af",
                                                  color:
                                                      e === "confirmado"
                                                          ? "#155724"
                                                          : e === "no_asiste"
                                                            ? "#8b6b6b"
                                                            : "#111827",
                                              }
                                            : undefined
                                    }
                                >
                                    {e === "confirmado" ? (
                                        <Check className="h-4 w-4" />
                                    ) : e === "no_asiste" ? (
                                        <X className="h-4 w-4" />
                                    ) : (
                                        <span>Pendiente</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {coladosEnabled && (
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-neutral-700">
                            Cupo de {colPlur}
                        </label>
                        <CounterInput
                            value={cupoColados}
                            min={0}
                            max={limiteColadosMax}
                            onChange={setCupoColados}
                        />
                    </div>
                )}
                {invitado.tipo === "familia" && (
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-neutral-700">
                            Integrantes:
                        </p>
                        <div className="mb-2 space-y-2">
                            {integrantes.map((i, idx) => (
                                <div
                                    key={i.id}
                                    className="rounded-lg border border-neutral-200 p-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={i.nombre}
                                            maxLength={INVITADO_NOMBRE_MAX_LENGTH}
                                            onChange={(e) =>
                                                handleUpdateIntegrante(
                                                    idx,
                                                    e.target.value,
                                                )
                                            }
                                            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditingIntegranteIdx(idx)
                                            }
                                            title="Editar estado de asistencia"
                                            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium leading-none"
                                            style={{
                                                backgroundColor:
                                                    i.estado === "confirmado"
                                                        ? "#d4edda"
                                                        : i.estado ===
                                                            "no_asiste"
                                                          ? "#f5d5d5"
                                                          : "#9ca3af",
                                                color:
                                                    i.estado === "confirmado"
                                                        ? "#155724"
                                                        : i.estado ===
                                                            "no_asiste"
                                                          ? "#8b6b6b"
                                                          : "#111827",
                                            }}
                                        >
                                            <span>
                                                {i.estado === "confirmado"
                                                    ? "Asiste"
                                                    : i.estado === "no_asiste"
                                                      ? "No asiste"
                                                      : "Pendiente"}
                                            </span>
                                            <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleRemoveIntegrante(idx)
                                            }
                                            className="rounded-lg bg-red-100 p-2 text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                ref={integranteInputRef}
                                type="text"
                                placeholder="Agregar integrante"
                                value={newIntegrante}
                                disabled={atMaxIntegrantes}
                                maxLength={INVITADO_NOMBRE_MAX_LENGTH}
                                onChange={(e) =>
                                    setNewIntegrante(
                                        trimInvitadoNombre(e.target.value),
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    !atMaxIntegrantes &&
                                    handleAddIntegrante()
                                }
                                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                                type="button"
                                disabled={atMaxIntegrantes}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleAddIntegrante}
                                className="rounded-lg bg-neutral-100 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {editingIntegranteIdx !== null &&
                            integrantes[editingIntegranteIdx] && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                                    onClick={() =>
                                        setEditingIntegranteIdx(null)
                                    }
                                >
                                    <div
                                        className="w-full max-w-sm rounded-2xl bg-white p-5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3 className="mb-2 text-base font-semibold text-center">
                                            Editar estado
                                        </h3>
                                        <p className="mb-4 text-center text-sm text-neutral-600">
                                            {
                                                integrantes[
                                                    editingIntegranteIdx
                                                ].nombre
                                            }
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {(
                                                [
                                                    "pendiente",
                                                    "confirmado",
                                                    "no_asiste",
                                                ] as const
                                            ).map((e) => (
                                                <button
                                                    key={e}
                                                    type="button"
                                                    onClick={() => {
                                                        handleUpdateIntegranteEstado(
                                                            editingIntegranteIdx,
                                                            e,
                                                        );
                                                        setEditingIntegranteIdx(
                                                            null,
                                                        );
                                                    }}
                                                    className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-[10px] font-medium ${integrantes[editingIntegranteIdx].estado === e ? "" : "bg-neutral-100 text-neutral-500"}`}
                                                    style={
                                                        integrantes[
                                                            editingIntegranteIdx
                                                        ].estado === e
                                                            ? {
                                                                  backgroundColor:
                                                                      e ===
                                                                      "confirmado"
                                                                          ? "#d4edda"
                                                                          : e ===
                                                                              "no_asiste"
                                                                            ? "#f5d5d5"
                                                                            : "#9ca3af",
                                                                  color:
                                                                      e ===
                                                                      "confirmado"
                                                                          ? "#155724"
                                                                          : e ===
                                                                              "no_asiste"
                                                                            ? "#8b6b6b"
                                                                            : "#111827",
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    {e === "confirmado"
                                                        ? "Asiste"
                                                        : e === "no_asiste"
                                                          ? "No asiste"
                                                          : "Pendiente"}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditingIntegranteIdx(null)
                                            }
                                            className="mt-4 w-full rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-700"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            )}
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-neutral-100 py-3 text-sm font-medium text-neutral-600"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !nombre.trim()}
                        className="flex-1 rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
