-- tipo de pieza en el croquis: mesa | objeto | pista
-- Corré UNA vez en Supabase si ya existe la tabla mesas.

ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'mesa';

ALTER TABLE public.mesas
  DROP CONSTRAINT IF EXISTS mesas_tipo_check;

ALTER TABLE public.mesas
  ADD CONSTRAINT mesas_tipo_check
  CHECK (tipo IN ('mesa', 'objeto', 'pista'));

-- Permitir 0 sillas en objetos; mesas de invitados usan 4–15 en la app.
ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_capacidad_check;
ALTER TABLE public.mesas
  ADD CONSTRAINT mesas_capacidad_check
  CHECK (capacidad >= 0 AND capacidad <= 50);

COMMENT ON COLUMN public.mesas.tipo IS
  'mesa = con sillas; objeto = mueble/espacio (mesa dulce, etc.); pista = pista de baile.';
