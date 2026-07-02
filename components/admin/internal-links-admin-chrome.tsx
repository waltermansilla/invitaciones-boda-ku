"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  Laptop,
  Smartphone,
  User,
  Wifi,
} from "lucide-react"
import launcherConfig from "@/data/internal/admin-launcher.json"
import "./internal-links-admin-menu.css"

const ENV_STORAGE_KEY = "internal-admin-env-v1"
const MENU_CLOSE_MS = 280

type EnvIcon = "cloud" | "wifi" | "smartphone" | "laptop"
type MenuView = "main" | "env"

type LauncherEnvironment = {
  id: string
  label: string
  origin: string
  icon: EnvIcon
}

type LauncherDestination = {
  id: string
  label: string
  path: string
}

const envIconMap = {
  cloud: Cloud,
  wifi: Wifi,
  smartphone: Smartphone,
  laptop: Laptop,
} as const

function resolveProductionOrigin(fallback: string): string {
  const fromConfig = launcherConfig.environments.find((e) => e.id === "prod")
  const origin = fromConfig?.origin?.trim() || fallback.trim()
  return origin.replace(/\/+$/, "")
}

function buildAbsoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

export function InternalLinksAdminChrome({
  productionOrigin,
}: {
  productionOrigin: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [view, setView] = useState<MenuView>("main")
  const [pendingDestination, setPendingDestination] =
    useState<LauncherDestination | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  const viewRef = useRef<MenuView>("main")
  const lastToggleRef = useRef(0)

  viewRef.current = view

  const environments = launcherConfig.environments as LauncherEnvironment[]
  const destinations = launcherConfig.destinations as LauncherDestination[]

  const originsById = useCallback(() => {
    const prod = resolveProductionOrigin(productionOrigin)
    const map = new Map<string, string>()
    for (const env of environments) {
      map.set(env.id, env.id === "prod" ? prod : env.origin.replace(/\/+$/, ""))
    }
    return map
  }, [environments, productionOrigin])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true)
      setMenuVisible(false)
      return
    }

    setMenuVisible(false)
    const timer = window.setTimeout(() => {
      setMenuMounted(false)
      setView("main")
      setPendingDestination(null)
    }, MENU_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [menuOpen])

  useLayoutEffect(() => {
    if (!menuOpen || !menuMounted || !portalTarget) return

    setMenuVisible(false)
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setMenuVisible(true))
    })

    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [menuOpen, menuMounted, portalTarget])

  useEffect(() => {
    if (!menuOpen) return

    const { body } = document

    scrollYRef.current =
      window.scrollY || document.documentElement.scrollTop || 0

    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }

    body.style.position = "fixed"
    body.style.top = `-${scrollYRef.current}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (viewRef.current === "env") {
        setView("main")
        setPendingDestination(null)
        return
      }
      closeMenu()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      window.scrollTo(0, scrollYRef.current)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen, closeMenu])

  const openDestinationPicker = (dest: LauncherDestination) => {
    setPendingDestination(dest)
    setView("env")
  }

  const goBackToMain = () => {
    setView("main")
    window.setTimeout(() => setPendingDestination(null), 300)
  }

  const openWithEnvironment = (envId: string) => {
    if (!pendingDestination) return
    const origins = originsById()
    const origin = origins.get(envId)
    if (!origin) return
    const url = buildAbsoluteUrl(origin, pendingDestination.path)
    window.open(url, "_blank", "noopener,noreferrer")
    try {
      localStorage.setItem(ENV_STORAGE_KEY, envId)
    } catch {
      // ignore
    }
    closeMenu()
  }

  const showMainItems = menuVisible && view === "main"
  const showEnvItems = menuVisible && view === "env"

  return (
    <>
      <header
        id="internal-links-admin-header"
        className={`fixed top-0 right-0 left-0 border-b border-[#DECDB8] bg-[#FFFDF9]/95 backdrop-blur-md ${
          menuOpen ? "ilam-header-menu-open z-[10002]" : "z-[40]"
        }`}
      >
        <nav
          className="relative z-[10001] mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:h-16 sm:px-6"
          aria-label="Admin"
        >
          <User
            className="h-[22px] w-[22px] text-[#7A5F45]"
            aria-hidden
            strokeWidth={1.6}
          />

          <button
            type="button"
            className="ilam-menu-toggle flex h-10 w-10 items-center justify-center rounded-full text-[#3F332B] transition-colors hover:bg-[#F2EBE0]"
            aria-expanded={menuOpen}
            aria-controls="internal-links-admin-menu"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => {
              const now = Date.now()
              if (now - lastToggleRef.current < 400) return
              lastToggleRef.current = now
              setMenuOpen((open) => !open)
            }}
          >
            <span
              className={`ilam-menu-line ilam-menu-line-top ${menuOpen ? "is-open" : ""}`}
              aria-hidden
            />
            <span
              className={`ilam-menu-line ilam-menu-line-mid ${menuOpen ? "is-open" : ""}`}
              aria-hidden
            />
            <span
              className={`ilam-menu-line ilam-menu-line-bot ${menuOpen ? "is-open" : ""}`}
              aria-hidden
            />
          </button>
        </nav>
      </header>

      {menuMounted &&
        portalTarget &&
        createPortal(
          <div
            ref={menuRef}
            id="internal-links-admin-menu"
            data-menu-view={view}
            className={`ilam-mobile-menu fixed top-14 right-0 bottom-0 left-0 z-[10000] sm:top-16 ${menuVisible ? "is-open" : ""}`}
            aria-hidden={!menuVisible}
          >
            <button
              type="button"
              className="ilam-mobile-menu-backdrop"
              aria-label="Cerrar menú"
              onClick={closeMenu}
            />

            <div className="ilam-mobile-menu-panel !px-0">
              <div className="w-full flex-1 overflow-hidden">
                <div
                  className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    transform:
                      view === "env" ? "translateX(-50%)" : "translateX(0)",
                  }}
                >
                  <div className="box-border w-1/2 shrink-0 overflow-hidden px-5 sm:px-8">
                    <nav
                      className="ilam-mobile-menu-links !px-0"
                      aria-label="Destinos"
                    >
                      {destinations.map((dest, index) => (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => openDestinationPicker(dest)}
                          className={`ilam-mobile-menu-link ilam-dest-link ${showMainItems ? "is-visible" : ""}`}
                          style={{
                            transitionDelay: showMainItems
                              ? `${60 + index * 40}ms`
                              : "0ms",
                          }}
                        >
                          <span className="block min-w-0">{dest.label}</span>
                          <ChevronRight
                            className="ilam-mobile-menu-link-chevron"
                            strokeWidth={2}
                            aria-hidden
                          />
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="box-border w-1/2 shrink-0 overflow-hidden px-5 sm:px-8">
                    <button
                      type="button"
                      onClick={goBackToMain}
                      className={`ilam-env-back ${showEnvItems ? "is-visible" : ""}`}
                    >
                      <ChevronLeft
                        className="ilam-env-back-chevron"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span className="ilam-env-back-title">
                        {pendingDestination?.label ?? ""}
                      </span>
                    </button>

                    <nav
                      className="ilam-mobile-menu-links ilam-mobile-menu-links-env !px-0"
                      aria-label="Entornos"
                    >
                      {environments.map((env, index) => {
                        const Icon = envIconMap[env.icon] ?? Cloud
                        const origins = originsById()
                        const host = (origins.get(env.id) || "")
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")

                        return (
                          <button
                            key={env.id}
                            type="button"
                            onClick={() => openWithEnvironment(env.id)}
                            className={`ilam-mobile-menu-link ilam-env-link ${showEnvItems ? "is-visible" : ""}`}
                            style={{
                              transitionDelay: showEnvItems
                                ? `${80 + index * 40}ms`
                                : "0ms",
                            }}
                          >
                            <span className="ilam-env-link-icon">
                              <Icon
                                className="h-[1.15rem] w-[1.15rem]"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                            </span>
                            <span className="ilam-env-link-body">
                              <span className="block">{env.label}</span>
                              <span className="ilam-env-link-host">{host}</span>
                            </span>
                          </button>
                        )
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          portalTarget,
        )}

      <div className="h-14 shrink-0 sm:h-16" aria-hidden />
    </>
  )
}
