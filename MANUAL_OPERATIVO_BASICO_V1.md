# MANUAL OPERATIVO BASICO V1

> Guia interna de trabajo para crear y adaptar invitaciones digitales.
> Lectura estimada: 8-10 minutos.
> Ultima actualizacion: Febrero 2026.

---

## 1. INTRODUCCION

El sistema de invitaciones funciona de la siguiente manera:

- **Un solo archivo JSON** (`data/wedding-config.json`) controla todo el contenido: textos, colores, fuentes, fotos, links, secciones, modales y orden visual.
- El **Hero** (portada con foto y cuenta regresiva) se renderiza siempre primero y se configura aparte.
- Las **secciones** son dinamicas: se recorren con `map()` y se muestran en el orden que aparecen en el array `sections` del JSON.
- Para cambiar el orden de la pagina, solo hay que mover objetos dentro del array.
- Para ocultar una seccion, se elimina del array. Para agregar, se copia un bloque y se cambia el `id`.

**No se necesita tocar codigo para adaptar una invitacion.** Todo se hace desde el JSON.

---

## 2. FLUJO DE TRABAJO RECOMENDADO

Seguir este orden para cada nuevo cliente:

### Paso 1: Duplicar el proyecto base
Copiar la carpeta completa del proyecto. Renombrar si es necesario.

### Paso 2: Editar datos generales (meta)
Abrir `data/wedding-config.json` y cambiar:
```json
"meta": {
  "title": "Nuestra Boda - Ana & Martin",
  "description": "Te invitamos a celebrar nuestro amor...",
  "lang": "es",
  "coupleNames": {
    "groomName": "Martin",
    "brideName": "Ana",
    "separator": "&"
  }
}
```

### Paso 3: Ajustar colores y fuente
```json
"theme": {
  "primaryColor": "#6B7F5E",
  "backgroundColor": "#FAF8F5",
  "textColor": "#3A3A3A",
  "lightBgTextColor": "#6B7F5E",
  "darkBgTextColor": "#FFFFFF",
  "accentBackground": "#EDF2E8",
  "modalTextColor": "#FFFFFF",
  "font": {
    "family": "Josefin Sans",
    "weights": "100,200,300,400,500,600,700"
  }
}
```
- `primaryColor`: color de las secciones con fondo (verde por defecto).
- `backgroundColor`: fondo general claro.
- `lightBgTextColor`: color de TODOS los textos, iconos y botones en secciones de fondo claro. Por defecto es el color primario. Cambiar a cualquier hex (ej: `"#555555"` para gris).
- `darkBgTextColor`: color de todos los textos en secciones de fondo primario/oscuro. Por defecto blanco.
- `modalTextColor`: color del texto dentro de los modales.
- `font.family`: nombre exacto tal como aparece en Google Fonts.
- `font.weights`: pesos que necesitas, separados por coma.

**Ejemplo rapido:** si queres que el texto en fondo claro sea gris en vez de verde, solo cambias:
```json
"lightBgTextColor": "#555555"
```
Todo se actualiza junto: titulos, parrafos, iconos, botones, separadores.

### Paso 4: Configurar hero
```json
"hero": {
  "coupleImage": "/images/couple-hero.jpg",
  "headline": "Nos casamos!",
  "showNamesOnPhoto": true,
  "eventDate": "2026-10-10T18:00:00",
  "countdownLabels": {
    "days": "Dias",
    "hours": "Horas",
    "minutes": "Minutos",
    "seconds": "Segundos"
  }
}
```
- `eventDate`: formato obligatorio `AAAA-MM-DDTHH:MM:SS`. Controla la cuenta regresiva.
- `coupleImage`: ruta a la foto. Colocarla en `/public/images/`.
- `showNamesOnPhoto`: `true` muestra los nombres de la pareja sobre la foto de portada, `false` los oculta (los nombres siguen apareciendo en el overlay de bienvenida y en la seccion de cierre).

### Paso 5: Activar o quitar secciones
Revisar el array `sections` y decidir cuales quedan. Ver seccion 3 de este manual.

### Paso 6: Ajustar textos de cada seccion
Cambiar frases, descripciones, preguntas de trivia, datos bancarios, etc.

### Paso 7: Revisar ubicaciones y links
Verificar que los `url` de Google Maps, WhatsApp e Instagram sean correctos.

### Paso 8: Reemplazar fotos
Colocar fotos reales en `/public/images/` con los mismos nombres o actualizar las rutas en el JSON.

### Paso 9: Probar en mobile
La invitacion esta pensada para celular. Siempre revisar en un telefono real o con el inspector del navegador.

### Paso 10: Checklist final
Ver seccion 7 de este manual.

---

## 3. QUE PARTES DEL JSON SE EDITAN SIEMPRE

### Campos que se cambian en TODOS los clientes:

| Campo | Ubicacion | Que es |
|-------|-----------|--------|
| `meta.title` | Raiz | Titulo de la pestana del navegador |
| `meta.coupleNames` | Raiz | Nombres de la pareja |
| `hero.coupleImage` | Raiz | Foto principal |
| `hero.eventDate` | Raiz | Fecha del evento (controla countdown) |
| `dateInfo > data.value` | Sections | Fecha en texto ("10 de Octubre 2026") |
| `locationInfo > data.address` | Sections | Direcciones de los lugares |
| `locationInfo > data.button.url` | Sections | Links a Google Maps |
| `giftCard > data.modal.transferData` | Sections | Datos bancarios de la tarjeta |
| `honeymoon > data.modal.bankData` | Sections | Datos bancarios luna de miel |
| `rsvp > data.deadline` | Sections | Fecha limite de confirmacion |
| `footer > data.socialLinks` | Sections | URLs de redes sociales |

### Color de fondo y texto por seccion:

Cada seccion tiene un campo `bgColor` que controla su fondo:
```json
{
  "type": "quote",
  "id": "quote-welcome",
  "bgColor": "primary",
  "blocks": ["text", "author"],
  "data": { ... }
}
```

| Valor de `bgColor` | Que hace | Texto automatico |
|---------------------|----------|------------------|
| `"primary"` | Fondo verde (color primario del tema) | Usa `darkBgTextColor` del tema (blanco por defecto) |
| `"background"` | Fondo crema (color de fondo general) | Usa `lightBgTextColor` del tema (verde primario por defecto) |

**El texto se adapta automaticamente al fondo.** Los colores de texto se controlan globalmente desde el tema:
- `lightBgTextColor` en el tema -> se aplica a TODAS las secciones con `bgColor: "background"`
- `darkBgTextColor` en el tema -> se aplica a TODAS las secciones con `bgColor: "primary"`

**Override opcional por seccion:** si UNA seccion necesita un color distinto al global, podes agregar `textColor` solo en esa seccion:
```json
{
  "type": "quote",
  "bgColor": "primary",
  "textColor": "#FF0000",
  ...
}
```

El `textColor` de la seccion tiene prioridad sobre el valor global del tema. Acepta cualquier codigo hex.

### Campos opcionales (dependen del cliente):

| Campo | Que hace |
|-------|----------|
| `overlay.enabled` | Activa/desactiva la pantalla de bienvenida |
| `music.enabled` | Activa/desactiva la musica |
| `gallery > data.images` | Agregar/quitar fotos del slider |
| `trivia > data.modal.questions` | Agregar/quitar preguntas |
| `truths > data.questions` | Agregar/quitar preguntas |
| `ourStory > data.moments` | Agregar/quitar momentos |
| `itinerary > data.events` | Agregar/quitar momentos del itinerario |
| `dressCode > data.modal.sections` | Agregar/quitar bloques de consejos |

### Secciones que se pueden eliminar sin romper nada:

Cualquier seccion se puede eliminar del array `sections` sin afectar al resto. Las mas comunes de quitar son:

- `trivia` -- si el cliente no quiere juego
- `truths` -- si el cliente no quiere juego
- `ourStory` -- si el cliente no quiere historia
- `honeymoon` -- si no hay luna de miel
- `emotionalQuote` -- si no quiere frase intermedia
- `closingImage` -- si no quiere foto de cierre
- `photos` -- si no hay album compartido

### Como eliminar una seccion correctamente:

1. Buscar el bloque `{ "type": "..." }` en el array `sections`.
2. Seleccionar desde la llave `{` de apertura hasta la llave `}` de cierre.
3. Borrar TODO el bloque, incluyendo la coma que lo separa del siguiente.
4. Verificar que no quede una coma antes del `]` de cierre del array.

Ejemplo -- ANTES:
```json
"sections": [
  { "type": "quote", ... },
  { "type": "dateInfo", ... },
  { "type": "gallery", ... }
]
```

Quiero eliminar `dateInfo` -- DESPUES:
```json
"sections": [
  { "type": "quote", ... },
  { "type": "gallery", ... }
]
```

**Importante:** la ultima seccion del array NO lleva coma al final.

---

## 4. QUE NO DEBE TOCARSE

### Nunca cambiar:

- **Nombres de propiedades** (`type`, `id`, `blocks`, `data`, etc.). Si cambias `"type": "quote"` por otro nombre, el componente no se va a encontrar.
- **IDs de secciones** a menos que dupliques una seccion (en ese caso el nuevo ID debe ser unico).
- **La estructura de los arrays**. Si un campo espera un array `[]`, no convertirlo en un objeto `{}` ni en un string.
- **Valores de `type`**. Los valores validos son:
  - `quote`, `dateInfo`, `locationInfo`, `gallery`, `itinerary`, `photos`, `giftCard`, `honeymoon`, `dressCode`, `emotionalQuote`, `trivia`, `ourStory`, `truths`, `rsvp`, `closingImage`, `footer`
- **Archivos fuera del JSON** salvo que sea estrictamente necesario (ver seccion 6).

### Valores especiales que no se deben alterar:

| Campo | Valores validos |
|-------|----------------|
| `button.variant` | `"primary"`, `"secondary"` |
| `trivia correctIndex` | Numero del 0 al 3 (0 = primera opcion) |
| `truths correctOption` | `"A"` o `"B"` |
| `socialLinks icon` | `"instagram"`, `"whatsapp"` |
| `itinerary icon` | `heart`, `wine`, `utensils`, `music`, `church`, `camera`, `cake`, `car`, `glass`, `party`, `sparkles`, `sun`, `moon`, `clock`, `pin`, `gift`, `bus` |
| `aspectRatio` | `"3/4"`, `"4/3"`, `"1/1"`, `"16/9"` |
| `bgColor` | `"primary"`, `"background"` |
| `textColor` | `"primary-foreground"`, `"foreground"`, o un hex como `"#FF0000"` |

---

## 5. ERRORES COMUNES

### Coma final antes de cierre
```json
// MAL - coma despues del ultimo elemento
"images": [
  "/images/foto1.jpg",
  "/images/foto2.jpg",   <-- esta coma sobra
]

// BIEN
"images": [
  "/images/foto1.jpg",
  "/images/foto2.jpg"
]
```

### Comillas mal cerradas
```json
// MAL
"title": "Nos casamos!

// BIEN
"title": "Nos casamos!"
```

### Fecha mal formateada
```json
// MAL - el countdown no va a funcionar
"eventDate": "10 de Octubre 2026"

// BIEN - formato ISO obligatorio
"eventDate": "2026-10-10T18:00:00"
```

### Array mal cerrado
```json
// MAL - falta cerrar el array
"options": ["Vegetariano", "Vegano"

// BIEN
"options": ["Vegetariano", "Vegano"]
```

### Links incompletos
```json
// MAL - falta https://
"url": "wa.me/3456023759"

// BIEN
"url": "https://wa.me/3456023759"
```

### Ruta de imagen incorrecta
```json
// MAL - la carpeta public no se incluye en la ruta
"image": "/public/images/foto.jpg"

// BIEN - la ruta empieza desde /images/
"image": "/images/foto.jpg"
```

---

## 6. ARCHIVOS FUERA DEL JSON (SI ES NECESARIO)

En el 95% de los casos solo se toca el JSON. Pero si necesitas algo mas especifico:

| Que quiero cambiar | Que archivo tocar |
|--------------------|-------------------|
| Fuente tipografica | Solo el JSON (`theme.font.family` y `theme.font.weights`) |
| Colores generales | Solo el JSON (`theme.primaryColor`, `theme.backgroundColor`, etc.) |
| Color de texto en modales | Solo el JSON (`theme.modalTextColor`) |
| Layout general de la pagina | `app/layout.tsx` (raramente necesario) |
| Estilos globales CSS | `app/globals.css` (solo si necesitas animaciones nuevas) |
| Agregar una nueva seccion tipo | `components/wedding/section.tsx` (requiere conocimiento de React) |
| Agregar un nuevo icono al itinerario | `components/wedding/itinerary-section.tsx` (agregar al `iconMap`) |

**Regla general:** si el cambio se puede hacer desde el JSON, hacelo desde el JSON. Solo tocar codigo si no hay otra opcion.

---

## 7. CHECKLIST FINAL ANTES DE ENTREGAR

Recorrer esta lista antes de enviar al cliente:

### Datos basicos
- [ ] Nombres correctos en `meta.coupleNames`
- [ ] Titulo de pestana correcto en `meta.title`
- [ ] Fecha correcta en `hero.eventDate` (formato ISO)
- [ ] Fecha en texto correcta en `dateInfo > data.value`
- [ ] Cuenta regresiva funcionando (verificar en la pagina)

### Fotos
- [ ] Foto del hero reemplazada (`hero.coupleImage`)
- [ ] Fotos de la galeria reemplazadas
- [ ] Fotos de "Nuestra historia" reemplazadas (si aplica)
- [ ] Foto de cierre reemplazada (si aplica)
- [ ] Todas las imagenes estan en `/public/images/`

### Links y datos
- [ ] Links de Google Maps funcionan (abrir y verificar)
- [ ] Datos bancarios correctos (alias, CBU, titular)
- [ ] Valor de tarjeta correcto
- [ ] URL de WhatsApp correcta
- [ ] URL de Instagram correcta

### Contenido
- [ ] Frases y textos personalizados para el cliente
- [ ] Preguntas de trivia adaptadas (si aplica)
- [ ] Preguntas de "verdades" adaptadas (si aplica)
- [ ] Itinerario con horarios reales
- [ ] Dress code acorde al evento
- [ ] Deadline del RSVP correcto

### Secciones
- [ ] No hay secciones vacias o con datos de ejemplo
- [ ] El orden de secciones tiene sentido narrativo
- [ ] Secciones innecesarias eliminadas

### Funcional
- [ ] Responsive OK (probar en celular real)
- [ ] Musica funciona (si esta activada)
- [ ] Overlay de bienvenida funciona (si esta activado)
- [ ] Modales abren y cierran correctamente
- [ ] Boton de copiar en modales funciona
- [ ] Formulario RSVP envia correctamente

---

> **Nota:** Este documento se puede actualizar con nuevas versiones (V2, V3) a medida que se agreguen funcionalidades o secciones al sistema.
