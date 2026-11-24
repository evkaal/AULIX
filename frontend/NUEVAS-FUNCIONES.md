# Nuevas funciones — Aulix v2 (2026-11-23, noche antes de la entrega)

Lo que pidió Jonathan y cómo quedó. Todo es frontend; el backend no se
tocó. La demo de mañana funciona con `VITE_DEMO_MODE=true` o con el
backend real en `http://localhost:8106/api` (con respaldo demo si no
responde, `VITE_DEMO_FALLBACK=true`).

## Qué ya existía (no se duplicó)

- **Materiales**: subir archivo (PDF/DOCX/imagen, 20 MB) o video por URL,
  y listarlos. No tenía reproductor dentro de la app ni botón Descargar.
- **Avisos**: crear anuncio (solo docente) y listarlos dentro del detalle
  de la clase. En demo no persistían y no se veían en el Panel principal.
- **Chat**: enviar texto + un adjunto. Sin enlaces clicables, sin vista
  previa de imágenes, sin notas de voz.
- **Colores/iconos**: 3 colores (`blue/green/purple`) y 3 iconos en un
  desplegable. La tarjeta ya usaba `tema` e `icono` de la clase.
- **Login**: dos columnas (panel azul + formulario). Funcional, pero
  genérico.

## 1. Videos — Materiales de cada clase

- Video por URL (YouTube/Vimeo/mp4): se reproduce **dentro de la app**
  (`<video controls>` o iframe de YouTube/Vimeo).
- Archivo: botón **Descargar** (con Bearer en modo real; en demo, descarga
  del objectURL). Imágenes con vista previa.
- Video por archivo: en **demo sí** se guarda y reproduce (en memoria,
  objectURL). En **modo real el backend lo rechaza**: su
  `ArchivoService` solo acepta PDF, DOCX o imagen (máx. 20 MB). La UI lo
  avisa antes de enviar y sugiere usar video por URL.
- Límite en la UI: 20 MB en real (lo que dice el backend); en demo,
  100 MB como tope práctico para no saturar la memoria del navegador.
- Demo trae 2 videos de ejemplo (uno por clase) para mostrar el
  reproductor sin subir nada.
- Endpoints usados (ya existían): `GET/POST /api/clases/{id}/materiales`,
  `GET /api/archivos/{nombre}`.

## 2. Chat grupal mejorado — Mensajes por materia

- **Enlaces**: se detectan en el texto, se vuelven clicables y muestran
  una tarjeta de vista previa (dominio + "Abrir ↗" en pestaña nueva).
- **Imágenes**: vista previa tipo Discord en el mensaje; clic para
  ampliar en modal (lightbox) y descargar.
- **Notas de voz**: botón "Nota de voz", graba con MediaRecorder, **máx.
  60 segundos** con contador, se escucha antes de enviar, se puede borrar
  y se envía como adjunto. Se reproduce en línea con `<audio controls>`.
- **Vista previa antes de enviar**: miniatura de imagen/video, reproductor
  de audio o chip de archivo, con botón "Quitar adjunto".
- **Limitación real**: el backend acepta el adjunto con el mismo
  `ArchivoService` (solo PDF/DOCX/imagen). Una nota de voz (`.webm`) o un
  video como adjunto **se rechaza en modo real** y la UI muestra por qué;
  en **demo funciona completo**. Para que funcione en real, el backend
  debe ampliar las extensiones permitidas (p. ej. `webm, mp3, mp4`) y
  aceptar `audio/*` en `MensajeService.enviar`.
- Endpoints usados (ya existían): `POST /api/mensajes/conversaciones/{id}/mensajes`
  (multipart texto + adjunto), `GET .../mensajes?page=&size=`.

## 3. Colores e iconos de las clases

- **12 colores predefinidos** (azul Aulix, menta, verde, turquesa,
  celeste, índigo, morado, rosa, rojo rosa, rojo, naranja, ámbar).
- **Rueda de color radial**: el docente mueve el punto sobre la rueda
  (o usa las flechas del teclado) y elige un tono personalizado, más un
  input de color exacto y una vista previa en vivo de la tarjeta.
- **18 iconos** (Matemáticas, Álgebra, Química, Biología, Ciencias,
  Lengua, Idiomas, Historia, Geografía, Arte, Dibujo, Música, Deporte,
  Educación física, Programación, Computación, Graduación, General) con
  lucide-react.
- Al crear o editar una clase se elige color + icono y se ven en la
  tarjeta (Mis clases y Panel principal) y en su detalle.
- **Funciona en modo real sin cambiar el backend**: el campo `tema` de
  `Clase` es un String libre (sin validación de enum) y `icono` también,
  así que un color personalizado se guarda como hexadecimal
  (ej. `tema="#0EA47A"`). Si el backend algún día valida `tema`, habrá
  que mapear el hex a un nombre.

## 4. Zona de Avisos por clase

- Sección **"Avisos" separada del chat**, estilo WhatsApp: burbujas
  verdes con autor y fecha/hora, solo el docente publica.
- Está en el detalle de cada clase (Mis clases y `/mis-clases/:id`) y
  los **5 avisos más recientes aparecen en el Panel principal**
  ("Avisos recientes").
- Endpoints usados (ya existían): `GET/POST /api/clases/{id}/anuncios`.
- En demo los avisos **ahora persisten** (antes el POST no guardaba
  nada) y hay 3 avisos de ejemplo.

## 5. Login nuevo

- Tarjeta blanca centrada, **bordes muy redondeados (28px)**, campos
  color menta redondeados, botón azul marino redondeado, logotipo Aulix
  visible y fondo propio con gradiente azul marino → menta y dunas
  (CSS, sin copiar la imagen de Freepik ni su marca; tampoco se usan el
  morado/rosa de la referencia).
- "Recordarme", "¿Olvidaste tu contraseña?", "Crear cuenta" y acceso
  rápido demo (solo en modo demo). Validaciones bajo cada input, igual
  que antes. **Responsivo**: en móvil la tarjeta ocupa toda la pantalla
  sin desbordar.
- Registro y Recuperar contraseña mantienen el diseño anterior (comparten
  la hoja de estilos vieja y no se tocaron).

## Archivos nuevos / tocados (frontend)

- Nuevos: `src/components/ClassTheme.jsx`, `MessageContent.jsx`,
  `VoiceRecorder.jsx`, `AvisosClase.jsx`, `MaterialesSection.jsx`,
  `src/services/materialesService.js`, `NUEVAS-FUNCIONES.md` (este archivo).
- Tocados: `src/pages/Mensajes.jsx`, `MisClases.jsx`, `ClaseDetalle.jsx`,
  `Inicio.jsx`, `Login.jsx`, `src/styles/login.css`, `src/styles/pages.css`,
  `src/services/mockApi.js` (avisos y materiales demo persistentes,
  adjuntos demo en memoria), `src/services/authService.js` (el File
  original se conserva en modo demo para la vista previa).
- Backend: **intacto**.

## Qué le falta al backend (para tu compañero)

1. Aceptar **audio** (`.webm`, `.mp3`) y **video** (`.mp4`, `.webm`) en
   `ArchivoService` (hoy solo PDF/DOCX/imagen) para que las notas de voz
   y los videos adjuntos funcionen en modo real.
2. (Opcional) Un campo `color` dedicado en `Clase` — hoy se reutiliza
   `tema` con el hexadecimal, y funciona, pero un campo propio sería
   más limpio.
3. Lo ya pendiente de antes: rol ADMIN, correo/SMS/WhatsApp, paginación
   completa, README raíz, tablero de GitHub Projects y despliegue VPS
   con HTTPS.

## Cómo probarlo (demo, sin backend)

```bash
cd frontend
npm install
VITE_DEMO_MODE=true npm run dev   # o npm run dev con .env en demo
```

- Entra como docente demo y crea una clase eligiendo color en la rueda
  e icono; verás la tarjeta con ese color.
- En la clase, publica un aviso y súbelo: aparece en Avisos y en el
  Panel principal. Sube un video por URL y reprodúcelo ahí mismo.
- En Mensajes, escribe un enlace (p. ej. `https://www.youtube.com`),
  adjunta una imagen, y graba una nota de voz (máx. 1 minuto).
- Cierra sesión y entra como estudiante demo para verlo desde su lado.

---

# Nuevas funciones — Aulix v5 (2026-11-23, noche antes de la entrega)

## 1. Perfiles limpios para probar (semilla demo vacía)
- La semilla demo ya no trae clases, tareas, calificaciones, mensajes,
  avisos ni materiales: admin, docente y estudiante entran con TODO vacío.
- Nueva clave de base demo: `aulix_demo_v2` (la vieja `aulix_demo_v1` con
  datos ya no se carga; si la tenías en el navegador, se ignora).
- Estados vacíos claros en cada vista: Inicio ("Aún no tienes clases.
  Crea tu primera clase" con botón), Mis clases, Tareas, Calificaciones,
  Calendario ("Aún no tienes eventos…"), Mensajes y cada clase.
- En **Perfil** y **Configuración** (solo en modo demo) hay dos botones:
  "Borrar todos los datos demo" (deja todo limpio, sin cerrar sesión) y
  "Cargar datos de ejemplo" (pone los datos de la demo anterior, v1–v4,
  para ver cómo se ve lleno). Ambos piden confirmación con ConfirmModal
  (sin `alert()` ni `confirm()`).
- Funciones nuevas en `services/mockApi.js`: `clearDemoData()`,
  `loadExampleData()`; `resetDemoData()` queda como alias de vaciar.

## 2. Videos del docente (archivo y YouTube)
- En Materiales de la clase el docente sube un video como archivo o pega
  un enlace de YouTube (formulario con los dos tipos bien etiquetados).
- El estudiante ve el video dentro de la app: `<video>` para archivos,
  embed para YouTube. Los videos subidos como archivo se pueden
  DESCARGAR (botón Descargar); los de YouTube muestran "Ver en YouTube".
- **Limitación (sin descargador de terceros): los videos de YouTube se
  reproducen aquí; YouTube no permite descargarlos.** La UI lo dice en
  una línea bajo la lista de materiales y en cada tarjeta de YouTube.
  La descarga SÍ funciona para videos subidos como archivo.
- Arreglo: los videos subidos en demo ahora se reproducen de verdad
  (`MaterialCard` usa `material.adjuntoUrl`, el objectURL en memoria;
  antes solo miraba `material.url`, que es null para archivos subidos).
- En modo real el backend sigue sin aceptar videos por archivo
  (solo PDF/DOCX/imagen, máx. 20 MB): la UI avisa antes de enviarlo.

## 3. Mensajes por clase, unificados
- Nuevo componente `components/ChatClase.jsx`: chat de una sola clase
  (mensajes, adjuntos y notas de voz de máx. 60 s) con los endpoints
  reales `/mensajes/conversaciones/{claseId}/mensajes` y `.../leido`.
- En el detalle de cada clase (`ClaseDetalle` y el detalle de
  `MisClases`) hay pestañas **Avisos | Mensajes | Materiales / Videos**:
  en esa misma clase se publican avisos (docente), se mandan mensajes
  y notas de voz, y se ven los materiales y videos.
- La vista general de Mensajes (`/mensajes`) se mantiene, y ahora
  muestra una conversación por cada clase aunque aún no tenga mensajes
  (el mock sintetiza la lista desde las clases; al enviar el primer
  mensaje se crea la conversación).
- En demo funciona completo; en real usa los endpoints existentes
  (anuncios y mensajes por conversación de clase).

## 4. Logo en el encabezado
- `components/layout/Navbar.jsx` muestra el logo
  (`frontend/src/assets/logo-aulix.png`, 32 px) junto al nombre "Aulix",
  visible en todas las vistas internas y en móvil. El login no se tocó.
- De paso, el rol del encabezado ya no dice "Docente" para el admin:
  muestra Administrador / Docente / Estudiante según el rol real.

## 5. Botón de descarga uniforme
- Nueva clase `.btn-download` (`styles/layout.css`): botón redondeado
  (pill), icono `Download` de lucide-react + texto "Descargar", mismo
  estilo en Materiales, videos, entregas (`Calificaciones`,
  `VistaPreviaEntrega`), exportación CSV y adjuntos de mensajes
  (`MessageContent`). Sin emojis.

## Archivos tocados (frontend, v5)
- `services/mockApi.js` (semilla vacía v2, semilla de ejemplo, borrar/cargar, conversaciones por clase)
- `components/ChatClase.jsx` (nuevo), `components/MaterialesSection.jsx`,
  `components/MessageContent.jsx`, `components/layout/Navbar.jsx`
- `pages/ClaseDetalle.jsx`, `pages/MisClases.jsx`, `pages/Perfil.jsx`,
  `pages/Configuracion.jsx`, `pages/Inicio.jsx`, `pages/Calendario.jsx`,
  `pages/Calificaciones.jsx`, `pages/VistaPreviaEntrega.jsx`
- `styles/layout.css` (`.navbar__logo`, `.btn-download`)
- Backend: **intacto**.

## Verificación (v5)
- `npm run build`: éxito. También con `VITE_DEMO_MODE=true`: éxito.
- Humo con `vite preview` (build demo): `/`, `/login`, `/inicio`,
  `/mis-clases`, `/tareas`, `/calificaciones`, `/calendario`, `/mensajes` → **200** en todas.
- `grep`: cero `alert()` / `confirm()` en `frontend/src`.
- Prueba mental del flujo (no probado con clics en navegador): entrar
  en demo como alumno, docente y admin → todo vacío; crear una clase
  como docente → aparece; publicar un video (archivo y YouTube) → se ve
  y el archivo se descarga; entrar a esa clase → Avisos/Mensajes/Voz juntos.
