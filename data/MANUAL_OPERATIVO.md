# MANUAL OPERATIVO - Momento Unico Invitaciones

## Flujo de trabajo para nuevas invitaciones

### 1. Crear la invitacion

1. Duplica el template correspondiente:
   - Boda: `data/_TEMPLATE_BODA.json` -> `data/clientes/boda/[slug].json`
   - XV: `data/_TEMPLATE_XV.json` -> `data/clientes/xv/[slug].json`

2. Edita el JSON con los datos del cliente

3. Agrega las imagenes en `public/clientes/[tipo]/[slug]/`
   - Ej: `public/clientes/boda/juan-maria/hero.jpg`

4. Prueba en localhost: `http://localhost:3000/boda/[slug]`

### 2. Migrar imagenes a Vercel Blob

Cuando tengas varias invitaciones listas (o cuando quieras):

```bash
# 1. Abri la terminal en la carpeta del proyecto

# 2. Ejecuta el script de migracion
npx tsx scripts/migrate-to-blob.ts

# 3. El script:
#    - Sube SOLO las imagenes nuevas (no duplica)
#    - Actualiza automaticamente los JSONs con las URLs de Blob

# 4. Verifica que funcione en localhost

# 5. Hace commit y push
git add .
git commit -m "Migrar imagenes a Blob"
git push
```

### 3. Despues de migrar

Podes borrar las imagenes de `public/clientes/` que ya migraste para liberar espacio en Git. El script te muestra cuales podes borrar.

---

## Estructura de carpetas

```
data/
  _TEMPLATE_BODA.json    <- Template de referencia para bodas
  _TEMPLATE_XV.json      <- Template de referencia para XV
  clientes/
    boda/
      juan-maria.json    <- Invitacion de boda
    xv/
      valentina.json     <- Invitacion de XV

public/
  clientes/              <- Imagenes ANTES de migrar a Blob
    boda/
      juan-maria/
        hero.jpg
        galeria-1.jpg
    xv/
      valentina/
        hero.jpg

scripts/
  migrate-to-blob.ts     <- Script de migracion
  url-mapping.json       <- Mapeo de URLs (generado por el script)
```

---

## URLs de las invitaciones

- Boda: `https://tudominio.com/boda/[slug]`
- XV: `https://tudominio.com/xv/[slug]`
- QR Card: `https://tudominio.com/boda/[slug]/qr`

---

## Comandos utiles

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Migrar imagenes a Blob
npx tsx scripts/migrate-to-blob.ts

# Ver que archivos estan en Blob (desde Vercel dashboard)
# vercel.com -> tu proyecto -> Storage -> Blob
```

---

## Troubleshooting

### "BLOB_READ_WRITE_TOKEN not found"
El script necesita el token de Blob. Opciones:
1. Corre desde Vercel (ya tiene el token)
2. Exporta la variable: `export BLOB_READ_WRITE_TOKEN="tu_token"`
3. Crea un archivo `.env.local` con `BLOB_READ_WRITE_TOKEN=tu_token`

### Las imagenes no cargan
1. Verifica que la URL en el JSON sea correcta
2. Si es URL de Blob, deberia empezar con `https://...blob.vercel-storage.com/`
3. Si es local, deberia empezar con `/clientes/...`

### El JSON tiene errores
1. Usa un validador de JSON online para verificar sintaxis
2. Verifica que todas las comillas esten cerradas
3. Verifica que no haya comas de mas al final de arrays/objetos
