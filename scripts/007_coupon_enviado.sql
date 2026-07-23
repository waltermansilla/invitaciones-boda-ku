-- Estado "enviado por mail" en cupones
ALTER TABLE public.cupones
  ADD COLUMN IF NOT EXISTS enviado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enviado_email text,
  ADD COLUMN IF NOT EXISTS enviado_at timestamptz;
