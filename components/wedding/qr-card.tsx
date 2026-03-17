"use client"

import { useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Instagram, Heart, Download, Loader2 } from "lucide-react"

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

  // Colors
  const bgColor = cardStyle?.bgColor || "#F8F4EE"
  const textColor = cardStyle?.textColor || "#4A4A4A"
  const accentColor = cardStyle?.accentColor || primaryColor
  const leafColor = cardStyle?.leafColor || "#9CAF88"

  // QR
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  // Download PNG using canvas
  const downloadPNG = async () => {
    if (!cardRef.current) return
    setDownloading("png")
    
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: true,
      })
      
      const dataUrl = canvas.toDataURL("image/png", 1.0)
      const link = document.createElement("a")
      link.download = `qr-${names.name1}-${names.name2}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("PNG export error:", err)
      alert("Error al generar PNG. Intenta de nuevo.")
    } finally {
      setDownloading(null)
    }
  }

  // Download PDF
  const downloadPDF = async () => {
    if (!cardRef.current) return
    setDownloading("pdf")
    
    try {
      // Dynamic imports
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: true,
      })
      
      const imgData = canvas.toDataURL("image/png", 1.0)
      
      // 3:4 aspect ratio in mm
      const pdfWidth = 90
      const pdfHeight = 120
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      })
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`qr-${names.name1}-${names.name2}.pdf`)
    } catch (err) {
      console.error("PDF export error:", err)
      alert("Error al generar PDF. Intenta de nuevo.")
    } finally {
      setDownloading(null)
    }
  }

  // Camera icon SVG
  const CameraIcon = () => (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1.2" style={{ opacity: 0.55 }}>
      <rect x="6" y="16" width="40" height="28" rx="4" />
      <circle cx="26" cy="30" r="9" />
      <circle cx="26" cy="30" r="5" />
      <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
      <circle cx="38" cy="22" r="2" fill={textColor} />
    </svg>
  )

  // Decorative leaf branch
  const LeafBranch = ({ side }: { side: "left" | "right" }) => {
    const isLeft = side === "left"
    return (
      <svg
        width="55"
        height="320"
        viewBox="0 0 55 320"
        fill="none"
        className={`absolute ${isLeft ? "left-0" : "right-0 scale-x-[-1]"} top-1/2 -translate-y-1/2`}
      >
        <path
          d="M45 30 Q30 70 35 110 Q40 150 32 190 Q24 230 35 270 Q42 300 30 310"
          stroke={leafColor}
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />
        {[
          { cx: 40, cy: 45, angle: -35 },
          { cx: 34, cy: 70, angle: 40 },
          { cx: 38, cy: 95, angle: -30 },
          { cx: 35, cy: 120, angle: 35 },
          { cx: 38, cy: 145, angle: -40 },
          { cx: 33, cy: 170, angle: 30 },
          { cx: 36, cy: 195, angle: -35 },
          { cx: 32, cy: 220, angle: 40 },
          { cx: 36, cy: 245, angle: -30 },
          { cx: 33, cy: 270, angle: 35 },
          { cx: 38, cy: 290, angle: -40 },
        ].map((leaf, i) => (
          <g key={i} transform={`rotate(${leaf.angle} ${leaf.cx} ${leaf.cy})`}>
            <ellipse
              cx={leaf.cx}
              cy={leaf.cy}
              rx="15"
              ry="6"
              fill="none"
              stroke={leafColor}
              strokeWidth="0.8"
              opacity="0.5"
            />
            <line
              x1={leaf.cx - 11}
              y1={leaf.cy}
              x2={leaf.cx + 11}
              y2={leaf.cy}
              stroke={leafColor}
              strokeWidth="0.4"
              opacity="0.35"
            />
          </g>
        ))}
      </svg>
    )
  }

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
        {/* Decorative leaves */}
        <LeafBranch side="left" />
        <LeafBranch side="right" />

        {/* Small hearts decoration */}
        <Heart 
          className="absolute left-5 top-[30%] h-3 w-3 fill-current" 
          style={{ color: accentColor, opacity: 0.45 }} 
        />
        <Heart 
          className="absolute right-7 top-[24%] h-2.5 w-2.5 fill-current" 
          style={{ color: accentColor, opacity: 0.35 }} 
        />
        <Heart 
          className="absolute left-8 bottom-[14%] h-2.5 w-2.5 fill-current" 
          style={{ color: accentColor, opacity: 0.4 }} 
        />
        <Heart 
          className="absolute right-5 bottom-[10%] h-3 w-3 fill-current" 
          style={{ color: accentColor, opacity: 0.45 }} 
        />

        {/* Content */}
        <div className="z-10 flex h-full w-full flex-col items-center px-8 py-7">
          {/* Names with heart separator */}
          <div 
            className="mb-4 flex items-center text-[28px]"
            style={{ fontFamily: names.font || "'Great Vibes', cursive" }}
          >
            <span>{names.name1}</span>
            <Heart 
              className="mx-1 h-[18px] w-[18px] fill-current" 
              style={{ color: accentColor }} 
            />
            <span>{names.name2}</span>
          </div>

          {/* Icon */}
          {icon && icon !== "none" && (
            <div className="mb-3">
              <CameraIcon />
            </div>
          )}

          {/* Title */}
          <h1 
            className="mb-1.5 text-center text-[24px] font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
          >
            {title}
          </h1>

          {/* Description */}
          <p 
            className="mb-4 max-w-[230px] text-center text-[13px] leading-[1.55]"
            style={{ opacity: 0.7 }}
          >
            {description}
          </p>

          {/* QR Code container */}
          <div 
            className="bg-white/60 p-2"
            style={{ borderRadius: "10px" }}
          >
            <QRCodeSVG
              value={qrUrl}
              size={125}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="M"
            />
          </div>

          {/* Brand at bottom - VISIBLE IN CARD */}
          <div className="mt-auto pt-4">
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div className="flex items-center gap-2" style={{ color: textColor, opacity: 0.7 }}>
                <Instagram className="h-5 w-5" />
                <span className="text-[14px]">{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && (
              <span className="text-[14px] tracking-wide" style={{ color: textColor, opacity: 0.7 }}>
                {brand.text}
              </span>
            )}
            {brand?.type === "logo" && brand.logoUrl && (
              <img 
                src={brand.logoUrl} 
                alt="Logo" 
                className="h-10 w-auto" 
                style={{ opacity: 0.8 }}
                crossOrigin="anonymous"
              />
            )}
            {(!brand || brand.type === "none") && (
              <span className="text-[13px] tracking-wide" style={{ color: textColor, opacity: 0.5 }}>
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
