# MANUAL OPERATIVO - SISTEMA MULTI-EVENTO

> Guia interna para crear y administrar invitaciones digitales (bodas, XV, etc.).
> Ultima actualizacion: Febrero 2026.

---

## 1. COMO FUNCIONA EL SISTEMA

Un solo proyecto sirve para **todos los clientes y tipos de evento** (bodas, XV, cumples, etc.).

- Cada cliente tiene su **propio JSON** en `data/clientes/[tipo]/[slug].json`.
- Cada cliente tiene sus **propias imagenes** en `public/clientes/[tipo]/[slug]/`.
- La URL se genera automaticamente: `data/clientes/boda/anto-walter.json` -> `tudominio.com/boda/anto-walter`
- Cada cliente tiene **dos versiones automaticas**: la real (`/boda/slug`) y la muestra (`/m/boda/slug`).
- **No se toca codigo para crear un nuevo cliente.** Solo se agrega un JSON y una carpeta de imagenes.

### Estructura de carpetas

```
data/
  _TEMPLATE_BODA.json         <- Referencia con TODAS las secciones posibles para boda
  _TEMPLATE_XV.json           <- Referencia con TODAS las secciones posibles para XV
  clientes/
    boda/
      anto-walter.json        -> tudominio.com/boda/anto-walter (real)
                              -> tudominio.com/m/boda/anto-walter (muestra)
    xv/
      valentina.json          -> tudominio.com/xv/valentina (real)
                              -> tudominio.com/m/xv/valentina (muestra)

public/
  clientes/
    boda/
      anto-walter/
        img-hero.jpg
        galeria-1.jpg
        ...
    xv/
      valentina/
        quince-hero.jpg
        quince-portrait.jpg
        ...
```

---

## 2. COMO CREAR UN NUEVO CLIENTE

### Paso 1: Elegir el template segun tipo de evento

- Para **boda**: copiar `data/_TEMPLATE_BODA.json`
- Para **XV**: copiar `data/_TEMPLATE_XV.json`

Estos templates tienen TODAS las secciones posibles con comentarios explicativos. Borras las que no necesites.

### Paso 2: Renombrar y ubicar el JSON

Copiar al directorio correcto con el nombre que sera la URL:
- `data/clientes/boda/lucia-sebastian.json` -> `/boda/lucia-sebastian`
- `data/clientes/xv/camila.json` -> `/xv/camila`

Usar siempre minusculas, sin espacios, separado por guiones.

### Paso 3: Crear carpeta de imagenes

Crear en `public/clientes/[tipo]/[slug]/` y poner ahi todas las fotos del cliente.

### Paso 4: Editar el JSON

1. **meta** -- nombres, titulo, descripcion
2. **theme** -- colores y fuente
3. **hero** -- foto principal, fecha, headline
4. **sections** -- borrar las que no se necesiten, editar textos, fotos, links, datos bancarios
5. **Rutas de imagenes** -- todas deben apuntar a `/clientes/[tipo]/[slug]/nombre.jpg` (sin `/public`)

### Paso 5: Probar

- Version real: `http://localhost:3000/boda/lucia-sebastian`
- Version muestra: `http://localhost:3000/m/boda/lucia-sebastian`

Listo. No hay que tocar ningun otro archivo.

---

## 3. COMO TRABAJAR EN TU MAC LOCAL

### Levantar el proyecto

```bash
cd invitaciones-boda-ku
npm install          # solo la primera vez o si se agregan dependencias
npm run dev          # levanta el servidor de desarrollo
```

### URLs disponibles

| URL | Que es |
| --- | ------ |
| `http://localhost:3000` | Pagina raiz -- listado de todas las invitaciones (links a versiones muestra) |
| `http://localhost:3000/boda/anto-walter` | Version real de boda |
| `http://localhost:3000/m/boda/anto-walter` | Version muestra de boda |
| `http://localhost:3000/xv/valentina` | Version real de XV |
| `http://localhost:3000/m/xv/valentina` | Version muestra de XV |

### Editar y ver en vivo

Cada vez que guardas un archivo (JSON, `.tsx`, `.css`), el navegador se actualiza solo. No hace falta reiniciar el servidor.

### Flujo de trabajo recomendado

1. Abrir terminal y correr `npm run dev`
2. Abrir el navegador en `localhost:3000`
3. Editar el JSON del cliente (textos, fotos, secciones)
4. Guardar. La pagina se actualiza sola
5. Ir alternando entre `/boda/slug` (real) y `/m/boda/slug` (muestra) para verificar
6. Cuando esta listo, pushear a GitHub y se deploya automatico a Vercel

---

## 4. DIFERENCIA ENTRE BODA Y XV

### Secciones compartidas (disponibles en ambos)

| `type`           | Que hace                                                 | Notas para XV |
| ---------------- | -------------------------------------------------------- | ------------- |
| `quote`          | Frase con fondo (autor opcional)                         | |
| `dateInfo`       | Fecha del evento                                         | |
| `locationInfo`   | Ubicacion con link a Google Maps                         | |
| `gallery`        | Slider automatico de fotos                               | |
| `itinerary`      | Linea de tiempo con iconos                               | |
| `dressCode`      | Vestimenta con modal de consejos                         | |
| `photos`         | Invita a subir fotos al album compartido                 | |
| `emotionalQuote` | Frase emotiva centrada                                   | |
| `trivia`         | Juego trivia (4 opciones)                                | |
| `truths`         | Juego verdadero/falso (opcion A o B)                     | |
| `ourStory`       | Momentos con fotos                                       | En XV se usa como "Mi historia" |
| `giftCard`       | Tarjeta de regalo con datos bancarios                    | |
| `honeymoon`      | Alcancia con datos bancarios                             | En XV se usa como "Mi viaje sonado" o similar |
| `playlist`       | Link a playlist de Spotify                               | |
| `rsvp`           | Formulario de confirmacion                               | |
| `specialMessage` | Mensaje personal con firma                               | En boda: de los novios. En XV: de la quinceanera |
| `closingImage`   | Foto de cierre                                           | |
| `footer`         | Pie de pagina con redes de tu marca                      | |

### Secciones exclusivas de XV

| `type`            | Que hace                                                |
| ----------------- | ------------------------------------------------------- |
| `presentation`    | Foto + nombre + descripcion de la quinceanera           |
| `parents`         | Listado de padres/padrinos                              |

### Templates de referencia

- **`data/_TEMPLATE_BODA.json`** -- Todas las secciones posibles para una boda, con textos de ejemplo adaptados (pareja, "nos casamos", "nuestra historia", etc.)
- **`data/_TEMPLATE_XV.json`** -- Todas las secciones posibles para un XV, con textos adaptados ("mis 15", "mi historia", "mis padres", etc.) e incluyendo `presentation` y `parents`

---

## 5. MODO MUESTRA (PORTFOLIO)

### Que es

Cada invitacion tiene automaticamente dos versiones:
- **Version real**: `/boda/anto-walter` -- para el cliente. Todos los links activos, datos reales.
- **Version muestra**: `/m/boda/anto-walter` -- para tu portfolio. Simulacion perfecta sin datos sensibles.

Ambas usan **el mismo JSON**. No se duplica nada.

### Que cambia en modo muestra

La muestra se ve **visualmente identica** a la real. No hay botones grises ni deshabilitados.

| Componente                      | Comportamiento en muestra                                     |
| ------------------------------- | ------------------------------------------------------------- |
| Botones de accion (Maps, etc.)  | Mismo estilo. No navegan. Muestra aviso "version de muestra". |
| Formulario RSVP                 | Se llena normalmente. Al enviar dice "Confirmacion simulada". |
| Modal de datos bancarios        | Se abre. Datos enmascarados (XXXX-XXXX-XXXX). Sin boton copiar. |
| Modal de luna de miel           | Se abre. Datos enmascarados (XXXX-XXXX-XXXX). Sin boton copiar. |
| Footer (Instagram, WhatsApp)    | Funcionan normalmente (son tus links de marca, no del cliente). |
| Botones del itinerario          | Mismo estilo. No navegan. Muestra aviso "version de muestra". |

### Flujo de trabajo con muestra

1. Crear el JSON del cliente en `data/clientes/[tipo]/[slug].json`
2. Agregar las imagenes en `public/clientes/[tipo]/[slug]/`
3. Probar la version real: `tudominio.com/boda/nombre`
4. Verificar la version muestra: `tudominio.com/m/boda/nombre`
5. Entregar al cliente **solo** la URL real (`/boda/nombre`)
6. Publicar en portfolio **solo** la URL muestra (`/m/boda/nombre`)

### Pagina raiz

La pagina raiz (`/`) lista todos los clientes con links a la version **muestra**. La version real nunca se enlaza publicamente.

### Reglas importantes

- **Nunca desactivar la version real.** Queda activa de por vida.
- **Nunca duplicar el JSON.** Ambas versiones usan el mismo archivo.
- **Nunca enlazar la version real en el portfolio.** Solo la version `/m/...`.
- **No existe un campo `isActive`.** No usar, no inventar.

---

## 6. EDITAR COLORES Y FUENTE (THEME)

```json
"theme": {
  "primaryColor": "#C4788A",
  "backgroundColor": "#FFF9F7",
  "textColor": "#3A3A3A",
  "lightBgTextColor": "#C4788A",
  "darkBgTextColor": "#FFFFFF",
  "accentBackground": "#FDF0EE",
  "modalTextColor": "#FFFFFF",
  "font": {
    "family": "Playfair Display",
    "weights": "300,400,500,600,700"
  }
}
```

| Campo              | Que controla                                                    |
| ------------------ | --------------------------------------------------------------- |
| `primaryColor`     | Color principal: fondos de secciones, botones, acentos, footer  |
| `backgroundColor`  | Fondo general de la pagina                                      |
| `textColor`        | Color del texto del body                                        |
| `lightBgTextColor` | Texto en secciones con fondo claro (iconos, titulos, botones)   |
| `darkBgTextColor`  | Texto en secciones con fondo primario (blanco por defecto)      |
| `accentBackground` | Fondo de elementos sutiles (cards, badges)                      |
| `modalTextColor`   | Color del texto dentro de modales                               |
| `font.family`      | Nombre exacto de Google Fonts                                   |
| `font.weights`     | Pesos separados por coma                                        |

---

## 7. VALORES ESPECIALES

| Campo                  | Valores validos                                                |
| ---------------------- | -------------------------------------------------------------- |
| `button.variant`       | `"primary"`, `"secondary"`, `"background"`                     |
| `bgColor`              | `"primary"` (fondo color primario), `"background"` (fondo claro) |
| `trivia correctIndex`  | Numero del 0 al 3 (0 = primera opcion)                        |
| `truths correctOption` | `"A"` o `"B"`                                                  |
| `socialLinks icon`     | `"instagram"`, `"whatsapp"`                                    |
| `aspectRatio`          | `"3/4"`, `"4/3"`, `"1/1"`, `"16/9"`                           |

---

## 8. ITINERARIO - OPCIONES AVANZADAS

### Campos de cada evento del itinerario

| Campo    | Obligatorio | Que hace                                                       |
| -------- | ----------- | -------------------------------------------------------------- |
| `icon`   | Si          | Icono del evento (ver tabla abajo)                             |
| `name`   | Si          | Nombre del evento ("Civil", "Cena", etc.)                      |
| `time`   | Si          | Hora del evento                                                |
| `date`   | No          | Fecha/dia ("Viernes 16/02"). Si cambia, se muestra separador   |
| `button` | No          | Boton debajo de la hora. Tiene `text`, `url` y `variant`       |

### Ejemplo con fecha y boton

```json
{
  "icon": "civil",
  "name": "Civil",
  "time": "11:00 hs",
  "date": "Viernes 16/02",
  "button": {
    "text": "Como llegar",
    "url": "https://maps.app.goo.gl/...",
    "variant": "secondary"
  }
}
```

### Ejemplo basico (sin fecha ni boton)

```json
{ "icon": "camera", "name": "Fotos", "time": "19:30 hs" }
```

### Tabla completa de iconos

| Nombre en JSON     | Que representa                |
| ------------------ | ----------------------------- |
| `heart`            | Corazon                       |
| `wine`             | Copa de vino                  |
| `utensils`         | Cubiertos / Cena              |
| `music`            | Musica                        |
| `church`           | Iglesia / Ceremonia religiosa |
| `camera`           | Camara / Fotos                |
| `cake`             | Torta                         |
| `car`              | Auto / Traslado               |
| `glass`            | Vaso de agua / Brindis        |
| `party`            | Fiesta / Celebracion          |
| `sparkles`         | Destellos / Recepcion         |
| `sun`              | Sol / Dia                     |
| `moon`             | Luna / Noche                  |
| `clock`            | Reloj / Horario               |
| `pin`              | Ubicacion                     |
| `gift`             | Regalo                        |
| `bus`              | Colectivo / Transporte        |
| `podium`           | Discursante en atril          |
| `book`             | Libro                         |
| `salon`            | Salon de conferencias         |
| `civil`            | Civil / Anillos               |
| `mate`             | Mate                          |
| `fin`              | Fin / Bandera                 |
| `sidra`            | Sidra (copa)                  |
| `mesaDulce`        | Mesa dulce                    |
| `tortaCasamiento`  | Torta de casamiento           |

---

## 9. ERRORES COMUNES

| Error                     | Ejemplo MAL                            | Ejemplo BIEN                           |
| ------------------------- | -------------------------------------- | -------------------------------------- |
| Coma final antes de `]`   | `"foto2.jpg",]`                        | `"foto2.jpg"]`                         |
| Comillas mal cerradas     | `"title": "Hola`                       | `"title": "Hola"`                      |
| Fecha mal formateada      | `"10 de Octubre 2026"`                 | `"2026-10-10T18:00:00"`               |
| Ruta con /public          | `"/public/clientes/boda/img.jpg"`      | `"/clientes/boda/anto-walter/img.jpg"` |
| Link sin https            | `"wa.me/3456023759"`                   | `"https://wa.me/3456023759"`           |

---

## 10. CHECKLIST FINAL

### Datos
- [ ] Nombres correctos en `meta.coupleNames`
- [ ] Titulo de pestana correcto en `meta.title`
- [ ] Fecha en formato ISO en `hero.eventDate`
- [ ] Cuenta regresiva funcionando

### Imagenes
- [ ] Todas las imagenes estan en `public/clientes/[tipo]/[slug]/`
- [ ] Las rutas en el JSON empiezan con `/clientes/[tipo]/[slug]/`
- [ ] Hero, galeria, historia y cierre tienen fotos reales

### Links
- [ ] Google Maps funciona
- [ ] Datos bancarios correctos
- [ ] WhatsApp e Instagram correctos (son de TU MARCA)

### Contenido
- [ ] Textos personalizados (no datos de ejemplo)
- [ ] Secciones innecesarias eliminadas del JSON
- [ ] Orden de secciones tiene sentido

### Versiones
- [ ] Probar version real: `/boda/slug`
- [ ] Probar version muestra: `/m/boda/slug`
- [ ] Probar en celular real
- [ ] Musica funciona (si esta activada)
- [ ] Overlay funciona (si esta activado)
- [ ] Modales abren y cierran
- [ ] RSVP envia correctamente (real) / muestra mensaje simulado (muestra)
- [ ] Datos bancarios reales (real) / enmascarados (muestra)

---

## 11. FOOTER (MARCA)

El footer es **igual en todas las invitaciones**. No se configura desde el JSON -- esta hardcodeado en el componente.

### Donde esta
Archivo: `components/wedding/footer-section.tsx`

### Que tiene
- **Nombre de marca**: "walter invitaciones" -- es un link que lleva a la raiz (`/`).
- **Redes sociales**: Instagram y WhatsApp -- tus links de marca.

### Como cambiar el nombre de marca
Abrir `components/wedding/footer-section.tsx` y buscar esta linea al principio del archivo:
```
const BRAND_NAME = "walter invitaciones"
```
Cambiar el texto entre comillas por el nuevo nombre. Listo, se actualiza en todas las invitaciones.

### Como poner un logo en vez de texto
En el mismo archivo, buscar donde dice `{BRAND_NAME}` dentro del `<Link>` y reemplazarlo por una imagen:
```jsx
<img src="/images/mi-logo.png" alt="Mi Marca" className="h-6 opacity-40" />
```
Subir el logo a `public/images/`.

### Como cambiar las redes sociales
En el mismo archivo, buscar `SOCIAL_LINKS` y editar las URLs:
```
{ icon: "instagram", url: "https://instagram.com/tu_cuenta", label: "Instagram" },
{ icon: "whatsapp",  url: "https://wa.me/tunumero", label: "WhatsApp" },
```
Para agregar otra red (ej: TikTok) habria que agregar el icono SVG al archivo tambien.

### Importante
- El footer **no se elimina** del JSON de los clientes (sigue ahi como seccion type `"footer"` para que aparezca en su lugar). Pero los datos que tenga dentro (`brandName`, `socialLinks`) se **ignoran** -- el componente usa los suyos propios.
- El color se adapta automaticamente al primary de cada invitacion.

---

## 12. QUE NO TOCAR

- **Nombres de propiedades** (`type`, `id`, `blocks`, `data`, etc.)
- **Valores de `type`** -- usar solo los listados en la seccion 4
- **Estructura de arrays** -- no convertir `[]` en `{}` o en string
- **Archivos de codigo** -- salvo que sea estrictamente necesario
- **Los templates** (`_TEMPLATE_BODA.json`, `_TEMPLATE_XV.json`) -- son de referencia, nunca se borran

| Que quiero cambiar               | Donde                                                     |
| -------------------------------- | --------------------------------------------------------- |
| Textos, fotos, colores, fuentes  | Solo el JSON del cliente                                  |
| Agregar un nuevo tipo de seccion | `components/wedding/section.tsx` (requiere React)         |
| Agregar un nuevo icono           | `components/wedding/itinerary-section.tsx` (agregar map)  |
| Estilos CSS globales             | `app/globals.css` (raramente necesario)                   |

---

## 13. RESUMEN RAPIDO

```
Crear nueva boda:
  1. Copiar data/_TEMPLATE_BODA.json -> data/clientes/boda/nuevo-slug.json
  2. Crear public/clientes/boda/nuevo-slug/ con las fotos
  3. Editar el JSON (textos, colores, fotos, secciones)
  4. Listo: /boda/nuevo-slug (real) y /m/boda/nuevo-slug (muestra)

Crear nuevo XV:
  1. Copiar data/_TEMPLATE_XV.json -> data/clientes/xv/nuevo-slug.json
  2. Crear public/clientes/xv/nuevo-slug/ con las fotos
  3. Editar el JSON (textos, colores, fotos, secciones)
  4. Listo: /xv/nuevo-slug (real) y /m/xv/nuevo-slug (muestra)

Entregar al cliente: URL real (/boda/slug)
Publicar en portfolio: URL muestra (/m/boda/slug)
```
