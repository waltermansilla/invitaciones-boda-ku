"use client"

import { useEffect } from "react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"
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
  variant?: "classic" | "romantic" | "minimal"
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
  variant = "classic",
}: QRCardProps) {
  const bgColor = cardStyle?.bgColor || (variant === "minimal" ? "#FFFFFF" : "#F8F4EE")
  const textColor = cardStyle?.textColor || (variant === "minimal" ? "#2D2D2D" : "#4A4A4A")
  const accentColor = cardStyle?.accentColor || primaryColor
  const leafColor = cardStyle?.leafColor || (variant === "romantic" ? "#8FA97C" : "#9CAF88")
  const qrFgColor = qrStyle?.fgColor || "#3D3D3D"
  const qrBgColor = qrStyle?.bgColor || "transparent"

  useEffect(() => {
    const fonts = variant === "minimal" 
      ? "https://fonts.googleapis.com/css2?family=Italiana&family=Montserrat:wght@300;400&display=swap"
      : variant === "romantic"
      ? "https://fonts.googleapis.com/css2?family=Tangerine:wght@400;700&family=Cormorant+Garamond:wght@400;600&display=swap"
      : "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@400;600&display=swap"
    const link = document.createElement("link")
    link.href = fonts
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [variant])

  // ============ CLASSIC VARIANT ============
  if (variant === "classic") {
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
        <path d="M32 30 Q20 100 24 170 Q28 240 22 310 Q16 350 24 390" stroke={leafColor} strokeWidth="1" fill="none" opacity="0.6" />
        {[45, 80, 115, 150, 185, 220, 255, 290, 325, 360].map((cy, i) => (
          <ellipse key={i} cx={24 + (i % 2) * 4} cy={cy} rx="14" ry="6" fill="none" stroke={leafColor} strokeWidth="0.8" opacity="0.5" transform={`rotate(${i % 2 === 0 ? -35 : 35} ${24 + (i % 2) * 4} ${cy})`} />
        ))}
      </svg>
    )

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100vw", height: "100dvh", backgroundColor: "#e5e5e5" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "min(100vw, 360px)", height: "min(100dvh, 480px)", overflow: "hidden", backgroundColor: bgColor, color: textColor }}>
          <LeafBranch side="left" />
          <LeafBranch side="right" />
          <Heart style={{ position: "absolute", left: "12%", top: "18%", width: "12px", height: "12px", color: accentColor, opacity: 0.4, fill: accentColor }} />
          <Heart style={{ position: "absolute", right: "14%", top: "12%", width: "10px", height: "10px", color: accentColor, opacity: 0.3, fill: accentColor }} />
          <Heart style={{ position: "absolute", left: "14%", bottom: "15%", width: "10px", height: "10px", color: accentColor, opacity: 0.35, fill: accentColor }} />
          <Heart style={{ position: "absolute", right: "12%", bottom: "10%", width: "12px", height: "12px", color: accentColor, opacity: 0.4, fill: accentColor }} />

          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 50px", textAlign: "center" }}>
            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", fontSize: "32px", fontFamily: names.font || "'Great Vibes', cursive", color: textColor }}>
              <span>{names.name1}</span>
              <Heart style={{ margin: "0 8px", width: "18px", height: "18px", color: accentColor, fill: accentColor }} />
              <span>{names.name2}</span>
            </div>
            {icon !== "none" && <div style={{ marginBottom: "14px" }}><CameraIcon /></div>}
            <h1 style={{ marginBottom: "8px", fontSize: "26px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", color: textColor }}>{title}</h1>
            <p style={{ marginBottom: "20px", maxWidth: "260px", fontSize: "13px", lineHeight: 1.6, opacity: 0.7, color: textColor }}>{description}</p>
            <div style={{ borderRadius: "10px", padding: "8px", backgroundColor: "rgba(255,255,255,0.6)" }}>
              <QRCodeCanvas value={qrUrl} size={120} fgColor={qrFgColor} bgColor={qrBgColor} level="M" />
            </div>
          </div>

          <div style={{ position: "absolute", bottom: "16px", left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: textColor, opacity: 0.65 }}>
                <Instagram style={{ width: "16px", height: "16px" }} />
                <span style={{ fontSize: "12px" }}>{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && <span style={{ fontSize: "12px", letterSpacing: "0.05em", color: textColor, opacity: 0.65 }}>{brand.text}</span>}
            {brand?.type === "logo" && brand.logoUrl && <img src={brand.logoUrl} alt="Logo" style={{ height: "32px", width: "auto", opacity: 0.8 }} crossOrigin="anonymous" />}
            {(!brand || brand.type === "none") && <span style={{ fontSize: "11px", letterSpacing: "0.05em", color: textColor, opacity: 0.5 }}>momentounico.com.ar</span>}
          </div>
        </div>
      </div>
    )
  }

  // ============ ROMANTIC VARIANT ============
  if (variant === "romantic") {
    const CameraIcon = () => (
      <svg width="44" height="44" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1" style={{ opacity: 0.5 }}>
        <rect x="6" y="16" width="40" height="28" rx="4" />
        <circle cx="26" cy="30" r="9" />
        <circle cx="26" cy="30" r="5" />
        <path d="M16 16V13a2 2 0 012-2h16a2 2 0 012 2v3" />
        <circle cx="38" cy="22" r="2" fill={textColor} />
      </svg>
    )

    const RomanticLeaves = ({ side }: { side: "left" | "right" }) => (
      <svg
        width="55"
        height="100%"
        viewBox="0 0 55 480"
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
        <path d="M40 10 Q25 60 30 120 Q35 180 28 240 Q22 300 30 360 Q38 420 30 470" stroke={leafColor} strokeWidth="1.2" fill="none" opacity="0.7" />
        <path d="M35 30 Q20 80 25 140 Q30 200 22 260 Q15 320 24 380 Q33 440 25 480" stroke={leafColor} strokeWidth="0.8" fill="none" opacity="0.5" />
        {[25, 55, 85, 115, 145, 175, 205, 235, 265, 295, 325, 355, 385, 415, 445].map((cy, i) => (
          <g key={i}>
            <ellipse cx={30 + (i % 2) * 5} cy={cy} rx="16" ry="7" fill={leafColor} opacity="0.25" transform={`rotate(${i % 2 === 0 ? -40 : 40} ${30 + (i % 2) * 5} ${cy})`} />
            <ellipse cx={30 + (i % 2) * 5} cy={cy} rx="16" ry="7" fill="none" stroke={leafColor} strokeWidth="0.6" opacity="0.6" transform={`rotate(${i % 2 === 0 ? -40 : 40} ${30 + (i % 2) * 5} ${cy})`} />
            {i % 3 === 0 && <circle cx={20 + (i % 2) * 8} cy={cy + 10} r="2" fill={accentColor} opacity="0.3" />}
          </g>
        ))}
      </svg>
    )

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100vw", height: "100dvh", backgroundColor: "#e5e5e5" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "min(100vw, 360px)", height: "min(100dvh, 480px)", overflow: "hidden", backgroundColor: bgColor, color: textColor }}>
          <RomanticLeaves side="left" />
          <RomanticLeaves side="right" />
          
          <Heart style={{ position: "absolute", left: "15%", top: "8%", width: "10px", height: "10px", color: "#C45C5C", opacity: 0.4, fill: "#C45C5C" }} />
          <Heart style={{ position: "absolute", right: "18%", top: "15%", width: "8px", height: "8px", color: "#C45C5C", opacity: 0.3, fill: "#C45C5C" }} />
          <Heart style={{ position: "absolute", left: "18%", top: "25%", width: "6px", height: "6px", color: "#C45C5C", opacity: 0.25, fill: "#C45C5C" }} />
          <Heart style={{ position: "absolute", right: "15%", bottom: "25%", width: "7px", height: "7px", color: "#C45C5C", opacity: 0.3, fill: "#C45C5C" }} />
          <Heart style={{ position: "absolute", left: "16%", bottom: "12%", width: "9px", height: "9px", color: "#C45C5C", opacity: 0.35, fill: "#C45C5C" }} />
          <Heart style={{ position: "absolute", right: "14%", bottom: "8%", width: "11px", height: "11px", color: "#C45C5C", opacity: 0.4, fill: "#C45C5C" }} />

          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 55px", textAlign: "center" }}>
            <div style={{ marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <span style={{ fontSize: "38px", fontFamily: "'Tangerine', cursive", fontWeight: 700, color: textColor }}>{names.name1}</span>
              <div style={{ position: "relative", margin: "0 -5px", zIndex: 5 }}>
                <Heart style={{ width: "22px", height: "22px", color: "#C45C5C", fill: "#C45C5C" }} />
              </div>
              <span style={{ fontSize: "38px", fontFamily: "'Tangerine', cursive", fontWeight: 700, color: textColor }}>{names.name2}</span>
            </div>
            
            {icon !== "none" && <div style={{ marginBottom: "12px" }}><CameraIcon /></div>}
            <h1 style={{ marginBottom: "6px", fontSize: "24px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", color: textColor }}>{title}</h1>
            <p style={{ marginBottom: "18px", maxWidth: "250px", fontSize: "12px", lineHeight: 1.6, opacity: 0.7, color: textColor }}>{description}</p>
            <div style={{ borderRadius: "12px", padding: "8px", backgroundColor: "rgba(255,255,255,0.7)", border: `1px solid ${leafColor}40` }}>
              <QRCodeCanvas value={qrUrl} size={115} fgColor={qrFgColor} bgColor={qrBgColor} level="M" />
            </div>
          </div>

          <div style={{ position: "absolute", bottom: "14px", left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            {brand?.type === "instagram" && brand.instagramHandle && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: textColor, opacity: 0.6 }}>
                <Instagram style={{ width: "15px", height: "15px" }} />
                <span style={{ fontSize: "11px" }}>{brand.instagramHandle}</span>
              </div>
            )}
            {brand?.type === "text" && brand.text && <span style={{ fontSize: "11px", letterSpacing: "0.05em", color: textColor, opacity: 0.6 }}>{brand.text}</span>}
            {brand?.type === "logo" && brand.logoUrl && <img src={brand.logoUrl} alt="Logo" style={{ height: "30px", width: "auto", opacity: 0.75 }} crossOrigin="anonymous" />}
            {(!brand || brand.type === "none") && <span style={{ fontSize: "10px", letterSpacing: "0.05em", color: textColor, opacity: 0.45 }}>momentounico.com.ar</span>}
          </div>
        </div>
      </div>
    )
  }

  // ============ MINIMAL VARIANT ============
  const CameraIconMinimal = () => (
    <svg width="36" height="36" viewBox="0 0 52 52" fill="none" stroke={textColor} strokeWidth="1" style={{ opacity: 0.4 }}>
      <rect x="8" y="18" width="36" height="24" rx="2" />
      <circle cx="26" cy="30" r="7" />
      <path d="M18 18V15a1 1 0 011-1h14a1 1 0 011 1v3" />
    </svg>
  )

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100vw", height: "100dvh", backgroundColor: "#f5f5f5" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "min(100vw, 360px)", height: "min(100dvh, 480px)", overflow: "hidden", backgroundColor: bgColor, color: textColor }}>
        
        <div style={{ position: "absolute", top: "30px", left: "30px", width: "40px", height: "40px", borderTop: `1px solid ${textColor}20`, borderLeft: `1px solid ${textColor}20` }} />
        <div style={{ position: "absolute", top: "30px", right: "30px", width: "40px", height: "40px", borderTop: `1px solid ${textColor}20`, borderRight: `1px solid ${textColor}20` }} />
        <div style={{ position: "absolute", bottom: "50px", left: "30px", width: "40px", height: "40px", borderBottom: `1px solid ${textColor}20`, borderLeft: `1px solid ${textColor}20` }} />
        <div style={{ position: "absolute", bottom: "50px", right: "30px", width: "40px", height: "40px", borderBottom: `1px solid ${textColor}20`, borderRight: `1px solid ${textColor}20` }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 50px", textAlign: "center" }}>
          <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "34px", fontFamily: "'Italiana', serif", fontWeight: 400, letterSpacing: "0.08em", color: textColor }}>{names.name1}</span>
            <span style={{ fontSize: "14px", fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: "0.3em", color: textColor, opacity: 0.5 }}>&</span>
            <span style={{ fontSize: "34px", fontFamily: "'Italiana', serif", fontWeight: 400, letterSpacing: "0.08em", color: textColor }}>{names.name2}</span>
          </div>
          
          {icon !== "none" && <div style={{ marginBottom: "16px" }}><CameraIconMinimal /></div>}
          <h1 style={{ marginBottom: "8px", fontSize: "18px", fontWeight: 300, fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", color: textColor }}>{title}</h1>
          <p style={{ marginBottom: "24px", maxWidth: "260px", fontSize: "12px", lineHeight: 1.7, opacity: 0.6, color: textColor, fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>{description}</p>
          
          <div style={{ padding: "12px", backgroundColor: "#fafafa", borderRadius: "4px" }}>
            <QRCodeSVG value={qrUrl} size={110} fgColor={qrFgColor} bgColor="transparent" level="M" />
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "18px", left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          {brand?.type === "instagram" && brand.instagramHandle && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: textColor, opacity: 0.45 }}>
              <Instagram style={{ width: "14px", height: "14px" }} />
              <span style={{ fontSize: "10px", fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: "0.1em" }}>{brand.instagramHandle}</span>
            </div>
          )}
          {brand?.type === "text" && brand.text && <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: textColor, opacity: 0.45, fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>{brand.text}</span>}
          {brand?.type === "logo" && brand.logoUrl && <img src={brand.logoUrl} alt="Logo" style={{ height: "28px", width: "auto", opacity: 0.6 }} crossOrigin="anonymous" />}
          {(!brand || brand.type === "none") && <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: textColor, opacity: 0.35, fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>MOMENTOUNICO.COM.AR</span>}
        </div>
      </div>
    </div>
  )
}
