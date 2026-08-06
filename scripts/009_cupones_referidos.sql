-- =====================================================
-- Cupones referidos (activados desde invitación con panel)
-- Cada invitado con link ?i= genera un cupón al abrir el modal
-- por primera vez. Vence a los 30 días desde la activación.
-- =====================================================
-- Corré este script UNA vez en Supabase (SQL Editor).

ALTER TABLE public.cupones
  ADD COLUMN IF NOT EXISTS panel_id TEXT;

ALTER TABLE public.cupones
  ADD COLUMN IF NOT EXISTS invitado_codigo TEXT;

ALTER TABLE public.cupones
  ADD COLUMN IF NOT EXISTS evento_label TEXT;

ALTER TABLE public.cupones
  ADD COLUMN IF NOT EXISTS activado_at TIMESTAMPTZ;

-- Backfill de activación = created_at cuando exista
UPDATE public.cupones
SET activado_at = created_at
WHERE categoria = 'referido'
  AND activado_at IS NULL
  AND created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cupones_panel_id
  ON public.cupones (panel_id)
  WHERE panel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cupones_activado_at
  ON public.cupones (activado_at DESC NULLS LAST)
  WHERE categoria = 'referido';

CREATE UNIQUE INDEX IF NOT EXISTS idx_cupones_referido_invitado
  ON public.cupones (panel_id, invitado_codigo)
  WHERE panel_id IS NOT NULL AND invitado_codigo IS NOT NULL;

COMMENT ON COLUMN public.cupones.panel_id IS
  'Panel del evento (solo cupones categoría referido).';
COMMENT ON COLUMN public.cupones.invitado_codigo IS
  'Código del invitado (?i=) que activó el cupón.';
COMMENT ON COLUMN public.cupones.evento_label IS
  'Nombre legible del evento (novios / XV) para el admin.';
COMMENT ON COLUMN public.cupones.activado_at IS
  'Fecha/hora en que el invitado abrió el modal del cupón por primera vez.';
