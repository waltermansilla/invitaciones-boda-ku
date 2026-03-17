"use client"

import { useEffect } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Instagram, Sparkles, Camera } from "lucide-react"

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
  const bgColor = cardStyle?.bgColor || "#FDF8F3"
  const textColor = cardStyle?.textColor || "#4A4A4A"
  const accentColor = cardStyle?.accentColor || primaryColor
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

  const IconComponent = () => {
    if (icon === "sparkles") {
      return <Sparkles style={{ width: "44px", height: "44px", color: accentColor, opacity: 0.7 }} />
    }
    return (
      <svg width="48" height="48" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1.2" style={{ opacity: 0.55 }}>
        <rect x="6" y="16" width="40" height="28" rx="4" />
        <circle cx="26" cy="30" r="9" />
        <circle cx="26" cy="30" r="5" />
        <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
        <circle cx="38" cy="22" r="2" fill={textColor} />
      </svg>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100dvh",
        backgroundColor: "#e5e5e5",
      }}
    >
      {/* Card with 3:4 aspect ratio */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "min(100vw, 360px)",
          height: "min(100dvh, 480px)",
          overflow: "hidden",
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        {/* Sparkles decoration */}
      <Sparkles style={{ position: "absolute", left: "10%", top: "12%", width: "18px", height: "18px", color: accentColor, opacity: 0.35 }} />
      <Sparkles style={{ position: "absolute", right: "12%", top: "18%", width: "14px", height: "14px", color: accentColor, opacity: 0.25 }} />
      <Sparkles style={{ position: "absolute", left: "8%", bottom: "20%", width: "14px", height: "14px", color: accentColor, opacity: 0.3 }} />
      <Sparkles style={{ position: "absolute", right: "10%", bottom: "15%", width: "18px", height: "18px", color: accentColor, opacity: 0.35 }} />
      <Sparkles style={{ position: "absolute", left: "20%", top: "8%", width: "10px", height: "10px", color: accentColor, opacity: 0.2 }} />
      <Sparkles style={{ position: "absolute", right: "22%", bottom: "8%", width: "10px", height: "10px", color: accentColor, opacity: 0.2 }} />

      {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 50px", textAlign: "center" }}>
          {/* Names - two lines */}
          <div style={{ marginBottom: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "16px", fontFamily: names.font1 || "'Cormorant Garamond', serif", letterSpacing: "0.15em", textTransform: "uppercase", color: textColor, opacity: 0.7 }}>
              {names.text1}
            </span>
            <span style={{ fontSize: "38px", fontFamily: names.font2 || "'Great Vibes', cursive", color: textColor }}>
              {names.text2}
            </span>
          </div>

          {/* Icon */}
          {icon && icon !== "none" && (
            <div style={{ marginBottom: "12px" }}>
              <IconComponent />
            </div>
          )}

          {/* Title */}
          <h1 style={{ marginBottom: "6px", fontSize: "24px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", color: textColor }}>
            {title}
          </h1>

          {/* Description */}
          <p style={{ marginBottom: "18px", maxWidth: "260px", fontSize: "12px", lineHeight: 1.5, opacity: 0.7, color: textColor }}>
            {description}
          </p>

          {/* QR */}
          <div style={{ borderRadius: "10px", padding: "8px", backgroundColor: "rgba(255,255,255,0.6)", border: `1px solid ${accentColor}30` }}>
            <QRCodeCanvas
              value={qrUrl}
              size={115}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="M"
            />
          </div>
        </div>

        {/* Brand - fixed at bottom inside card */}
        <div style={{ position: "absolute", bottom: "16px", left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          {brand?.type === "instagram" && brand.instagramHandle && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: textColor, opacity: 0.65 }}>
              <Instagram style={{ width: "16px", height: "16px" }} />
              <span style={{ fontSize: "12px" }}>{brand.instagramHandle}</span>
            </div>
          )}
          {brand?.type === "text" && brand.text && (
            <span style={{ fontSize: "12px", letterSpacing: "0.05em", color: textColor, opacity: 0.65 }}>
              {brand.text}
            </span>
          )}
        {brand?.type === "logo" && brand.logoUrl && (
          <img src={brand.logoUrl} alt="Logo" style={{ height: "40px", width: "auto", opacity: 0.8 }} crossOrigin="anonymous" />
        )}
        {(!brand || brand.type === "none") && (
          <span style={{ fontSize: "11px", letterSpacing: "0.05em", color: textColor, opacity: 0.5 }}>
            momentounico.com.ar
          </span>
        )}
        </div>
      </div>
    </div>
  )
}
