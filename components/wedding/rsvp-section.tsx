"use client"

import { useState, Fragment } from "react"

interface RSVPSectionProps {
  title: string
  deadline: string
  guestCountLabel: string
  guestCountOptions: number[]
  fields: {
    firstName: string
    lastName: string
    attendance: string
    attendanceYes: string
    attendanceNo: string
    dietary: string
    dietaryOptions: string[]
    songRequest: string
    submitButton: string
  }
}

interface GuestForm {
  firstName: string
  lastName: string
  attendance: string
  dietary: string
  songRequest: string
}

export default function RSVPSection({
  title,
  deadline,
  guestCountLabel,
  guestCountOptions,
  fields,
}: RSVPSectionProps) {
  const [guestCount, setGuestCount] = useState(1)
  const [guests, setGuests] = useState<GuestForm[]>([
    { firstName: "", lastName: "", attendance: "", dietary: "Ninguno", songRequest: "" },
  ])
  const [submitted, setSubmitted] = useState(false)

  const handleGuestCountChange = (count: number) => {
    setGuestCount(count)
    const newGuests: GuestForm[] = []
    for (let i = 0; i < count; i++) {
      newGuests.push(
        guests[i] || {
          firstName: "",
          lastName: "",
          attendance: "",
          dietary: "Ninguno",
          songRequest: "",
        }
      )
    }
    setGuests(newGuests)
  }

  const updateGuest = (index: number, field: keyof GuestForm, value: string) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [field]: value }
    setGuests(newGuests)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section className="px-6 py-16 text-center">
        <h2
          className="mb-4 text-3xl font-light tracking-[0.05em] text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {"Gracias!"}
        </h2>
        <p
          className="text-sm text-muted-foreground"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Tu confirmacion ha sido registrada.
        </p>
      </section>
    )
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-md">
        <h2
          className="mb-2 text-center text-2xl font-light tracking-[0.1em] uppercase text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p
          className="mb-8 text-center text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {deadline}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Guest count */}
          <div>
            <label
              className="mb-2 block text-xs font-medium tracking-wide text-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {guestCountLabel}
            </label>
            <select
              value={guestCount}
              onChange={(e) => handleGuestCountChange(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {guestCountOptions.map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "persona" : "personas"}
                </option>
              ))}
            </select>
          </div>

          {/* Guest forms */}
          {guests.map((guest, index) => (
            <Fragment key={index}>
              {guestCount > 1 && (
                <p
                  className="mt-2 text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {"Invitado "}{index + 1}
                </p>
              )}
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
                <input
                  type="text"
                  placeholder={fields.firstName + " *"}
                  required
                  value={guest.firstName}
                  onChange={(e) => updateGuest(index, "firstName", e.target.value)}
                  className="w-full border-b border-border bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                />
                <input
                  type="text"
                  placeholder={fields.lastName + " *"}
                  required
                  value={guest.lastName}
                  onChange={(e) => updateGuest(index, "lastName", e.target.value)}
                  className="w-full border-b border-border bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                />

                {/* Attendance */}
                <div>
                  <p
                    className="mb-2 text-xs font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {fields.attendance}
                  </p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                      <input
                        type="radio"
                        name={`attendance-${index}`}
                        value="yes"
                        checked={guest.attendance === "yes"}
                        onChange={() => updateGuest(index, "attendance", "yes")}
                        className="h-4 w-4 accent-primary"
                        required
                      />
                      {fields.attendanceYes}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                      <input
                        type="radio"
                        name={`attendance-${index}`}
                        value="no"
                        checked={guest.attendance === "no"}
                        onChange={() => updateGuest(index, "attendance", "no")}
                        className="h-4 w-4 accent-primary"
                      />
                      {fields.attendanceNo}
                    </label>
                  </div>
                </div>

                {/* Dietary */}
                <div>
                  <label
                    className="mb-2 block text-xs font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {fields.dietary}
                  </label>
                  <select
                    value={guest.dietary}
                    onChange={(e) => updateGuest(index, "dietary", e.target.value)}
                    className="w-full rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {fields.dietaryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Song request */}
                <input
                  type="text"
                  placeholder={fields.songRequest}
                  value={guest.songRequest}
                  onChange={(e) => updateGuest(index, "songRequest", e.target.value)}
                  className="w-full border-b border-border bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                />
              </div>
            </Fragment>
          ))}

          <button
            type="submit"
            className="mt-2 w-full min-h-[48px] rounded-lg border border-foreground/30 py-3 text-xs font-medium tracking-[0.2em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {fields.submitButton}
          </button>
        </form>
      </div>
    </section>
  )
}
