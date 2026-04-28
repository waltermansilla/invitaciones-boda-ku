# Admin interno de links

URL de entrada (difícil):

- `/925837links`

Qué muestra:

- tipo + slug
- URL de muestra
- URL real base
- URL real con token (si existe `access.token` en el JSON)
- URL base privada (si existe `base.enabled=true` y `base.token` válido de 8 chars)
- estado de token (`tokenEnabled`, hash presente, legacy)

Notas:

- No tiene login; la protección es conocer la URL completa.
- La URL real con token solo se puede construir si en el JSON existe `access.token`.
- La validación pública sigue usando `access.tokenHash` (SHA-256).

## Cómo cambiar la URL

1. Renombrá la carpeta `app/925837links/` por la que quieras.
2. Reiniciá/redeploy.
3. Entrá con la nueva ruta.
