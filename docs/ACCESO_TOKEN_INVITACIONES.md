 # Acceso con token corto (6 caracteres)

Manual simple para proteger invitaciones reales de curiosos.

## Objetivo

- La invitación real (`/tipo/slug`) puede pedir un token en URL: `?k=ABC123`.
- Si no coincide, devuelve 404.
- La muestra (`/m/tipo/slug`) no usa este token.

## Opción recomendada (fácil): token corto

Para uso diario, podés manejarte solo con token corto de 6 caracteres.

Agregar en el JSON del cliente:

```json
"access": {
  "tokenEnabled": true,
  "token": "ABC123",
  "allowLegacyUntil": "2026-12-31"
}
```

- `tokenEnabled`: activa/desactiva el control.
- `token`: token real de 6 caracteres alfanuméricos.
- `allowLegacyUntil` (opcional): hasta esa fecha deja entrar sin `k` para migraciones.

Con esto ya funciona todo el acceso por `?k=...`.

## Opción más segura: usar hash SHA-256

Si querés más seguridad, además (o en lugar de `token`) podés guardar solo el hash.

```json
"access": {
  "tokenEnabled": true,
  "token": "ABC123",
  "tokenHash": "SHA256_EN_HEX",
  "allowLegacyUntil": ""
}
```

- Si hay `tokenHash`, la validación prioriza ese valor.
- Si no hay `tokenHash`, valida con `token` corto.
- Recomendación de seguridad fuerte: guardar solo `tokenHash`.

### Dónde copiar/pegar rápido

- Templates:
  - `data/templates/_TEMPLATE_BODA.json`
  - `data/templates/_TEMPLATE_XV.json`
- Evento real (ejemplo): `data/clientes/boda/16-mirta-pelu.json`

Copiá este bloque (fácil):

```json
"access": {
  "tokenEnabled": true,
  "token": "ABC123",
  "allowLegacyUntil": ""
}
```

Si querés la variante con hash, agregá:

```json
"tokenHash": "PEGAR_SHA256_AQUI"
```

## Generar token + hash

```bash
node scripts/gen-access-token.mjs
```

### Cuándo correr este script

- Cuando creás un evento nuevo con token.
- Cuando necesitás rotar token (si se filtró el link).
- Cuando pasás un evento viejo a modo protegido.

No hace falta correrlo en cada deploy.

Salida ejemplo:

- `token: Ab3Xz9`
- `sha256: ...`

Si usás la opción segura, pegá el hash en `access.tokenHash`.
El token real se comparte solo por WhatsApp/link.

También podés pasar un token manual:

```bash
node scripts/gen-access-token.mjs Ab3Xz9
```

### Qué hace el script

- Genera (o usa) un token de 6 caracteres.
- Calcula su SHA-256.
- Te imprime ambos para copiar/pegar:
  - token real: lo compartís en el link (`?k=...`)
  - hash: lo guardás en `access.tokenHash`

## Cómo compartir links

- Link real normal: `https://tudominio.com/boda/mi-slug?k=Ab3Xz9`
- Si también usás panel por invitado: `...?k=Ab3Xz9&c=CODIGO`

## Compatibilidad con eventos ya activos

Para no romper enlaces viejos:

1. Dejá `tokenEnabled: false` en eventos viejos, o
2. Activá token y agregá `allowLegacyUntil` unos días.

Cuando pase la fecha, ya será obligatorio `k`.

### `allowLegacyUntil` explicado simple

- Si `tokenEnabled` está en `true`, normalmente pide `?k=...`.
- Si cargás `allowLegacyUntil: "2026-12-31"`, hasta ese día deja entrar también sin token.
- Desde el día siguiente, vuelve a exigir token.
- Si no lo necesitás, dejalo vacío (`""`) o quitá la clave.

## Notas importantes

- El token acepta solo 6 caracteres alfanuméricos (`A-Z a-z 0-9`).
- La validación aplica en rutas reales:
  - `/{tipo}/{slug}`
  - `/{tipo}/{slug}/qr`
- Si el token es inválido o falta (cuando es obligatorio), responde 404.
