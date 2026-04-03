import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET: Obtener datos del invitado por código
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const supabase = await createClient()

  const { data: invitado, error } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("codigo", codigo)
    .single()

  if (error || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ invitado })
}

// POST: Confirmar asistencia
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const body = await request.json()
  const supabase = await createClient()

  // Obtener invitado
  const { data: invitado, error: getError } = await supabase
    .from("invitados")
    .select("id, tipo")
    .eq("codigo", codigo)
    .single()

  if (getError || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  // Actualizar invitado
  const updateData: Record<string, unknown> = {
    estado: body.asiste ? "confirmado" : "no_asiste",
    fecha_confirmacion: new Date().toISOString(),
  }

  if (body.restricciones !== undefined) updateData.restricciones = body.restricciones
  if (body.mensaje !== undefined) updateData.mensaje = body.mensaje
  if (body.cancion !== undefined) updateData.cancion = body.cancion

  const { error: updateError } = await supabase
    .from("invitados")
    .update(updateData)
    .eq("id", invitado.id)

  if (updateError) {
    return NextResponse.json({ error: "Error guardando confirmación" }, { status: 500 })
  }

  // Si es familia y vienen integrantes, actualizar cada uno
  if (invitado.tipo === "familia" && body.integrantes) {
    for (const int of body.integrantes) {
      await supabase
        .from("integrantes")
        .update({
          estado: int.asiste ? "confirmado" : "no_asiste",
          restricciones: int.restricciones,
          fecha_confirmacion: new Date().toISOString(),
        })
        .eq("id", int.id)
    }
  }

  // Obtener invitado actualizado
  const { data: invitadoActualizado } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitado.id)
    .single()

  return NextResponse.json({ invitado: invitadoActualizado })
}
