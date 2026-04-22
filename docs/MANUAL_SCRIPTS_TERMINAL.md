# Manual: scripts y comandos de terminal

Guía de todo lo que podés ejecutar desde la terminal en este proyecto: **comandos npm** (Next, lint, validación) y **scripts en `scripts/`** (herramientas sueltas en Node o TypeScript). Incluye para qué sirve cada uno, cómo invocarlo y cómo funciona por dentro a alto nivel.

**Convención:** los comandos asumen que estás en la **raíz del repo** (donde está `package.json`).

---

## 1. Comandos npm (definidos en `package.json`)

Son atajos a `next`, `eslint` o `node`. No son archivos en `scripts/` salvo donde se indica.

| Comando | Qué hace |
|--------|-----------|
| `npm run dev` | Levanta el servidor de desarrollo de **Next.js** (hot reload). Abrís el sitio en el puerto que muestre la consola (por defecto 3000). |
| `npm run dev:webpack` | Igual que `dev` pero forzando el bundler **Webpack** en lugar del predeterminado del proyecto. |
| `npm run dev:local` | Servidor de desarrollo escuchando solo en **127.0.0.1** (útil si no querés exponer en toda la red local). |
| `npm run build` | **Compilación de producción**: genera la app optimizada en `.next/`. Falla si hay errores de compilación. |
| `npm run build:ci` | Primero ejecuta **`validate:clientes`** y, si pasa, **`build`**. Pensado para CI o antes de deploy para no subir JSON rotos. |
| `npm run start` | Sirve la app **ya compilada** (hay que correr `build` antes). Es el modo “producción” local. |
| `npm run lint` | Corre **ESLint** sobre el proyecto (`eslint .`). |
| `npm run validate:clientes` | Ejecuta `node scripts/validate-client-invitations.mjs` (ver sección 2). |
| `npm run panel:gen-id` | Ejecuta `node scripts/generate-panel-id.mjs` (ver sección 3). |
| `npm run panel:audit-orphans` | Ejecuta `node scripts/audit-orphan-panel-eventos.mjs` (ver sección 4). |

**Cómo trabajar en el día a día**

- Desarrollo: `npm run dev`, editás código/JSON, recargás el navegador.
- Antes de commit o deploy: `npm run validate:clientes` y, si usás calidad estricta, `npm run lint` y `npm run build`.
- Producción local: `npm run build` y luego `npm run start`.

---

## 2. `scripts/validate-client-invitations.mjs`

**Para qué sirve.** Revisar **todos** los JSON de invitaciones en `data/clientes/<tipo>/*.json` antes de que fallen en el navegador o en el build.

**Cómo correrlo**

```bash
npm run validate:clientes
```

o:

```bash
node scripts/validate-client-invitations.mjs
```

**Qué valida (resumen)**

1. **Parseo JSON** — Si el archivo no es JSON válido, lo reporta y sigue con el resto de archivos.
2. **Estructura mínima** — Exige objetos raíz con `meta`, `theme`, `overlay`, `hero`, `music` (tipos y presencia básica).
3. **`sections`** — Debe ser un array; cada elemento debe tener `type` e `id`; no permite **ids de sección duplicados** (rompen las keys de React).
4. **Reglas por tipo de sección** — Por ejemplo `honeymoon`, `dressCode`, `universalInfo`: si el botón está activo según las flags, exige `data.button` donde corresponde.
5. **Archivos en disco** — Recorre strings del JSON que parecen rutas a archivos bajo `public/` (imágenes, `/clientes/`, `/landing/`, etc.) y comprueba que el archivo **exista** en el disco del proyecto.

**Cómo interpretar la salida**

- **Código de salida 0** y mensaje `OK — N invitación(es)...`: no encontró problemas.
- **Código de salida 1**: lista archivos con problemas y, bajo cada uno, viñetas con el detalle. Corregís y volvé a correr.

**Cómo funciona por dentro**

- No usa red ni base de datos: solo `fs` y `path`.
- Ignora claves de comentario que empiezan con `//` o `_comment` al recorrer strings anidados (para no tratar comentarios como rutas).

---

## 3. `scripts/generate-panel-id.mjs`

**Para qué sirve.** Generar un texto **difícil de adivinar** para `rsvpPanel.panelId` (la “clave” del link `/panel/...`). No toca Supabase ni el disco de clientes: **solo imprime** una línea en la terminal.

**Cómo correrlo**

```bash
npm run panel:gen-id
npm run panel:gen-id -- anto-walter
```

o sin npm:

```bash
node scripts/generate-panel-id.mjs anto-walter
```

- Sin argumentos usa el prefijo `mi-evento`.
- El argumento es un **prefijo legible** (se normaliza: minúsculas, guiones, sin caracteres raros).

**Salida**

- Una línea en **stdout**: `{prefijo}-{tokenDe12Caracteres}` (el token sale de un alfabeto alfanumérico en minúsculas vía `nanoid`).
- Una línea en **stderr** recordando que copiés el valor en el JSON (`rsvpPanel.panelId`).

**Cómo funciona por dentro**

- `customAlphabet` de `nanoid` con 12 caracteres aleatorios.
- El prefijo se limpia para que sea seguro en URL; si queda vacío, vuelve a `mi-evento`.

---

## 4. `scripts/audit-orphan-panel-eventos.mjs`

**Para qué sirve.** Encontrar filas de la tabla **`eventos`** en **Supabase** cuyo `panel_id` **no** aparece en ningún JSON de `data/clientes/**` (ni en `rsvpPanel.panelId` ni en `rsvpPanel.legacyPanelIds`). Sirve para limpiar eventos viejos de prueba o migraciones descuidadas.

**Requisitos**

- Archivo **`.env.local`** en la raíz con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (el script los carga igual que la app).

**Cómo correrlo**

Solo listar (no borra):

```bash
npm run panel:audit-orphans
node scripts/audit-orphan-panel-eventos.mjs
```

Listar y luego **borrar** los huérfanos (pide confirmación escribiendo `YES`):

```bash
node scripts/audit-orphan-panel-eventos.mjs --delete
```

**Salida**

- Cuántos `panel_id` están referenciados desde JSON.
- Tabla de huérfanos con: `panel_id`, `num_invitados`, `con_datos` (Sí/No), `created_at`, `id` del evento.
- Resumen: cuántos huérfanos tienen al menos un invitado (revisar antes de borrar).

**Borrado**

- Tras `--delete`, si escribís `YES`, ejecuta `DELETE` en `eventos` para esos ids. Por **CASCADE** en el esquema del proyecto, se borran también `invitados` e `integrantes` ligados.

**Cómo funciona por dentro**

- Recorre JSON de clientes y arma un `Set` de ids en uso.
- Consulta `eventos` en Supabase con el cliente JS oficial.
- Cuenta invitados por `evento_id` para los huérfanos.

Más detalle operativo: **`docs/PANEL_INVITADOS.md`** (sección de eventos huérfanos).

---

## 5. `scripts/gen-access-token.mjs`

**Para qué sirve.** Generar el **token de acceso corto** (6 caracteres) y su **hash SHA-256** para guardar en el JSON del cliente (`access.tokenHash`), sin guardar el token en claro en el repo si no querés. Va alineado con **`docs/ACCESO_TOKEN_INVITACIONES.md`**.

**Cómo correrlo**

```bash
node scripts/gen-access-token.mjs
node scripts/gen-access-token.mjs MI6TOK
```

- Sin argumento: elige un token aleatorio de 6 caracteres (A–Z, a–z, 0–9).
- Con argumento: debe ser **exactamente** 6 caracteres alfanuméricos (útil si ya definiste uno y solo querés el hash).

**Salida**

- Imprime `token:` y `sha256:`.
- Imprime un bloque JSON de ejemplo con `tokenEnabled` y `tokenHash` para pegar/adaptar en el cliente.

**Cómo funciona por dentro**

- `crypto.randomBytes` + alfabeto base62 para el modo aleatorio.
- `crypto.createHash("sha256").update(token).digest("hex")` para el hash.

**Nota de seguridad**

- El token en claro (`access.token`) en JSON es solo para **admin** que necesite copiar el link con `?k=`; en producción lo habitual es solo `tokenHash` + `tokenEnabled`.

---

## 6. `scripts/migrate-to-blob.ts` (TypeScript, avanzado)

**Para qué sirve.** Migrar archivos que hoy viven bajo **`public/clientes/`** (y similares) a **Vercel Blob**, y reescribir URLs en los JSON de `data/clientes/**` para que apunten a Blob. Es **incremental**: intenta no volver a subir lo ya subido (según lo que implemente el script y la API de listado).

**Cómo correrlo (según el propio archivo)**

1. Token de escritura: `export BLOB_READ_WRITE_TOKEN="..."`  
2. Ejecutar con un runner TS, por ejemplo:

```bash
npx tsx scripts/migrate-to-blob.ts
```

(`tsx` puede no estar en `package.json`; si falla, instalá `tsx` como devDependency o usá otro runner compatible.)

**Qué hace (según comentarios en el script)**

1. Busca archivos en `public/clientes/` (y extensiones que maneje).
2. Consulta Blob para ver qué ya existe.
3. Sube solo lo nuevo.
4. Actualiza JSON de clientes con nuevas URLs.
5. Puede guardar mapeo en `scripts/url-mapping.json` (según implementación).

**Advertencia**

- Este archivo es **TypeScript** y puede requerir revisión si el proyecto no compila ese script con `tsc` (dependencias y sintaxis). Tratalo como herramienta de **migración puntual**, no como parte obligatoria del flujo diario.

---

## 7. `scripts/001_create_rsvp_tables.sql` (no es Node)

**Para qué sirve.** Definición de tablas **Supabase** para el panel RSVP: `eventos`, `invitados`, `integrantes`, índices y comentarios sobre CASCADE.

**Cómo “correrlo”**

- En el **SQL Editor** de Supabase pegás el contenido y ejecutás, o usás `psql` contra tu base si tenés el proyecto self-hosted.

**No** se ejecuta con `node`. Es documentación ejecutable de esquema.

---

## 8. Tabla resumen rápida

| Qué | Comando típico | Red / .env |
|-----|----------------|------------|
| Validar JSON clientes | `npm run validate:clientes` | No |
| Generar `panelId` | `npm run panel:gen-id -- prefijo` | No |
| Auditar / borrar eventos huérfanos | `npm run panel:audit-orphans` | Sí (Supabase desde `.env.local`) |
| Token + hash acceso invitación | `node scripts/gen-access-token.mjs` | No |
| Migración a Vercel Blob | `npx tsx scripts/migrate-to-blob.ts` | Sí (Blob + disco) |
| Crear tablas panel | SQL en Supabase | N/A |
| App en desarrollo | `npm run dev` | Opcional |
| Build producción | `npm run build` | No (salvo fetch en build) |

---

## 9. Manuales relacionados en `docs/`

- **`PANEL_INVITADOS.md`** — Uso del panel, `panelId`, `legacyPanelIds`, script de huérfanos.
- **`ACCESO_TOKEN_INVITACIONES.md`** — Token `?k=` en invitaciones; encaja con `gen-access-token.mjs`.
- **`VALIDAR_INVITACIONES_CLIENTES.md`** — Si existe, suele remitir al validador de clientes.

---

*Si agregás un script nuevo en `scripts/` o un `npm run` en `package.json`, actualizá este manual en el mismo cambio para que la lista siga siendo la fuente de verdad.*
