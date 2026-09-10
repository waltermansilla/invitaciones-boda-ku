-- Extra de layout: rotación, alto, sillas fijas y posiciones.
-- Corré esto en Supabase (SQL Editor). Sin RLS.

ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;
