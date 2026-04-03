import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

// GET: Obtener evento y lista de invitados
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const { panelId } = await params
  const supabase = await createClient()

  // Obtener evento
  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .select("*")
    .eq("panel_id", panelId)
    .single()

  if (eventoError || !evento) {
    // Si no existe, crear el evento
    const { data: nuevoEvento, error: createError } = await supabase
      .from("eventos")
      .insert({ panel_id: panelId })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: "Error creando evento" }, { status: 500 })
    }

    return NextResponse.json({
      evento: nuevoEvento,
      invitados: [],
      stats: { confirmados: 0, noAsisten: 0, pendientes: 0 }
    })
  }

  // Obtener invitados con sus integrantes
  const { data: invitados, error: invitadosError } = await supabase
    .from("invitados")
    .select(`
      *,
      integrantes (*)
    `)
    .eq("evento_id", evento.id)
    .order("created_at", { ascending: true })

  if (invitadosError) {
    return NextResponse.json({ error: "Error obteniendo invitados" }, { status: 500 })
  }

  // Calcular estadísticas (por persona, no por grupo)
  let confirmados = 0
  let noAsisten = 0
  let pendientes = 0

  invitados?.forEach((inv) => {
    if (inv.tipo === "persona") {
      if (inv.estado === "confirmado") confirmados++
      else if (inv.estado === "no_asiste") noAsisten++
      else pendientes++
    } else {
      // Familia: contar integrantes
      inv.integrantes?.forEach((int: { estado: string }) => {
        if (int.estado === "confirmado") confirmados++
        else if (int.estado === "no_asiste") noAsisten++
        else pendientes++
      })
    }
  })

  return NextResponse.json({
    evento,
    invitados: invitados || [],
    stats: { confirmados, noAsisten, pendientes }
  })
}

// POST: Crear nuevo invitado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const { panelId } = await params
  const body = await request.json()
  const supabase = await createClient()

  // Obtener evento
  const { data: evento } = await supabase
    .from("eventos")
    .select("id")
    .eq("panel_id", panelId)
    .single()

  if (!evento) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
  }

  // Generar código único para el invitado
  const codigo = nanoid(8)

  // Crear invitado
  const { data: invitado, error } = await supabase
    .from("invitados")
    .insert({
      evento_id: evento.id,
      nombre: body.nombre,
      codigo,
      tipo: body.tipo || "persona",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Error creando invitado" }, { status: 500 })
  }

  // Si es familia, crear integrantes
  if (body.tipo === "familia" && body.integrantes?.length > 0) {
    const integrantes = body.integrantes.map((nombre: string) => ({
      invitado_id: invitado.id,
      nombre,
    }))

    await supabase.from("integrantes").insert(integrantes)
  }

  // Obtener invitado con integrantes
  const { data: invitadoCompleto } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitado.id)
    .single()

  return NextResponse.json({ invitado: invitadoCompleto })
}
