# Sistema de Confirmacion de Asistencia (RSVP) - Version VIP

## Estado: EN ESPERA (ideas guardadas para desarrollo futuro)

---

## Estructura General

El anfitrion tiene 2 paginas:

1. **Pagina de gestion de invitados** (`/panel/{uuid}/invitados`)
   - Cargar invitados (persona o grupo/familia)
   - Copiar enlaces personalizados
   - Ver estado rapido de cada uno
   - Editar/eliminar invitados

2. **Pagina de confirmaciones** (`/panel/{uuid}/confirmados`)
   - Ver totales (invitados, confirmados, no asisten, pendientes)
   - Lista detallada con colores (verde confirmado, rojo no asiste, sin color pendiente)
   - Detalles de formularios completados

Ambas paginas tienen boton para ir a la otra.

---

## Tipos de Invitados

### Persona individual
- Anfitrion carga: Nombre completo
- Invitado ve: "Walter Mansilla, un lugar para vos"
- Formulario: 1 solo

### Grupo/Familia
- Anfitrion carga: Nombre familia + integrantes (ej: "Familia Mansilla" + Juan, Maria, Pedro)
- Invitado ve: "Familia Mansilla, 3 lugares para ustedes"
- Formulario: 1 por cada integrante, con nombre precargado y NO editable
- En panel de confirmaciones: cada integrante aparece por separado con su estado

---

## Enlaces

- Enlace del panel (anfitrion): UUID largo imposible de adivinar
  Ejemplo: `/panel/a1b2c3d4-e5f6-7890-abcd-ef1234567890`
  
- Enlace del invitado: codigo corto random
  Ejemplo: `/boda/anto-walter/xK9mPq`

---

## Flujo del Invitado

1. Abre su enlace personalizado
2. Ve la invitacion con su nombre/familia ya mostrado
3. Llena el formulario de confirmacion
4. Ve mensaje de agradecimiento
5. Si vuelve a abrir el enlace:
   - NO ve el formulario de nuevo
   - Ve texto: "Ya confirmaste tu asistencia"
   - Opcion: "Cometiste un error? Modificar respuesta" -> abre formulario con datos precargados

---

## Panel de Confirmaciones (vista anfitrion)

### Encabezado con totales:
```
Total invitados: 45 grupos (120 personas)
Confirmados: 28 grupos (75 personas)     [verde]
No asisten: 5 grupos (12 personas)       [rojo]
Pendientes: 12 grupos (33 personas)      [gris]
```

### Lista:
- Confirmado: fondo verde suave + detalles opcionales
- No asiste: fondo rojo suave + motivo si lo puso
- Pendiente: sin fondo

### Diseño:
- Minimalista, sin excesos de colores
- Mobile-first, cards apiladas en celular
- Facil de scrollear

---

## Decisiones Pendientes

1. **Campos opcionales del formulario**: Lo configura Walter en el JSON cuando arma la invitacion

2. **Edicion de respuesta**: El invitado puede cambiar todo (incluso de Si a No)

3. **Fecha limite**: PENDIENTE - decidir si el anfitrion puede poner fecha limite

4. **Exportar lista**: PENDIENTE - decidir si puede descargar Excel/PDF

5. **Notificaciones**: Por ahora NO. Evaluar agregar email mas adelante si hay demanda.

6. **Limite de invitados**: Sin limite tecnico. Diferenciacion por plan es por funcionalidad (VIP tiene RSVP, otros no)

---

## Estructura de Datos (referencia)

```
EVENTO (boda-anto-walter)
├── Panel del anfitrion: /panel/a1b2c3d4-e5f6-...
│
├── INVITADO 1 (persona)
│   ├── Nombre: "Walter Mansilla"
│   ├── Link: /boda/anto-walter/xK9m
│   ├── Estado: confirmado
│   └── Respuesta: { asiste: true, restricciones: "vegetariano" }
│
├── INVITADO 2 (familia)
│   ├── Nombre familia: "Familia Garcia"
│   ├── Link: /boda/anto-walter/pQ3r
│   ├── Integrantes:
│   │   ├── Juan Garcia - confirmado
│   │   ├── Maria Garcia - confirmado
│   │   └── Pedrito Garcia - pendiente
```
