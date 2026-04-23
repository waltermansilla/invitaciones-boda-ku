 "use client"

import { useEffect, useState } from "react"
import { MapPin, Video, KeyRound, CalendarDays, Clock } from "lucide-react"

interface CaptureCardSectionProps {
  image: string
  name: string
  topLabel?: string
  nameSize?: string
  locationTitle?: string
  locationAddress?: string
  eventDay?: string
  eventTime?: string
  zoomTitle?: string
  meetingId?: string
  passcode?: string
  colors?: {
    blockBg?: string
    blockBorder?: string
    dateTimeBg?: string
    locationBg?: string
    zoomBg?: string
    captureBg?: string
    cardBg?: string
    photoPanelBg?: string
    nameTextColor?: string
    blockTextColor?: string
  }
}

export default function CaptureCardSection({
  image,
  name,
  topLabel,
  nameSize,
  locationTitle,
  locationAddress,
  eventDay,
  eventTime,
  zoomTitle,
  meetingId,
  passcode,
  colors,
}: CaptureCardSectionProps) {
  const [imageError, setImageError] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  const blockBg = colors?.blockBg || "#F3ECE2"
  const blockBorder = colors?.blockBorder || "#D9CCBB"
  const dateTimeBg = colors?.dateTimeBg || blockBg
  const locationBg = colors?.locationBg || blockBg
  const zoomBg = colors?.zoomBg || blockBg
  const captureBg = colors?.captureBg || "#EDE4D8"
  const cardBg = colors?.cardBg || "#F8F3EC"
  const photoPanelBg = colors?.photoPanelBg || "#FBF7F2"
  const nameTextColor = colors?.nameTextColor || "#3f352b"
  const blockTextColor = colors?.blockTextColor || "#4d4338"
  const captureNameFont = {
    fontFamily: '"Dancing Script", cursive',
    letterSpacing: "0",
  }
  const captureBodyFont = {
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
  }
  const resolvedNameSize = nameSize && nameSize.trim() ? nameSize.trim() : "35px"
  const meetingIdTelHref = meetingId
    ? `tel:${meetingId.replace(/[^\d+]/g, "")}`
    : undefined

  useEffect(() => {
    setHydrated(true)
  }, [])

  return (
    <section className="flex items-center justify-center px-4 py-10" style={{ backgroundColor: captureBg }}>
      <div
        className="w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#d7ccbe] shadow-[0_10px_28px_rgba(70,52,36,0.12)]"
        style={{ backgroundColor: cardBg }}
      >
        <div
          className="mx-auto flex w-full flex-col justify-between px-4 py-4 text-center sm:px-5"
          style={{ aspectRatio: "3 / 5" }}
        >
          <div className="rounded-2xl border border-[#e2d7ca] px-4 py-4" style={{ backgroundColor: photoPanelBg }}>
            <p
              className="text-[13px] uppercase tracking-[0.2em] text-[#7b6c5b]"
              style={captureBodyFont}
            >
              {topLabel || "Recordatorio"}
            </p>
            <div className="mx-auto mt-3 mb-2 h-px w-16 bg-[#d7ccbe]" />
            <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#d7ccbe] bg-current/10">
            {!imageError && image ? (
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 8%" }}
                onError={() => {
                  if (hydrated) setImageError(true)
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold tracking-[0.1em] text-inherit/60">
                {initials || "LZ"}
              </div>
            )}
            </div>
            <h3
              className="mt-3 font-semibold leading-tight"
              style={{ ...captureNameFont, fontSize: resolvedNameSize, color: nameTextColor }}
            >
              {name}
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 text-left">
            {(eventDay || eventTime) && (
              <div
                className="rounded-xl px-3 py-2.5"
                style={{
                  backgroundColor: dateTimeBg,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                }}
              >
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#5a6650]" style={captureBodyFont}>
                  Fecha y hora
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold" style={{ ...captureBodyFont, color: blockTextColor }}>
                  {eventDay ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {eventDay}
                    </span>
                  ) : null}
                  {eventTime ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {eventTime}
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {(locationTitle || locationAddress) && (
                <div
                  className="rounded-xl px-2.5 py-2.5"
                  style={{
                    backgroundColor: locationBg,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                  }}
                >
                  <p
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase"
                    style={{ ...captureBodyFont, color: blockTextColor }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Lugar
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold leading-tight" style={{ ...captureBodyFont, color: blockTextColor }}>
                    {locationTitle || "Lugar"}
                  </p>
                  {locationAddress ? (
                    <p className="mt-0.5 text-[12px] leading-tight" style={{ ...captureBodyFont, color: blockTextColor }}>
                      {locationAddress}
                    </p>
                  ) : null}
                </div>
              )}

              {(zoomTitle || meetingId || passcode) && (
                <div
                  className="rounded-xl px-2.5 py-2.5"
                  style={{
                    backgroundColor: zoomBg,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                  }}
                >
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ ...captureBodyFont, color: blockTextColor }}>
                    <Video className="h-3.5 w-3.5" />
                    Zoom
                  </p>
                  {meetingId ? (
                    <p className="mt-0.5 text-[13px] font-semibold leading-tight" style={{ ...captureBodyFont, color: blockTextColor }}>
                      ID:{" "}
                      <a
                        href={meetingIdTelHref}
                        className="no-underline"
                        style={{ color: "inherit" }}
                      >
                        {meetingId}
                      </a>
                    </p>
                  ) : null}
                  {passcode ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold leading-tight" style={{ ...captureBodyFont, color: blockTextColor }}>
                      <KeyRound className="h-3.5 w-3.5" />
                      {passcode}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
