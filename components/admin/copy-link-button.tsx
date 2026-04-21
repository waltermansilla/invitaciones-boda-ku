"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const fallbackCopy = (text: string) => {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "absolute"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
      } else {
        const ok = fallbackCopy(value)
        if (!ok) throw new Error("copy-failed")
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 4000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copiar link"
      title={copied ? "Copiado" : "Copiar link"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors hover:brightness-95"
      style={{
        borderColor: "#D9CBB9",
        backgroundColor: "#FFFFFF",
        color: "#7A5F45",
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

