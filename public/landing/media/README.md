# Medios de la landing home (ruta `/`, datos en `data/landing/landing-2.json`)

Todo lo que pongas acá se sirve desde la raíz del sitio: rutas que empiezan con `/landing/media/`.

## Carpetas

| Carpeta   | Uso recomendado |
|-----------|------------------|
| `images/` | Fotos para cards de estilos, hero, sección “Qué incluye”, panel, comparativa, etc. |
| `videos/` | Loops o previews en `videoSrc` de cada ítem en `sections.estilos.items` (opcional). |

Podés crear subcarpetas si querés ordenar (ej. `images/estilos/`, `images/panel/`); la ruta en JSON debe coincidir.

## Cómo enlazarlo en `landing-2.json` (y `.en.json`)

Las rutas son **públicas**, sin `public/` en el string:

```json
"imageSrc": "/landing/media/images/incluye-ejemplo.webp"
```

```json
"items": [
  {
    "image": "/landing/media/images/estilo-anto-walter.webp",
    "videoSrc": "/landing/media/videos/estilo-anto-preview.mp4",
    "titulo": "Anto & Walter",
    "descripcion": "…",
    "href": "/m/boda/anto-walter"
  }
]
```

Otros campos que suelen llevar imagen:

- `sections.hero` — si en el futuro agregás imagen de fondo (hoy depende del componente).
- `sections.incluye.imageSrc` — puede ser un **video** (`.mp4`, `.webm`, `.mov`). No usamos `poster` en el `<video>`: una imagen distinta al primer frame suele **destellar** al arrancar la reproducción.
- `sections.idiomas.globeImageSrc`
- `sections.panel.imageSrc`
- `sections.comparativa` — `imageSrc` / `imageAlt` en bloques que los usen.

## Formatos

- **Imágenes:** WebP o AVIF (mejor peso), JPG/PNG si ya los tenés.
- **Video:** MP4 (H.264) para máxima compatibilidad; mantené clips cortos y livianos para móvil.

## No commitear archivos enormes

Si un video pesa mucho, subilo a un CDN o hosting y usá URL absoluta en `image` / `videoSrc` en el JSON.
