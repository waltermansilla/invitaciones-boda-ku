# MANUAL OPERATIVO - Momento Unico Invitaciones

================================================================================
## 1. FLUJO DE TRABAJO PARA NUEVAS INVITACIONES
================================================================================

### Paso 1: Crear la invitacion

1. Duplica el template correspondiente:
   - Boda: `data/templates/_TEMPLATE_BODA.json` -> `data/clientes/boda/[slug].json`
   - XV: `data/templates/_TEMPLATE_XV.json` -> `data/clientes/xv/[slug].json`

2. Edita el JSON con los datos del cliente

3. Agrega las imagenes en `public/clientes/[tipo]/[slug]/`
   - Ejemplo: `public/clientes/boda/juan-maria/hero.jpg`

4. Prueba en localhost: `http://localhost:3000/boda/[slug]`

5. Cuando estes conforme, sigue al Paso 2


### Paso 2: Migrar imagenes a Vercel Blob

Cuando tengas una o varias invitaciones listas:

```bash
npx tsx scripts/migrate-to-blob.ts
```

### Paso 3: Verificar y subir

1. Verifica que las invitaciones funcionen en localhost
2. Hace commit y push:
```bash
git add .
git commit -m "Nuevas invitaciones"
git push
```

### Paso 4: Limpiar (opcional)

Borra las imagenes locales que ya migraste:
```bash
npx tsx scripts/migrate-to-blob.ts --delete
```


================================================================================
## 2. SCRIPT DE MIGRACION - EXPLICACION DETALLADA
================================================================================

### Que es el script?

Es un archivo que automatiza la subida de imagenes a Vercel Blob y actualiza 
los JSONs para que usen las nuevas URLs. Esta en `scripts/migrate-to-blob.ts`.


### Como ejecutarlo?

Abri la terminal en la carpeta del proyecto y ejecuta:

```bash
npx tsx scripts/migrate-to-blob.ts
```


### Que hace exactamente? (paso a paso)

1. **Consulta Vercel Blob**
   - Se conecta a tu storage de Blob
   - Obtiene la lista de todos los archivos que YA estan subidos
   - Esto evita subir duplicados

2. **Busca archivos locales**
   - Recorre la carpeta `public/clientes/`
   - Encuentra todas las imagenes (jpg, png, webp, gif) y audios (mp3, wav)

3. **Compara y sube**
   - Si el archivo YA existe en Blob -> lo saltea (no lo sube de nuevo)
   - Si el archivo es NUEVO -> lo sube a Blob

4. **Actualiza los JSONs**
   - Recorre todos los JSONs en `data/clientes/*/` (boda, xv, baby, cumple, etc.)
   - Reemplaza las rutas locales por las URLs de Blob
   - Ejemplo: `/clientes/boda/juan/hero.jpg` -> `https://xxx.blob.vercel-storage.com/clientes/boda/juan/hero.jpg`

5. **Muestra resumen**
   - Te dice cuantos archivos subio
   - Te dice cuantos salteo (ya existian)
   - Te muestra las CARPETAS que podes borrar


### Que me va a mostrar?

```
========================================
   MIGRACION A VERCEL BLOB
========================================

Consultando archivos existentes en Blob...
Ya existen 93 archivos en Blob

Encontrados 15 archivos locales

--- SUBIENDO ARCHIVOS NUEVOS ---

  Subiendo: clientes/boda/nueva-pareja/hero.jpg
    -> https://xxx.blob.vercel-storage.com/clientes/boda/nueva-pareja/hero.jpg
  Subiendo: clientes/boda/nueva-pareja/gallery-1.jpg
    -> https://xxx.blob.vercel-storage.com/clientes/boda/nueva-pareja/gallery-1.jpg

Subidos: 2 nuevos
Saltados: 13 (ya existian)

--- ACTUALIZANDO JSONs ---

  Actualizado: nueva-pareja.json

========================================
   MIGRACION COMPLETADA
========================================

Proximos pasos:
1. Verifica que las invitaciones funcionen en localhost
2. Hace commit y push:
   git add .
   git commit -m "Migrar imagenes a Blob"
   git push

========================================
   CARPETAS QUE PODES BORRAR
========================================

Todas las imagenes de estas carpetas ya estan en Blob:

   public/clientes/boda/camila/  (8 archivos)
   public/clientes/boda/juan-maria/  (5 archivos)
   public/clientes/boda/nueva-pareja/  (2 archivos)

Total: 15 archivos en 3 carpetas

----------------------------------------
OPCIONES PARA BORRAR:
----------------------------------------

Opcion 1 - Automatico (borra todo):
   npx tsx scripts/migrate-to-blob.ts --delete

Opcion 2 - Manual (borrar carpetas especificas):
   Borra las carpetas desde tu explorador de archivos
```


### El comando --delete

Si ejecutas:
```bash
npx tsx scripts/migrate-to-blob.ts --delete
```

El script:
1. Verifica que archivos locales ya estan en Blob
2. Borra SOLO esos archivos (no borra nada que no este en Blob)
3. Borra las carpetas que quedan vacias automaticamente


### Es seguro?

SI, porque:
- Solo sube archivos nuevos (no duplica)
- Solo borra archivos que YA estan en Blob
- Si algo falla, las imagenes siguen en Blob y podes recuperarlas


### Prerequisitos

El script necesita el token de Blob para conectarse. Opciones:

1. **Si tenes .env.local** (recomendado):
   Agrega esta linea al archivo `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=tu_token_aqui
   ```

2. **Si preferis exportar manualmente**:
   ```bash
   export BLOB_READ_WRITE_TOKEN="tu_token_aqui"
   npx tsx scripts/migrate-to-blob.ts
   ```

Para obtener el token:
1. Anda a vercel.com -> tu proyecto -> Storage -> Blob
2. Click en "Tokens" o busca el token en la configuracion


================================================================================
## 3. ESTRUCTURA DE CARPETAS
================================================================================

```
data/
  README.md                <- Indice de carpetas (ver raiz de data/)
  clientes/
    boda/
      juan-maria.json      <- Invitacion de boda
      otra-pareja.json
    xv/
      valentina.json       <- Invitacion de XV
  landing/                 <- Landings comerciales (/, /landing), pricing.json, configurador-es.json
  templates/
    _TEMPLATE_BODA.json    <- Template de referencia para bodas
    _TEMPLATE_XV.json      <- Template de referencia para XV
  reference/
    wedding-config.json    <- Ejemplo legacy (referencia)
  admin/
    admin.json             <- Panel admin (API)
  docs/
    MANUAL_OPERATIVO.md    <- Este archivo

public/
  clientes/                <- Imagenes ANTES de migrar a Blob
    boda/
      juan-maria/
        hero.jpg
        gallery-1.jpg
    xv/
      valentina/
        hero.jpg

scripts/
  migrate-to-blob.ts       <- Script de migracion
  url-mapping.json         <- Mapeo de URLs (generado automaticamente)
```


================================================================================
## 4. URLs DE LAS INVITACIONES
================================================================================

Produccion:
- Boda: `https://momentounico.com/boda/[slug]`
- XV: `https://momentounico.com/xv/[slug]`
- QR Card: `https://momentounico.com/{tipo}/{slug}/qr` (ej. `/boda/anto-walter/qr`, `/baby/maxima/qr`)

Desarrollo local:
- Boda: `http://localhost:3000/boda/[slug]`
- XV: `http://localhost:3000/xv/[slug]`


================================================================================
## 5. COMANDOS UTILES
================================================================================

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Migrar imagenes a Blob
npx tsx scripts/migrate-to-blob.ts

# Borrar archivos ya migrados
npx tsx scripts/migrate-to-blob.ts --delete

# Ver archivos en Blob (desde el navegador)
# vercel.com -> tu proyecto -> Storage -> Blob
```


================================================================================
## 6. TROUBLESHOOTING
================================================================================

### "BLOB_READ_WRITE_TOKEN not found"

El script necesita el token de Blob. Solucion:
1. Crea/edita el archivo `.env.local` en la raiz del proyecto
2. Agrega: `BLOB_READ_WRITE_TOKEN=tu_token`
3. Obtene el token desde vercel.com -> Storage -> Blob -> Tokens


### Las imagenes no cargan

1. Verifica que la URL en el JSON sea correcta
2. Si es URL de Blob: debe empezar con `https://...blob.vercel-storage.com/`
3. Si es local: debe empezar con `/clientes/...`
4. Verifica que el archivo exista en Blob (vercel.com -> Storage -> Blob)


### El JSON tiene errores de sintaxis

1. Usa un validador online: jsonlint.com
2. Errores comunes:
   - Comillas sin cerrar
   - Comas de mas al final de arrays/objetos
   - Caracteres especiales sin escapar


### El script no encuentra archivos

1. Verifica que las imagenes esten en `public/clientes/`
2. Verifica que sean formatos soportados: jpg, jpeg, png, webp, gif, mp3, wav, mp4
