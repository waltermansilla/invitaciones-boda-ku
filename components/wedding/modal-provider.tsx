"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import config from "@/data/wedding-config.json"

type ModalContent = React.ReactNode | null

interface ModalContextType {
  openModal: (content: React.ReactNode) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType>({
  openModal: () => {},
  closeModal: () => {},
})

export function useModal() {
  return useContext(ModalContext)
}

export default function ModalProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ModalContent>(null)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const openModal = useCallback((node: React.ReactNode) => {
    setContent(node)
    setVisible(true)
    setClosing(false)
    document.body.style.overflow = "hidden"
  }, [])

  const closeModal = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setVisible(false)
      setContent(null)
      document.body.style.overflow = ""
    }, 280)
  }, [])

  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [visible, closeModal])

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) closeModal()
  }

  const modal = visible && mounted ? createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[99999] flex items-center justify-center px-5 py-8 ${
        closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        className={`relative w-full max-w-sm rounded-sm bg-primary px-7 py-8 ${
          closing ? "animate-modal-content-out" : "animate-modal-content-in"
        }`}
        style={{ color: (config.theme as Record<string, unknown>).modalTextColor as string || "#FFFFFF" }}
      >
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground/60 transition-colors hover:text-primary-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
        {content}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modal}
    </ModalContext.Provider>
  )
}
