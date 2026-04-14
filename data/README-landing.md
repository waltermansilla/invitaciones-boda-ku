# Data de landing y configurador

Este resumen es **solo para landing y configurador** (no invitaciones de clientes).

## Archivos clave (editar acá)

- `pricing.json`
  - Fuente unica de precios en ARS.
  - `usdArs`: cotizacion ARS/USD.
  - USD se calcula automatico con redondeo hacia arriba por item.

- `landing-theme.json`
  - Tema por defecto / referencia (la landing TDY en `/` usa `theme` dentro de `landing-tdy*.json`).

- `landing-tdy.json` + `landing-tdy.en.json`
  - Landing **oficial** en la **raíz** `/` (componente `LandingTdyPage`).
  - Textos, `theme`, `pageLayout`, secciones; precios principales desde `pricing.json`.

- `landing.json`
  - Landing **clásica** en **`/landing`** (`LandingPage`).

## Fotos y videos de la landing

Archivos estáticos (no van dentro de `data/`):

- Carpeta: **`public/landing/media/`**
  - `images/` — imágenes (cards de estilos, incluye, panel, globo de idiomas, etc.).
  - `videos/` — previews opcionales para el carrusel de estilos (`videoSrc` en cada ítem).

En el JSON usá rutas desde la raíz del sitio, por ejemplo:

`/landing/media/images/mi-foto.webp`  
`/landing/media/videos/mi-preview.mp4`

Detalle de campos y convenciones: **`public/landing/media/README.md`**.

## Importante

- No editar archivos de `data/clientes/*` desde este flujo (son invitaciones reales).
- Si queres cambiar precios:
  1) cambia ARS en `pricing.json`
  2) ajusta `usdArs`
  3) listo, landing/configurador recalculan USD.
