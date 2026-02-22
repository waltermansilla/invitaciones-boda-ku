"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Copy, Check } from "lucide-react"

interface WeddingModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function WeddingModal({ open, onClose, children }: WeddingModalProps) {
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      document.body.style.overflow = ""
      onClose()
    }, 280)
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose()
  }

  if (!mounted || (!open && !closing)) return null

  const modal = (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-5 py-8 ${
        closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <div
        className={`relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-sm bg-primary p-8 ${
          closing ? "animate-modal-content-out" : "animate-modal-content-in"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground/60 transition-colors hover:text-primary-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div className="modal-content-green">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
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
      className="ml-2 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-primary-foreground/20 text-primary-foreground/50 transition-colors hover:text-primary-foreground"
      aria-label="Copiar"
    >
      {copied ? (
        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={2} />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={1.5} />
      )}
    </button>
  )
}
