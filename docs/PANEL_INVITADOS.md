# Manual del panel de invitados

Guía simple: qué es, cómo armar el link y qué pasos seguir para que funcione.

---

## Para qué sirve

- Los **novios** (o vos) entran a una página aparte de la invitación: el **panel**. Ahí cargan la lista de invitados, ven quién confirmó y pueden mandar por WhatsApp el link personal de cada uno.
- Los invitados siguen entrando a la **invitación normal** (`/boda/slug`, etc.) y, si el plan usa RSVP con código, con un link que lleva algo como `...?c=abcd1234`.
- Los datos del panel (lista, confirmaciones) se guardan en **Supabase** (base de datos en la nube). Sin Supabase bien configurado, el panel no puede trabajar.

---

## Tres cosas que tenés que saber antes

1. **No hay usuario ni contraseña.** Solo existe el link del panel. Por eso el link es **secreto**: no lo subas a redes públicas; pasalo por WhatsApp o mail solo a quien administra la lista.

2. El **nombre técnico** del panel se llama `panelId`. Es el texto que va después de `/panel/` en el navegador.  
   Ejemplo: si `panelId` es `priscila-agustin-boditacheiw`, el link del panel es:  
   `https://tudominio.com.ar/panel/priscila-agustin-boditacheiw`

3. Ese mismo `panelId` tiene que estar **escrito igual** en dos lugares: en el **JSON del cliente** (`rsvpPanel.panelId`) y, si ya hay datos cargados, en **Supabase** en la tabla de eventos (`panel_id`). Si en un solo lugar está distinto, vas a ver panel vacío o datos “perdidos” en otro id.

---

## Cómo elegir el `panelId` (dos formas, las dos válidas)

El sistema **no exige** un formato mágico. Cualquier texto razonable sirve, siempre que:

- no tenga espacios raros al principio o al final,
- sea el **mismo** en JSON y en Supabase (cuando ya hay evento creado).

### Opción A — Lo inventás vos a mano

Ejemplo: `priscila-agustin-boditacheiw`

Funciona igual que cualquier otro. Lo importante es que **no sea fácil de adivinar** para extraños (evitá solo `nombre-boda` si muchos clientes van a seguir el mismo patrón).

### Opción B — Lo genera el proyecto por vos (recomendado)

En la carpeta del proyecto, en la terminal:

```bash
npm run panel:gen-id -- priscila-agustin
```

- Después de `--` va un **prefijo** que te ayude a reconocer el evento (suele ser parecido al nombre del archivo del cliente, sin el número del principio).
- Si no ponés nada:

```bash
npm run panel:gen-id
```

usa el prefijo `mi-evento`.

Te va a imprimir **una línea** con letras y números (ej. `priscila-agustin-kq8nr2xlm4pz`). Esa línea entera es el `panelId`: copiala y pegala en el JSON.

El comando está definido en `package.json` (`panel:gen-id`) y el programa pequeño vive en `scripts/generate-panel-id.mjs`.

### El generador de id, sin vueltas

`npm run panel:gen-id` **solo imprime un texto** en la terminal: tu prefijo + letras y números al azar (ej. `priscila-agustin-kq8nr2xlm4pz`).

- **No** crea nada en Supabase solo.
- **No** edita el JSON solo: vos tenés que **copiar** esa línea y **pegarla** en `rsvpPanel.panelId` del cliente.
- Es **opcional**: si preferís, escribís el `panelId` a mano (como `priscila-agustin-boditacheiw`). El comando existe para **no tener que inventar** la parte rara del final y que sea más difícil de adivinar.

En resumen: el generador = **atajo para armar una contraseña de link**, nada más.

---

## Cuándo se usa el `panelId` y cuándo no

### Sí se usa el `panelId` (tenés que tenerlo claro)

Solo cuando el cliente tiene **RSVP con panel**, o sea en el JSON:

- `"rsvpPanel": { "enabled": true, "panelId": "algo-unico", ... }`

Ahí el `panelId` sirve para dos cosas:

1. **Link del panel** para quien administra la lista: `https://tudominio.com.ar/panel/algo-unico`
2. Que el sistema **una** el mismo evento en Supabase con ese nombre (y encuentre el JSON del cliente buscando ese mismo texto en `panelId`).

Si cambiás el texto sin actualizar la base cuando ya había datos, se desacomoda: por eso en el manual insistimos en que JSON y Supabase digan lo mismo.

### No hace falta el `panelId` (no te preocupes por generar nada)

Cuando el cliente **no** usa ese sistema, por ejemplo:

- Solo tiene la sección **`confirmarWhatsapp`** (botón que abre WhatsApp con un mensaje fijo), y
- **`rsvpPanel`** no está, o está con **`"enabled": false`**

Ahí **no existe panel web**: nadie usa `/panel/...`. No hay que inventar `panelId` ni correr el comando. La invitación funciona igual por `/boda/slug` (o el tipo que sea).

### Ojo: la invitación pública no lleva el `panelId` en la URL

- La invitación que compartís con todos es siempre del estilo **`/boda/nombre-del-json`**, **`/xv/...`**, etc. Eso sale de la **carpeta** + **archivo** en `data/clientes/`, no del `panelId`.
- El `panelId` es **otra dirección**, aparte, para la **gestión** de la lista.
- El **`?c=...`** (código del invitado) se pone **después** de la URL de la invitación cuando querés un link personalizado; eso lo arma el panel al mandar WhatsApp, no reemplaza el `/boda/slug`.

---

## ¿Desde cuándo “existe” el link del panel?

- La dirección `/panel/cualquier-cosa` **siempre está disponible** en el sitio: no hay que activar un interruptor aparte.
- Lo que importa es que, cuando alguien abre ese link, el servidor **encuentre** en algún JSON de `data/clientes/` un `rsvpPanel.panelId` **exactamente igual** a lo que pusiste en la URL.

En la práctica:

1. Guardás el JSON con el `panelId` nuevo.
2. Si trabajás en tu Mac con `npm run dev`, con **guardar el archivo** alcanza; recargá el navegador.
3. Si el sitio está en **Vercel** (o similar), tenés que **subir el cambio** (git push / deploy) para que el servidor sirva el JSON nuevo.

La **primera vez** que abrís el panel en el navegador con ese id, si en Supabase todavía no había fila para ese evento, el sistema **puede crear** la fila sola. Después ya podés agregar invitados.

---

## Pasos para un cliente nuevo (de cero)

Seguí en orden:

1. **Elegí el `panelId`** (a mano o con `npm run panel:gen-id -- tu-prefijo`).
2. Abrí el archivo del cliente en `data/clientes/.../algo.json`.
3. Buscá o creá el bloque **`rsvpPanel`** y poné por lo menos:
   - `"enabled": true`
   - `"panelId": "acá pegás el id que elegiste"`
   - `"fechaEvento"` con la fecha del casamiento (formato `AAAA-MM-DD`)
   - Lo que quieras de `theme`, `labels`, `confirmationMessage` (textos y colores del panel).
4. **Guardá** el JSON y asegurate de que el sitio ya use esa versión (local o deploy).
5. En el navegador entrá a:  
   `https://tudominio.com.ar/panel/TU-PANEL-ID`  
   (reemplazá dominio y el id). Si todo está bien, ves el panel (aunque todavía sin invitados).
6. Desde ahí **agregá invitados**. Cada uno recibe un código; el botón de WhatsApp del panel arma el link de la invitación con `?c=...` para mandárselo.

Listo: ese es el flujo completo para “generar y hacer funcionar” el panel en un cliente nuevo.

---

## Bloque `rsvpPanel` completo (JSON)

Referencia rápida de todas las claves disponibles:

```json
"rsvpPanel": {
  "enabled": true,
  "confirmacion": "formulario",
  "panelId": "anto-walter-boda",
  "fechaEvento": "2027-02-16",
  "confirmationMessage": "Gracias por confirmar! Nos vemos el 16 de febrero.",
  "limiteInvitados": 120,
  "registrarSinCodigoEnPanel": false,
  "theme": {
    "primaryColor": "#b8a88a"
  },
  "labels": {
    "title": "Panel de Invitados",
    "totalLabel": "Total invitados",
    "confirmedLabel": "Confirmados",
    "pendingLabel": "Pendientes",
    "declinedLabel": "No asisten",
    "paymentPending": "Pago pendiente",
    "addGuest": "Agregar Invitado",
    "copyLink": "Copiar link",
    "manualConfirm": "Confirmación manual",
    "paidButton": "Ya pagó",
    "unpaidButton": "¿Pagó tarjeta?"
  }
}
```

Qué hace cada clave:

- `enabled`: activa/desactiva el sistema de panel para esa invitación.
- `confirmacion`:
  - `formulario`: usa la sección `rsvp` y guarda confirmaciones por API.
  - `comun`: usa `confirmarWhatsapp` y registra en panel antes de abrir WhatsApp.
- `panelId`: ID único del panel (URL: `/panel/[panelId]`).
- `fechaEvento`: fecha para el contador interno del panel (`YYYY-MM-DD`).
- `confirmationMessage`: texto que ve el invitado al confirmar.
- `limiteInvitados` (opcional): tope de plazas. Si falta, no hay límite.
- `registrarSinCodigoEnPanel` (solo `confirmacion: "formulario"`):
  - `true`: si entran sin `?c=` y envían RSVP, se crea invitado en panel.
  - `false`: si entran sin `?c=`, el RSVP solo sale por WhatsApp.
- `theme`: colores del panel.
- `labels`: textos personalizables del panel.

---

## Comportamiento sin `?c=` (invitado no cargado)

Aplica cuando la invitación tiene sección `rsvp`:

- Si `registrarSinCodigoEnPanel = true`: el envío crea invitado en panel y guarda su confirmación.
- Si `registrarSinCodigoEnPanel = false` (o no existe): el envío solo va por WhatsApp.

En `confirmacion: "comun"`, el registro en panel ocurre con links personalizados (`?c=`), porque ese flujo trabaja sobre invitados existentes.

---

## Si el cliente **ya tenía** otro `panelId` y datos en Supabase

Si cambiás solo el JSON y **no** tocás Supabase:

- El link **nuevo** abre un panel **vacío** (nuevo evento).
- Los invitados viejos siguen atados al **id viejo** en la base.

Para **renombrar** sin perder datos tenés que en Supabase poner el **mismo** `panel_id` nuevo en la fila del evento (o migrar a mano según cómo manejes la base). Después avisá a los novios el link nuevo; el viejo deja de ser el correcto.

---

## Qué ves en la pantalla del panel (resumen)

- Números: total, confirmados, pendientes, no asisten.
- Buscador y filtros.
- Botón para **agregar** invitado (persona o familia).
- Editar, borrar, marcar confirmación a mano, marcar si pagó tarjeta (si lo usás).
- **Enviar invitación** por WhatsApp con el link con código.

Los textos y colores del encabezado salen del JSON (`rsvpPanel.labels` y `rsvpPanel.theme`).

---

## Relación con la invitación pública

- Con `rsvpPanel.enabled: true`, en la invitación se muestra el **formulario RSVP** (no solo el botón de WhatsApp del plan base).
- El invitado confirma ahí; los datos van a Supabase y el panel los muestra cuando actualizás la página (el panel se refresca solo cada unos segundos también).

---

## Si algo falla

- Revisá que **Supabase** esté configurado (variables en `.env.local` en local, o en el panel de Vercel en producción).
- Revisá que el `panelId` del JSON sea **idéntico** al de la URL que abrís.
- Si el panel abre vacío pero antes había gente: casi seguro es un **desfasaje** entre JSON y `panel_id` en la base.

El script SQL de tablas está en `scripts/001_create_rsvp_tables.sql` si necesitás revisar nombres de tablas.

---

## Nota sobre la prueba “Anto & Walter”

Ese cliente puede seguir usando un id clásico tipo `anto-walter-boda` solo para pruebas tuyas. Para **clientes reales nuevos**, conviene un id más largo o aleatorio, como en las opciones de arriba.

---

*Si en el futuro agregamos login o PIN al panel, habría que actualizar este manual en el mismo cambio de código.*
