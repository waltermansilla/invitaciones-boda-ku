# Documentación del proyecto

- **`GUIA_COMPLETA_DESARROLLADOR.txt`** — Arquitectura, archivos y flujos (referencia amplia).
- **`MANUAL_OPERATIVO_BASICO_V1.md`** — Pasos rápidos operativos (clientes, landing, deploy).

Documentación ligada a **datos** (landing, precios, operación de `data/`):

- **`../data/docs/`** — p. ej. `README-landing.md`, `MANUAL_OPERATIVO.md` (migración Blob, etc.).

Scripts de automatización: **`../scripts/`** (p. ej. `migrate-to-blob.ts`).

**Validar todas las invitaciones (clientes):** [`VALIDAR_INVITACIONES_CLIENTES.md`](./VALIDAR_INVITACIONES_CLIENTES.md) — comando `npm run validate:clientes` y `npm run build:ci`.

**Panel de invitados (RSVP Premium, Supabase, URLs):** [`PANEL_INVITADOS.md`](./PANEL_INVITADOS.md) — flujo, seguridad por URL, `npm run panel:gen-id`.
