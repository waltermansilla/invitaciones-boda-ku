import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET: Obtener invitado específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { invitadoId } = await params
  const supabase = await createClient()

  const { data: invitado, error } = await supabase
    .from("invitados")
    .select(`*, integrantes (*)`)
    .eq("id", invitadoId)
    .single()

  if (error || !invitado) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ invitado })
}

// PUT: Actualizar invitado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { invitadoId } = await params
  const body = await request.json()
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}

  if (body.nombre !== undefined) updateData.nombre = body.nombre
  if (body.estado !== undefined) {
    updateData.estado = body.estado
    if (body.estado === "confirmado" || body.estado === "no_asiste") {
      updateData.fecha_confirmacion = new Date().toISOString()
    }
  }
  if (body.pago_tarjeta !== undefined) updateData.pago_tarjeta = body.pago_tarjeta
  if (body.confirmado_manual !== undefined) updateData.confirmado_manual = body.confirmado_manual
  if (body.restricciones !== undefined) updateData.restricciones = body.restricciones
  if (body.mensaje !== undefined) updateData.mensaje = body.mensaje
  if (body.cancion !== undefined) updateData.cancion = body.cancion

  const { data: invitado, error } = await supabase
    .from("invitados")
    .update(updateData)
    .eq("id", invitadoId)
    .select(`*, integrantes (*)`)
    .single()

  if (error) {
    return NextResponse.json({ error: "Error actualizando invitado" }, { status: 500 })
  }

  return NextResponse.json({ invitado })
}

// DELETE: Eliminar invitado
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string; invitadoId: string }> }
) {
  const { invitadoId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from("invitados")
    .delete()
    .eq("id", invitadoId)

  if (error) {
    return NextResponse.json({ error: "Error eliminando invitado" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
