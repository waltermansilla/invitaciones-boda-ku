-- Forma de mesa en el croquis: redonda | cuadrada | rectangular
-- Corré UNA vez en Supabase (SQL Editor) si ya corriste 010_mesas.sql.

ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS forma TEXT NOT NULL DEFAULT 'redonda';

ALTER TABLE public.mesas
  DROP CONSTRAINT IF EXISTS mesas_forma_check;

ALTER TABLE public.mesas
  ADD CONSTRAINT mesas_forma_check
  CHECK (forma IN ('redonda', 'cuadrada', 'rectangular'));

COMMENT ON COLUMN public.mesas.forma IS
  'Silueta en el croquis: redonda, cuadrada o rectangular.';
