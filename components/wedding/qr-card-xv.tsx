"use client"

import { useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Instagram, Sparkles, Star, Download, Loader2 } from "lucide-react"

interface QRCardXVProps {
  names: {
    text1: string
    text2: string
    font1?: string
    font2?: string
  }
  icon?: string
  title: string
  description: string
  qrUrl: string
  qrStyle?: {
    fgColor?: string
    bgColor?: string
  }
  cardStyle?: {
    bgColor?: string
    textColor?: string
    accentColor?: string
  }
  brand?: {
    type: "text" | "logo" | "instagram" | "none"
    text?: string
    logoUrl?: string
    instagramHandle?: string
  }
  primaryColor?: string
}

export default function QRCardXV({
  names,
  icon = "camera",
  title,
  description,
  qrUrl,
  qrStyle,
  cardStyle,
  brand,
  primaryColor = "#D4A5A5",
}: QRCardXVProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null)

  // Colors
  const bgColor = cardStyle?.bgColor || "#FDF8F3"
  const textColor = cardStyle?.textColor || "#4A4A4A"
  const accentColor = cardStyle?.accentColor || primaryColor

  // QR
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  // Download PNG
  const downloadPNG = async () => {
    const card = cardRef.current
    if (!card) {
      alert("Error: No se encontró la tarjeta")
      return
    }
    setDownloading("png")
    
    try {
      const html2canvasModule = await import("html2canvas")
      const html2canvas = html2canvasModule.default
      
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: card.offsetWidth,
        height: card.offsetHeight,
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `qr-${names.text2}.png`
          a.click()
          URL.revokeObjectURL(url)
        } else {
          alert("Error al generar imagen")
        }
        setDownloading(null)
      }, "image/png", 1.0)
    } catch (err) {
      console.error("PNG error:", err)
      alert("Error al generar PNG: " + (err as Error).message)
      setDownloading(null)
    }
  }

  // Download PDF
  const downloadPDF = async () => {
    const card = cardRef.current
    if (!card) {
      alert("Error: No se encontró la tarjeta")
      return
    }
    setDownloading("pdf")
    
    try {
      const html2canvasModule = await import("html2canvas")
      const html2canvas = html2canvasModule.default
      const jspdfModule = await import("jspdf")
      const jsPDF = jspdfModule.jsPDF
      
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: card.offsetWidth,
        height: card.offsetHeight,
      })
      
      const imgData = canvas.toDataURL("image/png", 1.0)
      
      const pdfWidth = 90
      const pdfHeight = 120
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      })
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`qr-${names.text2}.pdf`)
    } catch (err) {
      console.error("PDF error:", err)
      alert("Error al generar PDF: " + (err as Error).message)
    } finally {
      setDownloading(null)
    }
  }

  // Camera icon
  const CameraIcon = () => (
    <svg width="48" height="48" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1.2" style={{ opacity: 0.5 }}>
      <rect x="6" y="16" width="40" height="28" rx="4" />
      <circle cx="26" cy="30" r="9" />
      <circle cx="26" cy="30" r="5" />
      <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
      <circle cx="38" cy="22" r="2" fill={textColor} />
    </svg>
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-200 p-6">
      {/* Card - 3:4 aspect ratio */}
      <div
        ref={cardRef}
        className="relative flex flex-col items-center overflow-hidden"
        style={{
          width: "320px",
          height: "427px",
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        {/* Decorative stars */}
        <Sparkles 
          className="absolute left-5 top-8 h-5 w-5" 
          style={{ color: accentColor, opacity: 0.25 }} 
        />
        <Star 
          className="absolute left-12 top-16 h-3 w-3 fill-current" 
          style={{ color: accentColor, opacity: 0.2 }} 
        />
        <Sparkles 
          className="absolute right-6 top-10 h-4 w-4" 
          style={{ color: accentColor, opacity: 0.2 }} 
        />
        <Star 
          className="absolute right-14 top-20 h-2.5 w-2.5 fill-current" 
          style={{ color: accentColor, opacity: 0.18 }} 
        />
        <Sparkles 
          className="absolute left-7 bottom-[18%] h-4 w-4" 
          style={{ color: accentColor, opacity: 0.22 }} 
        />
        <Star 
          className="absolute left-16 bottom-[12%] h-2.5 w-2.5 fill-current" 
          style={{ color: accentColor, opacity: 0.18 }} 
        />
        <Sparkles 
          className="absolute right-8 bottom-[15%] h-5 w-5" 
          style={{ color: accentColor, opacity: 0.25 }} 
        />
        <Star 
          className="absolute right-5 bottom-[22%] h-3 w-3 fill-current" 
          style={{ color: accentColor, opacity: 0.2 }} 
        />

        {/* Elegant frame border */}
        <div 
          className="pointer-events-none absolute inset-5 rounded-lg border"
          style={{ borderColor: accentColor, opacity: 0.15 }}
        />

        {/* Content */}
        <div className="z-10 flex h-full w-full flex-col items-center px-8 py-7">
          {/* Names - stacked */}
          <div className="mb-4 flex flex-col items-center">
            <span 
              className="text-sm font-light uppercase tracking-[0.25em]"
              style={{ 
                fontFamily: names.font1 || "'Cormorant Garamond', serif",
                opacity: 0.65
              }}
            >
              {names.text1}
            </span>
            <span 
              className="mt-0.5 text-[30px]"
              style={{ fontFamily: names.font2 || "'Great Vibes', cursive" }}
            >
              {names.text2}
            </span>
            {/* Decorative line with star */}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-px w-10" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
              <Star className="h-2.5 w-2.5 fill-current" style={{ color: accentColor, opacity: 0.4 }} />
              <div className="h-px w-10" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
            </div>
          </div>

          {/* Icon */}
          {icon && icon !== "none" && (
            <div className="mb-3">
              <CameraIcon />
            </div>
          )}

          {/* Title */}
          <h1 
            className="mb-1.5 text-center text-[22px] font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
          >
            {title}
          </h1>

          {/* Description */}
          <p 
            className="mb-4 max-w-[220px] text-center text-[12px] leading-[1.6]"
            style={{ opacity: 0.65 }}
          >
            {description}
          </p>

          {/* QR Code with corner decorations */}
          <div className="relative">
            <div 
              className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2" 
              style={{ borderColor: accentColor, opacity: 0.3 }} 
            />
            <div 
              className="absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2" 
              style={{ borderColor: accentColor, opacity: 0.3 }} 
            />
            <div 
              className="absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2" 
              style={{ borderColor: accentColor, opacity: 0.3 }} 
            />
            <div 
              className="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2" 
              style={{ borderColor: accentColor, opacity: 0.3 }} 
            />
            
            <div 
              className="bg-white/60 p-2"
              style={{ borderRadius: "8px" }}
            >
              <QRCodeSVG
                value={qrUrl}
                size={120}
                fgColor={qrFgColor}
                bgColor={qrBgColor}
                level="M"
              />
            </div>
          </div>

          {/* Brand at bottom - VISIBLE */}
          <div className="mt-auto pt-4">
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div className="flex items-center gap-2" style={{ color: textColor, opacity: 0.65 }}>
                <Instagram className="h-4 w-4" />
                <span className="text-[13px]">{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && (
              <span className="text-[13px] tracking-wide" style={{ color: textColor, opacity: 0.65 }}>
                {brand.text}
              </span>
            )}
            {brand?.type === "logo" && brand.logoUrl && (
              <img 
                src={brand.logoUrl} 
                alt="Logo" 
                className="h-8 w-auto" 
                style={{ opacity: 0.7 }}
                crossOrigin="anonymous"
              />
            )}
            {(!brand || brand.type === "none") && (
              <span className="text-[12px] tracking-wide" style={{ color: textColor, opacity: 0.45 }}>
                momentounico.com.ar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadPNG}
          disabled={downloading !== null}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
        >
          {downloading === "png" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar PNG
        </button>
        <button
          onClick={downloadPDF}
          disabled={downloading !== null}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          {downloading === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar PDF
        </button>
      </div>
    </div>
  )
}
