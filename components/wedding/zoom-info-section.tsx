import { Video, KeyRound } from "lucide-react"
import ActionButton from "./action-button"

interface ZoomInfoSectionProps {
  title: string
  meetingId: string
  passcode: string
  notes?: string
  showButton?: boolean
  button: {
    text: string
    url: string
    variant: "primary" | "secondary" | "background"
  }
}

export default function ZoomInfoSection({
  title,
  meetingId,
  passcode,
  notes,
  showButton = true,
  button,
}: ZoomInfoSectionProps) {
  return (
    <section className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <Video className="h-9 w-9 text-inherit/50" strokeWidth={1.4} />
      <h2 className="text-xl font-semibold tracking-wide uppercase text-inherit md:text-2xl">
        {title}
      </h2>

      <div className="w-full max-w-sm rounded-2xl border border-current/15 bg-white/20 px-5 py-4">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-inherit/60">
          ID de reunion
        </p>
        <p className="mt-1 text-lg font-semibold tracking-[0.08em] text-inherit">
          {meetingId}
        </p>

        <div className="mx-auto my-3 h-px w-12 bg-current/20" />

        <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase text-inherit/60">
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.8} />
          Contrasena
        </p>
        <p className="mt-1 text-lg font-semibold tracking-[0.08em] text-inherit">
          {passcode}
        </p>
      </div>

      {notes ? (
        <p className="max-w-sm text-sm font-medium tracking-[0.08em] text-inherit/75">
          {notes}
        </p>
      ) : null}

      {showButton && (
        <div className="mt-1">
          <ActionButton text={button.text} url={button.url} variant={button.variant} />
        </div>
      )}
    </section>
  )
}
