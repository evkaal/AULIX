# AULIX — Frontend (React + Vite)

Frontend de Aulix integrado al backend Spring Boot del mismo repo
(`../backend`, puerto 8106, base `/api`).

## Correr en local

```bash
copy .env.example .env   # PowerShell, en esta carpeta (frontend)
npm install
npm run dev              # http://localhost:5173
npm run build            # build de producción (dist/)
```

`.env` por defecto: `VITE_API_URL=http://localhost:8106/api`,
`VITE_DEMO_MODE=false` (backend real). Con `VITE_DEMO_MODE=true` entra
en modo demo sin backend (cuentas `admin@aulix.mx`, `docente@aulix.mx`,
`alumno@aulix.mx`, contraseña `Demo123!`). Si el backend no responde y
`VITE_DEMO_FALLBACK` no es `false`, cae solo al demo y avisa con un banner.

## Roles

Backend real: solo `DOCENTE` y `ESTUDIANTE` (`ESTUDIANTE` = alumno en la
UI). El rol `ADMIN` y la vista `/usuarios` solo existen en modo demo: el
backend no tiene `/api/usuarios`.

## Contrato de API (resumen; el detalle está en `../backend/README.md`)

- Auth: `POST /api/auth/register`, `POST /api/auth/login`,
  `GET /api/auth/me`, `POST /api/auth/change-password`. JWT en
  `Authorization: Bearer <token>`. Usuario: `{id, nombre, correo, rol,
  grupo, ciclo, avatar}`.
- Dashboard: `GET /api/docente/resumen`, `GET /api/estudiante/resumen`.
- Clases: `GET /api/clases?ciclo=&q=`, `POST /api/clases`,
  `GET/PUT/DELETE /api/clases/{id}`, `POST /api/clases/unirse {codigo}`,
  `GET /api/clases/{id}/alumnos?filtro=&q=&page=&size=` (Page),
  `GET /api/clases/{id}/mis-tareas`, `GET /api/clases/{id}/mi-progreso`.
- Tareas: `GET /api/tareas` (docente) / `GET /api/estudiante/tareas`,
  `POST/PUT/DELETE /api/tareas[/{id}]`, `PUT /api/tareas/{id}/programacion`,
  `POST /api/tareas/{id}/entregas` (multipart: archivo + comentario + paginas).
- Calificaciones (nota **0–10**): `POST/PUT /api/entregas/{id}/calificacion
  {nota, comentario}`, `GET /api/calificaciones/resumen`,
  `GET /api/estudiante/calificaciones`, `GET /api/calificaciones/exportar`
  (CSV). Vista previa: `GET /api/entregas/{id}` + `GET /api/entregas/{id}/archivo`.
- Mensajes: `GET /api/mensajes/conversaciones`,
  `GET /api/mensajes/conversaciones/{claseId}/mensajes?page=&size=` (Page),
  `POST .../mensajes` (multipart), `POST .../leido`, `GET /api/mensajes/sin-leer`.
- Calendario: `GET /api/calendario?mes=&materiaId=` /
  `GET /api/estudiante/calendario?mes=`.

Paginación server-side: solo `/clases/{id}/alumnos` y
`/mensajes/.../mensajes` devuelven `Page`; el resto devuelve la lista
completa (así lo documenta el backend).

## Rutas

`/login`, `/registro`, `/recuperar` (sin endpoint real: fuera de alcance
en el backend), `/inicio`, `/mis-clases`, `/mis-clases/:id`, `/tareas`,
`/tareas/:id`, `/calificaciones`, `/calificaciones/entrega/:id`,
`/calificaciones/guardada`, `/calendario`, `/mensajes`, `/mensajes/:id`,
`/perfil`, `/configuracion`, `/usuarios` (solo demo/ADMIN).

Validaciones bajo cada input, rutas protegidas por rol, modales de
confirmación, sin `alert()` ni `confirm()`, responsivo (paleta Figma:
azul marino + menta).
