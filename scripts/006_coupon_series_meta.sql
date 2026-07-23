-- Meta por serie (mensaje de email, etc.)
CREATE TABLE IF NOT EXISTS public.coupon_series_meta (
  categoria TEXT PRIMARY KEY,
  mensaje_email TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coupon_series_meta ENABLE ROW LEVEL SECURITY;

INSERT INTO public.coupon_series_meta (categoria, mensaje_email)
VALUES (
  'unico',
  E'Muchas gracias por rellenar el cuestionario. Eso me ayuda a entender mejor las necesidades de quienes estan planificando sus bodas y asi ofrecerles un mejor servicio 🤍\n\nCUPÓN DE DESCUENTO: {{codigo}}\n\nPara usar tu cupón de descuento, ingresa a https://momentounico.com.ar, toca "Reservar invitación". Justo antes de confirmar tu reserva, podrás ingresar tu cupón y se aplicará el {{descuento}}% de descuento sin importar el valor de tu reserva. Este cupón es de un solo uso.\n\nRecordá que tenés tiempo hasta el {{vence}} inclusive para usarla, y con abonar la seña ya podés congelar el precio.\n\nSuerte con tus planes 🙌🏼'
)
ON CONFLICT (categoria) DO UPDATE SET
  mensaje_email = EXCLUDED.mensaje_email,
  updated_at = NOW();
