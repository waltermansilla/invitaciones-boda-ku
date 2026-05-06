-- =====================================================
-- RSVP Panel - Soporte de colados por invitado/familia
-- =====================================================

ALTER TABLE public.invitados
ADD COLUMN IF NOT EXISTS cupo_colados INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.integrantes
ADD COLUMN IF NOT EXISTS es_colado BOOLEAN NOT NULL DEFAULT FALSE;

-- Normalización defensiva si existían filas previas.
UPDATE public.invitados
SET cupo_colados = 0
WHERE cupo_colados IS NULL OR cupo_colados < 0;

-- Check de integridad (evita negativos).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invitados_cupo_colados_nonnegative'
  ) THEN
    ALTER TABLE public.invitados
    ADD CONSTRAINT invitados_cupo_colados_nonnegative CHECK (cupo_colados >= 0);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_integrantes_invitado_colado
  ON public.integrantes (invitado_id, es_colado);
