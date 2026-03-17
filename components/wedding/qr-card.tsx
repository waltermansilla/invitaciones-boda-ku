"use client"

import { useRef, useState, useEffect } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Instagram, Heart, Download, Loader2 } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface QRCardProps {
  names: {
    name1: string
    name2: string
    font?: string
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
    leafColor?: string
  }
  brand?: {
    type: "text" | "logo" | "instagram" | "none"
    text?: string
    logoUrl?: string
    instagramHandle?: string
  }
  primaryColor?: string
}

export default function QRCard({
  names,
  icon = "camera",
  title,
  description,
  qrUrl,
  qrStyle,
  cardStyle,
  brand,
  primaryColor = "#8B7355",
}: QRCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null)

  const bgColor = cardStyle?.bgColor || "#F8F4EE"
  const textColor = cardStyle?.textColor || "#4A4A4A"
  const accentColor = cardStyle?.accentColor || primaryColor
  const leafColor = cardStyle?.leafColor || "#9CAF88"
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@400;600&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const downloadPNG = async () => {
    if (!cardRef.current) return
    setDownloading("png")
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: true,
      })
      
      const link = document.createElement("a")
      link.download = `qr-${names.name1}-${names.name2}.png`
      link.href = canvas.toDataURL("image/png", 1.0)
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
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: true,
      })
      
      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [90, 120],
      })
      
      pdf.addImage(imgData, "PNG", 0, 0, 90, 120)
      pdf.save(`qr-${names.name1}-${names.name2}.pdf`)
    } catch (e) {
      console.error("PDF error:", e)
    }
    setDownloading(null)
  }

  const CameraIcon = () => (
    <svg width="48" height="48" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1.2" style={{ opacity: 0.55 }}>
      <rect x="6" y="16" width="40" height="28" rx="4" />
      <circle cx="26" cy="30" r="9" />
      <circle cx="26" cy="30" r="5" />
      <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
      <circle cx="38" cy="22" r="2" fill={textColor} />
    </svg>
  )

  // Leaves positioned inside the card bounds
  const LeafBranch = ({ side }: { side: "left" | "right" }) => (
    <svg
      width="40"
      height="380"
      viewBox="0 0 40 380"
      fill="none"
      style={{
        position: "absolute",
        top: "50%",
        transform: `translateY(-50%) ${side === "right" ? "scaleX(-1)" : ""}`,
        left: side === "left" ? "5px" : undefined,
        right: side === "right" ? "5px" : undefined,
        overflow: "visible",
      }}
    >
      <path
        d="M30 40 Q18 90 22 140 Q26 190 20 240 Q14 290 22 340 Q26 360 18 370"
        stroke={leafColor}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      {[50, 80, 110, 140, 170, 200, 230, 260, 290, 320, 350].map((cy, i) => (
        <ellipse
          key={i}
          cx={22 + (i % 2) * 4}
          cy={cy}
          rx="12"
          ry="5"
          fill="none"
          stroke={leafColor}
          strokeWidth="0.8"
          opacity="0.5"
          transform={`rotate(${i % 2 === 0 ? -35 : 35} ${22 + (i % 2) * 4} ${cy})`}
        />
      ))}
    </svg>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "24px", backgroundColor: "#e5e5e5" }}>
      {/* Card - proporcion 3:4 ajustada */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          width: "320px",
          height: "460px",
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        <LeafBranch side="left" />
        <LeafBranch side="right" />

        {/* Hearts decoration */}
        <Heart style={{ position: "absolute", left: "50px", top: "28%", width: "10px", height: "10px", color: accentColor, opacity: 0.4, fill: accentColor }} />
        <Heart style={{ position: "absolute", right: "55px", top: "22%", width: "8px", height: "8px", color: accentColor, opacity: 0.3, fill: accentColor }} />
        <Heart style={{ position: "absolute", left: "55px", bottom: "15%", width: "8px", height: "8px", color: accentColor, opacity: 0.35, fill: accentColor }} />
        <Heart style={{ position: "absolute", right: "50px", bottom: "12%", width: "10px", height: "10px", color: accentColor, opacity: 0.4, fill: accentColor }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", height: "100%", width: "100%", flexDirection: "column", alignItems: "center", padding: "32px 45px 24px 45px" }}>
          {/* Names */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", fontSize: "28px", fontFamily: names.font || "'Great Vibes', cursive", color: textColor }}>
            <span>{names.name1}</span>
            <Heart style={{ margin: "0 6px", width: "16px", height: "16px", color: accentColor, fill: accentColor }} />
            <span>{names.name2}</span>
          </div>

          {/* Icon */}
          {icon && icon !== "none" && (
            <div style={{ marginBottom: "14px" }}>
              <CameraIcon />
            </div>
          )}

          {/* Title */}
          <h1 style={{ marginBottom: "8px", textAlign: "center", fontSize: "24px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", color: textColor }}>
            {title}
          </h1>

          {/* Description */}
          <p style={{ marginBottom: "18px", maxWidth: "210px", textAlign: "center", fontSize: "12.5px", lineHeight: 1.55, opacity: 0.7, color: textColor }}>
            {description}
          </p>

          {/* QR */}
          <div style={{ borderRadius: "10px", padding: "8px", backgroundColor: "rgba(255,255,255,0.6)" }}>
            <QRCodeCanvas
              value={qrUrl}
              size={120}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="M"
            />
          </div>

          {/* Brand - siempre visible */}
          <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: textColor, opacity: 0.65 }}>
                <Instagram style={{ width: "18px", height: "18px" }} />
                <span style={{ fontSize: "13px" }}>{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && (
              <span style={{ fontSize: "13px", letterSpacing: "0.05em", color: textColor, opacity: 0.65 }}>
                {brand.text}
              </span>
            )}
            {brand?.type === "logo" && brand.logoUrl && (
              <img src={brand.logoUrl} alt="Logo" style={{ height: "36px", width: "auto", opacity: 0.8 }} crossOrigin="anonymous" />
            )}
            {(!brand || brand.type === "none") && (
              <span style={{ fontSize: "12px", letterSpacing: "0.05em", color: textColor, opacity: 0.5 }}>
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
          style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", backgroundColor: "#262626", padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "#fff", border: "none", cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.6 : 1 }}
        >
          {downloading === "png" ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Download style={{ width: "16px", height: "16px" }} />}
          Descargar PNG
        </button>
        <button
          onClick={downloadPDF}
          disabled={downloading !== null}
          style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", backgroundColor: "#fff", padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "#262626", border: "1px solid #d4d4d4", cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.6 : 1 }}
        >
          {downloading === "pdf" ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Download style={{ width: "16px", height: "16px" }} />}
          Descargar PDF
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
