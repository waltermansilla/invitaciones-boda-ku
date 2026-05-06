"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Download } from "lucide-react";
import { eventTypeLabelFromFolderTipo } from "@/lib/client-helpers-shared";
import type {
    ExtraInputA4BottomDef,
    ExtraInputA4Def,
} from "@/lib/panel-a4-extras";
import { resolveExtraValueFromStoredMensaje } from "@/lib/panel-a4-extras";

function sanitizeDocumentTitle(raw: string): string {
    return raw
        .replace(/[/\\:?*"<>|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

interface Integrante {
    id: string;
    nombre: string;
    estado: "pendiente" | "confirmado" | "no_asiste";
    restricciones?: string;
    mensaje?: string;
    cancion?: string;
    fecha_confirmacion?: string;
    es_colado?: boolean;
}

interface Invitado {
    id: string;
    nombre: string;
    tipo: "persona" | "familia" | "integrante";
    estado: "pendiente" | "confirmado" | "no_asiste";
    restricciones?: string;
    mensaje?: string;
    cancion?: string;
    integrantes?: Integrante[];
}

interface Evento {
    nombre_evento?: string;
    tipo_evento?: string;
    fecha_evento?: string;
}

interface PanelTheme {
    primaryColor?: string;
}

interface PanelVariantConfigLite {
    id: string;
    label: string;
}

interface PanelData {
    evento: Evento;
    invitados: Invitado[];
    stats: { confirmados: number; noAsisten: number; pendientes: number };
    panelConfig?: {
        theme?: PanelTheme;
        extraInputsA4?: ExtraInputA4Def[];
        /** Campos tipo `a4: "bottom"`: texto largo después de la tabla (nombre + mensaje). */
        extraInputsA4Bottom?: ExtraInputA4BottomDef[];
        variantes?: PanelVariantConfigLite[];
        activeVariante?: string;
    };
}

/** Solo si hay varias variantes: " (Nombre)" según label efectivo del JSON (`baseLabel` en default / `label` en el resto). */
function tituloVarianteA4Parentesis(panelConfig?: {
    variantes?: PanelVariantConfigLite[];
    activeVariante?: string;
}): string {
    const variantes = panelConfig?.variantes;
    if (!variantes || variantes.length <= 1) return "";
    const idRaw = panelConfig?.activeVariante?.trim() || "default";
    const v = variantes.find((x) => x.id === idRaw);
    const lab = v?.label?.trim();
    if (!lab) return "";
    return ` (${lab})`;
}

interface PrintRow {
    nombre: string;
    tipo: string;
    titularGrupo: string;
    estado: Invitado["estado"];
    alimentos: string;
    extras: string[];
    sortOrder: number;
}

function extrasColumnasA4(
    defs: ExtraInputA4Def[],
    mensajeCrudo: string | undefined,
    personaNombre: string,
    permitirTituloSinNombre: boolean,
): string[] {
    return defs.map((d) =>
        resolveExtraValueFromStoredMensaje(
            mensajeCrudo,
            personaNombre,
            d.matchKeys,
            permitirTituloSinNombre,
        ),
    );
}

function estadoRankFromCodigo(estado: PrintRow["estado"]): number {
    if (estado === "confirmado") return 0;
    if (estado === "no_asiste") return 1;
    return 2;
}

/** Texto corto en planilla A4: Sí / No / - */
function estadoCeldaImpresion(estado: PrintRow["estado"]): string {
    if (estado === "confirmado") return "Sí";
    if (estado === "no_asiste") return "No";
    return "-";
}

/** Misma fila granular que la tabla (mensaje por persona/colado) para extras A4 tipo bottom. */
type LineaMensajeExtrasA4 = {
    nombre: string;
    mensajeParaExtras: string | undefined;
    allowOrphanTituloChunks: boolean;
    sortOrder: number;
    estado: Invitado["estado"];
    /** Vacío titular individual; " (Integrante de X)" / " (Colado de X)" como en la columna Tipo. */
    rolSuffix: string;
};

function invitadosLineasExtrasMensaje(invitados: Invitado[]) {
    const out: LineaMensajeExtrasA4[] = [];
    let order = 0;
    for (const inv of invitados) {
        if (inv.tipo === "familia" && Array.isArray(inv.integrantes)) {
            for (const integrante of inv.integrantes) {
                const sufijo = integrante.es_colado
                    ? ` (Colado de ${inv.nombre})`
                    : ` (Integrante de ${inv.nombre})`;
                out.push({
                    nombre: integrante.nombre,
                    mensajeParaExtras:
                        integrante.mensaje?.trim() || inv.mensaje,
                    allowOrphanTituloChunks: false,
                    sortOrder: order++,
                    estado: integrante.estado,
                    rolSuffix: sufijo,
                });
            }
            continue;
        }
        if (inv.tipo === "integrante") continue;
        const tieneIntegrantes =
            Array.isArray(inv.integrantes) && inv.integrantes.length > 0;

        out.push({
            nombre: inv.nombre,
            mensajeParaExtras: inv.mensaje?.trim(),
            allowOrphanTituloChunks: !tieneIntegrantes,
            sortOrder: order++,
            estado: inv.estado,
            rolSuffix: "",
        });

        if (tieneIntegrantes) {
            for (const integrante of inv.integrantes!) {
                const sufijo = integrante.es_colado
                    ? ` (Colado de ${inv.nombre})`
                    : ` (Integrante de ${inv.nombre})`;
                out.push({
                    nombre: integrante.nombre,
                    mensajeParaExtras:
                        integrante.mensaje?.trim() || inv.mensaje,
                    allowOrphanTituloChunks: false,
                    sortOrder: order++,
                    estado: integrante.estado,
                    rolSuffix: sufijo,
                });
            }
        }
    }

    out.sort((a, b) => {
        const byEstado =
            estadoRankFromCodigo(a.estado) - estadoRankFromCodigo(b.estado);
        if (byEstado !== 0) return byEstado;
        const byAlpha = a.nombre
            .trim()
            .toLocaleLowerCase("es")
            .localeCompare(b.nombre.trim().toLocaleLowerCase("es"), "es");
        if (byAlpha !== 0) return byAlpha;
        return a.sortOrder - b.sortOrder;
    });
    return out;
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
                ? `Error HTTP ${res.status}.`
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
    if (!json) throw new Error("Respuesta vacía del servidor.");
    return json as unknown as PanelData;
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
            const idxColon = chunk.indexOf(":");
            if (idxColon <= 0) return;
            const left = chunk.slice(0, idxColon).trim();
            const value = chunk.slice(idxColon + 1).trim();
            if (!value || !left) return;
            const memberName = left.includes(" - ")
                ? left.split(" - ")[0].trim()
                : left;
            if (!memberName) return;
            if (!out[memberName]) out[memberName] = [];
            out[memberName].push(value);
        });
    return out;
}

export default function PanelPrintPage({
    params,
}: {
    params: Promise<{ panelId: string }>;
}) {
    const [panelId, setPanelId] = useState<string | null>(null);
    const [panelVariant, setPanelVariant] = useState("default");

    useEffect(() => {
        params.then((p) => setPanelId(p.panelId));
    }, [params]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const pv = new URLSearchParams(window.location.search).get("pv");
        if (pv?.trim()) setPanelVariant(pv.trim());
    }, []);

    const panelApiUrl = panelId
        ? `/api/panel/${panelId}?pv=${encodeURIComponent(panelVariant)}`
        : null;
    const { data, error } = useSWR<PanelData>(panelApiUrl, fetcher);

    const listaInvitadosPdfTitle = useMemo(() => {
        if (!data?.evento) return sanitizeDocumentTitle("Lista invitados");
        const tipoRaw = String(data.evento.tipo_evento || "boda").toLowerCase();
        const tipoLabel = eventTypeLabelFromFolderTipo(tipoRaw);
        const nombre = (data.evento.nombre_evento || "").trim() || "Evento";
        const sufijo = tituloVarianteA4Parentesis(data.panelConfig);
        return sanitizeDocumentTitle(
            `Lista invitados ${tipoLabel} ${nombre}${sufijo}`,
        );
    }, [data]);

    useEffect(() => {
        document.title = listaInvitadosPdfTitle;
    }, [listaInvitadosPdfTitle]);

    const rows = useMemo<PrintRow[]>(() => {
        if (!data?.invitados) return [];
        const defs = data.panelConfig?.extraInputsA4 ?? [];
        const out: PrintRow[] = [];
        let order = 0;

        const alimentosCelda = (raw: string) => {
            const t = raw?.trim();
            return t.length ? t : "-";
        };

        for (const inv of data.invitados) {
            if (inv.tipo === "familia" && Array.isArray(inv.integrantes)) {
                const perMemberRestricciones = parsePerMemberValues(
                    inv.restricciones,
                );
                for (const integrante of inv.integrantes) {
                    const alimentos = alimentosCelda(
                        integrante.restricciones?.trim() ||
                            perMemberRestricciones[integrante.nombre]?.join(
                                ", ",
                            ) ||
                            "",
                    );
                    const mensajeParaExtras =
                        integrante.mensaje?.trim() || inv.mensaje;
                    out.push({
                        nombre: integrante.nombre,
                        tipo: integrante.es_colado
                            ? "Colado de"
                            : "Integrante de",
                        titularGrupo: inv.nombre,
                        estado: integrante.estado,
                        alimentos,
                        extras: extrasColumnasA4(
                            defs,
                            mensajeParaExtras?.trim(),
                            integrante.nombre,
                            false,
                        ),
                        sortOrder: order++,
                    });
                }
                continue;
            }
            if (inv.tipo === "integrante") continue;

            const perMemberRestricciones = parsePerMemberValues(
                inv.restricciones,
            );
            const tieneIntegrantes =
                Array.isArray(inv.integrantes) && inv.integrantes.length > 0;

            out.push({
                nombre: inv.nombre,
                tipo: "Invitado",
                titularGrupo: "",
                estado: inv.estado,
                alimentos: alimentosCelda(
                    perMemberRestricciones[inv.nombre]?.join(", ") ||
                        inv.restricciones?.trim() ||
                        "",
                ),
                extras: extrasColumnasA4(
                    defs,
                    inv.mensaje?.trim(),
                    inv.nombre,
                    !tieneIntegrantes,
                ),
                sortOrder: order++,
            });

            if (Array.isArray(inv.integrantes) && inv.integrantes.length > 0) {
                for (const integrante of inv.integrantes) {
                    const alimentos = alimentosCelda(
                        integrante.restricciones?.trim() ||
                            perMemberRestricciones[integrante.nombre]?.join(
                                ", ",
                            ) ||
                            "",
                    );
                    const mensajeParaExtras =
                        integrante.mensaje?.trim() || inv.mensaje;
                    out.push({
                        nombre: integrante.nombre,
                        tipo: integrante.es_colado
                            ? "Colado de"
                            : "Integrante de",
                        titularGrupo: inv.nombre,
                        estado: integrante.estado,
                        alimentos,
                        extras: extrasColumnasA4(
                            defs,
                            mensajeParaExtras?.trim(),
                            integrante.nombre,
                            false,
                        ),
                        sortOrder: order++,
                    });
                }
            }
        }
        return out.sort((a, b) => {
            const byEstado =
                estadoRankFromCodigo(a.estado) - estadoRankFromCodigo(b.estado);
            if (byEstado !== 0) return byEstado;
            const byAlpha = a.nombre
                .trim()
                .toLocaleLowerCase("es")
                .localeCompare(b.nombre.trim().toLocaleLowerCase("es"), "es");
            if (byAlpha !== 0) return byAlpha;
            return a.sortOrder - b.sortOrder;
        });
    }, [data]);

    const bloquesMensajesA4Bottom = useMemo(() => {
        const defs = data?.panelConfig?.extraInputsA4Bottom ?? [];
        const guests = data?.invitados;
        if (!guests?.length || !defs.length) return [];
        const lineas = invitadosLineasExtrasMensaje(guests);
        const bloques = defs.map((def) => {
            const entradas: {
                nombre: string;
                rolSuffix: string;
                texto: string;
            }[] = [];
            for (const L of lineas) {
                const v = resolveExtraValueFromStoredMensaje(
                    L.mensajeParaExtras,
                    L.nombre,
                    def.matchKeys,
                    L.allowOrphanTituloChunks,
                ).trim();
                if (!v || v === "-") continue;
                entradas.push({
                    nombre: L.nombre,
                    rolSuffix: L.rolSuffix,
                    texto: v,
                });
            }
            return { blockTitle: def.blockTitle, entradas };
        });
        return bloques.filter((b) => b.entradas.length > 0);
    }, [data]);

    /** Sin restricciones reales el grid usa "-"; esa columna se oculta si todos están vacíos. */
    const mostrarColumnaAlimentos = useMemo(
        () =>
            rows.some((r) => {
                const s = String(r.alimentos ?? "").trim();
                return s.length > 0 && s !== "-";
            }),
        [rows],
    );

    const printedAt = useMemo(
        () =>
            new Intl.DateTimeFormat("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(new Date()),
        [],
    );

    if (error) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Error cargando la hoja de impresión: {error.message}
                </p>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                <p className="text-sm text-neutral-500">Cargando hoja A4...</p>
            </main>
        );
    }

    const primaryColor =
        data.panelConfig?.theme?.primaryColor?.trim() || "#b8a88a";

    const extraInputsA4 = data.panelConfig?.extraInputsA4 ?? [];

    return (
        <main className="print-shell mx-auto max-w-5xl p-3 print:max-w-none print:p-0">
            <style jsx global>{`
                @page {
                    size: A4;
                    margin: 8mm;
                }
                @media print {
                    body {
                        background: #fff;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .panel-print-table tbody tr {
                        break-inside: avoid-page;
                        page-break-inside: avoid;
                    }
                    .panel-print-table tbody td {
                        page-break-inside: avoid;
                    }
                    thead {
                        display: table-header-group;
                    }
                    .panel-print-table th,
                    .panel-print-table td {
                        padding-top: 0.12rem !important;
                        padding-bottom: 0.12rem !important;
                        line-height: 1.2 !important;
                        white-space: normal !important;
                        overflow-wrap: anywhere !important;
                        word-break: break-word !important;
                    }
                    .panel-print-scroll {
                        overflow: visible !important;
                    }
                    .panel-print-table {
                        min-width: 0 !important;
                        width: 100% !important;
                        table-layout: auto !important;
                        font-size: 9px !important;
                    }
                    .panel-print-table th .panel-print-asiste-stack,
                    .panel-print-table th .panel-print-asiste-stack span {
                        font-size: 6px !important;
                        line-height: 1 !important;
                    }
                    .panel-print-table th.panel-print-col-nombre,
                    .panel-print-table td.panel-print-col-nombre {
                        white-space: nowrap !important;
                        overflow-wrap: normal !important;
                        word-break: normal !important;
                    }
                    .panel-print-bottom-block,
                    .panel-print-bottom-msg {
                        break-inside: avoid-page;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="no-print mb-4 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 md:flex-row md:items-center md:justify-between md:gap-0">
                <p className="w-full text-center text-sm text-neutral-600 md:w-auto md:text-left">
                    Vista A4 lista para guardar en PDF.
                </p>
                <div className="flex w-full gap-2 md:ml-auto md:w-auto md:justify-end">
                    <button
                        type="button"
                        onClick={() => window.close()}
                        className="inline-flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 md:flex-none md:px-4 md:text-xs"
                    >
                        <ArrowLeft
                            className="h-4 w-4 shrink-0"
                            aria-hidden
                        />
                        Volver
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            document.title = listaInvitadosPdfTitle;
                            window.print();
                        }}
                        style={{ backgroundColor: primaryColor }}
                        className="inline-flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-white md:flex-none md:px-4 md:text-xs"
                    >
                        <Download className="h-4 w-4 shrink-0" aria-hidden />
                        Guardar PDF
                    </button>
                </div>
            </div>

            <section className="rounded-lg border border-neutral-200 bg-white p-3 print:rounded-none print:border-0 print:p-0">
                <header className="mb-1.5 border-b border-neutral-200 pb-1.5 leading-tight">
                    <h1 className="text-base font-semibold tracking-wide text-neutral-800">
                        Lista de invitados
                        {tituloVarianteA4Parentesis(data.panelConfig)}
                    </h1>
                    <p className="text-[11px] text-neutral-600">
                        {data.evento?.nombre_evento || "Evento"} -{" "}
                        {data.evento?.tipo_evento || "boda"}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                        Emitido: {printedAt}
                    </p>
                </header>

                <div className="mb-1.5 grid grid-cols-4 gap-1.5 text-center text-[10px] leading-tight">
                    <div className="rounded border border-neutral-200 bg-neutral-50 px-1 py-1">
                        <p className="font-semibold tabular-nums text-neutral-800">
                            {rows.length}
                        </p>
                        <p className="text-[9px] text-neutral-500">Total</p>
                    </div>
                    <div className="rounded border border-neutral-200 bg-neutral-50 px-1 py-1">
                        <p className="font-semibold tabular-nums text-neutral-800">
                            {data.stats.confirmados}
                        </p>
                        <p className="text-[9px] text-neutral-500">Confirmados</p>
                    </div>
                    <div className="rounded border border-neutral-200 bg-neutral-50 px-1 py-1">
                        <p className="font-semibold tabular-nums text-neutral-800">
                            {data.stats.pendientes}
                        </p>
                        <p className="text-[9px] text-neutral-500">Pendientes</p>
                    </div>
                    <div className="rounded border border-neutral-200 bg-neutral-50 px-1 py-1">
                        <p className="font-semibold tabular-nums text-neutral-800">
                            {data.stats.noAsisten}
                        </p>
                        <p className="text-[9px] text-neutral-500">No asisten</p>
                    </div>
                </div>

                <div className="panel-print-scroll overflow-x-auto rounded border border-neutral-200">
                    <table className="panel-print-table min-w-[940px] print:min-w-0 w-full border-collapse text-left text-[10px] leading-tight table-auto">
                        <thead className="bg-neutral-100 text-[9px] uppercase tracking-wide text-neutral-700">
                            <tr>
                                <th className="border-b border-neutral-200 px-1 py-1 w-8">
                                    #
                                </th>
                                <th className="panel-print-col-nombre border-b border-neutral-200 px-1 py-1 whitespace-nowrap">
                                    Nombre
                                </th>
                                <th className="border-b border-neutral-200 px-1 py-1 whitespace-nowrap w-[74px]">
                                    Tipo
                                </th>
                                <th className="border-b border-neutral-200 px-1 py-1 w-[132px]">
                                    Grupo
                                </th>
                                <th className="border-b border-neutral-200 px-0.5 py-1 align-middle text-center font-medium normal-case tracking-normal">
                                    <span className="panel-print-asiste-stack inline-flex flex-col items-center gap-px leading-none text-[6px]">
                                        {"Asiste".split("").map((ch, i) => (
                                            <span key={i}>{ch}</span>
                                        ))}
                                    </span>
                                </th>
                                {mostrarColumnaAlimentos ? (
                                    <th className="border-b border-neutral-200 px-1 py-1">
                                        Alimentos
                                    </th>
                                ) : null}
                                {extraInputsA4.map((col) => (
                                    <th
                                        key={`a4-extra-${col.columnTitle}`}
                                        className="border-b border-neutral-200 px-1 py-1 normal-case tracking-normal first-letter:uppercase"
                                    >
                                        {col.columnTitle}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr
                                    key={`${row.sortOrder}-${row.nombre}-${idx}`}
                                    style={{
                                        backgroundColor:
                                            row.estado === "confirmado"
                                                ? "#e9f8ee"
                                                : row.estado === "no_asiste"
                                                  ? "#fdeeee"
                                                  : "#f3f4f6",
                                    }}
                                >
                                    <td className="border-b border-neutral-200 px-1 py-0.5 align-top tabular-nums text-neutral-500">
                                        {idx + 1}
                                    </td>
                                    <td className="panel-print-col-nombre border-b border-neutral-200 px-1 py-0.5 align-top font-medium text-neutral-800 whitespace-nowrap">
                                        {row.nombre}
                                    </td>
                                    <td className="border-b border-neutral-200 px-1 py-0.5 align-top whitespace-nowrap text-neutral-700">
                                        {row.tipo}
                                    </td>
                                    <td className="border-b border-neutral-200 px-1 py-0.5 align-top text-neutral-700">
                                        {row.titularGrupo ? (
                                            <span className="font-semibold">
                                                {row.titularGrupo}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td className="border-b border-neutral-200 px-1 py-0.5 align-top whitespace-nowrap text-neutral-700">
                                        {estadoCeldaImpresion(row.estado)}
                                    </td>
                                    {mostrarColumnaAlimentos ? (
                                        <td className="border-b border-neutral-200 px-1 py-0.5 align-top text-neutral-700">
                                            {row.alimentos}
                                        </td>
                                    ) : null}
                                    {row.extras.map((cell, xi) => (
                                        <td
                                            key={`x-${row.sortOrder}-${xi}`}
                                            className="border-b border-neutral-200 px-1 py-0.5 align-top text-neutral-700"
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {bloquesMensajesA4Bottom.map((bloque, bi) => (
                    <div
                        key={`a4-bot-${bloque.blockTitle}-${bi}`}
                        className="panel-print-bottom-block mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 print:mt-3 print:break-inside-avoid print:rounded-none print:border-neutral-300"
                    >
                        <h2 className="border-b border-neutral-300 pb-1.5 text-sm font-semibold tracking-wide text-neutral-800">
                            {bloque.blockTitle}
                        </h2>
                        <ul className="mt-2 list-none space-y-3 p-0 text-[11px] leading-snug">
                            {bloque.entradas.map((e, ei) => (
                                <li
                                    key={`${e.nombre}-${e.rolSuffix}-${ei}`}
                                    className="panel-print-bottom-msg rounded border border-neutral-200 bg-white px-2 py-1.5 print:border-neutral-300"
                                >
                                    <p className="m-0 text-neutral-900">
                                        <span className="font-semibold">
                                            {e.nombre}
                                        </span>
                                        {e.rolSuffix ? (
                                            <span className="font-normal text-neutral-600">
                                                {e.rolSuffix}
                                            </span>
                                        ) : null}
                                    </p>
                                    <p className="mt-1 m-0 whitespace-pre-wrap text-neutral-700">
                                        {e.texto}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
        </main>
    );
}
