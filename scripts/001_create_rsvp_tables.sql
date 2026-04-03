-- =====================================================
-- RSVP Panel Tables
-- Sistema de confirmación de asistencia para invitaciones
-- =====================================================

-- Tabla: eventos
-- Almacena la configuración del panel de cada evento
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id TEXT UNIQUE NOT NULL,  -- ID usado en la URL (ej: "anto-walter-2024")
  fecha_evento DATE,              -- Fecha del evento (para mostrar días restantes)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: invitados
-- Almacena cada invitado (persona o familia)
CREATE TABLE IF NOT EXISTS public.invitados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,           -- Nombre del invitado o "Familia García"
  codigo TEXT UNIQUE NOT NULL,    -- Código único para el link (ej: "xK9mPq")
  tipo TEXT NOT NULL DEFAULT 'persona' CHECK (tipo IN ('persona', 'familia')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'no_asiste')),
  pago_tarjeta BOOLEAN DEFAULT FALSE,
  confirmado_manual BOOLEAN DEFAULT FALSE,  -- Si el anfitrión lo confirmó manualmente
  restricciones TEXT,             -- Restricciones alimentarias
  mensaje TEXT,                   -- Mensaje para los novios
  cancion TEXT,                   -- Canción sugerida
  fecha_confirmacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: integrantes
-- Para familias: almacena cada integrante por separado
CREATE TABLE IF NOT EXISTS public.integrantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitado_id UUID NOT NULL REFERENCES public.invitados(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'no_asiste')),
  restricciones TEXT,
  fecha_confirmacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_invitados_evento_id ON public.invitados(evento_id);
CREATE INDEX IF NOT EXISTS idx_invitados_codigo ON public.invitados(codigo);
CREATE INDEX IF NOT EXISTS idx_integrantes_invitado_id ON public.integrantes(invitado_id);

-- No usamos RLS porque el panel es público (acceso por URL secreta)
-- La seguridad está en el panel_id/codigo que son únicos y difíciles de adivinar
