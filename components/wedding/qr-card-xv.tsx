"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Camera, Instagram, Sparkles, Heart, Star, PartyPopper, Download, Crown } from "lucide-react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

// Icon map
const iconMap: Record<string, React.ReactNode> = {
  camera: <Camera className="h-10 w-10" strokeWidth={1} />,
  sparkles: <Sparkles className="h-10 w-10" strokeWidth={1} />,
  heart: <Heart className="h-10 w-10" strokeWidth={1} />,
  star: <Star className="h-10 w-10" strokeWidth={1} />,
  party: <PartyPopper className="h-10 w-10" strokeWidth={1} />,
  crown: <Crown className="h-10 w-10" strokeWidth={1} />,
}

interface QRCardXVProps {
  // Names config - XV has 2 texts with different fonts (e.g., "Mis XV" + "Valentina")
  names: {
    text1: string // e.g., "Mis XV"
    text2: string // e.g., "Valentina"
    font1?: string
    font2?: string
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
  primaryColor?: string
}

export default function QRCardXV({
  names,
  icon = "sparkles",
  title,
  description,
  qrUrl,
  qrStyle,
  cardStyle,
  brand,
  primaryColor = "#D4A5A5",
}: QRCardXVProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Default styles
  const bgColor = cardStyle?.bgColor || "#FDF8F3"
  const textColor = cardStyle?.textColor || "#3D3D3D"
  const accentColor = cardStyle?.accentColor || primaryColor

  // QR defaults
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  // Download as PNG
  const downloadPNG = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
    })
    const link = document.createElement("a")
    link.download = `qr-${names.text2}.png`
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
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [105, 148],
    })
    
    pdf.addImage(imgData, "PNG", 0, 0, 105, 148)
    pdf.save(`qr-${names.text2}.pdf`)
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
          aspectRatio: "105/148",
        }}
      >
        {/* Decorative stars/sparkles - scattered */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top left cluster */}
          <Sparkles className="absolute left-6 top-8 h-4 w-4 opacity-20" style={{ color: accentColor }} />
          <Star className="absolute left-12 top-14 h-3 w-3 fill-current opacity-15" style={{ color: accentColor }} />
          
          {/* Top right cluster */}
          <Sparkles className="absolute right-8 top-10 h-3 w-3 opacity-20" style={{ color: accentColor }} />
          <Star className="absolute right-14 top-16 h-2.5 w-2.5 fill-current opacity-15" style={{ color: accentColor }} />
          
          {/* Bottom corners */}
          <Sparkles className="absolute left-8 bottom-24 h-3 w-3 opacity-20" style={{ color: accentColor }} />
          <Star className="absolute left-16 bottom-16 h-2 w-2 fill-current opacity-15" style={{ color: accentColor }} />
          <Sparkles className="absolute right-10 bottom-20 h-4 w-4 opacity-20" style={{ color: accentColor }} />
          <Star className="absolute right-6 bottom-28 h-2.5 w-2.5 fill-current opacity-15" style={{ color: accentColor }} />
        </div>

        {/* Decorative frame - elegant border */}
        <div 
          className="pointer-events-none absolute inset-4 rounded-lg border opacity-20"
          style={{ borderColor: accentColor }}
        />
        <div 
          className="pointer-events-none absolute inset-6 rounded border opacity-10"
          style={{ borderColor: accentColor }}
        />

        {/* Names - stacked with different fonts */}
        <div className="z-10 mb-6 flex flex-col items-center">
          <span 
            className="text-sm font-light uppercase tracking-[0.3em] opacity-70"
            style={{ fontFamily: names.font1 || "'Cormorant Garamond', serif" }}
          >
            {names.text1}
          </span>
          <span 
            className="mt-1 text-3xl"
            style={{ fontFamily: names.font2 || "'Great Vibes', cursive" }}
          >
            {names.text2}
          </span>
          {/* Decorative line */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-px w-8 opacity-30" style={{ backgroundColor: accentColor }} />
            <Star className="h-2.5 w-2.5 fill-current opacity-40" style={{ color: accentColor }} />
            <div className="h-px w-8 opacity-30" style={{ backgroundColor: accentColor }} />
          </div>
        </div>

        {/* Icon */}
        {icon && iconMap[icon] && (
          <div className="z-10 mb-3 opacity-50" style={{ color: accentColor }}>
            {iconMap[icon]}
          </div>
        )}

        {/* Title */}
        <h1 className="z-10 mb-2 text-center text-xl font-medium tracking-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="z-10 mb-5 max-w-[200px] text-center text-xs leading-relaxed opacity-60">
          {description}
        </p>

        {/* QR Code with decorative frame */}
        <div className="relative z-10">
          {/* Corner decorations */}
          <div className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 opacity-30" style={{ borderColor: accentColor }} />
          <div className="absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 opacity-30" style={{ borderColor: accentColor }} />
          <div className="absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2 opacity-30" style={{ borderColor: accentColor }} />
          <div className="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 opacity-30" style={{ borderColor: accentColor }} />
          
          <div 
            className="rounded-lg bg-white/70 p-3"
            style={{ 
              borderRadius: qrStyle?.cornerStyle === "square" ? "4px" : "12px",
            }}
          >
            <QRCodeSVG
              value={qrUrl}
              size={130}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="M"
            />
          </div>
        </div>

        {/* Brand */}
        <div className="z-10 mt-auto pt-5">
          {brand?.type === "instagram" && brand.instagramHandle && (
            <div className="flex items-center gap-2 opacity-50">
              <Instagram className="h-3.5 w-3.5" />
              <span className="text-xs tracking-wide">{brand.instagramHandle}</span>
            </div>
          )}
          {brand?.type === "text" && brand.text && (
            <span className="text-xs font-medium tracking-wider opacity-50">
              {brand.text}
            </span>
          )}
          {brand?.type === "logo" && brand.logoUrl && (
            <img src={brand.logoUrl} alt="Logo" className="h-6 w-auto opacity-60" />
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
