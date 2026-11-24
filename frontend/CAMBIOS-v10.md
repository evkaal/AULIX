# AULIX frontend — v10 (cambios)

## Errores corregidos
1. **Login "solo con usuarios demo"**: el respaldo demo estaba activo por defecto
   (`VITE_DEMO_FALLBACK !== 'false'`). Si el backend no respondía (apagado, sin
   `JWT_SECRET`, CORS, otro puerto), el login y todos los datos caían al mock en
   silencio. Ahora es **opt-in** (`VITE_DEMO_FALLBACK=true`) y por defecto se ve un
   error claro con la URL a la que intenta conectar.
2. **Tareas y dashboard en 0**: se leían del mock en localStorage y no del backend.
   Con el fallback apagado todo sale de la API real.
3. **Sesión inválida (401)**: ahora se borra la sesión y se redirige al login.
4. **`ProtectedRoute`** ignoraba `allowedRoles`; ahora sí valida el rol.
5. Eliminados `components/Navbar.jsx` y `components/Sidebar.jsx` (duplicados sin uso;
   la app usa los de `components/layout/`).

## Diseño
- Nueva capa `src/styles/refresh.css`: tarjetas, tablas, pestañas, KPIs, badges,
  menú lateral y formularios con un solo estilo; compatible con modo oscuro.

## Cómo probar
1. Backend: `JWT_SECRET` y `DB_PASS` definidos, corriendo en `:8106`.
2. `copy .env.example .env` y `npm install && npm run dev`.
3. Abrir **http://localhost:5173** (no 127.0.0.1: el CORS del backend solo permite localhost).
4. Docente: `laura@colegio.edu` / `Docente123*`. Estudiante: `ana.sofia@colegio.edu` / `Estudiante123*`.
