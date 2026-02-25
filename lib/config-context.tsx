"use client"

import { createContext, useContext } from "react"
import type { ClientConfig } from "./get-client-config"

interface ConfigContextValue {
  config: ClientConfig
  isMuestra: boolean
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

/**
 * Hook to access the current client config from any component.
 * Must be used within a ConfigProvider.
 */
export function useConfig(): ClientConfig {
  const ctx = useContext(ConfigContext)
  if (!ctx) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return ctx.config
}

/**
 * Hook to check if we are in muestra (portfolio) mode.
 * In muestra mode, sensitive links and forms are disabled.
 */
export function useIsMuestra(): boolean {
  const ctx = useContext(ConfigContext)
  return ctx?.isMuestra ?? false
}

/**
 * Provider that wraps the invitation and supplies the client config to all children.
 * Pass isMuestra={true} for portfolio/demo routes (/m/...).
 */
export function ConfigProvider({
  config,
  isMuestra = false,
  children,
}: {
  config: ClientConfig
  isMuestra?: boolean
  children: React.ReactNode
}) {
  return (
    <ConfigContext.Provider value={{ config, isMuestra }}>
      {children}
    </ConfigContext.Provider>
  )
}
