"use client"

import { Languages } from "lucide-react"
import { useEffect, useId, useState } from "react"
import type { LandingTdyTheme } from "@/components/landing/landing-tdy-page"

export type LandingTdyLocale = "es" | "en"

function handleHeaderAnchorClick(event: React.MouseEvent<HTMLAnchorElement>, anchor: string, afterNavigate?: () => void) {
  if (!anchor.startsWith("#")) {
    afterNavigate?.()
    return
  }
  event.preventDefault()
  const targetId = anchor.slice(1)
  if (!targetId) {
    window.scrollTo({ top: 0, behavior: "smooth" })
  } else {
    const target = document.getElementById(targetId)
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, "", cleanUrl)
  afterNavigate?.()
}

function NavLinks({
  nav,
  tx,
  onNavigate,
  className,
}: {
  nav: { label: string; anchor: string }[]
  tx: LandingTdyTheme["text"]
  onNavigate?: () => void
  className?: string
}) {
  return (
    <>
      {nav.map((item) => (
        <a
          key={item.anchor + item.label}
          href={item.anchor}
          onClick={(event) => handleHeaderAnchorClick(event, item.anchor, onNavigate)}
          className={className}
          style={{ color: tx.muted, opacity: 0.92 }}
        >
          {item.label}
        </a>
      ))}
    </>
  )
}

export function LandingTdyHeader({
  theme,
  brand,
  nav,
  cta,
  locale,
  onLocaleChange,
  languageToggle = true,
}: {
  theme: LandingTdyTheme
  brand: string
  nav: { label: string; anchor: string }[]
  cta?: { label: string; anchor: string }
  locale: LandingTdyLocale
  onLocaleChange: (l: LandingTdyLocale) => void
  /** Si hay un solo idioma de datos, ocultar ES | EN */
  languageToggle?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const tx = theme.text

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  const seg = (active: boolean) =>
    ({
      fontFamily: theme.typography.bodyFont,
      color: active ? theme.background : tx.muted,
      background: active ? theme.accents.softGold : "transparent",
    }) as React.CSSProperties

  const closeMenu = () => setMenuOpen(false)
  const menuLabel = locale === "es" ? "Abrir menú" : "Open menu"
  const menuLabelClose = locale === "es" ? "Cerrar menú" : "Close menu"

  return (
    <header
      className="sticky top-0 z-[45] border-b backdrop-blur-md"
      style={{
        borderColor: theme.cardBorder,
        backgroundColor: `${theme.background}e6`,
        paddingTop: "max(0.65rem, env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-2.5 md:px-8 md:py-3">
        <div className="flex items-center justify-between gap-3">
          <a
            href="#"
            className="shrink-0 text-lg font-normal tracking-tight transition-opacity hover:opacity-80 md:text-xl"
            style={{ fontFamily: theme.typography.headingFont, color: tx.heading }}
            onClick={closeMenu}
          >
            {brand}
          </a>

          <nav
            className="hidden flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] md:flex lg:text-[11px]"
            aria-label={locale === "es" ? "Principal" : "Main"}
          >
            <NavLinks
              nav={nav}
              tx={tx}
              className="transition-colors duration-200 hover:opacity-100"
            />
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {languageToggle ? (
              <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label={locale === "es" ? "Idioma" : "Language"}
              >
                <Languages
                  className="pointer-events-none h-3.5 w-3.5 shrink-0"
                  style={{ color: theme.accents.softGold }}
                  aria-hidden
                />
                <div
                  className="flex rounded-full border p-0.5"
                  style={{ borderColor: theme.cardBorder, background: theme.cardBg }}
                >
                  <button
                    type="button"
                    onClick={() => onLocaleChange("es")}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-[color,background] duration-200"
                    style={seg(locale === "es")}
                    aria-pressed={locale === "es"}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => onLocaleChange("en")}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-[color,background] duration-200"
                    style={seg(locale === "en")}
                    aria-pressed={locale === "en"}
                  >
                    EN
                  </button>
                </div>
              </div>
            ) : null}

            {cta ? (
              <a
                href={cta.anchor}
                onClick={(event) => handleHeaderAnchorClick(event, cta.anchor)}
                className="hidden rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-[background,color,transform] duration-200 hover:scale-[1.02] md:inline-flex"
                style={{
                  borderColor: theme.foreground,
                  color: theme.foreground,
                  background: theme.background,
                }}
              >
                {cta.label}
              </a>
            ) : null}

            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center md:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? menuLabelClose : menuLabel}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="relative block h-2 w-[22px]">
                <span
                  className="absolute left-0 top-0 block h-0.5 w-full rounded-full transition-transform duration-300 ease-out motion-reduce:duration-75"
                  style={{
                    backgroundColor: tx.heading,
                    transformOrigin: "50% 50%",
                    transform: menuOpen ? "translateY(3px) rotate(45deg)" : "translateY(0) rotate(0deg)",
                  }}
                />
                <span
                  className="absolute bottom-0 left-0 block h-0.5 w-full rounded-full transition-transform duration-300 ease-out motion-reduce:duration-75"
                  style={{
                    backgroundColor: tx.heading,
                    transformOrigin: "50% 50%",
                    transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : "translateY(0) rotate(0deg)",
                  }}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none md:hidden"
          style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr" }}
          aria-hidden={!menuOpen}
        >
          <div className={`min-h-0 overflow-hidden ${menuOpen ? "" : "pointer-events-none"}`}>
            <div
              className="border-t pt-4 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
              style={{
                borderColor: theme.cardBorder,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
              }}
            >
              <nav
                className="flex flex-col gap-1 pb-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
                aria-label={locale === "es" ? "Principal" : "Main"}
              >
                <NavLinks
                  nav={nav}
                  tx={tx}
                  onNavigate={closeMenu}
                  className="rounded-lg px-3 py-3 transition-colors duration-200 hover:bg-black/[0.04]"
                />
              </nav>
              {cta ? (
                <a
                  href={cta.anchor}
                  onClick={(event) => handleHeaderAnchorClick(event, cta.anchor, closeMenu)}
                  className="mb-4 mt-1 block rounded-full border px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition-[transform,opacity] duration-200 active:scale-[0.99]"
                  style={{
                    borderColor: theme.foreground,
                    color: theme.foreground,
                    background: theme.background,
                    opacity: menuOpen ? 1 : 0,
                  }}
                >
                  {cta.label}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
