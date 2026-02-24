# MANUAL OPERATIVO - SISTEMA MULTI-EVENTO

> Guia interna para crear y administrar invitaciones digitales (bodas, XV, etc.).
> Ultima actualizacion: Febrero 2026.

---

## 1. COMO FUNCIONA EL SISTEMA

Un solo proyecto sirve para **todos los clientes y tipos de evento** (bodas, XV, cumples, etc.).

- Cada cliente tiene su **propio JSON** en `data/clientes/[tipo]/[slug].json`.
- Cada cliente tiene sus **propias imagenes** en `public/clientes/[tipo]/[slug]/`.
- La URL se genera automaticamente del nombre del archivo: `data/clientes/boda/anto-walter.json` -> `tudominio.com/boda/anto-walter`
- **No se toca codigo para crear un nuevo cliente.** Solo se agrega un JSON y una carpeta de imagenes.

### Estructura de carpetas

```
data/
  clientes/
    boda/
      anto-walter.json        -> tudominio.com/boda/anto-walter
      lucia-sebastian.json    -> tudominio.com/boda/lucia-sebastian
    xv/
      valentina.json          -> tudominio.com/xv/valentina
      camila.json             -> tudominio.com/xv/camila

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

### Paso 1: Elegir el JSON base segun tipo de evento

- Para **boda**: copiar `data/clientes/boda/anto-walter.json`
- Para **XV**: copiar `data/clientes/xv/valentina.json`

### Paso 2: Renombrar el JSON

El nombre del archivo define la URL:
- `lucia-sebastian.json` -> `/boda/lucia-sebastian`
- `camila.json` -> `/xv/camila`

Usar siempre minusculas, sin espacios, separado por guiones.

### Paso 3: Crear carpeta de imagenes

Crear la carpeta en `public/clientes/[tipo]/[slug]/` y poner ahi todas las fotos del cliente.

Ejemplo: `public/clientes/boda/lucia-sebastian/`

### Paso 4: Editar el JSON

Abrir el JSON copiado y cambiar:
1. **meta** -- nombres, titulo, descripcion
2. **theme** -- colores y fuente
3. **hero** -- foto principal, fecha, headline
4. **sections** -- textos, fotos, links, datos bancarios, etc.

### Paso 5: Actualizar rutas de imagenes en el JSON

Todas las rutas de imagenes deben apuntar a la carpeta del cliente:

```json
"coupleImage": "/clientes/boda/lucia-sebastian/hero.jpg"
```

**Importante:** la ruta NO incluye `/public`. Empieza directo con `/clientes/...`

### Paso 6: Probar

Abrir en el navegador:
- Local: `http://localhost:3000/boda/lucia-sebastian`
- Produccion: `https://tudominio.com/boda/lucia-sebastian`

Listo. No hay que tocar ningun otro archivo.

---

## 3. COMO VER UN CLIENTE EN LA PREVIEW

### En la vista previa de v0 o en produccion:
Ir directamente a la URL del cliente:
- `/boda/anto-walter` -- muestra la invitacion de Anto & Walter
- `/xv/valentina` -- muestra la invitacion de Valentina

### En tu Mac (local):
```bash
npm run dev
```
Abrir en el navegador:
- `http://localhost:3000/boda/anto-walter`
- `http://localhost:3000/xv/valentina`
- `http://localhost:3000` -- muestra un listado de todos los clientes con links directos

### Para cambiar entre clientes:
Solo cambiar la URL. No hay que modificar ningun archivo ni reiniciar el servidor.

---

## 4. TIPOS DE SECCION DISPONIBLES

### Para todos los eventos (boda y XV):

| `type`           | Que hace                                                 |
| ---------------- | -------------------------------------------------------- |
| `quote`          | Frase con fondo (autor opcional)                         |
| `dateInfo`       | Fecha del evento                                         |
| `locationInfo`   | Ubicacion con link a Google Maps                         |
| `gallery`        | Slider automatico de fotos                               |
| `itinerary`      | Linea de tiempo con iconos                               |
| `photos`         | Invita a subir fotos al album compartido                 |
| `giftCard`       | Tarjeta de regalo con modal de datos bancarios           |
| `honeymoon`      | Luna de miel / alcancia con modal                        |
| `dressCode`      | Vestimenta con modal de consejos                         |
| `emotionalQuote` | Frase emotiva centrada                                   |
| `trivia`         | Juego trivia (4 opciones)                                |
| `truths`         | Juego verdadero/falso (opcion A o B)                     |
| `ourStory`       | Momentos con fotos (historia de la pareja)               |
| `rsvp`           | Formulario de confirmacion                               |
| `closingImage`   | Foto de cierre a ancho completo                          |
| `footer`         | Pie de pagina con redes sociales y marca                 |
| `eventInfo`      | Info general del evento                                  |

### Solo para XV (tambien se pueden usar en bodas si tiene sentido):

| `type`            | Que hace                                                |
| ----------------- | ------------------------------------------------------- |
| `presentation`    | Foto + nombre + descripcion de la quinceañera           |
| `parents`         | Listado de padres/padrinos                              |
| `playlist`        | Link a playlist de Spotify                              |
| `specialMessage`  | Mensaje personal con firma                              |

---

## 5. EDITAR COLORES Y FUENTE (THEME)

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

**Todo se controla desde el JSON.** No hay colores hardcodeados en el codigo.

---

## 6. VALORES ESPECIALES

| Campo                  | Valores validos                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button.variant`       | `"primary"`, `"secondary"`, `"background"`                                                                                                          |
| `bgColor`              | `"primary"` (fondo color primario), `"background"` (fondo general)                                                                                  |
| `textColor` (seccion)  | `"primary-foreground"`, `"foreground"`, o un hex como `"#FF0000"`                                                                                   |
| `trivia correctIndex`  | Numero del 0 al 3 (0 = primera opcion)                                                                                                              |
| `truths correctOption` | `"A"` o `"B"`                                                                                                                                       |
| `socialLinks icon`     | `"instagram"`, `"whatsapp"`                                                                                                                         |
| `itinerary icon`       | Ver tabla completa de iconos abajo |
| `aspectRatio`          | `"3/4"`, `"4/3"`, `"1/1"`, `"16/9"`                                                                                                                 |

---

## 7. ITINERARIO - OPCIONES AVANZADAS

### Campos de cada evento del itinerario

| Campo    | Obligatorio | Que hace                                                       |
| -------- | ----------- | -------------------------------------------------------------- |
| `icon`   | Si          | Icono del evento (ver tabla abajo)                             |
| `name`   | Si          | Nombre del evento ("Civil", "Cena", etc.)                      |
| `time`   | Si          | Hora del evento                                                |
| `date`   | No          | Fecha/dia ("Viernes 16/02"). Si cambia respecto al anterior, se muestra un separador visual |
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

### Ejemplo sin fecha ni boton (basico)

```json
{ "icon": "camera", "name": "Fotos", "time": "19:30 hs" }
```

### Separador de dias

Si dos eventos tienen distinto `date`, se muestra automaticamente una linea sutil con el nombre del dia entre ambos. No hace falta hacer nada extra.

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

## 8. ERRORES COMUNES

| Error                     | Ejemplo MAL                            | Ejemplo BIEN                           |
| ------------------------- | -------------------------------------- | -------------------------------------- |
| Coma final antes de `]`   | `"foto2.jpg",]`                        | `"foto2.jpg"]`                         |
| Comillas mal cerradas     | `"title": "Hola`                       | `"title": "Hola"`                      |
| Fecha mal formateada      | `"10 de Octubre 2026"`                 | `"2026-10-10T18:00:00"`               |
| Ruta con /public          | `"/public/clientes/boda/img.jpg"`      | `"/clientes/boda/anto-walter/img.jpg"` |
| Link sin https            | `"wa.me/3456023759"`                   | `"https://wa.me/3456023759"`           |

---

## 9. CHECKLIST FINAL

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
- [ ] WhatsApp e Instagram correctos

### Contenido
- [ ] Textos personalizados (no datos de ejemplo)
- [ ] Secciones innecesarias eliminadas
- [ ] Orden de secciones tiene sentido

### Test
- [ ] Probar en celular real
- [ ] Musica funciona (si esta activada)
- [ ] Overlay funciona (si esta activado)
- [ ] Modales abren y cierran
- [ ] RSVP envia correctamente

---

## 10. QUE NO TOCAR

- **Nombres de propiedades** (`type`, `id`, `blocks`, `data`, etc.)
- **Valores de `type`** -- usar solo los listados en la seccion 4
- **Estructura de arrays** -- no convertir `[]` en `{}` o en string
- **Archivos de codigo** -- salvo que sea estrictamente necesario

| Que quiero cambiar               | Donde                                                     |
| -------------------------------- | --------------------------------------------------------- |
| Textos, fotos, colores, fuentes  | Solo el JSON del cliente                                  |
| Agregar un nuevo tipo de seccion | `components/wedding/section.tsx` (requiere React)         |
| Agregar un nuevo icono           | `components/wedding/itinerary-section.tsx` (agregar map)  |
| Estilos CSS globales             | `app/globals.css` (raramente necesario)                   |
