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
      <section className="bg-primary px-6 py-16 text-center">
        <h2
          className="mb-4 text-3xl font-semibold text-primary-foreground"
  
        >
          {"Gracias!"}
        </h2>
        <p
          className="text-sm text-primary-foreground/80"
            >
              Tu confirmacion ha sido registrada.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-primary px-6 py-14">
      <div className="mx-auto max-w-sm">
        <h2
          className="mb-1 text-center text-xl font-semibold tracking-wide uppercase text-primary-foreground md:text-2xl"
  
        >
          {title}
        </h2>
        <p
          className="mb-8 text-center text-[11px] font-medium tracking-[0.1em] uppercase text-primary-foreground/70"
            >
              {deadline}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Guest count */}
          <div>
            <label
              className="mb-2 block text-[11px] font-medium tracking-wide text-primary-foreground/80"

            >
              {guestCountLabel}
            </label>
            <select
              value={guestCount}
              onChange={(e) => handleGuestCountChange(Number(e.target.value))}
              className="w-full rounded-md border-0 bg-card px-4 py-3 text-sm text-foreground shadow-sm"
              style={{ fontSize: "16px" }}
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
                  className="mt-1 text-[11px] font-semibold tracking-[0.1em] uppercase text-primary-foreground/80"
    
                >
                  {"Invitado "}{index + 1}
                </p>
              )}
              <div className="flex flex-col gap-0 overflow-hidden rounded-md bg-card shadow-sm">
                <input
                  type="text"
                  placeholder={fields.firstName + " *"}
                  required
                  value={guest.firstName}
                  onChange={(e) => updateGuest(index, "firstName", e.target.value)}
                  className="w-full border-b border-border/40 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  style={{ fontSize: "16px" }}
                />
                <input
                  type="text"
                  placeholder={fields.lastName + " *"}
                  required
                  value={guest.lastName}
                  onChange={(e) => updateGuest(index, "lastName", e.target.value)}
                  className="w-full border-b border-border/40 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  style={{ fontSize: "16px" }}
                />

                {/* Attendance */}
                <div className="border-b border-border/40 px-4 py-3">
                  <p
                    className="mb-2 text-[11px] font-medium text-foreground/70"
      
                  >
                    {fields.attendance}
                  </p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-foreground">
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
                    <label className="flex items-center gap-2 text-sm text-foreground">
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
                <div className="border-b border-border/40 px-4 py-3">
                  <label
                    className="mb-2 block text-[11px] font-medium text-foreground/70"
      
                  >
                    {fields.dietary}
                  </label>
                  <select
                    value={guest.dietary}
                    onChange={(e) => updateGuest(index, "dietary", e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                    style={{ fontSize: "16px" }}
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
                  className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  style={{ fontSize: "16px" }}
                />
              </div>
            </Fragment>
          ))}

          <button
            type="submit"
            className="mt-1 min-h-[48px] w-full rounded-md border border-primary-foreground/30 bg-transparent py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-primary-foreground transition-colors hover:bg-primary-foreground/10"
           
          >
            {fields.submitButton}
          </button>
        </form>
      </div>
    </section>
  )
}
