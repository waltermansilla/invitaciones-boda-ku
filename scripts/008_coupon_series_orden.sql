-- Orden de series en el panel admin
ALTER TABLE public.coupon_series_meta
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;
