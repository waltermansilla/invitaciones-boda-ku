-- =====================================================
-- Cupones (tabla existente: public.cupones)
-- Completar serie + categoría "unico" + endurecer RLS.
-- =====================================================

UPDATE public.cupones
SET categoria = 'unico'
WHERE categoria = 'descuento_fijo';

INSERT INTO public.cupones (
  codigo, categoria, descuento_porcentaje, valido_hasta, activo, usado
)
SELECT
  'BODA' || n::text,
  'unico',
  30,
  DATE '2026-08-05',
  true,
  false
FROM generate_series(1250, 1500, 10) AS n
WHERE NOT EXISTS (
  SELECT 1 FROM public.cupones c WHERE c.codigo = 'BODA' || n::text
);

-- Bloquear acceso directo con anon key (las API usan service role)
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
-- Sin policies = nadie con anon/authenticated puede leer/escribir.
-- Service role bypasea RLS.
