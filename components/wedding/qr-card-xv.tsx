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
        useCORS: true,
        onclone: (_doc, element) => {
          element.style.color = textColor
          const allEls = element.querySelectorAll("*")
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement
            if (htmlEl.style) {
              const cs = getComputedStyle(htmlEl)
              if (cs.color.includes("oklab") || cs.color.includes("color(")) {
                htmlEl.style.color = textColor
              }
            }
          })
        },
      })
      
      const link = document.createElement("a")
      link.download = `qr-${names.text2}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (e) {
      console.error("PNG error:", e)
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
        useCORS: true,
        onclone: (_doc, element) => {
          element.style.color = textColor
          const allEls = element.querySelectorAll("*")
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement
            if (htmlEl.style) {
              const cs = getComputedStyle(htmlEl)
              if (cs.color.includes("oklab") || cs.color.includes("color(")) {
                htmlEl.style.color = textColor
              }
            }
          })
        },
      })
      
      const pdf = new jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [90, 120],
      })
      
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 90, 120)
      pdf.save(`qr-${names.text2}.pdf`)
    } catch (e) {
      console.error("PDF error:", e)
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
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "24px", backgroundColor: "#e5e5e5" }}>
      {/* Card */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          width: "320px",
          height: "427px",
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        {/* Sparkles decoration */}
        <Sparkles style={{ position: "absolute", left: "24px", top: "18%", width: "16px", height: "16px", color: accentColor, opacity: 0.5 }} />
        <Sparkles style={{ position: "absolute", right: "32px", top: "22%", width: "12px", height: "12px", color: accentColor, opacity: 0.4 }} />
        <Sparkles style={{ position: "absolute", left: "40px", bottom: "20%", width: "12px", height: "12px", color: accentColor, opacity: 0.35 }} />
        <Sparkles style={{ position: "absolute", right: "24px", bottom: "15%", width: "16px", height: "16px", color: accentColor, opacity: 0.5 }} />
        <Sparkles style={{ position: "absolute", left: "20%", top: "12%", width: "10px", height: "10px", color: accentColor, opacity: 0.3 }} />
        <Sparkles style={{ position: "absolute", right: "25%", bottom: "8%", width: "10px", height: "10px", color: accentColor, opacity: 0.3 }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", height: "100%", width: "100%", flexDirection: "column", alignItems: "center", padding: "28px 32px" }}>
          {/* Names - two lines */}
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "16px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: names.font1 || "'Cormorant Garamond', serif", opacity: 0.7, color: textColor }}>
              {names.text1}
            </span>
            <span style={{ fontSize: "36px", fontFamily: names.font2 || "'Great Vibes', cursive", color: textColor }}>
              {names.text2}
            </span>
          </div>

          {/* Icon */}
          {icon && icon !== "none" && (
            <div style={{ marginBottom: "12px" }}>
              <CameraIcon />
            </div>
          )}

          {/* Title */}
          <h1 style={{ marginBottom: "6px", textAlign: "center", fontSize: "24px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", color: textColor }}>
            {title}
          </h1>

          {/* Description */}
          <p style={{ marginBottom: "16px", maxWidth: "230px", textAlign: "center", fontSize: "13px", lineHeight: 1.55, opacity: 0.7, color: textColor }}>
            {description}
          </p>

          {/* QR */}
          <div style={{ borderRadius: "10px", padding: "8px", backgroundColor: "rgba(255,255,255,0.6)" }}>
            <QRCodeCanvas
              value={qrUrl}
              size={125}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="M"
            />
          </div>

          {/* Brand */}
          <div style={{ marginTop: "auto", paddingTop: "16px" }}>
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: textColor, opacity: 0.65 }}>
                <Instagram style={{ width: "20px", height: "20px" }} />
                <span style={{ fontSize: "14px" }}>{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && (
              <span style={{ fontSize: "14px", letterSpacing: "0.05em", color: textColor, opacity: 0.65 }}>
                {brand.text}
              </span>
            )}
            {brand?.type === "logo" && brand.logoUrl && (
              <img src={brand.logoUrl} alt="Logo" style={{ height: "40px", width: "auto", opacity: 0.8 }} />
            )}
            {(!brand || brand.type === "none") && (
              <span style={{ fontSize: "13px", letterSpacing: "0.05em", color: textColor, opacity: 0.5 }}>
                momentounico.com.ar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={downloadPNG}
          disabled={downloading !== null}
          style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", backgroundColor: "#262626", padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer", opacity: downloading ? 0.5 : 1 }}
        >
          {downloading === "png" ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Download style={{ width: "16px", height: "16px" }} />}
          Descargar PNG
        </button>
        <button
          onClick={downloadPDF}
          disabled={downloading !== null}
          style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", backgroundColor: "#fff", padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "#262626", border: "1px solid #d4d4d4", cursor: "pointer", opacity: downloading ? 0.5 : 1 }}
        >
          {downloading === "pdf" ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Download style={{ width: "16px", height: "16px" }} />}
          Descargar PDF
        </button>
      </div>
    </div>
  )
}
