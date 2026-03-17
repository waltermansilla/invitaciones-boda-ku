"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Camera, Instagram, Sparkles, Heart, Star, PartyPopper, Download } from "lucide-react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

// Icon map
const iconMap: Record<string, React.ReactNode> = {
  camera: <Camera className="h-12 w-12" strokeWidth={1} />,
  sparkles: <Sparkles className="h-12 w-12" strokeWidth={1} />,
  heart: <Heart className="h-12 w-12" strokeWidth={1} />,
  star: <Star className="h-12 w-12" strokeWidth={1} />,
  party: <PartyPopper className="h-12 w-12" strokeWidth={1} />,
}

interface QRCardProps {
  type: "boda" | "xv"
  // Names config
  names: {
    text1: string
    text2?: string
    separator?: string // heart, ampersand, dot, none
    font?: string
  }
  // Content
  icon?: string
  title: string
  description: string
  qrUrl: string
  // QR Style
  qrStyle?: {
    fgColor?: string
    bgColor?: string
    style?: "squares" | "dots"
    cornerStyle?: "square" | "rounded"
  }
  // Card style
  cardStyle?: {
    bgColor?: string
    textColor?: string
    accentColor?: string
  }
  // Brand at bottom
  brand?: {
    type: "text" | "logo" | "instagram"
    text?: string
    logoUrl?: string
    instagramHandle?: string
  }
  // Primary color from invitation
  primaryColor?: string
}

export default function QRCard({
  type,
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

  // Default styles
  const bgColor = cardStyle?.bgColor || "#F5F0E8"
  const textColor = cardStyle?.textColor || "#3D3D3D"
  const accentColor = cardStyle?.accentColor || primaryColor

  // QR defaults
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  // Separator
  const getSeparator = () => {
    switch (names.separator) {
      case "heart": return <Heart className="h-5 w-5 mx-2 fill-current" style={{ color: accentColor }} />
      case "ampersand": return <span className="mx-2" style={{ color: accentColor }}>&</span>
      case "dot": return <span className="mx-2" style={{ color: accentColor }}>·</span>
      case "none": return <span className="mx-3" />
      default: return <Heart className="h-5 w-5 mx-2 fill-current" style={{ color: accentColor }} />
    }
  }

  // Download as PNG
  const downloadPNG = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
    })
    const link = document.createElement("a")
    link.download = `qr-${names.text1}${names.text2 ? `-${names.text2}` : ""}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // Download as PDF
  const downloadPDF = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
    })
    const imgData = canvas.toDataURL("image/png")
    
    // A6 size in mm (105 x 148)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [105, 148],
    })
    
    pdf.addImage(imgData, "PNG", 0, 0, 105, 148)
    pdf.save(`qr-${names.text1}${names.text2 ? `-${names.text2}` : ""}.pdf`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-100 p-4">
      {/* Card */}
      <div
        ref={cardRef}
        className="relative flex w-[315px] flex-col items-center overflow-hidden px-8 py-10"
        style={{ 
          backgroundColor: bgColor,
          color: textColor,
          aspectRatio: "105/148", // A6 ratio
        }}
      >
        {/* Decorative leaves - left */}
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 opacity-30">
          <svg width="50" height="200" viewBox="0 0 50 200" fill="none">
            <path
              d="M40 20 Q20 50 25 80 Q30 110 20 140 Q10 170 30 190"
              stroke={accentColor}
              strokeWidth="1"
              fill="none"
            />
            {[30, 60, 90, 120, 150].map((y, i) => (
              <ellipse
                key={i}
                cx={25 + (i % 2 === 0 ? -8 : 8)}
                cy={y}
                rx="12"
                ry="6"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.5"
                transform={`rotate(${i % 2 === 0 ? -30 : 30} ${25 + (i % 2 === 0 ? -8 : 8)} ${y})`}
              />
            ))}
          </svg>
        </div>

        {/* Decorative leaves - right */}
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-30">
          <svg width="50" height="200" viewBox="0 0 50 200" fill="none">
            <path
              d="M10 20 Q30 50 25 80 Q20 110 30 140 Q40 170 20 190"
              stroke={accentColor}
              strokeWidth="1"
              fill="none"
            />
            {[30, 60, 90, 120, 150].map((y, i) => (
              <ellipse
                key={i}
                cx={25 + (i % 2 === 0 ? 8 : -8)}
                cy={y}
                rx="12"
                ry="6"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.5"
                transform={`rotate(${i % 2 === 0 ? 30 : -30} ${25 + (i % 2 === 0 ? 8 : -8)} ${y})`}
              />
            ))}
          </svg>
        </div>

        {/* Small hearts decoration */}
        <div className="pointer-events-none absolute inset-0">
          <Heart className="absolute left-4 top-[30%] h-2.5 w-2.5 fill-current opacity-40" style={{ color: accentColor }} />
          <Heart className="absolute right-6 top-[25%] h-2 w-2 fill-current opacity-30" style={{ color: accentColor }} />
          <Heart className="absolute left-8 bottom-[15%] h-2 w-2 fill-current opacity-40" style={{ color: accentColor }} />
          <Heart className="absolute right-4 bottom-[20%] h-2.5 w-2.5 fill-current opacity-30" style={{ color: accentColor }} />
        </div>

        {/* Names */}
        <div className="z-10 mb-6 flex items-center justify-center">
          <span 
            className="text-2xl italic"
            style={{ fontFamily: names.font || "'Great Vibes', cursive" }}
          >
            {names.text1}
          </span>
          {names.text2 && (
            <>
              {getSeparator()}
              <span 
                className="text-2xl italic"
                style={{ fontFamily: names.font || "'Great Vibes', cursive" }}
              >
                {names.text2}
              </span>
            </>
          )}
        </div>

        {/* Icon */}
        {icon && iconMap[icon] && (
          <div className="z-10 mb-4 opacity-60" style={{ color: textColor }}>
            {iconMap[icon]}
          </div>
        )}

        {/* Title */}
        <h1 className="z-10 mb-2 text-center text-2xl font-semibold tracking-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="z-10 mb-6 max-w-[220px] text-center text-sm leading-relaxed opacity-70">
          {description}
        </p>

        {/* QR Code */}
        <div 
          className="z-10 rounded-xl bg-white/80 p-3"
          style={{ 
            borderRadius: qrStyle?.cornerStyle === "square" ? "8px" : "16px",
          }}
        >
          <QRCodeSVG
            value={qrUrl}
            size={140}
            fgColor={qrFgColor}
            bgColor={qrBgColor}
            level="M"
            style={{
              borderRadius: qrStyle?.cornerStyle === "rounded" ? "8px" : "0",
            }}
          />
        </div>

        {/* Brand */}
        <div className="z-10 mt-auto pt-6">
          {brand?.type === "instagram" && brand.instagramHandle && (
            <div className="flex items-center gap-2 opacity-60">
              <Instagram className="h-4 w-4" />
              <span className="text-sm">{brand.instagramHandle}</span>
            </div>
          )}
          {brand?.type === "text" && brand.text && (
            <span className="text-sm font-medium tracking-wide opacity-60">
              {brand.text}
            </span>
          )}
          {brand?.type === "logo" && brand.logoUrl && (
            <img src={brand.logoUrl} alt="Logo" className="h-8 w-auto opacity-70" />
          )}
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadPNG}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          <Download className="h-4 w-4" />
          Descargar PNG
        </button>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>
      </div>
    </div>
  )
}
