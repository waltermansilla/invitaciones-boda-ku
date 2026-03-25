"use client"

import { useState } from "react"

export default function MigratePage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<{filesUploaded?: number; error?: string} | null>(null)

  const runMigration = async () => {
    setStatus("running")
    setLogs(["Iniciando migración..."])
    
    try {
      const response = await fetch("/api/migrate-to-blob", {
        method: "POST",
      })
      
      const data = await response.json()
      
      if (data.error) {
        setStatus("error")
        setLogs(data.logs || [data.error])
        setResult({ error: data.error })
      } else {
        setStatus("done")
        setLogs(data.logs || [])
        setResult({ filesUploaded: data.filesUploaded })
      }
    } catch (error) {
      setStatus("error")
      setLogs([String(error)])
      setResult({ error: String(error) })
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Migración a Vercel Blob</h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            Esta acción subirá todas las imágenes de <code>public/clientes</code> a Vercel Blob 
            y actualizará los JSONs con las nuevas URLs.
          </p>
        </div>

        <button
          onClick={runMigration}
          disabled={status === "running"}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {status === "running" ? "Migrando..." : "Iniciar Migración"}
        </button>

        {status === "done" && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Migración completada. {result?.filesUploaded} archivos subidos.
            </p>
            <p className="text-green-700 text-sm mt-2">
              Ahora verificá que las invitaciones funcionen correctamente.
              Si todo está bien, podés eliminar la carpeta <code>public/clientes</code>.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error: {result?.error}</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6">
            <h2 className="font-medium mb-2">Logs:</h2>
            <div className="bg-zinc-900 text-zinc-100 rounded-lg p-4 text-sm font-mono max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="py-0.5">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
