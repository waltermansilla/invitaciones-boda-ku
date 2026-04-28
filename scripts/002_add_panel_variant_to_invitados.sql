-- =====================================================
-- RSVP Panel - Variantes de lista por panel
-- =====================================================
-- Permite separar invitados por "lista/variante" dentro del mismo panel,
-- compartiendo el cupo total del evento.

ALTER TABLE public.invitados
ADD COLUMN IF NOT EXISTS panel_variant TEXT;

-- Índice recomendado para filtrar rápido por evento + variante
CREATE INDEX IF NOT EXISTS idx_invitados_evento_variant
  ON public.invitados (evento_id, panel_variant);
