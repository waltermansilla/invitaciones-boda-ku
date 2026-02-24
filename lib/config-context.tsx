"use client"

import { createContext, useContext } from "react"
import type { ClientConfig } from "./get-client-config"

const ConfigContext = createContext<ClientConfig | null>(null)

/**
 * Hook to access the current client config from any component.
 * Must be used within a ConfigProvider.
 */
export function useConfig(): ClientConfig {
  const ctx = useContext(ConfigContext)
  if (!ctx) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return ctx
}

/**
 * Provider that wraps the invitation and supplies the client config to all children.
 */
export function ConfigProvider({
  config,
  children,
}: {
  config: ClientConfig
  children: React.ReactNode
}) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}
