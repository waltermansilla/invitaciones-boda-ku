"use client"

import { useEffect } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Instagram, Heart } from "lucide-react"

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
  const bgColor = cardStyle?.bgColor || "#F8F4EE"
  const textColor = cardStyle?.textColor || "#4A4A4A"
  const accentColor = cardStyle?.accentColor || primaryColor
  const leafColor = cardStyle?.leafColor || "#9CAF88"
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@400;600&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const CameraIcon = () => (
    <svg width="48" height="48" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1.2" style={{ opacity: 0.55 }}>
      <rect x="6" y="16" width="40" height="28" rx="4" />
      <circle cx="26" cy="30" r="9" />
      <circle cx="26" cy="30" r="5" />
      <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
      <circle cx="38" cy="22" r="2" fill={textColor} />
    </svg>
  )

  const LeafBranch = ({ side }: { side: "left" | "right" }) => (
    <svg
      width="45"
      height="100%"
      viewBox="0 0 45 400"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: side === "left" ? 0 : undefined,
        right: side === "right" ? 0 : undefined,
        transform: side === "right" ? "scaleX(-1)" : undefined,
      }}
    >
      <path
        d="M32 30 Q20 100 24 170 Q28 240 22 310 Q16 350 24 390"
        stroke={leafColor}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      {[45, 80, 115, 150, 185, 220, 255, 290, 325, 360].map((cy, i) => (
        <ellipse
          key={i}
          cx={24 + (i % 2) * 4}
          cy={cy}
          rx="14"
          ry="6"
          fill="none"
          stroke={leafColor}
          strokeWidth="0.8"
          opacity="0.5"
          transform={`rotate(${i % 2 === 0 ? -35 : 35} ${24 + (i % 2) * 4} ${cy})`}
        />
      ))}
    </svg>
  )

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
        <LeafBranch side="left" />
        <LeafBranch side="right" />

        {/* Hearts decoration */}
        <Heart style={{ position: "absolute", left: "12%", top: "18%", width: "12px", height: "12px", color: accentColor, opacity: 0.4, fill: accentColor }} />
        <Heart style={{ position: "absolute", right: "14%", top: "12%", width: "10px", height: "10px", color: accentColor, opacity: 0.3, fill: accentColor }} />
        <Heart style={{ position: "absolute", left: "14%", bottom: "15%", width: "10px", height: "10px", color: accentColor, opacity: 0.35, fill: accentColor }} />
        <Heart style={{ position: "absolute", right: "12%", bottom: "10%", width: "12px", height: "12px", color: accentColor, opacity: 0.4, fill: accentColor }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 50px", textAlign: "center" }}>
          {/* Names */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", fontSize: "32px", fontFamily: names.font || "'Great Vibes', cursive", color: textColor }}>
            <span>{names.name1}</span>
            <Heart style={{ margin: "0 8px", width: "18px", height: "18px", color: accentColor, fill: accentColor }} />
            <span>{names.name2}</span>
          </div>

          {/* Icon */}
          {icon && icon !== "none" && (
            <div style={{ marginBottom: "14px" }}>
              <CameraIcon />
            </div>
          )}

          {/* Title */}
          <h1 style={{ marginBottom: "8px", fontSize: "26px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", color: textColor }}>
            {title}
          </h1>

          {/* Description */}
          <p style={{ marginBottom: "20px", maxWidth: "260px", fontSize: "13px", lineHeight: 1.6, opacity: 0.7, color: textColor }}>
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
            <img src={brand.logoUrl} alt="Logo" style={{ height: "32px", width: "auto", opacity: 0.8 }} crossOrigin="anonymous" />
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
