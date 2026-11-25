# AULIX — Backend (Spring Boot + JWT)

Backend de **AULIX**, plataforma de clases para docentes y estudiantes, hecho
con el mismo patrón de las Actividades 3 y 4: **Spring Boot 4.1.2, Java 21,
Spring Data JPA, Spring Security (JWT stateless), MySQL, Lombok y JJWT 0.12.6**.


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
bruno/                           # Colección Bruno
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







