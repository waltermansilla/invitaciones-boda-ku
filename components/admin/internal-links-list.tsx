"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import type { InternalInviteRow } from "@/lib/internal-links-admin"
import { CopyLinkButton } from "@/components/admin/copy-link-button"

const tipoBadge: Record<string, string> = {
  boda: "#E6D6C3",
  xv: "#E8D8E9",
  baby: "#DCE8F2",
  cumple: "#F7E7DD",
  corporativo: "#DCE8DF",
}

export function InternalLinksList({
  rows,
  baseUrl,
}: {
  rows: InternalInviteRow[]
  baseUrl: string
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [activeTipo, setActiveTipo] = useState<string>("todos")
  const [query, setQuery] = useState("")
  const [sortByEventDate, setSortByEventDate] = useState(false)
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">("all")
  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  const isPastDate = (dateIso: string) => {
    const d = new Date(`${dateIso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return false
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return d.getTime() < today.getTime()
  }
  const toRelativeDisplay = (url: string) => {
    try {
      const u = new URL(url)
      return `${u.pathname}${u.search}${u.hash}`
    } catch {
      return url
    }
  }
  const tipoOrder = ["boda", "xv", "baby", "cumple"]
  const tipos = Array.from(new Set(rows.map((r) => r.tipo))).sort((a, b) => {
    const ia = tipoOrder.indexOf(a)
    const ib = tipoOrder.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  const byTipo =
    activeTipo === "todos" ? rows : rows.filter((r) => r.tipo === activeTipo)
  const normalizedQuery = normalizeText(query.trim())
  const visibleRows = normalizedQuery
    ? byTipo.filter((r) => {
        const idText = r.fileId != null ? String(r.fileId) : ""
        const nameText = normalizeText(r.nombre)
        const tipoText = normalizeText(r.tipo)
        return (
          idText.includes(normalizedQuery) ||
          nameText.includes(normalizedQuery) ||
          tipoText.includes(normalizedQuery)
        )
      })
    : byTipo
  const byDate =
    sortByEventDate && dateFilter !== "all"
      ? visibleRows.filter((r) => {
          if (!r.eventDate) return false
          const past = isPastDate(r.eventDate)
          return dateFilter === "past" ? past : !past
        })
      : visibleRows
  const rowsFinal = sortByEventDate
    ? [...byDate].sort((a, b) => {
        const da = a.eventDate ? new Date(a.eventDate).getTime() : Number.MAX_SAFE_INTEGER
        const db = b.eventDate ? new Date(b.eventDate).getTime() : Number.MAX_SAFE_INTEGER
        return da - db
      })
    : byDate

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#DECDB8] bg-white px-3 py-2 shadow-[0_4px_14px_rgba(71,45,22,0.05)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm text-[#6A5C52]">
            Total invitaciones: <strong>{rows.length}</strong>
          </p>
          <div className="flex items-center gap-2">
            {sortByEventDate ? (
              <>
                <button
                  type="button"
                  onClick={() => setDateFilter((v) => (v === "upcoming" ? "all" : "upcoming"))}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                    dateFilter === "upcoming"
                      ? "border-[#7A5F45] bg-[#7A5F45] text-white"
                      : "border-[#D9CBB9] bg-[#FFFDF9] text-[#6A4F38]"
                  }`}
                  title="Filtrar no pasaron"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter((v) => (v === "past" ? "all" : "past"))}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                    dateFilter === "past"
                      ? "border-[#7A5F45] bg-[#7A5F45] text-white"
                      : "border-[#D9CBB9] bg-[#FFFDF9] text-[#6A4F38]"
                  }`}
                  title="Filtrar ya pasaron"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() =>
                setSortByEventDate((v) => {
                  const next = !v
                  if (!next) setDateFilter("all")
                  return next
                })
              }
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                sortByEventDate
                  ? "border-[#7A5F45] bg-[#7A5F45] text-white"
                  : "border-[#D9CBB9] bg-[#FFFDF9] text-[#6A4F38]"
              }`}
            >
              {sortByEventDate ? "Fecha: ON" : "Fecha: OFF"}
            </button>
          </div>
        </div>
        <div className="mb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ID, nombre o tipo..."
            className="w-full rounded-lg border border-[#D9CBB9] bg-[#FFFDF9] px-3 py-2 text-sm text-[#3F332B] outline-none placeholder:text-[#9A8B7C] focus:border-[#BDA587]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTipo("todos")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              activeTipo === "todos"
                ? "border-[#7A5F45] bg-[#7A5F45] text-white"
                : "border-[#D9CBB9] bg-[#FFFDF9] text-[#6A4F38]"
            }`}
          >
            Todos
          </button>
          {tipos.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setActiveTipo(tipo)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                activeTipo === tipo
                  ? "border-[#7A5F45] bg-[#7A5F45] text-white"
                  : "border-[#D9CBB9] bg-[#FFFDF9] text-[#6A4F38]"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {rowsFinal.length === 0 ? (
        <div className="rounded-xl border border-[#DECDB8] bg-white px-4 py-6 text-center text-sm text-[#7A6A5B]">
          No hay invitaciones que coincidan con el filtro.
        </div>
      ) : null}

      {rowsFinal.map((row) => {
        const key = `${row.tipo}/${row.slug}`
        const isOpen = openKey === key
        const fullSample = `${baseUrl}${row.sampleUrl}`
        const fullRealBase = `${baseUrl}${row.realBaseUrl}`
        const fullRealWithToken = row.realUrlWithToken ? `${baseUrl}${row.realUrlWithToken}` : null
        const fullReal = row.tokenEnabled && fullRealWithToken ? fullRealWithToken : fullRealBase
        const displayReal = toRelativeDisplay(fullReal)
        const displaySample = toRelativeDisplay(fullSample)

        return (
          <div
            key={key}
            className="overflow-hidden rounded-2xl border border-[#DECDB8] bg-white shadow-[0_4px_14px_rgba(71,45,22,0.05)]"
          >
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : key)}
              className="flex w-full items-center justify-between gap-3 bg-[#FFF9F3] px-4 py-3 text-left"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: row.tokenEnabled ? "#2FB36D" : "#E45858" }}
                  title={row.tokenEnabled ? "Protegida" : "Libre"}
                />
                <span className="rounded-md bg-[#EAD6BD] px-2.5 py-1 text-sm font-bold text-[#6A4F38]">
                  {row.fileId ?? "-"}
                </span>
                <p className="truncate text-sm font-semibold text-[#3F332B]">{row.nombre}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {sortByEventDate && row.eventDate ? (
                  <span
                    className="rounded-md bg-[#F2EEE7] px-2 py-0.5 text-[11px]"
                    style={{ color: isPastDate(row.eventDate) ? "#3E75B3" : "#6A5C52" }}
                  >
                    {row.eventDate}
                  </span>
                ) : null}
                <span
                  className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3F332B]"
                  style={{ backgroundColor: tipoBadge[row.tipo] || "#D9CBB9" }}
                >
                  {String(row.tipo || "-")}
                </span>
              </div>
            </button>

            {isOpen ? (
              <div className="space-y-3 border-t border-[#E8D8C4] bg-[#FFFCF8] px-4 py-3 text-sm">
                <div className="rounded-xl border border-[#DDEBDD] bg-[#F8FDF8] px-3 py-2">
                  <div className="flex w-full flex-nowrap items-center gap-2">
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#2F7E56]">
                      Real:
                    </span>
                    <a
                      className="block min-w-0 flex-1 truncate whitespace-nowrap pr-1 text-[13px] leading-tight text-[#2F7E56] underline underline-offset-2"
                      href={fullReal}
                      target="_blank"
                    >
                      {displayReal}
                    </a>
                    <div className="shrink-0">
                      <CopyLinkButton value={fullReal} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#EADDCF] bg-[#FFFCF8] px-3 py-2">
                  <div className="flex w-full flex-nowrap items-center gap-2">
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#7A5F45]">
                      Muestra:
                    </span>
                    <a
                      className="block min-w-0 flex-1 truncate whitespace-nowrap pr-1 text-[13px] leading-tight text-[#7A5F45] underline underline-offset-2"
                      href={fullSample}
                      target="_blank"
                    >
                      {displaySample}
                    </a>
                    <div className="shrink-0">
                      <CopyLinkButton value={fullSample} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#EFE5DA] bg-white p-3 text-xs text-[#7A6A5B]">
                  <p>
                    token activo: <strong>{row.tokenEnabled ? "sí" : "no"}</strong> | token cargado:{" "}
                    <strong>{row.tokenPresent ? "sí" : "no"}</strong> | hash:{" "}
                    <strong>{row.tokenHashPresent ? "sí" : "no"}</strong>
                  </p>
                  <p className="mt-1">
                    slug: <strong>{row.slug}</strong> | allowLegacyUntil:{" "}
                    <strong>{row.allowLegacyUntil || "-"}</strong>
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

