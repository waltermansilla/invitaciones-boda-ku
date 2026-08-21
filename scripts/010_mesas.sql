-- =====================================================
-- Mesas de asignación (panel anfitrión)
-- Una mesa pertenece a un evento; cada asiento es un
-- integrante o un invitado persona (seat_key).
-- =====================================================
-- Corré este script UNA vez en Supabase (SQL Editor).

CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  capacidad INT NOT NULL DEFAULT 15 CHECK (capacidad >= 1 AND capacidad <= 50),
  orden INT NOT NULL DEFAULT 0,
  pos_x DOUBLE PRECISION NOT NULL DEFAULT 50,
  pos_y DOUBLE PRECISION NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evento_id, numero)
);

CREATE TABLE IF NOT EXISTS public.mesa_asientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  seat_key TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evento_id, seat_key)
);

CREATE INDEX IF NOT EXISTS idx_mesas_evento_id
  ON public.mesas (evento_id);

CREATE INDEX IF NOT EXISTS idx_mesa_asientos_mesa_id
  ON public.mesa_asientos (mesa_id);

CREATE INDEX IF NOT EXISTS idx_mesa_asientos_evento_id
  ON public.mesa_asientos (evento_id);

COMMENT ON TABLE public.mesas IS
  'Mesas del salón (organización del anfitrión en el panel).';
COMMENT ON TABLE public.mesa_asientos IS
  'Asignación seat_key → mesa. seat_key = integrante:<uuid> | invitado:<uuid>.';
COMMENT ON COLUMN public.mesa_asientos.seat_key IS
  'integrante:<id> para miembros de familia/colados; invitado:<id> para persona sola.';
COMMENT ON COLUMN public.mesas.pos_x IS
  'Posición horizontal en croquis (0–100).';
COMMENT ON COLUMN public.mesas.pos_y IS
  'Posición vertical en croquis (0–100).';
