"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import FooterSection from "@/components/wedding/footer-section"

/* ─── Types ─── */
interface LandingTheme {
  background: string
  foreground: string
  accent: string
  accentForeground: string
  muted: string
  cardBg: string
  cardBorder: string
  footerBg: string
  footerText: string
}

interface LandingData {
  theme: LandingTheme
  whatsapp: { number: string; message: string }
  sections: {
    hero: {
      enabled: boolean
      title: string
      subtitle: string
      ctaText: string
      secondaryCtaText?: string
      secondaryCtaAnchor?: string
    }
    muestras: {
      enabled: boolean
      title: string
      description: string
      items: { tipo: string; slug: string; titulo: string; etiqueta: string }[]
    }
    servicio: {
      enabled: boolean
      title: string
      subtitle: string
      showPrices: boolean
      planes: {
        name: string
        badge: string | null
        price: string
        description: string
        features: string[]
      }[]
      sharedFeatures: { title: string; items: string[] }
    }
    proceso: {
      enabled: boolean
      title: string
      steps: { number: string; title: string; description: string }[]
      highlights: string[]
      ctaText: string
    }
    faq: {
      enabled: boolean
      title: string
      items: { question: string; answer: string }[]
    }
    ctaFinal: {
      enabled: boolean
      title: string
      subtitle: string
      ctaText: string
    }
  }
}

/* ─── Intersection Observer hook for fade-in ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

/* ─── WhatsApp URL builder ─── */
function waUrl(wa: { number: string; message: string }) {
  return `https://wa.me/${wa.number}?text=${encodeURIComponent(wa.message)}`
}

/* ─── Check icon SVG ─── */
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5" aria-hidden="true">
      <path d="M3.5 8.5L6.5 11.5L12.5 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ═══════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════ */
function HeroSection({ data, theme, wa }: { data: LandingData["sections"]["hero"]; theme: LandingTheme; wa: LandingData["whatsapp"] }) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(true) }, [])

  return (
    <section className="flex min-h-[85svh] flex-col items-center justify-center px-6 py-24 text-center" style={{ background: theme.background }}>
      <div
        className="mx-auto max-w-2xl transition-all duration-700 ease-out"
        style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(24px)" }}
      >
        <h1
          className="text-balance text-4xl font-light leading-tight tracking-tight md:text-5xl lg:text-6xl"
          style={{ color: theme.foreground }}
        >
          {data.title}
        </h1>
        <p
          className="mx-auto mt-6 max-w-lg text-pretty text-base leading-relaxed md:text-lg"
          style={{ color: theme.muted }}
        >
          {data.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={waUrl(wa)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center rounded-sm px-8 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            style={{ background: theme.accent, color: theme.accentForeground }}
          >
            {data.ctaText}
          </a>
          {data.secondaryCtaText && data.secondaryCtaAnchor && (
            <a
              href={data.secondaryCtaAnchor}
              className="inline-flex min-h-[52px] items-center justify-center rounded-sm border px-8 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 hover:bg-black/5"
              style={{ borderColor: theme.cardBorder, color: theme.foreground }}
            >
              {data.secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   MUESTRAS
   ═══════════════════════════════════════════════ */
function MuestrasSection({ data, theme }: { data: LandingData["sections"]["muestras"]; theme: LandingTheme }) {
  const fade = useFadeIn()

  return (
    <section
      id="muestras"
      className="px-6 py-20 md:py-28"
      style={{ background: theme.background }}
    >
      <div
        ref={fade.ref}
        className="mx-auto max-w-3xl transition-all duration-700 ease-out"
        style={{ opacity: fade.visible ? 1 : 0, transform: fade.visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <div className="mb-12 text-center">
          <h2
            className="text-balance text-2xl font-light tracking-tight md:text-3xl"
            style={{ color: theme.foreground }}
          >
            {data.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed md:text-base" style={{ color: theme.muted }}>
            {data.description}
          </p>
        </div>

        <div className="mx-auto grid max-w-lg gap-4">
          {data.items.map((item) => (
            <Link
              key={`${item.tipo}/${item.slug}`}
              href={`/m/${item.tipo}/${item.slug}`}
              className="group flex min-h-[60px] items-center justify-between rounded-sm border px-6 py-4 transition-all duration-200 hover:shadow-sm"
              style={{ background: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <span
                className="text-sm font-medium tracking-wide transition-all duration-200 group-hover:tracking-wider"
                style={{ color: theme.foreground }}
              >
                {item.titulo}
              </span>
              <span
                className="rounded-sm px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] uppercase"
                style={{ background: theme.accent + "0D", color: theme.muted }}
              >
                {item.etiqueta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   SERVICIO / PLANES
   ═══════════════════════════════════════════════ */
function ServicioSection({ data, theme, wa }: { data: LandingData["sections"]["servicio"]; theme: LandingTheme; wa: LandingData["whatsapp"] }) {
  const fade = useFadeIn()

  return (
    <section className="px-6 py-20 md:py-28" style={{ background: theme.accent + "06" }}>
      <div
        ref={fade.ref}
        className="mx-auto max-w-4xl transition-all duration-700 ease-out"
        style={{ opacity: fade.visible ? 1 : 0, transform: fade.visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <div className="mb-14 text-center">
          <h2 className="text-balance text-2xl font-light tracking-tight md:text-3xl" style={{ color: theme.foreground }}>
            {data.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed md:text-base" style={{ color: theme.muted }}>
            {data.subtitle}
          </p>
        </div>

        <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
          {data.planes.map((plan, i) => {
            const isPremium = i === 1
            return (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-sm border p-7 transition-all duration-200 hover:shadow-md"
                style={{
                  background: theme.cardBg,
                  borderColor: isPremium ? theme.accent + "40" : theme.cardBorder,
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-6 rounded-sm px-3 py-1 text-[10px] font-medium tracking-[0.15em] uppercase"
                    style={{ background: theme.accent, color: theme.accentForeground }}
                  >
                    {plan.badge}
                  </span>
                )}
                <h3
                  className="text-lg font-medium tracking-wide"
                  style={{ color: theme.foreground }}
                >
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: theme.muted }}>
                  {plan.description}
                </p>
                {data.showPrices && (
                  <p className="mt-5 text-3xl font-light" style={{ color: theme.foreground }}>
                    {plan.price}
                  </p>
                )}
                <ul className="mt-6 flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: theme.foreground }}>
                      <CheckIcon color={theme.accent} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-7">
                  <a
                    href={waUrl(wa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] w-full items-center justify-center rounded-sm text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                    style={
                      isPremium
                        ? { background: theme.accent, color: theme.accentForeground }
                        : { border: `1px solid ${theme.cardBorder}`, color: theme.foreground }
                    }
                  >
                    Elegir {plan.name}
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        {/* Shared features */}
        <div className="mt-14 text-center">
          <p className="mb-5 text-xs font-medium tracking-[0.15em] uppercase" style={{ color: theme.muted }}>
            {data.sharedFeatures.title}
          </p>
          <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {data.sharedFeatures.items.map((f) => (
              <span key={f} className="flex items-center gap-2 text-sm" style={{ color: theme.foreground }}>
                <CheckIcon color={theme.accent + "80"} />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   PROCESO / COMO FUNCIONA
   ═══════════════════════════════════════════════ */
function ProcesoSection({ data, theme, wa }: { data: LandingData["sections"]["proceso"]; theme: LandingTheme; wa: LandingData["whatsapp"] }) {
  const fade = useFadeIn()

  return (
    <section className="px-6 py-20 md:py-28" style={{ background: theme.background }}>
      <div
        ref={fade.ref}
        className="mx-auto max-w-3xl transition-all duration-700 ease-out"
        style={{ opacity: fade.visible ? 1 : 0, transform: fade.visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <h2 className="mb-14 text-center text-2xl font-light tracking-tight md:text-3xl" style={{ color: theme.foreground }}>
          {data.title}
        </h2>

        <div className="flex flex-col gap-10 md:flex-row md:gap-8">
          {data.steps.map((step, i) => (
            <div key={i} className="flex-1 text-center">
              <span
                className="mb-3 inline-block text-3xl font-extralight"
                style={{ color: theme.accent + "40" }}
              >
                {step.number}
              </span>
              <h3 className="mb-2 text-base font-medium tracking-wide" style={{ color: theme.foreground }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {data.highlights.map((h) => (
            <span key={h} className="flex items-center gap-2 text-sm" style={{ color: theme.muted }}>
              <span className="inline-block h-1 w-1 rounded-full" style={{ background: theme.accent + "60" }} />
              {h}
            </span>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={waUrl(wa)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center rounded-sm px-8 py-3 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            style={{ background: theme.accent, color: theme.accentForeground }}
          >
            {data.ctaText}
          </a>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════ */
function FaqItem({ q, a, theme }: { q: string; a: string; theme: LandingTheme }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b" style={{ borderColor: theme.cardBorder }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[56px] w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-4 text-sm font-medium" style={{ color: theme.foreground }}>{q}</span>
        <span
          className="shrink-0 text-xl font-light transition-transform duration-200"
          style={{ color: theme.muted, transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "300px" : "0px", opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-sm leading-relaxed" style={{ color: theme.muted }}>
          {a}
        </p>
      </div>
    </div>
  )
}

function FaqSection({ data, theme }: { data: LandingData["sections"]["faq"]; theme: LandingTheme }) {
  const fade = useFadeIn()

  return (
    <section className="px-6 py-20 md:py-28" style={{ background: theme.accent + "06" }}>
      <div
        ref={fade.ref}
        className="mx-auto max-w-2xl transition-all duration-700 ease-out"
        style={{ opacity: fade.visible ? 1 : 0, transform: fade.visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <h2 className="mb-10 text-center text-2xl font-light tracking-tight md:text-3xl" style={{ color: theme.foreground }}>
          {data.title}
        </h2>
        <div>
          {data.items.map((item, i) => (
            <FaqItem key={i} q={item.question} a={item.answer} theme={theme} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   CTA FINAL
   ═══════════════════════════════════════════════ */
function CtaFinalSection({ data, theme, wa }: { data: LandingData["sections"]["ctaFinal"]; theme: LandingTheme; wa: LandingData["whatsapp"] }) {
  const fade = useFadeIn()

  return (
    <section className="px-6 py-24 md:py-32" style={{ background: theme.background }}>
      <div
        ref={fade.ref}
        className="mx-auto max-w-xl text-center transition-all duration-700 ease-out"
        style={{ opacity: fade.visible ? 1 : 0, transform: fade.visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <h2 className="text-balance text-2xl font-light tracking-tight md:text-3xl" style={{ color: theme.foreground }}>
          {data.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed md:text-base" style={{ color: theme.muted }}>
          {data.subtitle}
        </p>
        <div className="mt-10">
          <a
            href={waUrl(wa)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[56px] items-center justify-center rounded-sm px-10 py-4 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{ background: theme.accent, color: theme.accentForeground }}
          >
            {data.ctaText}
          </a>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   LANDING FOOTER (wrapper around shared footer)
   ═══════════════════════════════════════════════ */
function LandingFooter({ theme }: { theme: LandingTheme }) {
  return (
    <div
      style={{
        "--primary": theme.footerBg,
        "--primary-foreground": theme.footerText,
      } as React.CSSProperties}
    >
      <FooterSection />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════ */
export default function LandingPage({ data }: { data: LandingData }) {
  const { theme, whatsapp: wa, sections } = data

  return (
    <main style={{ background: theme.background }}>
      {sections.hero.enabled && <HeroSection data={sections.hero} theme={theme} wa={wa} />}
      {sections.muestras.enabled && <MuestrasSection data={sections.muestras} theme={theme} />}
      {sections.servicio.enabled && <ServicioSection data={sections.servicio} theme={theme} wa={wa} />}
      {sections.proceso.enabled && <ProcesoSection data={sections.proceso} theme={theme} wa={wa} />}
      {sections.faq.enabled && <FaqSection data={sections.faq} theme={theme} />}
      {sections.ctaFinal.enabled && <CtaFinalSection data={sections.ctaFinal} theme={theme} wa={wa} />}
      <LandingFooter theme={theme} />
    </main>
  )
}
