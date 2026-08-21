#!/usr/bin/env node
/**
 * Demo Sofía & Mateo: ~130 personas extra + mesas tipicas.
 *
 *   node scripts/seed-sofia-mesas-demo.mjs
 *
 * - Borra solo invitados previos con codigo smd* (seed)
 * - Reemplaza mesas del evento (plan demo)
 * - Conserva invitados reales (códigos que no empiezan con smd)
 *
 * Requiere .env.local: NEXT_PUBLIC_SUPABASE_URL +
 *   SUPABASE_SERVICE_ROLE_KEY (preferido) o NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { createClient } from "@supabase/supabase-js"
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6,
)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const PANEL_IDS = ["sofia-mateo-rbkwo1", "pauli-juanma-rbjwo1"]

const NOMBRES = [
  "Sofía", "Mateo", "Valentina", "Benjamín", "Martina", "Thiago", "Catalina",
  "Santiago", "Isabella", "Joaquín", "Emma", "Lucas", "Olivia", "Mateo",
  "Camila", "Felipe", "Julieta", "Tomás", "Mía", "Agustín", "Delfina",
  "Nicolás", "Renata", "Diego", "Paula", "Ignacio", "Lucía", "Martín",
  "Florencia", "Andrés", "Carla", "Sebastián", "Ana", "Gonzalo", "Laura",
  "Facundo", "Rocío", "Bruno", "Julia", "Pedro", "Mariana", "Esteban",
  "Natalia", "Hugo", "Elena", "Pablo", "Victoria", "Ramiro", "Clara",
  "Emilia", "Simón", "Abril", "Leo", "Josefina", "Bautista", "Amparo",
]

const APELLIDOS = [
  "García", "Rodríguez", "López", "Fernández", "González", "Pérez",
  "Martínez", "Sánchez", "Romero", "Torres", "Ruiz", "Álvarez", "Flores",
  "Acosta", "Benítez", "Castro", "Domínguez", "Espósito", "Giménez",
  "Herrera", "Ibarra", "Juárez", "Kovacs", "Ledesma", "Molina", "Navarro",
  "Ortiz", "Paz", "Quiroga", "Ríos", "Silva", "Vega", "Wagner", "Zárate",
]

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local")
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i <= 0) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function pick(arr, i) {
  return arr[i % arr.length]
}

function fullName(i) {
  return `${pick(NOMBRES, i)} ${pick(APELLIDOS, Math.floor(i * 1.7) + 3)}`
}

/**
 * Arma ~130 plazas: familias + personas.
 * Devuelve grupos { tipo, nombre, estadoTitular, integrantes: [{nombre, estado}] }
 */
function buildGuestBlueprint() {
  /** @type {{ tipo: 'persona'|'familia', nombre: string, estado: string, integrantes: {nombre:string, estado:string}[] }[]} */
  const groups = []
  let people = 0
  let i = 0

  // 10 no asisten (personas solas) — sin mesa
  for (let n = 0; n < 10; n++) {
    groups.push({
      tipo: "persona",
      nombre: fullName(i++),
      estado: "no_asiste",
      integrantes: [],
      tag: "no_asiste",
    })
    people++
  }

  // ~90 para mesas: mix confirmado / pendiente
  while (people < 100) {
    const left = 100 - people
    const size = Math.min(left, 2 + (i % 3)) // 2–4
    if (size >= 2 && left >= 2) {
      const apellido = pick(APELLIDOS, i + 11)
      const ints = []
      for (let k = 0; k < size; k++) {
        const est = (people + k) % 5 === 0 ? "pendiente" : "confirmado"
        ints.push({ nombre: `${pick(NOMBRES, i + k * 2)} ${apellido}`, estado: est })
      }
      groups.push({
        tipo: "familia",
        nombre: `Familia ${apellido}`,
        estado: ints.every((x) => x.estado === "confirmado")
          ? "confirmado"
          : "pendiente",
        integrantes: ints,
        tag: "mesa",
      })
      people += size
      i += size
    } else {
      const est = people % 3 === 0 ? "pendiente" : "confirmado"
      groups.push({
        tipo: "persona",
        nombre: fullName(i++),
        estado: est,
        integrantes: [],
        tag: "mesa",
      })
      people++
    }
  }

  // ~30 más sin mesa (para seguir asignando)
  while (people < 130) {
    const left = 130 - people
    if (left >= 3 && i % 4 === 0) {
      const apellido = pick(APELLIDOS, i + 40)
      const size = Math.min(3, left)
      const ints = []
      for (let k = 0; k < size; k++) {
        ints.push({
          nombre: `${pick(NOMBRES, i + k * 3)} ${apellido}`,
          estado: k === 0 ? "confirmado" : "pendiente",
        })
      }
      groups.push({
        tipo: "familia",
        nombre: `Familia ${apellido}`,
        estado: "pendiente",
        integrantes: ints,
        tag: "libre",
      })
      people += size
      i += size
    } else {
      groups.push({
        tipo: "persona",
        nombre: fullName(i++),
        estado: people % 2 === 0 ? "confirmado" : "pendiente",
        integrantes: [],
        tag: "libre",
      })
      people++
    }
  }

  return { groups, people }
}

/** Tamaños de mesa ~8–9 sumando ~90 */
function mesaSizesFor(count) {
  const sizes = []
  let left = count
  let toggle = false
  while (left > 0) {
    let s = toggle ? 8 : 9
    toggle = !toggle
    if (left < 8) s = left
    else if (left - s > 0 && left - s < 6) {
      // evitar mesa residual chiquita: repartir
      s = Math.ceil(left / 2)
      if (s > 9) s = 9
    }
    sizes.push(Math.min(s, left))
    left -= sizes[sizes.length - 1]
  }
  return sizes
}

async function main() {
  loadEnvLocal()
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!urlRaw || !key) {
    console.error("Faltan variables Supabase en .env.local")
    process.exit(1)
  }
  const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: eventos, error: evErr } = await supabase
    .from("eventos")
    .select("id, panel_id")
    .in("panel_id", PANEL_IDS)

  if (evErr) {
    console.error(evErr.message)
    process.exit(1)
  }
  if (!eventos?.length) {
    console.error("No encontré el evento de Sofía & Mateo. Abrí el panel una vez primero.")
    process.exit(1)
  }
  const evento = eventos[0]
  const eventoId = evento.id
  console.log(`Evento ${evento.panel_id} · ${eventoId}`)

  // Borrar seed anterior (códigos smd…)
  const { data: oldSeed, error: oldErr } = await supabase
    .from("invitados")
    .select("id, codigo")
    .eq("evento_id", eventoId)
    .like("codigo", "smd%")

  if (oldErr) {
    console.error(oldErr.message)
    process.exit(1)
  }
  if (oldSeed?.length) {
    const ids = oldSeed.map((r) => r.id)
    const { error: delErr } = await supabase.from("invitados").delete().in("id", ids)
    if (delErr) {
      console.error("No pude borrar seed anterior:", delErr.message)
      process.exit(1)
    }
    console.log(`Borrados ${ids.length} invitados seed previos`)
  }

  // Limpiar mesas del evento (demo completo)
  await supabase.from("mesa_asientos").delete().eq("evento_id", eventoId)
  await supabase.from("mesas").delete().eq("evento_id", eventoId)

  const { groups, people } = buildGuestBlueprint()
  console.log(`Creando ${groups.length} filas · ${people} personas…`)

  /** @type {{ seatKey: string, tag: string }[]} */
  const assignableSeats = []
  /** @type {{ seatKey: string }[]} */
  const freeSeats = []

  for (const g of groups) {
    const codigo = `smd${nanoid()}`
    const { data: inv, error: invErr } = await supabase
      .from("invitados")
      .insert({
        evento_id: eventoId,
        nombre: g.nombre,
        codigo,
        tipo: g.tipo,
        estado: g.estado,
        confirmado_manual: g.estado === "confirmado",
        fecha_confirmacion:
          g.estado === "confirmado" ? new Date().toISOString() : null,
      })
      .select("id")
      .single()

    if (invErr || !inv) {
      console.error("invitado:", invErr?.message || "sin id")
      process.exit(1)
    }

    if (g.tipo === "familia" && g.integrantes.length) {
      const rows = g.integrantes.map((int) => ({
        invitado_id: inv.id,
        nombre: int.nombre,
        estado: int.estado,
        fecha_confirmacion:
          int.estado === "confirmado" ? new Date().toISOString() : null,
      }))
      const { data: ints, error: intErr } = await supabase
        .from("integrantes")
        .insert(rows)
        .select("id, nombre, estado")
      if (intErr) {
        console.error("integrantes:", intErr.message)
        process.exit(1)
      }
      for (const row of ints || []) {
        const seat = { seatKey: `integrante:${row.id}`, tag: g.tag }
        if (g.tag === "mesa") assignableSeats.push(seat)
        else if (g.tag === "libre") freeSeats.push(seat)
      }
    } else {
      const seat = { seatKey: `invitado:${inv.id}`, tag: g.tag }
      if (g.tag === "mesa") assignableSeats.push(seat)
      else if (g.tag === "libre") freeSeats.push(seat)
      // no_asiste: no entra a listas de asignación
    }
  }

  console.log(
    `Asientos para mesa: ${assignableSeats.length} · libres: ${freeSeats.length}`,
  )

  const sizes = mesaSizesFor(assignableSeats.length)
  const mesaRows = sizes.map((capacidad, idx) => {
    const col = idx % 3
    const row = Math.floor(idx / 3)
    return {
      id: `00000000-0000-4000-8000-${String(idx + 1).padStart(12, "0")}`,
      evento_id: eventoId,
      numero: idx + 1,
      nombre: "",
      capacidad: 15,
      orden: idx,
      pos_x: Math.min(88, 18 + col * 32),
      pos_y: Math.min(82, 22 + row * 28),
    }
  })

  const { error: mesaErr } = await supabase.from("mesas").insert(mesaRows)
  if (mesaErr) {
    console.error("mesas:", mesaErr.message)
    process.exit(1)
  }

  let cursor = 0
  const asientoRows = []
  for (let mi = 0; mi < mesaRows.length; mi++) {
    const size = sizes[mi]
    const chunk = assignableSeats.slice(cursor, cursor + size)
    cursor += size
    chunk.forEach((s, orden) => {
      asientoRows.push({
        evento_id: eventoId,
        mesa_id: mesaRows[mi].id,
        seat_key: s.seatKey,
        orden,
      })
    })
  }

  if (asientoRows.length) {
    const { error: asErr } = await supabase
      .from("mesa_asientos")
      .insert(asientoRows)
    if (asErr) {
      console.error("asientos:", asErr.message)
      process.exit(1)
    }
  }

  console.log(
    `OK · ${mesaRows.length} mesas · ${asientoRows.length} asignados · ~${freeSeats.length} libres · 10 no asisten sin mesa`,
  )
  console.log("Abrí /panel/sofia-mateo-rbkwo1/mesas para verlo.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
