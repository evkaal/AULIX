# AULIX — Backend (Spring Boot + JWT)

Backend de **AULIX**, plataforma de clases para docentes y estudiantes, hecho
con el mismo patrón de las Actividades 3 y 4: **Spring Boot 4.1.2, Java 21,
Spring Data JPA, Spring Security (JWT stateless), MySQL, Lombok y JJWT 0.12.6**.

El frontend (React + Vite, repo de tu compañero) ya tenía Login e Inicio con
datos simulados y auth temporal con DummyJSON. Este backend reemplaza todo
eso: login/registro reales con JWT, clases, tareas, entregas, calificaciones,
mensajes, calendario, archivos y resúmenes.

- Puerto: **8106** (no choca con DONAVIDA 8080, Act. 3 8102 ni Act. 4 8104).
- Base de datos MySQL: **aulix_db**.
- Frontend: `http://localhost:5173` (CORS permitido).

## Qué trae

```
src/main/java/com/aulix/aulix/
├── AulixApplication.java        # @SpringBootApplication + @EnableScheduling
├── entity/                      # Usuario, Clase, Inscripcion, Tarea, Recurso,
│                                #   Anuncio, Entrega, Calificacion, Conversacion,
│                                #   Mensaje, LecturaMensaje + enums Rol, EstadoTarea,
│                                #   TipoRecurso, EstadoEntrega
├── repository/                  # 11 repositorios JPA (uno por entidad)
├── dto/                         # Requests/responses (records). Nunca se expone password.
├── service/                     # AuthService, ClaseService, TareaService,
│                                #   EntregaService, CalificacionService, MensajeService,
│                                #   DashboardService, CalendarioService, ArchivoService,
│                                #   SecurityHelper, TareaScheduler, DatabaseSeeder
├── controller/                  # Auth, Dashboard, Clase, Tarea, Entrega,
│                                #   Calificacion, Mensaje, Calendario, Archivo
├── security/                    # JwtService, JwtAuthenticationFilter, SecurityConfig
├── config/                      # ApplicationConfig (UserDetailsService, BCrypt,
│                                #   AuthenticationManager, CORS)
└── exception/                   # GlobalExceptionHandler (401/403/404/400/422)
bruno/                           # Colección Bruno (ver "Probar con Bruno")
deploy/                          # aulix.service, crear-bd.sql, .env.example, desplegar-vps.sh
frontend-patch/                  # authService.js y classService.js ya adaptados
```

## Entidades y reglas

| Entidad | Clave |
|---|---|
| Usuario | nombre, email único, password BCrypt, rol `DOCENTE`/`ESTUDIANTE`, grupo (ej. "3° A", null para docente), ciclo 2026, avatarUrl, activo. Implementa `UserDetails` con `ROLE_DOCENTE`/`ROLE_ESTUDIANTE`. |
| Clase | nombre, grupo, ciclo, docente, diasSemana ("LUN,MIE,VIE"), horaInicio/horaFin, aula, tema, simbolo, icono, codigoInvitacion único generado (ej. `MAT-3A-2026`), estado `EN_CURSO`. |
| Inscripcion | usuario + clase, única por pareja. |
| Tarea | clase, titulo, descripcion/instrucciones, fechaPublicacion, fechaActivacion, fechaVencimiento, activacionAutomatica, estado `PROGRAMADA`/`ACTIVA`/`CERRADA`, autor. |
| Recurso | tarea (nullable) o clase (nullable), tipo `ARCHIVO`/`VIDEO`, nombre, url, mime, tamanoBytes, paginas, duracionMin. |
| Anuncio | clase, autor, texto. |
| Entrega | tarea + estudiante, **única por pareja** (volver a entregar actualiza la misma), archivo (nombre/ruta/tipo/tamaño/paginas), comentario privado, fechaEntrega, estado `ENTREGADA`/`CALIFICADA`. |
| Calificacion | entrega `@OneToOne` única, nota 0–10, comentario, docente, fecha. Al crearla la entrega pasa a `CALIFICADA`. |
| Conversacion | una por clase (`@OneToOne` única). |
| Mensaje | conversacion, autor, texto, fechaEnvio, adjunto (nombre/ruta/tamaño). |
| LecturaMensaje | mensaje + usuario, única por pareja. |

Reglas que aplica el backend (no confíes en el frontend):

- Docente solo gestiona **sus propias** clases; estudiante solo ve clases donde está inscrito.
- Entrega: solo su autor o el docente de esa clase. Su comentario es privado (autor + docente).
- Calificación: solo el docente de la clase, nota 0–10. El estudiante nunca edita nota ni comentario.
- Tarea `PROGRAMADA` es invisible para estudiantes hasta `fechaActivacion`; el scheduler la activa cada minuto.
- `aTiempo = fechaEntrega <= fechaVencimiento` (se calcula, no se guarda).
- Promedios y KPIs son agregaciones calculadas al momento, no se guardan.
- Contraseña fuerte al registrar: mín. 8, mayúscula, minúscula, número y carácter especial (igual que `validators.js` del frontend).
- **Fuera de alcance:** login con Google y recuperación de contraseña (los botones del frontend ya lo avisan). Solo se implementan register/login con JWT.

## Semilla (DatabaseSeeder)

Al primer arranque, si la tabla `usuarios` está vacía, se crea todo con
repositorios y `PasswordEncoder` (por eso NO hay `data.sql` con usuarios: el
hash BCrypt no se puede escribir a mano). "Hoy" en la semilla = **2026-10-21**.

- Docente: **Laura Martínez — laura@colegio.edu / `Docente123*`**
- Estudiantes (contraseña `Estudiante123*`): Ana Sofía García
  `ana.sofia@colegio.edu`, Bruno Hernández, Camila López, Daniel Pérez,
  Elena Rodríguez, Gabriel Sánchez, Isabella Torres, Javier Ramírez
  (`nombre.apellido@colegio.edu`, 3° A). Más genéricos hasta **28 en 3° A**
  y **26 en 3° B** (`estudiante-3a-09@colegio.edu`, `estudiante-3b-01@...`).
- Clases: **Matemáticas 3° A** (LUN,MIE,VIE 08:00–09:00, Aula 3, blue,
  `x² + y²`, `MAT-3A-2026`), **Ciencias 3° A** (MAR,JUE 09:00–10:00, green,
  `H₂O`, `CIE-3A-2026`), **Lengua y Literatura 3° B** (LUN,MIE,VIE
  10:00–11:00, purple, `Aa`, `LEN-3B-2026`).
- 9 tareas con vencimientos 22–30 oct 2026 23:59: Ecuaciones de primer grado
  (Mat, 22 oct), El ciclo del agua (Cie, 23 oct), Reseña de lectura (Len,
  23 oct), Ángulos y triángulos (Mat, 26 oct), Operaciones con enteros (Mat,
  27 oct), Los ecosistemas (Cie, 27 oct), Análisis de un poema (Len, 28 oct),
  Escritura de un cuento (Len, 30 oct) y **Problemas con fracciones** (Mat,
  activación 26 oct 08:00, vencimiento 28 oct 23:59, `PROGRAMADA`,
  activacionAutomatica true).
- Entregas: Ana entregó Ecuaciones 21 oct 09:20 (9.0), Ángulos 20 oct 16:45
  (9.0) y Enteros 19 oct 11:10 (8.0); Bruno entregó Ecuaciones sin calificar;
  Camila, Ciclo del agua (8.5); Daniel, Reseña sin calificar; Elena, Ángulos
  (7.5); Gabriel, Ecosistemas sin calificar.
- 1 conversación por clase con mensajes del 21 oct (Laura 09:00, Ana 09:24,
  Bruno 09:31, Laura 09:35), 1 anuncio por clase y 1 material por clase
  (Guía_ecuaciones.pdf, video del ciclo del agua, Guía_reseña.pdf).

> Las entregas y recursos sembrados son **metadatos sin archivo real** en
> `./uploads`: su descarga devuelve 404 hasta que alguien suba el archivo
> de verdad. Es intencional: la semilla no inventa archivos.

## Endpoints (base `/api`, todos protegidos salvo `/api/auth/**`)

Todos llevan `Authorization: Bearer <token>` salvo registro/login.
Errores: sin token o token inválido → **401**; sin permiso → **403**;
no encontrado → **404**; validación → **422** (campo por campo);
datos incorrectos → **400**.

### Auth
| Método | Ruta | Body / notas |
|---|---|---|
| POST | `/api/auth/register` | `{nombre, email, password, rol, grupo}` → **201** `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` → **200** `{token, user}` |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/change-password` | Con token. `{currentPassword, newPassword}` → **200**. Verifica la actual con BCrypt, rechaza una nueva igual a la actual; la nueva exige la misma regla fuerte del registro (mín. 8, mayúscula, minúscula, número, especial) → **422** si no la cumple. El token sigue válido; la nueva se usa en el siguiente login |

`user` = `{id, nombre, correo, rol, grupo, ciclo, avatar}` (correo, no
username: es lo que el frontend ya espera en `user.nombre/correo/avatar`).

```bash
curl -X POST http://localhost:8106/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"laura@colegio.edu","password":"Docente123*"}'
```

### Dashboard
| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/docente/resumen` | Clases del docente (estudiantes, tareasActivas), actividad reciente (entregas), proximasEntregas |
| GET | `/api/estudiante/resumen` | materias, tareasPendientes, trabajosCalificados, proximasEntregas, anuncios |

### Clases
| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/clases?ciclo=&q=` | Docente: suyas. Estudiante: inscritas |
| POST | `/api/clases` | Docente. El `codigoInvitacion` lo genera el backend |
| GET | `/api/clases/{id}` | |
| PUT | `/api/clases/{id}` | Solo el docente dueño |
| DELETE | `/api/clases/{id}` | Solo el docente dueño → **204**. No borra en cascada: **400** si ya tiene alumnos, tareas, materiales, anuncios o conversación |
| POST | `/api/clases/unirse` | `{codigo}` — estudiante |
| GET | `/api/clases/{id}/alumnos?filtro=pendientes&q=&page=&size=` | Docente. Por alumno: entregasRecibidas, entregasTotales, porCalificar, promedio |
| GET | `/api/clases/{id}/materiales` | |
| POST | `/api/clases/{id}/materiales` | multipart (docente): `archivo` o `tipo=VIDEO` + `url`, `nombre`, `duracionMin` |
| GET | `/api/clases/{id}/anuncios` | |
| POST | `/api/clases/{id}/anuncios` | `{texto}` — docente dueño |
| GET | `/api/clases/{id}/mis-tareas` | Estudiante: tareas visibles con miEstado |
| GET | `/api/clases/{id}/mi-progreso` | Estudiante: totales, entregadas, calificadas, promedio, por tarea |
| GET | `/api/clases/{id}/alumnos/{alumnoId}/entregas` | Docente |

### Tareas
| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/tareas?materiaId=&estado=&q=` | Docente, con entregasRecibidas/total |
| GET | `/api/estudiante/tareas?estado=&materiaId=&q=` | Con miEstado (pendiente/entregada/calificada) y nota |
| POST | `/api/tareas` | Docente: `{claseId, titulo, descripcion, instrucciones, fechaActivacion, fechaVencimiento, activacionAutomatica, estado}` |
| PUT | `/api/tareas/{id}` | Docente dueño |
| DELETE | `/api/tareas/{id}` | Docente dueño → **204**. No borra en cascada: **400** si ya tiene entregas o recursos adjuntos |
| GET | `/api/tareas/{id}` | Detalle + instrucciones + recursos + miEntrega si es estudiante |
| PUT | `/api/tareas/{id}/programacion` | `{fechaActivacion, fechaVencimiento, activacionAutomatica, estado}` |

### Entregas
| Método | Ruta | Notas |
|---|---|---|
| POST | `/api/tareas/{id}/entregas` | multipart: `archivo` + `comentario` (opcional) + `paginas` → **201**. Re-entregar actualiza la misma entrega |
| GET | `/api/entregas/{id}` | Solo autor o docente |
| GET | `/api/entregas/{id}/archivo` | Descarga del archivo |
| GET | `/api/entregas/{id}/revision` | nota + comentario + fecha, solo autor/docente |

Frontend: la vista previa del documento (pantalla Figma 18:993) es la ruta
`/calificaciones/entrega/:id` (`VistaPreviaEntrega.jsx`): pide
`GET /api/entregas/{id}` y el archivo como Blob con Bearer (PDF en
`<iframe>`, imagen en `<img>`, resto solo descarga); califica con
`POST/PUT /api/entregas/{id}/calificacion` y al guardar muestra
"Calificación guardada" (pantalla 18:1254).

### Calificaciones
| Método | Ruta | Notas |
|---|---|---|
| POST | `/api/entregas/{id}/calificacion` | Docente: `{nota, comentario}` (0–10). Crea o actualiza |
| PUT | `/api/entregas/{id}/calificacion` | Igual que POST |
| GET | `/api/calificaciones/resumen` | Docente: totales, promedio, por clase |
| GET | `/api/clases/{id}/calificaciones/resumen` | Docente |
| GET | `/api/estudiante/calificaciones?materiaId=` | Estudiante |
| GET | `/api/calificaciones/exportar?materiaId=&ciclo=` | CSV (docente). Columnas: alumno, correo, tarea, clase, nota, comentario, fecha |

### Mensajes (conversación grupal, una por clase)
| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/mensajes/conversaciones?filtro=sin-leer&q=` | Por materia, último mensaje, sinLeer |
| GET | `/api/mensajes/conversaciones/{claseId}/mensajes?page=&size=` | Más recientes primero |
| POST | `/api/mensajes/conversaciones/{claseId}/mensajes` | multipart: `texto` + `adjunto` opcional |
| POST | `/api/mensajes/conversaciones/{claseId}/leido` | Marca todos como leídos |
| GET | `/api/mensajes/conversaciones/{claseId}/archivos` | Adjuntos de esa conversación |
| GET | `/api/mensajes/sin-leer` | Total y por clase |

### Calendario
| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/calendario?mes=2026-10&materiaId=` | Docente: activaciones y vencimientos |
| GET | `/api/estudiante/calendario?mes=2026-10` | Horario recurrente de sus clases + vencimientos |

### Archivos
| Método | Ruta | Notas |
|---|---|---|
| POST | `/api/archivos` | multipart `archivo` (máx. 20 MB, solo PDF/DOCX/imagen) → `{nombre, ruta, tipo, tamanoBytes}` |
| GET | `/api/archivos/{nombre}` | Descarga |

Los archivos se guardan en `./uploads` (o `UPLOAD_DIR`) con nombre único
UUID. **Nunca se devuelve la ruta absoluta**: solo el nombre guardado y
`/uploads/<nombre>`.

### Scheduler
`TareaScheduler` corre cada minuto (`@EnableScheduling` en
`AulixApplication`) y pasa a `ACTIVA` las tareas `PROGRAMADA` cuya
`fechaActivacion` ya llegó. Las tareas **no se cierran solas** al vencer:
`CERRADA` solo la pone el docente.

## Cómo correr en local (tu PC, PowerShell)

Requisitos: Java 21, MySQL en Docker (el contenedor `mysql-act3` que ya
usas para las Act. 3 y 4 sirve: puerto 3306) y la base `aulix_db`
(se crea sola por `createDatabaseIfNotExist=true`, o con
`deploy/crear-bd.sql`).

1. Genera el secreto JWT (una sola vez, guárdalo, **no lo subas a GitHub**):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

2. En la carpeta del proyecto, con las variables de entorno en **esta misma
   terminal** (PowerShell):

```powershell
cd C:\Users\ejim1\Downloads\aulix-backend\aulix
$env:DB_PASS="tu_password_de_mysql"
$env:JWT_SECRET="lo_que_salio_en_el_paso_1"
.\mvnw.cmd spring-boot:run
```

> `JWT_SECRET` es **obligatorio y no tiene valor por defecto**: sin él la
> app no arranca. `DB_PASS` puede ir vacío si tu MySQL no tiene contraseña.
> El puerto se cambia con `$env:PORT="8106"` (por defecto 8106).

3. Prueba el login (cuenta sembrada):

```powershell
curl.exe -X POST http://localhost:8106/api/auth/login -H "Content-Type: application/json" -d '{"email":"laura@colegio.edu","password":"Docente123*"}'
```

Compilar el jar (sin arrancar):

```powershell
.\mvnw.cmd clean package -DskipTests
# El jar queda en target\aulix-0.0.1-SNAPSHOT.jar
```

## Probar con Bruno

1. Abre Bruno → Open Collection → carpeta `bruno/`.
2. Environment **local** (`http://localhost:8106`).
3. Corre en orden: `auth/02 - Login docente` (guarda `token`),
   `auth/03 - Login estudiante` (guarda `tokenEstudiante`), luego las
   carpetas clases, tareas, entregas, calificaciones, mensajes, calendario,
   dashboard y archivos.
4. `auth/05 - Sin token` debe dar **401** (así se comprueba que protege).
5. Environment **vps**: cambia `TU_VPS` por la IP o dominio del VPS.

## Despliegue en el VPS

Mismo VPS que DONAVIDA y las actividades (Ubuntu, Java 21 y MySQL):

```bash
# En el VPS, una sola vez:
mysql -u root -p < deploy/crear-bd.sql
# Copia deploy/.env.example a /opt/aulix/.env y rellena DB_PASS y JWT_SECRET reales.

# Desde tu PC, en la raíz del proyecto:
./deploy/desplegar-vps.sh ubuntu@159.173.138.239
```

El script compila el jar, lo sube a `/opt/aulix`, instala
`deploy/aulix.service` (systemd, puerto 8106, `EnvironmentFile=/opt/aulix/.env`)
y comprueba que sin token da 401. Los archivos subidos van a
`/opt/aulix/uploads` (`UPLOAD_DIR` en el `.env`).

## Integración con el frontend

En `frontend-patch/` están los dos archivos ya adaptados. Copiarlos al
frontend (sin tocar nada más):

- `frontend-patch/authService.js` → `frontend/src/services/authService.js`
  - `API_URL` pasa de `https://dummyjson.com/auth/login` a
    `http://localhost:8106/api/auth` (o `import.meta.env.VITE_API_URL`).
  - Login envía `{email, password}` y recibe `{token, user}` — ya no hay
    `username` ni `accessToken`.
  - Incluye `register()`, `getSession()`, `getToken()` y `apiFetch()` (fetch
    con `Authorization: Bearer <token>`).
  - `AuthContext.jsx` **no cambia**: ya guarda `{token, user}` en
    `aulix_session` y lee `user.nombre/correo/avatar`, que es justo lo que
    devuelve el backend.
- `frontend-patch/classService.js` → `frontend/src/services/classService.js`
  - `getResumenInicio()` llama a `/api/docente/resumen` o
    `/api/estudiante/resumen` según `user.rol` y adapta la respuesta al
    formato que `Inicio.jsx` ya espera (`clases` con tema/icono/formula,
    `actividad` con iniciales/tema/texto/detalle).
  - CORS ya permite `http://localhost:5173` en el backend.

Pendiente en el frontend (no es parte de este backend): las rutas
mis-clases, tareas, calificaciones, calendario, mensajes y configuracion
siguen siendo `Placeholder`; ahora ya tienen endpoints reales a los que
conectarlas.

## Respuestas a–d (como en la Act. 4)

**a) ¿Cómo funciona JWT aquí?** Al hacer login, el servidor verifica email +
contraseña (BCrypt) y firma un token con JJWT (subject = email, expiración
24 h, secreto Base64 de `JWT_SECRET`). El cliente lo guarda en la sesión y
lo manda en cada petición como `Authorization: Bearer <token>`.
`JwtAuthenticationFilter` lo valida en cada request y, si es válido, pone
el usuario en el `SecurityContext`. El servidor no guarda sesiones
(stateless): el token es toda la prueba.

**b) ¿Qué hace Spring Security?** `SecurityConfig` desactiva CSRF (es una
API), pone sesiones en `STATELESS`, permite sin autenticación solo
`/api/auth/**` y `/error`, exige autenticación en todo lo demás, registra el
filtro JWT antes de `UsernamePasswordAuthenticationFilter` y devuelve 401
JSON (sin token o token inválido) y 403 JSON (sin permiso) en lugar de la
página de login de Spring. `ApplicationConfig` define el
`UserDetailsService` (busca por email), el `DaoAuthenticationProvider` con
BCrypt, el `AuthenticationManager` y el CORS.

**c) ¿Para qué sirven los DTOs?** Separan lo que entra/sale de la API de
las entidades JPA: validan con `@Valid` (`@NotBlank`, `@Email`, `@Pattern`
para la contraseña fuerte, `@DecimalMin/@DecimalMax` para la nota 0–10),
evitan exponer el `password` y las relaciones que harían ciclos en JSON
(docente → clases → docente…), y devuelven solo lo que el frontend
necesita (ej. `UserResponse` con `correo` en vez de `email`, `TareaResponse`
con `miEstado`/`miNota` para el estudiante). Los errores de validación
llegan como **422** con el detalle por campo.

**d) Decisiones y supuestos**
- **Lengua y Literatura en 3° B:** el Figma la muestra en 3° B en la vista
  docente, así se sembró, aunque el Inicio la liste junto a las de 3° A.
  El backend no inventa el grupo: lo toma del dato del Figma.
- **Semilla reducida y coherente:** los totales del Figma (72/186 entregas…)
  no cuadran entre pantallas, así que la semilla no los replica: son 28
  alumnos en 3° A, 26 en 3° B, 9 tareas y 8 entregas con 5 calificadas.
  Los KPIs se calculan de estos datos y sí cuadran.
- **Google y recuperación de contraseña fuera de alcance:** el frontend ya
  los marca como "próxima entrega". No hay endpoints para eso.
- **1 archivo por entrega:** la entrega tiene un solo archivo; volver a
  entregar actualiza la misma fila (por la unicidad tarea+estudiante).
- **Exportar calificaciones en CSV**, no en Excel: es simple, lo abre Excel
  y no añade dependencias.
- **Scheduler activa todas las PROGRAMADA al llegar su fecha** (con
  activacionAutomatica true o false), porque no hay endpoint de activación
  manual y con `false` la tarea quedaría atascada. Las tareas no se cierran
  solas al vencer.
- **Archivos en disco local (`./uploads`)**, no en la base de datos: en la
  BD solo se guarda el nombre único. Máx. 20 MB, solo PDF/DOCX/imagen.
- **Sin `data.sql`:** la semilla es `DatabaseSeeder` en Java, porque el
  hash BCrypt de las contraseñas no se puede escribir a mano en SQL.
- **Sin paginación en listados simples:** solo `alumnos` y `mensajes`
  aceptan `page/size`; el resto devuelve la lista completa (son datos de
  una clase, no miles de filas).
