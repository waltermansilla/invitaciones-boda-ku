"use client"

import { useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Instagram, Sparkles, Download, Loader2 } from "lucide-react"

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

  const bgColor = cardStyle?.bgColor || "#FDF8F3"
  const textColor = cardStyle?.textColor || "#4A4A4A"
  const accentColor = cardStyle?.accentColor || primaryColor
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  const downloadPNG = async () => {
    if (!cardRef.current) return
    setDownloading("png")
    
    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: bgColor,
      })
      
      const link = document.createElement("a")
      link.download = `qr-${names.text2}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (e) {
      console.error(e)
    }
    setDownloading(null)
  }

  const downloadPDF = async () => {
    if (!cardRef.current) return
    setDownloading("pdf")
    
    try {
      const html2canvas = (await import("html2canvas")).default
      const jspdf = await import("jspdf")
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: bgColor,
      })
      
      const pdf = new jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [90, 120],
      })
      
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 90, 120)
      pdf.save(`qr-${names.text2}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setDownloading(null)
  }

  const CameraIcon = () => (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1.2" style={{ opacity: 0.55 }}>
      <rect x="6" y="16" width="40" height="28" rx="4" />
      <circle cx="26" cy="30" r="9" />
      <circle cx="26" cy="30" r="5" />
      <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
      <circle cx="38" cy="22" r="2" fill={textColor} />
    </svg>
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-200 p-6">
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
        {/* Sparkles decoration */}
        <Sparkles className="absolute left-6 top-[18%] h-4 w-4" style={{ color: accentColor, opacity: 0.5 }} />
        <Sparkles className="absolute right-8 top-[22%] h-3 w-3" style={{ color: accentColor, opacity: 0.4 }} />
        <Sparkles className="absolute left-10 bottom-[20%] h-3 w-3" style={{ color: accentColor, opacity: 0.35 }} />
        <Sparkles className="absolute right-6 bottom-[15%] h-4 w-4" style={{ color: accentColor, opacity: 0.5 }} />
        <Sparkles className="absolute left-[20%] top-[12%] h-2.5 w-2.5" style={{ color: accentColor, opacity: 0.3 }} />
        <Sparkles className="absolute right-[25%] bottom-[8%] h-2.5 w-2.5" style={{ color: accentColor, opacity: 0.3 }} />

        <div className="z-10 flex h-full w-full flex-col items-center px-8 py-7">
          {/* Names - two lines */}
          <div className="mb-4 flex flex-col items-center">
            <span 
              className="text-[16px] tracking-[0.15em] uppercase"
              style={{ fontFamily: names.font1 || "'Cormorant Garamond', serif", opacity: 0.7 }}
            >
              {names.text1}
            </span>
            <span 
              className="text-[36px]"
              style={{ fontFamily: names.font2 || "'Great Vibes', cursive" }}
            >
              {names.text2}
            </span>
          </div>

          {icon && icon !== "none" && (
            <div className="mb-3">
              <CameraIcon />
            </div>
          )}

          <h1 
            className="mb-1.5 text-center text-[24px] font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h1>

          <p className="mb-4 max-w-[230px] text-center text-[13px] leading-[1.55]" style={{ opacity: 0.7 }}>
            {description}
          </p>

          <div className="rounded-[10px] bg-white/60 p-2">
            <QRCodeCanvas
              value={qrUrl}
              size={125}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="M"
            />
          </div>

          <div className="mt-auto pt-4">
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div className="flex items-center gap-2" style={{ color: textColor, opacity: 0.65 }}>
                <Instagram className="h-5 w-5" />
                <span className="text-[14px]">{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && (
              <span className="text-[14px] tracking-wide" style={{ color: textColor, opacity: 0.65 }}>
                {brand.text}
              </span>
            )}
            {brand?.type === "logo" && brand.logoUrl && (
              <img src={brand.logoUrl} alt="Logo" className="h-10 w-auto" style={{ opacity: 0.8 }} />
            )}
            {(!brand || brand.type === "none") && (
              <span className="text-[13px] tracking-wide" style={{ color: textColor, opacity: 0.5 }}>
                momentounico.com.ar
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={downloadPNG}
          disabled={downloading !== null}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {downloading === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar PNG
        </button>
        <button
          onClick={downloadPDF}
          disabled={downloading !== null}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
        >
          {downloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar PDF
        </button>
      </div>
    </div>
  )
}
