"use client"

import { useEffect, useRef, useState } from "react"
import { X, Copy, Check } from "lucide-react"

interface WeddingModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function WeddingModal({ open, onClose, children }: WeddingModalProps) {
  const [closing, setClosing] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 250)
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose()
  }

  if (!open && !closing) return null

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className={`fixed inset-0 z-50 flex items-center justify-center px-5 py-10 ${
        closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className={`relative max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-sm bg-card p-7 ${
          closing ? "animate-modal-content-out" : "animate-modal-content-in"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-foreground/50 transition-colors hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border text-foreground/40 transition-colors hover:text-foreground"
      aria-label="Copiar"
    >
      {copied ? (
        <Check className="h-3 w-3 text-primary" strokeWidth={2} />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={1.5} />
      )}
    </button>
  )
}
