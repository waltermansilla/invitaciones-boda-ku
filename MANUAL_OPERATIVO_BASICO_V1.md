# MANUAL OPERATIVO - SISTEMA MULTI-EVENTO

> Guia interna completa para crear, administrar y escalar invitaciones digitales.
> Ultima actualizacion: Febrero 2026.

---

## INDICE

1. Como funciona el sistema
2. Estructura del proyecto
3. Como trabajar en tu Mac local
4. Como crear un nuevo cliente (paso a paso)
5. Diferencia entre boda y XV
6. Editar colores y fuente (theme)
7. Modo muestra (portfolio)
8. Landing comercial (pagina raiz)
9. Footer global (marca)
10. Botones CTA de la landing
11. Como agregar una muestra nueva a la landing
12. Valores especiales y opciones avanzadas
13. Errores comunes
14. Checklist final
15. Que no tocar
16. Resumen rapido

---

## 1. COMO FUNCIONA EL SISTEMA

Un solo proyecto sirve para **todos los clientes y tipos de evento** (bodas, XV, cumples, etc.).

- Cada cliente tiene su **propio JSON** en `data/clientes/[tipo]/[slug].json`.
- Cada cliente tiene sus **propias imagenes** en `public/clientes/[tipo]/[slug]/`.
- La URL se genera automaticamente: `data/clientes/boda/anto-walter.json` -> `tudominio.com/boda/anto-walter`
- Cada cliente tiene **dos versiones automaticas**: la real (`/boda/slug`) y la muestra (`/m/boda/slug`).
- **No se toca codigo para crear un nuevo cliente.** Solo se agrega un JSON y una carpeta de imagenes.
- La landing comercial se configura desde `data/landing.json`.
- El footer de marca es global y se edita en un solo archivo.

---

## 2. ESTRUCTURA DEL PROYECTO

```
app/
  page.tsx                     <- Landing comercial (lee de landing.json)
  layout.tsx                   <- Layout raiz (fuentes, metadata)
  globals.css                  <- Estilos globales, variables CSS
  [tipo]/[slug]/               <- Ruta REAL de cada cliente (/boda/anto-walter)
    page.tsx
    layout.tsx
  m/[tipo]/[slug]/             <- Ruta MUESTRA de cada cliente (/m/boda/anto-walter)
    page.tsx
    layout.tsx

components/
  landing/
    landing-page.tsx           <- Componente principal de la landing
  wedding/
    wedding-invitation.tsx     <- Renderiza todas las secciones de una invitacion
    section.tsx                <- Switch que mapea type -> componente
    footer-section.tsx         <- Footer global de marca (hardcodeado)
    hero-section.tsx, gallery-section.tsx, rsvp-section.tsx, etc.

data/
  landing.json                 <- Configuracion completa de la landing
  _TEMPLATE_BODA.json          <- Referencia con TODAS las secciones posibles para boda
  _TEMPLATE_XV.json            <- Referencia con TODAS las secciones posibles para XV
  clientes/
    boda/
      anto-walter.json         -> /boda/anto-walter (real) y /m/boda/anto-walter (muestra)
    xv/
      valentina.json           -> /xv/valentina (real) y /m/xv/valentina (muestra)

public/
  clientes/
    boda/anto-walter/          <- Imagenes de ese cliente
    xv/valentina/              <- Imagenes de ese cliente
```

### Como funciona el ruteo

| URL | Que carga | Fuente de datos |
| --- | --------- | --------------- |
| `/` | Landing comercial | `data/landing.json` |
| `/boda/anto-walter` | Invitacion real | `data/clientes/boda/anto-walter.json` |
| `/m/boda/anto-walter` | Invitacion muestra | Mismo JSON, con `isMuestra=true` |
| `/xv/valentina` | Invitacion real | `data/clientes/xv/valentina.json` |
| `/m/xv/valentina` | Invitacion muestra | Mismo JSON, con `isMuestra=true` |

---

## 3. COMO TRABAJAR EN TU MAC LOCAL

### Primera vez

```bash
git clone https://github.com/waltermansilla/invitaciones-boda-ku.git
cd invitaciones-boda-ku
npm install
```

### Levantar el servidor

```bash
npm run dev
```

### URLs disponibles

| URL | Que es |
| --- | ------ |
| `http://localhost:3000` | Landing comercial |
| `http://localhost:3000/boda/anto-walter` | Version real de boda |
| `http://localhost:3000/m/boda/anto-walter` | Version muestra de boda |
| `http://localhost:3000/xv/valentina` | Version real de XV |
| `http://localhost:3000/m/xv/valentina` | Version muestra de XV |

### Editar y ver en vivo

Cada vez que guardas un archivo (JSON, `.tsx`, `.css`), el navegador se actualiza solo (Hot Module Replacement). No hace falta reiniciar el servidor.

### Flujo de trabajo recomendado

1. Abrir terminal: `npm run dev`
2. Abrir navegador en `localhost:3000`
3. Editar el JSON del cliente (textos, fotos, secciones)
4. Guardar -> la pagina se actualiza sola
5. Alternar entre `/boda/slug` (real) y `/m/boda/slug` (muestra)
6. Cuando esta listo, pushear a GitHub -> se deploya automatico a Vercel

---

## 4. COMO CREAR UN NUEVO CLIENTE (PASO A PASO)

### Paso 1: Elegir el template

- Para **boda**: copiar `data/_TEMPLATE_BODA.json`
- Para **XV**: copiar `data/_TEMPLATE_XV.json`

Estos templates tienen TODAS las secciones posibles con comentarios explicativos.

### Paso 2: Renombrar y ubicar

Copiar al directorio correcto:
```
data/clientes/boda/lucia-sebastian.json  -> /boda/lucia-sebastian
data/clientes/xv/camila.json             -> /xv/camila
```
Siempre minusculas, sin espacios, separado por guiones.

### Paso 3: Crear carpeta de imagenes

```
public/clientes/boda/lucia-sebastian/    <- Todas las fotos de esa boda
public/clientes/xv/camila/              <- Todas las fotos de ese XV
```

### Paso 4: Editar el JSON

1. **meta** -- nombres, titulo, descripcion
2. **theme** -- colores y fuente
3. **hero** -- foto principal, fecha, headline
4. **sections** -- borrar las que no se necesiten, editar textos, fotos, links, datos bancarios
5. **Rutas de imagenes** -- todas apuntan a `/clientes/[tipo]/[slug]/nombre.jpg` (sin `/public`)

### Paso 5: Probar

```
http://localhost:3000/boda/lucia-sebastian      <- version real
http://localhost:3000/m/boda/lucia-sebastian     <- version muestra
```

### Paso 6: Agregar a la landing (opcional)

Ver seccion 11 "Como agregar una muestra nueva a la landing".

Listo. No hay que tocar ningun otro archivo.

---

## 5. DIFERENCIA ENTRE BODA Y XV

### Secciones compartidas (disponibles en ambos)

| `type` | Que hace | Notas para XV |
| ------ | -------- | ------------- |
| `quote` | Frase con fondo (autor opcional) | |
| `dateInfo` | Fecha del evento | |
| `locationInfo` | Ubicacion con link a Maps | |
| `gallery` | Slider automatico de fotos | |
| `itinerary` | Linea de tiempo con iconos | |
| `dressCode` | Vestimenta con modal de consejos | |
| `photos` | Invita a subir fotos al album | |
| `emotionalQuote` | Frase emotiva centrada | |
| `trivia` | Juego trivia (4 opciones) | |
| `truths` | Juego verdadero/falso | |
| `ourStory` | Momentos con fotos | En XV: "Mi historia" (crecimiento) |
| `giftCard` | Tarjeta de regalo con datos bancarios | |
| `honeymoon` | Alcancia con datos bancarios | En XV: "Regalos" (no viaje) |
| `confirmarWhatsapp` | Boton WhatsApp directo (Plan Base) | Sin formulario |
| `playlist` | Link a playlist de Spotify | |
| `rsvp` | Formulario de confirmacion | |
| `specialMessage` | Mensaje personal con firma | |
| `closingImage` | Foto de cierre | |
| `footer` | Footer de marca | |

### Secciones exclusivas de XV

| `type` | Que hace |
| ------ | -------- |
| `presentation` | Foto + nombre + descripcion |
| `parents` | Listado de padres/padrinos |

### Templates

- `data/_TEMPLATE_BODA.json` -- Todas las secciones para boda
- `data/_TEMPLATE_XV.json` -- Todas las secciones para XV (incluye `presentation`, `parents`, `ourStory` adaptado)

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

| Campo | Que controla |
| ----- | ------------ |
| `primaryColor` | Color principal: fondos, botones, acentos, footer |
| `backgroundColor` | Fondo general de la pagina |
| `textColor` | Color del texto del body |
| `lightBgTextColor` | Texto en secciones claras (iconos, titulos) |
| `darkBgTextColor` | Texto en secciones con fondo primario |
| `accentBackground` | Fondo de elementos sutiles (cards, badges) |
| `modalTextColor` | Texto dentro de modales |
| `font.family` | Nombre exacto de Google Fonts |
| `font.weights` | Pesos separados por coma |

---

## 7. MODO MUESTRA (PORTFOLIO)

### Que es

Cada invitacion tiene automaticamente dos versiones:
- **Version real**: `/boda/anto-walter` -- para el cliente, todo activo
- **Version muestra**: `/m/boda/anto-walter` -- para portfolio, datos sensibles protegidos

Ambas usan **el mismo JSON**. No se duplica nada.

### Que cambia en modo muestra

| Componente | En muestra |
| ---------- | ---------- |
| Botones de accion (Maps, etc.) | No navegan. Muestra aviso. |
| Formulario RSVP | Se llena. Al enviar dice "Confirmacion simulada". |
| Modal de datos bancarios | Se abre. Datos enmascarados (XXXX-XXXX-XXXX). Sin copiar. |
| Modal de luna de miel | Se abre. Datos enmascarados. Sin copiar. |
| Footer | Funciona normalmente (son tus links de marca). |
| Botones del itinerario | No navegan. Muestra aviso. |

### Reglas

- **Nunca desactivar la version real.** Queda activa de por vida.
- **Nunca duplicar el JSON.** Ambas versiones usan el mismo archivo.
- **Nunca enlazar la version real en el portfolio.** Solo `/m/...`.
- Entregar al cliente: URL real (`/boda/slug`)
- Publicar en portfolio: URL muestra (`/m/boda/slug`)

---

## 8. LANDING COMERCIAL (PAGINA RAIZ)

La landing en `/` se configura **100% desde** `data/landing.json`.

### Que se puede editar desde el JSON

| Seccion | Que editar |
| ------- | ---------- |
| `theme` | Colores de toda la landing (fondo, texto, acento, cards, footer) |
| `whatsapp` | Numero y mensaje default |
| `ctaButtons` | Todos los botones de accion (ver seccion 10) |
| `sections.hero` | Titulo (con parte en negrita), subtitulo |
| `sections.muestras` | Titulo, descripcion, lista de muestras |
| `sections.servicio` | Planes, precios, features, mostrar/ocultar precios |
| `sections.proceso` | Pasos, highlights |
| `sections.faq` | Preguntas y respuestas |
| `sections.ctaFinal` | Titulo y subtitulo del CTA final |

### Activar/desactivar secciones

Cada seccion tiene `"enabled": true/false`. Poner `false` para ocultarla.

### Titulo del hero con negrita parcial

```json
"title": {
  "normal": "Cada historia merece estar a ",
  "highlight": "la altura"
}
```
`normal` se renderiza con peso ligero, `highlight` en negrita.

---

## 9. FOOTER GLOBAL (MARCA)

El footer es **identico en todas las invitaciones y la landing**. No se configura desde JSON.

### Archivo
`components/wedding/footer-section.tsx`

### Constantes editables (al principio del archivo)

| Constante | Que es | Valor actual |
| --------- | ------ | ------------ |
| `BRAND_NAME` | Nombre de marca | `"momento unico"` |
| `BRAND_FONT` | Clase CSS de fuente | `"font-serif"` (cursiva) |
| `BRAND_SIZE` | Clase CSS de tamano | `"text-base"` |
| `BRAND_ICON` | URL de icono (o null) | `null` (sin icono) |
| `ICON_SIZE` | Tamano de iconos de redes (px) | `26` |
| `SOCIAL_LINKS` | Array de redes sociales | Instagram + WhatsApp |

### Como cambiar el nombre de marca

Buscar `BRAND_NAME` y cambiar el texto:
```js
const BRAND_NAME = "mi nueva marca"
```

### Como cambiar la fuente del nombre

Cambiar `BRAND_FONT`:
- `"font-serif"` -> cursiva elegante (Playfair Display)
- `"font-sans"` -> recta (la fuente del sistema)
- `"font-mono"` -> monoespaciada

### Como cambiar el tamano

Cambiar `BRAND_SIZE`:
- `"text-xs"` (muy chico)
- `"text-sm"` (chico)
- `"text-base"` (normal)
- `"text-lg"` (grande)

### Como agregar un icono al lado del nombre

Cambiar `BRAND_ICON` de `null` a la ruta de la imagen:
```js
const BRAND_ICON = "/images/mi-icono.png"
```
Subir el icono a `public/images/`.

### Como poner un logo en vez de texto

Reemplazar `{BRAND_NAME}` por un `<img>` dentro del `<Link>` del footer:
```jsx
<img src="/images/mi-logo.png" alt="Mi Marca" className="h-5 opacity-40" />
```

### Como cambiar las redes sociales

Editar `SOCIAL_LINKS`:
```js
{ icon: "instagram", url: "https://instagram.com/tu_cuenta", label: "Instagram" },
{ icon: "whatsapp",  url: "https://wa.me/tunumero", label: "WhatsApp" },
```

### Como cambiar el tamano de los iconos

Cambiar `ICON_SIZE` (en pixeles):
```js
const ICON_SIZE = 28
```

### Color del footer

- En las **invitaciones**: se adapta automaticamente al `primaryColor` del cliente via CSS variables.
- En la **landing**: se configura desde `landing.json` en `theme.footerBg` y `theme.footerText`.

---

## 10. BOTONES CTA DE LA LANDING

Todos los botones de accion estan centralizados en `landing.json` > `ctaButtons`.

### Estructura de un boton

```json
{
  "text": "Quiero mi invitacion",
  "type": "whatsapp",
  "message": "Hola! Me interesa una invitacion digital."
}
```

### Tipos disponibles

| `type` | Que hace | Campos necesarios |
| ------ | -------- | ----------------- |
| `whatsapp` | Abre WhatsApp con mensaje | `message` |
| `anchor` | Scroll a una seccion de la misma pagina | `anchor` (ej: `"#muestras"`) |
| `link` | Navega a una URL | `url`, `newTab` (opcional) |

### Botones configurados

| Key en JSON | Donde aparece |
| ----------- | ------------- |
| `heroPrimary` | Boton principal del hero |
| `heroSecondary` | Boton secundario del hero |
| `planEsencial` | Boton del plan Esencial |
| `planPremium` | Boton del plan Premium |
| `proceso` | Boton de la seccion "Como funciona" |
| `ctaFinal` | Boton del CTA final |

### Como cambiar un boton

Solo editar su objeto en `ctaButtons`:
```json
"heroPrimary": {
  "text": "Escribime por WhatsApp",
  "type": "whatsapp",
  "message": "Hola! Quiero info sobre invitaciones."
}
```

### Como agregar un nuevo boton

1. Agregar al objeto `ctaButtons` con un key nuevo
2. Referenciarlo desde la seccion que corresponda (ej: un plan nuevo con `"ctaButton": "planNuevo"`)

No hay que tocar ningun componente.

---

## 11. COMO AGREGAR UNA MUESTRA NUEVA A LA LANDING

### Paso 1: Crear el cliente

Seguir la seccion 4 (crear JSON + imagenes).

### Paso 2: Editar landing.json

Buscar `sections.muestras.items` y agregar un objeto:

```json
{
  "tipo": "boda",
  "slug": "lucia-sebastian",
  "titulo": "Lucia & Sebastian",
  "etiqueta": "Boda",
  "accentColor": "#9A8A7A"
}
```

| Campo | Que es |
| ----- | ------ |
| `tipo` | Carpeta del tipo de evento (`boda`, `xv`) |
| `slug` | Nombre del JSON (sin `.json`) |
| `titulo` | Nombre que se muestra en la landing |
| `etiqueta` | Badge (Boda, XV, etc.) |
| `accentColor` | Color del acento visual (barra lateral + badge) |

El boton se crea automaticamente con link a `/m/[tipo]/[slug]`.

---

## 12. VALORES ESPECIALES Y OPCIONES AVANZADAS

| Campo | Valores validos |
| ----- | --------------- |
| `button.variant` | `"primary"`, `"secondary"`, `"background"` |
| `bgColor` | `"primary"` (fondo color primario), `"background"` (fondo claro) |
| `trivia correctIndex` | 0 a 3 (0 = primera opcion) |
| `truths correctOption` | `"A"` o `"B"` |
| `socialLinks icon` | `"instagram"`, `"whatsapp"` |
| `aspectRatio` | `"3/4"`, `"4/3"`, `"1/1"`, `"16/9"` |
| `decorativeLines` | `true` o `false` -- lineas decorativas arriba/abajo en `quote` y `specialMessage` |

### Lineas divisorias entre secciones

Cuando dos secciones seguidas tienen el **mismo color de fondo** (ambas `"background"` o ambas `"primary"`), se muestra automaticamente una linea divisoria sutil entre ellas. No hay que configurar nada -- es automatico. No aparece cuando cambia el color de fondo porque el cambio de color ya separa visualmente.

### Lineas decorativas en frases especiales

En las secciones `quote` y `specialMessage`, podes activar lineas decorativas arriba y abajo del texto:

```json
"data": {
  "text": "Mi frase",
  "decorativeLines": true
}
```

Poner `false` o no incluir el campo para desactivarlas.

### Iconos de giftCard (Valor Tarjeta)

Se eligen desde `data.icon` en el JSON:

| Valor | Icono |
| ----- | ----- |
| `"gift"` | Caja de regalo (default) |
| `"creditCard"` | Tarjeta de credito |
| `"heart"` | Corazon |
| `"star"` | Estrella |
| `"sparkles"` | Brillos |
| `"handHeart"` | Mano con corazon |
| `"dollar"` | Signo de pesos |

### Iconos de honeymoon (Luna de miel / Regalos)

Se eligen desde `data.icon` en el JSON:

| Valor | Icono |
| ----- | ----- |
| `"plane"` | Avion (viaje / luna de miel) |
| `"gift"` | Caja de regalo (regalos en XV) |
| `"heart"` | Corazon |
| `"star"` | Estrella |
| `"sparkles"` | Brillos |
| `"moon"` | Luna |
| `"handHeart"` | Mano con corazon |

**IMPORTANTE**: honeymoon usa `bankData` en el modal (no `transferData`). giftCard usa `transferData`.

### RSVP con WhatsApp

El formulario RSVP ahora envia los datos por WhatsApp al confirmar. Se configura agregando `whatsapp` dentro de `data`:

```json
"whatsapp": {
  "number": "3456023759",
  "messageTemplate": "Hola! Confirmo asistencia para la boda de Anto & Walter:\n{resumen}\nGracias!"
}
```

- `number` = numero sin +, sin espacios
- `messageTemplate` = texto del mensaje. Usar `{resumen}` donde quieras que aparezcan los datos de los invitados
- El `{resumen}` se reemplaza automaticamente con nombre, apellido, asistencia, dieta y cancion de cada invitado
- Si hay multiples invitados, aparece cada uno en su linea

### Confirmacion simple por WhatsApp (Plan Base)

Para el plan base (sin formulario), usar `confirmarWhatsapp` en vez de `rsvp`:

```json
{
  "type": "confirmarWhatsapp",
  "id": "confirmar-whatsapp",
  "bgColor": "primary",
  "blocks": ["title", "button"],
  "data": {
    "title": "Confirmar asistencia",
    "buttonText": "Confirmar por WhatsApp",
    "whatsappNumber": "3456023759",
    "message": "Confirmo mi asistencia a la boda de Anto & Walter"
  }
}
```

- El boton tiene el mismo estilo que "Iniciar Trivia" (rounded-full, elegante)
- En modo muestra, muestra un alert en vez de abrir WhatsApp
- Editable al 100% desde JSON: titulo, texto del boton, numero y mensaje

### Iconos del itinerario

| Nombre | Representa |
| ------ | ---------- |
| `heart` | Corazon |
| `wine` | Copa de vino |
| `utensils` | Cubiertos / Cena |
| `music` | Musica |
| `church` | Iglesia |
| `camera` | Camara / Fotos |
| `cake` | Torta |
| `car` | Auto |
| `glass` | Brindis |
| `party` | Fiesta |
| `sparkles` | Recepcion |
| `sun` | Sol / Dia |
| `moon` | Luna / Noche |
| `clock` | Reloj |
| `pin` | Ubicacion |
| `gift` | Regalo |
| `bus` | Transporte |
| `podium` | Discurso |
| `book` | Libro |
| `salon` | Salon |
| `civil` | Civil / Anillos |
| `mate` | Mate |
| `fin` | Fin |
| `sidra` | Sidra |
| `mesaDulce` | Mesa dulce |
| `tortaCasamiento` | Torta de casamiento |

---

## 13. ERRORES COMUNES

| Error | Ejemplo MAL | Ejemplo BIEN |
| ----- | ----------- | ------------ |
| Coma final antes de `]` | `"foto2.jpg",]` | `"foto2.jpg"]` |
| Comillas mal cerradas | `"title": "Hola` | `"title": "Hola"` |
| Fecha mal formateada | `"10 de Octubre 2026"` | `"2026-10-10T18:00:00"` |
| Ruta con /public | `"/public/clientes/..."` | `"/clientes/boda/slug/img.jpg"` |
| Link sin https | `"wa.me/3456023759"` | `"https://wa.me/3456023759"` |

---

## 14. CHECKLIST FINAL

### Datos
- [ ] Nombres correctos en `meta.coupleNames`
- [ ] Titulo de pestana correcto en `meta.title`
- [ ] Fecha en formato ISO en `hero.eventDate`
- [ ] Cuenta regresiva funcionando

### Imagenes
- [ ] Todas en `public/clientes/[tipo]/[slug]/`
- [ ] Rutas en el JSON empiezan con `/clientes/[tipo]/[slug]/`
- [ ] Hero, galeria, historia y cierre tienen fotos reales

### Links
- [ ] Google Maps funciona
- [ ] Datos bancarios correctos
- [ ] WhatsApp e Instagram del footer son de TU MARCA
- [ ] RSVP tiene `whatsapp.number` correcto (numero del cliente o tuyo)
- [ ] RSVP `messageTemplate` menciona los nombres correctos

### Versiones
- [ ] Probar version real: `/boda/slug`
- [ ] Probar version muestra: `/m/boda/slug`
- [ ] Probar en celular real
- [ ] Modales abren y cierran (giftCard, honeymoon, dressCode, trivia)
- [ ] RSVP envia WhatsApp con datos correctos (real) / muestra simulado (muestra)
- [ ] Datos bancarios reales (real) / enmascarados (muestra)
- [ ] Iconos de giftCard y honeymoon se ven correctamente

### Landing
- [ ] Muestras aparecen correctamente
- [ ] Botones de WhatsApp abren con mensaje correcto
- [ ] Precios actualizados (o ocultos con `showPrices: false`)
- [ ] FAQ actualizado

---

## 15. QUE NO TOCAR

| Que quiero cambiar | Donde |
| ------------------- | ----- |
| Textos, fotos, colores de un cliente | Solo su JSON |
| Textos, precios, FAQ de la landing | `data/landing.json` |
| Nombre de marca, redes del footer | `components/wedding/footer-section.tsx` (constantes) |
| Agregar un nuevo tipo de seccion | `components/wedding/section.tsx` (requiere React) |
| Agregar un nuevo icono al itinerario | `components/wedding/itinerary-section.tsx` |
| Estilos CSS globales | `app/globals.css` (raramente necesario) |

**Nunca tocar:**
- Nombres de propiedades (`type`, `id`, `blocks`, `data`, etc.)
- Valores de `type` -- usar solo los listados en la seccion 5 mas `confirmarWhatsapp`
- Estructura de arrays -- no convertir `[]` en `{}` ni en string
- Los templates (`_TEMPLATE_BODA.json`, `_TEMPLATE_XV.json`) -- son de referencia

---

## 16. RESUMEN RAPIDO

```
Crear nueva boda:
  1. Copiar data/_TEMPLATE_BODA.json -> data/clientes/boda/nuevo-slug.json
  2. Crear public/clientes/boda/nuevo-slug/ con las fotos
  3. Editar el JSON
  4. Listo: /boda/nuevo-slug (real) y /m/boda/nuevo-slug (muestra)

Crear nuevo XV:
  1. Copiar data/_TEMPLATE_XV.json -> data/clientes/xv/nuevo-slug.json
  2. Crear public/clientes/xv/nuevo-slug/ con las fotos
  3. Editar el JSON
  4. Listo: /xv/nuevo-slug (real) y /m/xv/nuevo-slug (muestra)

Agregar muestra a la landing:
  1. Editar data/landing.json > sections.muestras.items
  2. Agregar { tipo, slug, titulo, etiqueta, accentColor }

Cambiar nombre de marca:
  1. Editar components/wedding/footer-section.tsx > BRAND_NAME

Entregar al cliente: URL real (/boda/slug)
Publicar en portfolio: URL muestra (/m/boda/slug)
```
