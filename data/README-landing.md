# Data de landing y configurador

Este resumen es **solo para landing y configurador** (no invitaciones de clientes).

## Archivos clave (editar acá)

- `pricing.json`
  - Fuente unica de precios en ARS.
  - `usdArs`: cotizacion ARS/USD.
  - USD se calcula automatico con redondeo hacia arriba por item.

- `landing-theme.json`
  - Fuente unica de diseno visual para landing (ES y EN).
  - Colores, bordes, sombras, tipografias, opacidades.

- `landing-tdy.json`
  - Contenido de texto en espanol (labels, titulos, subtitulos, etc.).
  - Los precios visibles principales se recalculan en runtime desde `pricing.json`.

- `landing-tdy.en.json`
  - Contenido de texto en ingles.
  - Mismo criterio: precios principales vienen desde `pricing.json`.

## Importante

- No editar archivos de `data/clientes/*` desde este flujo (son invitaciones reales).
- Si queres cambiar precios:
  1) cambia ARS en `pricing.json`
  2) ajusta `usdArs`
  3) listo, landing/configurador recalculan USD.
