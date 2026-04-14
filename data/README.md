# Carpeta `data/`

Todo el contenido editable por “dato” vive acá, agrupado por uso.

| Carpeta / archivo | Para qué es |
|-------------------|-------------|
| **`clientes/`** | Invitaciones reales: `boda/slug.json`, `xv/slug.json`, etc. El sitio lee `data/clientes/{tipo}/{slug}.json`. |
| **`landing/`** | Landings comerciales: `landing-2.json` + `landing-2.en.json` (home `/`), `landing-1.json` (`/landing`), `landing-2-theme.json` (referencia de tema). |
| **`config/`** | Ajustes globales del negocio: `pricing.json` (ARS, USD, planes, extras, tabla “papel”). |
| **`templates/`** | Plantillas para **copiar** al crear un cliente: `_TEMPLATE_BODA.json`, `_TEMPLATE_XV.json`. |
| **`reference/`** | Ejemplos o legacy: `wedding-config.json` (no es la fuente de una URL). |
| **`admin/`** | `admin.json` — datos del panel admin (rutas API bajo `app/api/admin/`). |
| **`docs/`** | Manuales ligados a **datos** del sitio (`README-landing.md`, `MANUAL_OPERATIVO.md`, etc.). |

Los medios (fotos/videos de la landing) siguen en **`public/landing/media/`**, no en `data/`.

Manuales de **arquitectura / operación general del repo** (guía larga, manual básico): carpeta **`docs/`** en la raíz del proyecto (al mismo nivel que `app/`), no confundir con `data/docs/`.
