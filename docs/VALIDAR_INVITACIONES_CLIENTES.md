# Validar invitaciones (JSON de clientes)

Cuando una tarjeta “no carga” o ves errores en consola, **antes de revisar a mano** conviene correr el chequeo automático sobre **todos** los archivos en `data/clientes/**/*.json`.

## Comandos

| Comando | Qué hace |
|--------|----------|
| `npm run validate:clientes` | Valida JSON, estructura mínima, ids de sección, rutas a archivos en `public/`, y reglas que suelen romper React. **Sale con código 1 si hay errores** (útil en CI). |
| `npm run build:ci` | Igual que arriba **y luego** `next build` (compilación + páginas estáticas). |

El script está en: `scripts/validate-client-invitations.mjs`.

## Qué revisa el script

- JSON bien formado.
- Presencia de objetos mínimos: `meta`, `theme`, `overlay`, `hero`, `music`, `sections`.
- Cada sección con `type` e `id`; **ids duplicados** (rompen las `key` de React).
- Strings que parecen archivos locales (`/clientes/...`, `/landing/...`, extensiones de imagen/audio, etc.): que existan bajo `public/`.
- Algunas combinaciones peligrosas (ej. sección `honeymoon` con botón visible pero sin `data.button`).

## Qué no revisa

- Diseño, textos, ni “si se ve bien” en el navegador.
- Lógica nueva de un componente si no está reflejada en reglas del script.

Para eso: probá la URL en local (`npm run dev` o `npm run dev:webpack`) y/o `npm run build`.

## Si olvidaste el nombre del comando

1. Abrí `package.json` → sección `"scripts"` → buscá **`validate:clientes`** o **`build:ci`**.
2. O esta guía: `docs/VALIDAR_INVITACIONES_CLIENTES.md`.

## CI / antes de publicar

En el servidor o en GitHub Actions, un paso típico es:

```bash
npm run build:ci
```

Si falla, la salida indica **qué archivo** (`data/clientes/...`) y **qué línea conceptual** (mensaje de error); corregís el JSON o subís el archivo faltante a `public/` y volvé a correr.
