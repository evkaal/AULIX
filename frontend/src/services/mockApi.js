// MODO DEMO (sin backend real). Persistencia en localStorage (clave
// aulix_demo_v2, v5). La semilla demo es VACÍA: admin, docente y estudiante
// entran sin clases, tareas, calificaciones, mensajes ni avisos, para probar
// creando materias desde cero. Los datos de ejemplo de versiones anteriores
// viven en seedExample() y solo se cargan con "Cargar datos de ejemplo"
// (Perfil / Configuración -> loadExampleData). SOLO se usa cuando
// VITE_DEMO_MODE=true, o como RESPALDO si el backend no responde y
// VITE_DEMO_FALLBACK no es 'false' (ver services/authService.js).
// Roles reales del backend: DOCENTE / ESTUDIANTE (ESTUDIANTE = alumno en
// la UI). La nota real es 0-10, no 0-100. Las respuestas imitan los DTO
// reales: ClaseResponse, TareaResponse, EntregaResponse,
// CalificacionResponse, MensajeResponse y los resúmenes de Dashboard.
// Paginación: solo /clases/{id}/alumnos y /mensajes/.../mensajes devuelven
// Page {content,totalElements,totalPages,number,size}; el resto devuelve
// la lista completa, igual que el backend real (ver backend/README.md).
export class DemoError extends Error {
  constructor(message, status = 0, type = 'server') { super(message); this.status = status; this.type = type }
}
export const DEMO_USERS = [
  { id: 1, nombre: 'Ana Administradora', correo: 'admin@aulix.mx', password: 'Demo123!', rol: 'ADMIN', avatar: null },
  { id: 2, nombre: 'Laura Martínez', correo: 'docente@aulix.mx', password: 'Demo123!', rol: 'DOCENTE', avatar: null },
  { id: 3, nombre: 'Jonathan Alumno', correo: 'alumno@aulix.mx', password: 'Demo123!', rol: 'ESTUDIANTE', avatar: null },
]
const KEY = 'aulix_demo_v2'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const today = (d = 0) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }
const dt = (d = 0, h = 23, m = 59) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, m, 0, 0); return t.toISOString().slice(0, 16) }
// Semilla VACÍA (v5): perfiles limpios para probar desde cero.
function seed() {
  return {
    usuarios: [...DEMO_USERS],
    clases: [],
    claseAlumnos: {},
    tareas: [],
    entregas: [],
    calificaciones: [],
    eventos: [],
    conversaciones: [],
    anuncios: {},
    materiales: {},
    seq: { clase: 1, tarea: 1, entrega: 1, calificacion: 1, evento: 1, usuario: 4, mensaje: 1, material: 1, anuncio: 1 },
  }
}
// Semilla de ejemplo (datos de la demo anterior, v1-v4): solo se carga
// cuando el usuario pulsa "Cargar datos de ejemplo" en Perfil/Configuración.
function seedExample() {
  return {
    usuarios: [...DEMO_USERS,
      { id: 4, nombre: 'Ana Sofía García', correo: 'ana.sofia@colegio.edu', password: 'Estudiante123*', rol: 'ESTUDIANTE', grupo: '3° A' },
      { id: 5, nombre: 'Carlos Ruiz', correo: 'carlos@colegio.edu', password: 'Demo123!', rol: 'ESTUDIANTE', grupo: '3° A' },
      { id: 6, nombre: 'Luis Pérez', correo: 'luis@colegio.edu', password: 'Demo123!', rol: 'DOCENTE' }],
    clases: [
      { id: 1, nombre: 'Matemáticas', grupo: '3° A', ciclo: 2026, descripcion: 'Álgebra y ecuaciones de primer grado.', docenteId: 2, docenteNombre: 'Laura Martínez', diasSemana: 'LUN,MIE,VIE', horaInicio: '08:00', horaFin: '09:00', aula: 'Aula 3', tema: 'blue', icono: 'calculator', codigoInvitacion: 'MAT-3A-2026', estado: 'EN_CURSO', estudiantes: 28, tareasActivas: 3 },
      { id: 2, nombre: 'Ciencias', grupo: '3° A', ciclo: 2026, descripcion: 'El método científico y la materia.', docenteId: 2, docenteNombre: 'Laura Martínez', diasSemana: 'MAR,JUE', horaInicio: '09:00', horaFin: '10:00', aula: 'Aula 3', tema: 'green', icono: 'flask', codigoInvitacion: 'CIE-3A-2026', estado: 'EN_CURSO', estudiantes: 28, tareasActivas: 2 },
      { id: 3, nombre: 'Lengua y Literatura', grupo: '3° B', ciclo: 2026, descripcion: 'Comprensión lectora y redacción.', docenteId: 2, docenteNombre: 'Laura Martínez', diasSemana: 'LUN,MIE,VIE', horaInicio: '10:00', horaFin: '11:00', aula: 'Aula 3', tema: 'purple', icono: 'book', codigoInvitacion: 'LEN-3B-2026', estado: 'EN_CURSO', estudiantes: 26, tareasActivas: 3 }],
    claseAlumnos: {
      1: [{ id: 3, nombre: 'Jonathan Alumno', correo: 'alumno@aulix.mx', grupo: '3° A', avatar: null, entregasRecibidas: 1, entregasTotales: 3, porCalificar: 0, promedio: 9.0 }, { id: 4, nombre: 'Ana Sofía García', correo: 'ana.sofia@colegio.edu', grupo: '3° A', avatar: null, entregasRecibidas: 3, entregasTotales: 3, porCalificar: 0, promedio: 8.7 }],
      2: [{ id: 3, nombre: 'Jonathan Alumno', correo: 'alumno@aulix.mx', grupo: '3° A', avatar: null, entregasRecibidas: 0, entregasTotales: 2, porCalificar: 0, promedio: null }],
      3: [{ id: 4, nombre: 'Ana Sofía García', correo: 'ana.sofia@colegio.edu', grupo: '3° B', avatar: null, entregasRecibidas: 1, entregasTotales: 3, porCalificar: 1, promedio: 8.5 }],
    },
    tareas: [
      { id: 1, claseId: 1, claseNombre: 'Matemáticas', titulo: 'Ecuaciones de primer grado', descripcion: 'Resuelve los 10 ejercicios del cuadernillo y sube tu procedimiento.', instrucciones: 'Sube un PDF con tu procedimiento.', fechaPublicacion: dt(-5, 8), fechaActivacion: dt(-5, 8), fechaVencimiento: dt(2), activacionAutomatica: true, estado: 'ACTIVA', miEstado: 'entregada', miNota: 9.0, miEntregaId: 2, entregasRecibidas: 2, entregasTotales: 28 },
      { id: 2, claseId: 2, claseNombre: 'Ciencias', titulo: 'El ciclo del agua', descripcion: 'Explica el ciclo del agua con un diagrama.', instrucciones: 'Diagrama + explicación de 1 cuartilla.', fechaPublicacion: dt(-4, 9), fechaActivacion: dt(-4, 9), fechaVencimiento: dt(4), activacionAutomatica: true, estado: 'ACTIVA', miEstado: 'pendiente', miNota: null, miEntregaId: null, entregasRecibidas: 1, entregasTotales: 28 },
      { id: 3, claseId: 3, claseNombre: 'Lengua y Literatura', titulo: 'Reseña de lectura', descripcion: 'Reseña del capítulo leído en clase.', instrucciones: 'Máximo 2 cuartillas.', fechaPublicacion: dt(-3, 10), fechaActivacion: dt(-3, 10), fechaVencimiento: dt(-1), activacionAutomatica: true, estado: 'ACTIVA', miEstado: 'pendiente', miNota: null, miEntregaId: null, entregasRecibidas: 1, entregasTotales: 26 }],
    entregas: [
      { id: 1, tareaId: 1, tareaTitulo: 'Ecuaciones de primer grado', estudianteId: 4, estudianteNombre: 'Ana Sofía García', archivoNombre: 'ecuaciones-ana.pdf', archivoRuta: null, archivoTipo: 'application/pdf', archivoTamanoBytes: 120000, paginas: 3, comentario: 'Adjunto mi procedimiento completo.', fechaEntrega: dt(-1, 9, 20), estado: 'CALIFICADA', aTiempo: true, nota: 9.0, comentarioCalificacion: 'Muy bien, solo revisa el ejercicio 7.' },
      { id: 2, tareaId: 1, tareaTitulo: 'Ecuaciones de primer grado', estudianteId: 3, estudianteNombre: 'Jonathan Alumno', archivoNombre: 'ecuaciones-jonathan.pdf', archivoRuta: null, archivoTipo: 'application/pdf', archivoTamanoBytes: 98000, paginas: 2, comentario: 'Ejercicios resueltos.', fechaEntrega: dt(0, 11, 10), estado: 'CALIFICADA', aTiempo: true, nota: 9.0, comentarioCalificacion: 'Muy bien, solo revisa el ejercicio 7.' },
      { id: 3, tareaId: 2, tareaTitulo: 'El ciclo del agua', estudianteId: 4, estudianteNombre: 'Ana Sofía García', archivoNombre: 'ciclo-agua.pdf', archivoRuta: null, archivoTipo: 'application/pdf', archivoTamanoBytes: 80000, paginas: 2, comentario: '', fechaEntrega: dt(-2, 16, 45), estado: 'CALIFICADA', aTiempo: true, nota: 8.5, comentarioCalificacion: 'Excelente procedimiento.' }],
    calificaciones: [
      { id: 1, entregaId: 1, tareaId: 1, tareaTitulo: 'Ecuaciones de primer grado', estudianteId: 4, estudianteNombre: 'Ana Sofía García', nota: 9.0, comentario: 'Muy bien, solo revisa el ejercicio 7.', docenteNombre: 'Laura Martínez', fechaCalificacion: dt(-1, 10) },
      { id: 2, entregaId: 2, tareaId: 1, tareaTitulo: 'Ecuaciones de primer grado', estudianteId: 3, estudianteNombre: 'Jonathan Alumno', nota: 9.0, comentario: 'Muy bien, solo revisa el ejercicio 7.', docenteNombre: 'Laura Martínez', fechaCalificacion: dt(0, 11) },
      { id: 3, entregaId: 3, tareaId: 2, tareaTitulo: 'El ciclo del agua', estudianteId: 4, estudianteNombre: 'Ana Sofía García', nota: 8.5, comentario: 'Excelente procedimiento.', docenteNombre: 'Laura Martínez', fechaCalificacion: dt(-2, 17) }],
    eventos: [
      { id: 1, titulo: 'Entrega: Ecuaciones de primer grado', fecha: dt(2), tipo: 'vencimiento', claseNombre: 'Matemáticas', tareaId: 1 },
      { id: 2, titulo: 'Entrega: El ciclo del agua', fecha: dt(4), tipo: 'vencimiento', claseNombre: 'Ciencias', tareaId: 2 }],
    conversaciones: [
      { claseId: 1, claseNombre: 'Matemáticas', grupo: '3° A', ultimoMensaje: { autorNombre: 'Ana Sofía García', texto: '¿La tarea se entrega en PDF o en foto?' }, sinLeer: 1, mensajes: [
        { id: 1, conversacionId: 1, autorId: 4, autorNombre: 'Ana Sofía García', autorAvatar: null, texto: '¿La tarea se entrega en PDF o en foto?', fechaEnvio: dt(-1, 9), adjuntoNombre: null, adjuntoRuta: null, adjuntoTamanoBytes: null },
        { id: 2, conversacionId: 1, autorId: 2, autorNombre: 'Laura Martínez', autorAvatar: null, texto: 'En PDF, por favor. Suban su procedimiento.', fechaEnvio: dt(-1, 9, 30), adjuntoNombre: null, adjuntoRuta: null, adjuntoTamanoBytes: null }] },
      { claseId: 2, claseNombre: 'Ciencias', grupo: '3° A', ultimoMensaje: { autorNombre: 'Laura Martínez', texto: 'Recuerden el reporte para el jueves.' }, sinLeer: 0, mensajes: [
        { id: 3, conversacionId: 2, autorId: 2, autorNombre: 'Laura Martínez', autorAvatar: null, texto: 'Recuerden el reporte para el jueves.', fechaEnvio: dt(-2, 10), adjuntoNombre: null, adjuntoRuta: null, adjuntoTamanoBytes: null }] }],
    anuncios: {
      1: [{ id: 1, claseId: 1, autorNombre: 'Laura Martínez', texto: 'Recuerden: la tarea de ecuaciones se entrega el viernes. Repasen los ejercicios 1 al 10.', createdAt: dt(-1, 8, 30) }, { id: 2, claseId: 1, autorNombre: 'Laura Martínez', texto: 'Subí la guía de repaso a Materiales. ¡Échenle un ojo antes del jueves!', createdAt: dt(0, 9, 15) }],
      2: [{ id: 3, claseId: 2, autorNombre: 'Laura Martínez', texto: 'El reporte del ciclo del agua se entrega el jueves, sin falta.', createdAt: dt(-2, 10) }],
    },
    materiales: {
      1: [
        { id: 1, claseId: 1, tipo: 'ARCHIVO', nombre: 'Guía_ecuaciones.pdf', unidad: 'Unidad 1', tema: 'Ecuaciones', url: '/uploads/guia-ecuaciones.pdf', mime: 'application/pdf', tamanoBytes: 120000, paginas: 3, duracionMin: null },
        { id: 2, claseId: 1, tipo: 'VIDEO', nombre: 'Ecuaciones paso a paso (video)', unidad: 'Unidad 1', tema: 'Ecuaciones', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', mime: 'video/mp4', tamanoBytes: null, paginas: null, duracionMin: 10 },
      ],
      2: [{ id: 3, claseId: 2, tipo: 'VIDEO', nombre: 'El ciclo del agua (video)', unidad: 'Unidad 2', tema: 'El ciclo del agua', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', mime: 'video/mp4', tamanoBytes: null, paginas: null, duracionMin: 1 }],
    },
    seq: { clase: 4, tarea: 4, entrega: 4, calificacion: 4, evento: 3, usuario: 7, mensaje: 10, material: 4, anuncio: 4 },
  }
}
function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const fixed = migrate(parsed)
      if (fixed) { localStorage.setItem(KEY, JSON.stringify(fixed)); return fixed }
      return parsed
    }
  } catch { /* seed de nuevo */ }
  const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s
}
// Migración v3: bases demo guardadas por versiones anteriores (v1) traían
// clases sin aula, horas, símbolo o icono, y a veces sin colecciones
// (entregas, anuncios...). Sin migrar, resumen() rompía (.map sobre
// undefined) y el Inicio quedaba vacío con error; y al editar una clase
// los campos faltantes se veían vacíos y al guardar se borraban (null).
// Solo se rellenan los campos vacíos de las clases semilla (id 1-3).
function migrate(db) {
  if (!db || typeof db !== 'object') return null
  const fresh = seed()
  let changed = false
  for (const key of ['usuarios', 'clases', 'tareas', 'entregas', 'calificaciones', 'eventos', 'conversaciones']) {
    if (!Array.isArray(db[key])) { db[key] = fresh[key]; changed = true }
  }
  for (const key of ['claseAlumnos', 'anuncios', 'materiales']) {
    if (!db[key] || typeof db[key] !== 'object') { db[key] = fresh[key]; changed = true }
  }
  if (!db.seq || typeof db.seq !== 'object') { db.seq = fresh.seq; changed = true }
  db.clases = db.clases.map((c) => {
    const base = fresh.clases.find((s) => s.id === c.id)
    if (!base || !c || typeof c !== 'object') return c
    const fixed = { ...c }
    for (const k of ['descripcion', 'diasSemana', 'horaInicio', 'horaFin', 'aula', 'tema', 'icono', 'codigoInvitacion', 'docenteNombre', 'estado', 'grupo', 'ciclo']) {
      if (fixed[k] === undefined || fixed[k] === null || fixed[k] === '') { fixed[k] = base[k]; changed = true }
    }
    if (fixed.estudiantes == null) { fixed.estudiantes = base.estudiantes; changed = true }
    if (fixed.tareasActivas == null) { fixed.tareasActivas = base.tareasActivas; changed = true }
    return fixed
  })
  // LIMPIEZA v7: las clases creadas en demo con el bug del body sin parsear
  // (v5/v6) quedaron SIN nombre, grupo ni horario y sin color elegido: no
  // se pueden recuperar porque esos datos nunca llegaron al mock. Se
  // eliminan (y sus conversaciones, anuncios, materiales, alumnos y
  // tareas huérfanas) para que el docente vuelva a crearlas bien.
  const antes = db.clases.length
  db.clases = (db.clases || []).filter((c) => c && typeof c === 'object' && String(c.nombre || '').trim())
  if (db.clases.length !== antes) changed = true
  const validIds = new Set(db.clases.map((c) => c.id))
  const validTareaIds = new Set((db.tareas || []).filter((t) => validIds.has(t.claseId)).map((t) => t.id))
  if ((db.conversaciones || []).length !== (db.conversaciones = (db.conversaciones || []).filter((cv) => validIds.has(cv.claseId))).length) changed = true
  for (const k of Object.keys(db.anuncios || {})) if (!validIds.has(Number(k))) { delete db.anuncios[k]; changed = true }
  for (const k of Object.keys(db.materiales || {})) if (!validIds.has(Number(k))) { delete db.materiales[k]; changed = true }
  for (const k of Object.keys(db.claseAlumnos || {})) if (!validIds.has(Number(k))) { delete db.claseAlumnos[k]; changed = true }
  const tAntes = (db.tareas || []).length
  db.tareas = (db.tareas || []).filter((t) => validIds.has(t.claseId))
  if (db.tareas.length !== tAntes) changed = true
  db.entregas = (db.entregas || []).filter((e) => validTareaIds.has(e.tareaId))
  db.calificaciones = (db.calificaciones || []).filter((c) => validTareaIds.has(c.tareaId))
  return changed ? db : db
}
function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* localStorage lleno (p. ej. varios archivos demo grandes): los datos siguen en memoria esta sesión */ } }
// Contenido de archivo demo guardado en localStorage como data URL, para
// que la vista previa sobreviva a recargar o cambiar de pantalla (v9: los
// objectURL en memoria se perdían al recargar y la vista previa siempre
// fallaba). Límite 2 MB por archivo: más grande no cabe de forma segura
// en localStorage junto al resto de datos demo.
const MAX_CONTENIDO_BYTES = 2 * 1024 * 1024
// File -> data URL sin FileReader (portable navegador/Node): arrayBuffer
// + base64 por trozos.
async function fileToDataUrl(file) {
  if (!file || file.size > MAX_CONTENIDO_BYTES) return null
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  return `data:${file.type || 'application/octet-stream'};base64,${btoa(bin)}`
}
// Clases visibles según el rol (v9, igual que el backend real
// ClaseService.listar: el docente ve solo las suyas, el estudiante solo
// aquellas en las que está inscrito — por código o porque el docente lo
// inscribió — y el admin todas). Antes el mock devolvía TODAS las clases
// a cualquiera, así que un estudiante veía clases sin código.
function clasesVisiblesPara(db, me) {
  if (me?.rol === 'DOCENTE') return (db.clases || []).filter((c) => c.docenteId === me.id)
  if (me?.rol === 'ESTUDIANTE') {
    const inscrito = new Set(Object.entries(db.claseAlumnos || {}).filter(([, als]) => (als || []).some((a) => a.id === me.id)).map(([cid]) => Number(cid)))
    return (db.clases || []).filter((c) => inscrito.has(c.id))
  }
  return [...(db.clases || [])]
}
function estaInscrito(db, claseId, userId) {
  return (db.claseAlumnos?.[claseId] || []).some((a) => a.id === userId)
}
// Adjuntos demo en memoria (objectURL): no se pueden guardar en
// localStorage, así que viven solo mientras la pestaña está abierta.
// Al recargar, la vista previa del adjunto demo ya no estará disponible.
const demoAttachments = new Map() // id -> { url, tipo, mime }
function tipoDeArchivo(file) {
  const type = file?.type || ''
  if (type.startsWith('image/')) return 'imagen'
  if (type.startsWith('audio/')) return 'audio'
  if (type.startsWith('video/')) return 'video'
  return 'archivo'
}
function withDemoAttachment(item) {
  // v9: primero el contenido persistido (data URL en localStorage, sobrevive
  // a recargar); si no hay, el objectURL en memoria de esta sesión.
  if (item?.adjuntoContenido) return { ...item, adjuntoUrl: item.adjuntoContenido, adjuntoTipo: item.adjuntoTipo, adjuntoMime: item.adjuntoMime }
  if (item?.contenido) return { ...item, adjuntoUrl: item.contenido, adjuntoTipo: item.adjuntoTipo, adjuntoMime: item.adjuntoMime }
  const a = demoAttachments.get(item.id)
  return a ? { ...item, adjuntoUrl: a.url, adjuntoTipo: a.tipo, adjuntoMime: a.mime } : item
}
// Vacía todos los datos demo (deja los 3 perfiles limpios) SIN cerrar sesión.
export function clearDemoData() { localStorage.setItem(KEY, JSON.stringify(seed())) }
// Carga la semilla de ejemplo (clases, tareas, mensajes y videos de la demo anterior).
export function loadExampleData() { localStorage.setItem(KEY, JSON.stringify(seedExample())) }
// Compatibilidad (v4): antes borraba también la sesión; en v5 vaciar no cierra sesión.
export function resetDemoData() { clearDemoData() }
// Promedio REAL de una lista de calificaciones {nota}: null si no hay
// ninguna (v8: nunca se inventa un 8.8/9.0 de ejemplo).
function promedioDe(list) {
  const notas = (list || []).map((c) => Number(c.nota)).filter((n) => !Number.isNaN(n))
  if (!notas.length) return null
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100
}
function csvCell(v) {
  if (v == null) return ''
  return `"${String(v).replace(/"/g, '""')}"`
}
function pageOf(list, params = {}) {
  const page = Number(params.page ?? 0), size = Number(params.size ?? 10)
  const search = (params.search || params.q || '').toLowerCase()
  let filtered = list
  if (search) filtered = list.filter((x) => JSON.stringify(x).toLowerCase().includes(search))
  if (params.filtro === 'pendientes') filtered = filtered.filter((x) => (x.entregasRecibidas ?? 0) < (x.entregasTotales ?? 0))
  const totalElements = filtered.length
  return { content: filtered.slice(page * size, page * size + size), totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)), number: page, size }
}
const pub = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, grupo: u.grupo ?? null, telefono: u.telefono ?? null, ciclo: 2026, avatar: u.avatar ?? null })
// Estado de una tarea según su fecha de activación (v7, igual que debe
// mandar el frontend al backend real: el backend NO deriva PROGRAMADA
// solo, usa el `estado` que recibe, con ACTIVA por defecto). Si la
// activación es futura y la activación automática está encendida, la
// tarea nace PROGRAMADA; si no, ACTIVA. Un estado explícito (p. ej.
// CERRADA) siempre se respeta.
function derivarEstadoTarea(body) {
  if (body?.estado === 'CERRADA' || body?.estado === 'PROGRAMADA') return body.estado
  const act = body?.fechaActivacion ? new Date(body.fechaActivacion) : null
  if (act && !Number.isNaN(act.getTime()) && act.getTime() > Date.now() && body?.activacionAutomatica !== false) return 'PROGRAMADA'
  return 'ACTIVA'
}
function sessionUser(db) {
  try {
    const raw = localStorage.getItem('aulix_session') ?? sessionStorage.getItem('aulix_session')
    const token = raw ? JSON.parse(raw)?.token : ''
    const m = String(token || '').match(/^demo-[a-z]+-(\d+)-/)
    return m ? db.usuarios.find((u) => u.id === Number(m[1])) ?? db.usuarios[2] : db.usuarios[2]
  } catch { return db.usuarios[2] }
}
// v9: el resumen respeta el rol (igual que el backend real
// DashboardService): el docente solo ve sus clases y sus entregas; el
// estudiante solo sus clases inscritas. Antes devolvía todas las clases
// y todas las tareas a cualquiera.
const resumen = (db, me) => {
  const clases = clasesVisiblesPara(db, me)
  const ids = new Set(clases.map((c) => c.id))
  return {
    clases,
    actividad: (db.entregas || []).filter((e) => { const t = db.tareas.find((x) => x.id === e.tareaId); return t && ids.has(t.claseId) }).map((e) => ({ id: e.id, iniciales: (e.estudianteNombre || '?').split(' ').slice(0, 2).map((p) => p[0]).join(''), tema: 'green', texto: `${e.estudianteNombre} entregó “${e.tareaTitulo}”.`, detalle: `${e.fechaEntrega}` })),
    proximasEntregas: (db.tareas || []).filter((t) => ids.has(t.claseId) && t.estado === 'ACTIVA' && t.fechaVencimiento && new Date(t.fechaVencimiento) > new Date()).sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento))).slice(0, 5),
  }
}
// Estado de una tarea para el estudiante actual (v9): se deriva de su
// entrega, igual que conMiEstado() del backend real. El mock guardaba
// miEstado en la tarea compartida y la calificación nunca lo actualizaba,
// así que tras calificar el alumno seguía viendo "entregada" sin nota.
function estadoParaEstudiante(db, tarea, estudianteId) {
  const e = (db.entregas || []).find((x) => x.tareaId === tarea.id && x.estudianteId === estudianteId)
  if (!e) return { miEstado: 'pendiente', miNota: null, miEntregaId: null }
  if (e.estado === 'CALIFICADA' || e.nota != null) return { miEstado: 'calificada', miNota: e.nota, miEntregaId: e.id }
  return { miEstado: 'entregada', miNota: null, miEntregaId: e.id }
}
export async function mockRequest(pathWithQuery, { method = 'GET', body: rawBody, params: extraParams } = {}) {
  await wait(250)
  // BUG CORREGIDO (v7): TODOS los llamantes mandan el body con
  // JSON.stringify (apiFetch), pero mockRequest lo trataba como objeto:
  // body?.nombre era undefined y {...body} esparcía los caracteres del
  // texto como claves numéricas. Por eso en demo las clases se creaban
  // sin nombre, sin grupo, sin horario y con el color predeterminado
  // (tema 'blue', icono 'book', símbolo 'Aa'), y las tareas programadas
  // perdían claseId (NaN) y fechas. Aquí se parsea el texto JSON.
  let body = rawBody
  if (typeof body === 'string' && body.trim()) {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const [path, qs] = String(pathWithQuery).split('?')
  const params = { ...(extraParams ?? {}) }
  if (qs) new URLSearchParams(qs).forEach((v, k) => { params[k] = v })
  const db = load()
  const seg = path.split('/').filter(Boolean)
  const me = sessionUser(db)
  // --- Auth ---
  if (path === '/auth/login' && method === 'POST') {
    const u = db.usuarios.find((x) => x.correo.toLowerCase() === String(body?.email || '').toLowerCase().trim())
    if (!u || u.password !== body?.password) throw new DemoError('Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.', 401, 'credentials')
    return { token: `demo-${u.rol.toLowerCase()}-${u.id}-${Date.now()}`, user: pub(u) }
  }
  if (path === '/auth/register' && method === 'POST') {
    if (db.usuarios.some((x) => x.correo.toLowerCase() === String(body?.email || '').toLowerCase())) throw new DemoError('Ese correo ya está registrado.', 400, 'validation')
    const rol = body.rol === 'ALUMNO' ? 'ESTUDIANTE' : (body.rol || 'ESTUDIANTE')
    const u = { id: db.seq.usuario++, nombre: body.nombre, correo: body.email, password: body.password, rol, grupo: body.grupo ?? null, telefono: body.telefono ?? null }
    db.usuarios.push(u); save(db)
    return { token: `demo-${rol.toLowerCase()}-${u.id}-${Date.now()}`, user: pub(u) }
  }
  if (path === '/auth/recuperar' && method === 'POST') return { message: `Te enviamos un enlace de recuperación a ${body?.email}. Revisa tu bandeja de entrada.` }
  if (path === '/auth/logout' && method === 'POST') return { message: 'Sesión cerrada.' }
  if (path === '/auth/me' && method === 'GET') return pub(me)
  if (path === '/auth/change-password' && method === 'POST') return { message: 'Contraseña actualizada.' }
  // --- Dashboard ---
  if (path === '/docente/resumen') return resumen(db, me)
  if (path === '/estudiante/resumen') {
    // v9: solo clases inscritas; los contadores se derivan de la entrega
    // real del alumno (pendiente/entregada/calificada); "próximas
    // entregas" solo trae tareas PENDIENTES con vencimiento futuro — antes
    // traía todas las ACTIVAS aunque ya estuvieran entregadas, y la
    // entregada sin calificar no contaba en ningún contador (Inicio: 0
    // pendientes, 0 calificados, 1 próximas). trabajosEntregados es un
    // campo extra del mock; el backend real no lo devuelve y el frontend
    // lo muestra solo si viene.
    const clases = clasesVisiblesPara(db, me)
    const ids = new Set(clases.map((c) => c.id))
    const visibles = db.tareas.filter((t) => ids.has(t.claseId) && t.estado === 'ACTIVA')
    const conEstado = visibles.map((t) => ({ ...t, ...estadoParaEstudiante(db, t, me.id) }))
    return {
      materias: clases, clases,
      tareasPendientes: conEstado.filter((t) => t.miEstado === 'pendiente').length,
      trabajosEntregados: conEstado.filter((t) => t.miEstado === 'entregada').length,
      trabajosCalificados: conEstado.filter((t) => t.miEstado === 'calificada').length,
      proximasEntregas: conEstado.filter((t) => t.miEstado === 'pendiente' && t.fechaVencimiento && new Date(t.fechaVencimiento) > new Date()).sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento))).slice(0, 5),
      anuncios: clases.flatMap((c) => (db.anuncios[c.id] || []).map((a) => ({ ...a, claseNombre: c.nombre }))),
    }
  }
  if (path === '/dashboard/resumen') return { ...resumen(db, me), totalClases: clasesVisiblesPara(db, me).length, tareasActivas: db.tareas.filter((t) => t.estado === 'ACTIVA').length, entregasPendientes: db.entregas.filter((e) => !e.nota).length, totalUsuarios: db.usuarios.length, promedio: promedioDe(db.calificaciones) }
  if (path === '/mensajes/sin-leer') return { totalSinLeer: db.conversaciones.reduce((a, c) => a + (c.sinLeer ?? 0), 0), total: db.conversaciones.reduce((a, c) => a + (c.sinLeer ?? 0), 0) }
  // --- Clases ---
  if (seg[0] === 'clases') {
    // v9 (bug 3): GET /clases filtra por rol, igual que el backend real
    // (ClaseService.listar: docente -> suyas, estudiante -> inscritas).
    if (seg.length === 1 && method === 'GET') { let list = clasesVisiblesPara(db, me); if (params.q) list = list.filter((c) => JSON.stringify(c).toLowerCase().includes(params.q.toLowerCase())); return list }
    if (seg.length === 1 && method === 'POST') { const c = { id: db.seq.clase++, ciclo: 2026, estudiantes: 0, tareasActivas: 0, tema: 'blue', icono: 'book', estado: 'EN_CURSO', codigoInvitacion: `CLS-${Date.now()}`, ...body, docenteId: me.id, docenteNombre: me.nombre }; db.clases.push(c); db.claseAlumnos[c.id] = []; save(db); return c }
    if (seg[1] === 'unirse' && method === 'POST') {
      const c = db.clases.find((x) => x.codigoInvitacion === body?.codigo)
      if (!c) throw new DemoError('Código de invitación inválido.', 404, 'not-found')
      // v8: unirse inscribe de verdad (antes solo devolvia la clase y el
      // alumno no quedaba en claseAlumnos, asi que /estudiante/tareas no
      // le mostraba nada de esa clase).
      db.claseAlumnos[c.id] = db.claseAlumnos[c.id] || []
      if (!db.claseAlumnos[c.id].some((a) => a.id === me.id)) {
        db.claseAlumnos[c.id].push({ id: me.id, nombre: me.nombre, correo: me.correo, grupo: me.grupo ?? null, avatar: me.avatar ?? null, entregasRecibidas: 0, entregasTotales: db.tareas.filter((t) => t.claseId === c.id).length, porCalificar: 0, promedio: null })
      }
      save(db)
      return c
    }
    const id = Number(seg[1])
    const clase = db.clases.find((x) => x.id === id)
    // v9 (bug 3): un estudiante solo puede leer una clase en la que está
    // inscrito, igual que exigirAcceso() del backend real (403 si no).
    if (clase && me?.rol === 'ESTUDIANTE' && method === 'GET' && !estaInscrito(db, id, me.id)) throw new DemoError('No estás inscrito en esta clase.', 403, 'server')
    // QA v8: resumen de calificaciones de la clase (si no, el GET generico
    // de abajo devolvia la clase en vez del resumen).
    if (seg[2] === 'calificaciones' && seg[3] === 'resumen' && method === 'GET') return { calificacionesTotales: db.calificaciones.length, promedioGeneral: promedioDe(db.calificaciones), porClase: [] }
    // QA v8: esta rama va ANTES que la lista de alumnos: si no, la lista
    // (Page) capturaba tambien /alumnos/{id}/entregas y el docente no veia
    // ninguna entrega al pulsar un alumno.
    if (seg[2] === 'alumnos' && seg[3] && seg[4] === 'entregas' && method === 'GET') return db.entregas.filter((e) => e.estudianteId === Number(seg[3]))
    if (seg[2] === 'alumnos' && method === 'GET') return pageOf(db.claseAlumnos[id] || [], params)
    if (seg[2] === 'materiales' && method === 'GET') return (db.materiales[id] || []).map(withDemoAttachment)
    if (seg[2] === 'materiales' && method === 'POST') {
      const file = body?.archivoFile
      const tipo = body?.tipo === 'VIDEO' ? 'VIDEO' : (file && tipoDeArchivo(file) === 'video' ? 'VIDEO' : 'ARCHIVO')
      // v9 (bug 1): el material subido se guarda como data URL persistida
      // (contenido), no solo como objectURL en memoria.
      const contenidoMat = file ? await fileToDataUrl(file) : null
      const m = { id: db.seq.material++, claseId: id, tipo, nombre: body?.nombre || file?.name || body?.url || 'Material', unidad: body?.unidad || null, tema: body?.tema || null, url: body?.url || null, mime: file?.type || null, tamanoBytes: file?.size ?? null, paginas: null, duracionMin: body?.duracionMin ? Number(body.duracionMin) : null, contenido: contenidoMat, adjuntoTipo: file ? tipoDeArchivo(file) : null, adjuntoMime: file?.type ?? null }
      if (file && !contenidoMat) demoAttachments.set(m.id, { url: URL.createObjectURL(file), tipo: tipoDeArchivo(file), mime: file.type })
      if (!file) m.url = tipo === 'VIDEO' ? body?.url : `/uploads/${m.nombre}`
      db.materiales[id] = [...(db.materiales[id] || []), m]; save(db)
      return withDemoAttachment(m)
    }
    if (seg[2] === 'anuncios' && method === 'GET') return db.anuncios[id] || []
    if (seg[2] === 'anuncios' && method === 'POST') {
      const a = { id: db.seq.anuncio++, claseId: id, autorNombre: me.nombre, texto: body?.texto, createdAt: new Date().toISOString() }
      db.anuncios[id] = [a, ...(db.anuncios[id] || [])]; save(db)
      return a
    }
    if (seg[2] === 'mis-tareas' && method === 'GET') return db.tareas.filter((t) => t.claseId === id && t.estado === 'ACTIVA').map((t) => ({ ...t, ...estadoParaEstudiante(db, t, me.id) }))
    if (seg[2] === 'mi-progreso' && method === 'GET') { const ts = db.tareas.filter((t) => t.claseId === id && t.estado === 'ACTIVA'); return { claseId: id, tareasTotales: ts.length, entregadas: ts.filter((t) => t.miEntregaId).length, calificadas: ts.filter((t) => t.miEstado === 'calificada').length, pendientes: ts.filter((t) => !t.miEntregaId).length, promedio: promedioDe(db.calificaciones.filter((c) => { const t = db.tareas.find((x) => x.id === c.tareaId); return t?.claseId === id && (c.estudianteId === me.id || c.estudianteNombre === me.nombre) })), porTarea: ts.map((t) => ({ tareaId: t.id, titulo: t.titulo, fechaVencimiento: t.fechaVencimiento, miEstado: t.miEstado, miNota: t.miNota })) } }
    if (!clase) throw new DemoError('No encontramos esa clase.', 404, 'not-found')
    if (method === 'GET') return clase
    if (method === 'PUT') { Object.assign(clase, body); save(db); return clase }
    if (method === 'DELETE') { db.clases = db.clases.filter((x) => x.id !== id); delete db.claseAlumnos[id]; save(db); return null }
  }
  // --- Tareas ---
  if (seg[0] === 'tareas' || (seg[0] === 'estudiante' && seg[1] === 'tareas')) {
    const listTareas = (soloInscrito = false) => {
      let list = db.tareas
      // v8 (bug 3): como el backend real (buscarVisiblesParaEstudiante),
      // el estudiante solo ve tareas de las clases en las que esta inscrito.
      if (soloInscrito) {
        const inscrito = new Set(Object.entries(db.claseAlumnos || {}).filter(([, als]) => (als || []).some((a) => a.id === me.id)).map(([cid]) => Number(cid)))
        // QA v8: como el backend real, el estudiante solo ve tareas ACTIVAS.
        list = list.filter((t) => inscrito.has(t.claseId) && t.estado === 'ACTIVA')
      }
      if (params.materiaId) list = list.filter((t) => t.claseId === Number(params.materiaId))
      if (params.estado) list = list.filter((t) => t.estado === params.estado)
      if (params.q) list = list.filter((t) => JSON.stringify(t).toLowerCase().includes(params.q.toLowerCase()))
      return list
    }
    if (path === '/estudiante/tareas' && method === 'GET') return listTareas(true).map((t) => ({ ...t, ...estadoParaEstudiante(db, t, me.id) }))
    if (seg[0] === 'tareas' && seg.length === 1 && method === 'GET') return listTareas()
    if (seg[0] === 'tareas' && seg.length === 1 && method === 'POST') { const clase = db.clases.find((c) => c.id === Number(body.claseId)); const t = { id: db.seq.tarea++, claseNombre: clase?.nombre || '', estado: 'ACTIVA', entregasRecibidas: 0, entregasTotales: 0, miEstado: 'pendiente', miNota: null, miEntregaId: null, ...body, claseId: Number(body.claseId), estado: derivarEstadoTarea(body) }; db.tareas.push(t); save(db); return t }
    const id = Number(seg[1])
    if (seg[2] === 'programacion' && method === 'PUT') { const t = db.tareas.find((x) => x.id === id); Object.assign(t, body); if (!body?.estado) t.estado = derivarEstadoTarea({ ...t, ...body }); save(db); return t }
    if (seg[2] === 'entregas' && method === 'POST') {
      const t = db.tareas.find((x) => x.id === id)
      // v9 (bug 1): el contenido del archivo se guarda como data URL
      // persistida (archivoContenido), no solo el nombre: así la vista
      // previa funciona tras recargar y al entrar el docente a calificar.
      // Sin esto la vista previa dependía de un objectURL en memoria.
      const contenido = body?.archivoFile ? await fileToDataUrl(body.archivoFile) : null
      const syncTarea = (entrega) => {
        if (!t) return
        t.miEntregaId = entrega.id
        // v9 (bug 2): la tarea pasa a ENTREGADA (y miNota se limpia al
        // re-entregar) para que Tareas, "Mis tareas" e Inicio la muestren
        // entregada y no pendiente.
        t.miEstado = 'entregada'; t.miNota = null
      }
      // QA v8: una entrega por alumno y tarea (igual que el backend real):
      // si ya existe, se actualiza la misma fila y vuelve a ENTREGADA.
      const previa = db.entregas.find((x) => x.tareaId === id && x.estudianteId === me.id)
      if (previa) {
        const estabaCalificada = previa.estado === 'CALIFICADA'
        previa.archivoNombre = body?.archivoNombre || previa.archivoNombre
        previa.archivoTipo = body?.archivoFile?.type || previa.archivoTipo
        previa.archivoTamanoBytes = body?.archivoFile?.size ?? previa.archivoTamanoBytes
        if (contenido) previa.archivoContenido = contenido
        if (body?.paginas != null) previa.paginas = body.paginas
        if (body?.comentario != null) previa.comentario = body.comentario
        previa.fechaEntrega = new Date().toISOString()
        previa.estado = 'ENTREGADA'; previa.nota = null; previa.comentarioCalificacion = null
        // La calificacion anterior queda sin efecto: el docente vuelve a calificar.
        db.calificaciones = db.calificaciones.filter((c) => c.entregaId !== previa.id)
        syncTarea(previa)
        // Si se re-entrega algo ya calificado, vuelve a "por calificar".
        if (estabaCalificada) {
          const fila = (db.claseAlumnos[t?.claseId] || []).find((a) => a.id === me.id)
          if (fila) fila.porCalificar = (fila.porCalificar ?? 0) + 1
        }
        save(db); return previa
      }
      const e = { id: db.seq.entrega++, tareaId: id, tareaTitulo: t?.titulo || '', estudianteId: me.id, estudianteNombre: me.nombre, archivoNombre: body?.archivoNombre || 'entrega.pdf', archivoRuta: null, archivoTipo: body?.archivoFile?.type || 'application/pdf', archivoTamanoBytes: body?.archivoFile?.size ?? 0, archivoContenido: contenido, paginas: body?.paginas ?? null, comentario: body?.comentario || '', fechaEntrega: new Date().toISOString(), estado: 'ENTREGADA', aTiempo: true, nota: null, comentarioCalificacion: null }; db.entregas.push(e); if (t) { t.entregasRecibidas += 1 } syncTarea(e)
      // Contador del alumno en la clase (lo que ve el docente).
      const fila = (db.claseAlumnos[t?.claseId] || []).find((a) => a.id === me.id)
      if (fila) { fila.entregasRecibidas = (fila.entregasRecibidas ?? 0) + 1; fila.porCalificar = (fila.porCalificar ?? 0) + 1 }
      save(db); return e
    }
    const tarea = db.tareas.find((x) => x.id === id)
    if (!tarea) throw new DemoError('No encontramos esa tarea.', 404, 'not-found')
    // v9 (bug 2): al estudiante se le devuelve el estado derivado de su
    // entrega (pendiente/entregada/calificada + nota), no el valor
    // guardado en la tarea compartida.
    if (method === 'GET') return me?.rol === 'ESTUDIANTE' ? { ...tarea, ...estadoParaEstudiante(db, tarea, me.id) } : tarea
    if (method === 'PUT') { Object.assign(tarea, body); if (!body?.estado && body?.fechaActivacion) tarea.estado = derivarEstadoTarea({ ...tarea, ...body }); save(db); return tarea }
    if (method === 'DELETE') { db.tareas = db.tareas.filter((x) => x.id !== id); save(db); return null }
  }
  // --- Entregas / calificaciones ---
  if (seg[0] === 'entregas') {
    const e = db.entregas.find((x) => x.id === Number(seg[1]))
    if (seg[2] === 'revision' && method === 'GET') return { nota: e?.nota ?? null, comentario: e?.comentarioCalificacion ?? null, fecha: e?.fechaEntrega }
    if (seg[2] === 'calificacion' && (method === 'POST' || method === 'PUT')) {
      const nota = Number(body?.nota)
      if (Number.isNaN(nota) || nota < 0 || nota > 10) throw new DemoError('La nota debe estar entre 0 y 10.', 422, 'validation')
      if (!e) throw new DemoError('No encontramos esa entrega.', 404, 'not-found')
      e.nota = nota; e.comentarioCalificacion = body?.comentario ?? ''; e.estado = 'CALIFICADA'
      const c = db.calificaciones.find((x) => x.entregaId === e.id) || { id: db.seq.calificacion++, entregaId: e.id, tareaId: e.tareaId, tareaTitulo: e.tareaTitulo, estudianteId: e.estudianteId, estudianteNombre: e.estudianteNombre, docenteNombre: me.nombre, fechaCalificacion: new Date().toISOString() }
      c.nota = nota; c.comentario = body?.comentario ?? ''
      if (!db.calificaciones.includes(c)) db.calificaciones.push(c)
      // v9 (bug 2): calificar actualiza también la tarea del alumno
      // (miEstado -> calificada, miNota) y el contador del alumno en la
      // clase. Antes solo cambiaba la entrega: el alumno seguía viendo
      // la tarea como "entregada" sin nota y el Inicio no sumaba el
      // trabajo calificado.
      const tCal = db.tareas.find((x) => x.id === e.tareaId)
      if (tCal) { tCal.miEstado = 'calificada'; tCal.miNota = nota; tCal.miEntregaId = e.id }
      const filaCal = (db.claseAlumnos[tCal?.claseId] || []).find((a) => a.id === e.estudianteId)
      if (filaCal) {
        filaCal.porCalificar = Math.max(0, (filaCal.porCalificar ?? 0) - 1)
        filaCal.promedio = promedioDe(db.calificaciones.filter((x) => { const t = db.tareas.find((y) => y.id === x.tareaId); return x.estudianteId === e.estudianteId && t?.claseId === tCal?.claseId }))
      }
      save(db); return c
    }
    // v9 (bug 1): en demo el archivo sí existe: es el contenido guardado
    // como data URL al entregar. Se devuelve para que apiFetchBlob lo
    // convierta en Blob y la vista previa lo muestre (imagen/PDF).
    if (seg[2] === 'archivo' && method === 'GET') {
      if (!e) throw new DemoError('No encontramos esa entrega.', 404, 'not-found')
      if (!e.archivoContenido) throw new DemoError('Esta entrega no guardó el contenido del archivo en modo demo (es de datos de ejemplo o supera 2 MB).', 404, 'not-found')
      return { contenido: e.archivoContenido, tipo: e.archivoTipo || 'application/octet-stream', nombre: e.archivoNombre }
    }
    if (!e) throw new DemoError('No encontramos esa entrega.', 404, 'not-found')
    if (method === 'GET') return e
  }
  if (path === '/calificaciones/resumen') return { calificacionesTotales: db.calificaciones.length, promedioGeneral: promedioDe(db.calificaciones), porClase: db.clases.map((c) => ({ claseId: c.id, claseNombre: c.nombre, entregasRecibidas: db.entregas.filter((e) => db.tareas.find((t) => t.id === e.tareaId)?.claseId === c.id).length, porCalificar: db.entregas.filter((e) => !e.nota && db.tareas.find((t) => t.id === e.tareaId)?.claseId === c.id).length })) }
  if (seg[0] === 'clases' && seg[2] === 'calificaciones' && seg[3] === 'resumen') return { calificacionesTotales: db.calificaciones.length, promedioGeneral: promedioDe(db.calificaciones), porClase: [] }
  if (path === '/estudiante/calificaciones') return db.calificaciones.filter((c) => c.estudianteId === me.id || c.estudianteNombre === me.nombre)
  if (path === '/calificaciones/exportar') {
    const filas = db.calificaciones.filter((c) => {
      const t = db.tareas.find((x) => x.id === c.tareaId)
      if (params.materiaId && t?.claseId !== Number(params.materiaId)) return false
      if (params.ciclo && t) { const cl = db.clases.find((x) => x.id === t.claseId); if (cl?.ciclo !== Number(params.ciclo)) return false }
      return true
    })
    let csv = 'alumno,correo,tarea,clase,nota,comentario,fecha\n'
    for (const c of filas) {
      const t = db.tareas.find((x) => x.id === c.tareaId)
      const cl = t ? db.clases.find((x) => x.id === t.claseId) : null
      csv += [csvCell(c.estudianteNombre), csvCell(db.usuarios.find((u) => u.id === c.estudianteId)?.correo ?? ''), csvCell(t?.titulo ?? c.tareaTitulo), csvCell(cl?.nombre ?? ''), c.nota, csvCell(c.comentario), c.fechaCalificacion].join(',') + '\n'
    }
    return csv
  }
  if (seg[0] === 'calificaciones' && method === 'GET') return db.calificaciones
  // --- Mensajes ---
  if (seg[0] === 'mensajes') {
    if (path === '/mensajes/conversaciones' && method === 'GET') return clasesVisiblesPara(db, me).map((cl) => {
      const ex = db.conversaciones.find((c) => c.claseId === cl.id)
      if (ex) { const { mensajes, ...c } = ex; return c }
      return { claseId: cl.id, claseNombre: cl.nombre, grupo: cl.grupo, ultimoMensaje: null, sinLeer: 0 }
    })
    const claseId = Number(seg[2])
    const conv = db.conversaciones.find((c) => c.claseId === claseId)
    if (seg[3] === 'leido' && method === 'POST') { if (conv) conv.sinLeer = 0; save(db); return { message: 'Marcado como leído.' } }
    if (seg[3] === 'mensajes' && method === 'GET') { const lista = [...(conv?.mensajes ?? [])].reverse().map(withDemoAttachment); const pg = pageOf(lista, params); pg.content = pg.content.map(withDemoAttachment); return pg }
    if (seg[3] === 'mensajes' && method === 'POST') {
      const file = body?.adjuntoFile
      // v9 (bug 1): el adjunto se guarda como data URL persistida
      // (adjuntoContenido), no solo como objectURL en memoria: la imagen
      // se sigue viendo tras recargar o cambiar de pantalla.
      const contenidoAdjunto = file ? await fileToDataUrl(file) : null
      const m = { id: db.seq.mensaje++, conversacionId: claseId, autorId: me.id, autorNombre: me.nombre, autorAvatar: null, texto: body?.texto || '', fechaEnvio: new Date().toISOString(), adjuntoNombre: body?.adjuntoNombre ?? null, adjuntoRuta: null, adjuntoTamanoBytes: file?.size ?? null, adjuntoTipo: file ? tipoDeArchivo(file) : null, adjuntoMime: file?.type ?? null, adjuntoContenido: contenidoAdjunto }
      if (file && !contenidoAdjunto) demoAttachments.set(m.id, { url: URL.createObjectURL(file), tipo: tipoDeArchivo(file), mime: file.type })
      let convMut = conv
      if (!convMut) { const cl = db.clases.find((c) => c.id === claseId); convMut = { claseId, claseNombre: cl?.nombre || 'Clase', grupo: cl?.grupo || '', ultimoMensaje: null, sinLeer: 0, mensajes: [] }; db.conversaciones.push(convMut) }
      convMut.mensajes.push(m); convMut.ultimoMensaje = { autorNombre: me.nombre, texto: m.texto || (/\.webm$|\.mp3$|\.wav$|\.ogg$|\.m4a$/i.test(m.adjuntoNombre || '') ? 'Nota de voz' : 'Archivo adjunto') }; save(db)
      return withDemoAttachment(m)
    }
    if (seg[3] === 'archivos' && method === 'GET') return []
  }
  // --- Calendario ---
  // El mock antes devolvía solo db.eventos (vacío en la semilla limpia),
  // así que una tarea programada nunca aparecía en el Calendario. Ahora
  // se derivan los eventos de las tareas (activación + vencimiento),
  // igual que hace el backend real (CalendarioService), filtrados por mes.
  if (path === '/calendario' || path === '/estudiante/calendario') {
    const mes = params.mes || ''
    const evs = [...(db.eventos || [])]
    // v9 (bug 3): el calendario solo muestra tareas de clases visibles
    // para el usuario (inscrito / propias), no de todas las clases.
    const visiblesCal = new Set(clasesVisiblesPara(db, me).map((c) => c.id))
    for (const t of db.tareas || []) {
      if (!visiblesCal.has(t.claseId)) continue
      const cl = db.clases.find((c) => c.id === t.claseId)
      if (t.fechaActivacion) evs.push({ titulo: t.titulo, fecha: t.fechaActivacion, tipo: 'activacion', tareaId: t.id, claseId: t.claseId, claseNombre: cl?.nombre || t.claseNombre || '', aula: cl?.aula || '' })
      if (t.fechaVencimiento) evs.push({ titulo: t.titulo, fecha: t.fechaVencimiento, tipo: 'vencimiento', tareaId: t.id, claseId: t.claseId, claseNombre: cl?.nombre || t.claseNombre || '', aula: cl?.aula || '' })
    }
    const filtrados = mes ? evs.filter((e) => String(e.fecha || '').startsWith(mes)) : evs
    filtrados.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    return { eventos: filtrados }
  }
  // --- Usuarios (solo demo: el backend real NO tiene /api/usuarios) ---
  if (seg[0] === 'usuarios') {
    if (seg.length === 1 && method === 'GET') return pageOf(db.usuarios.map(pub), params)
    if (seg.length === 1 && method === 'POST') { const u = { id: db.seq.usuario++, password: 'Demo123!', grupo: body.grupo ?? null, ...body }; db.usuarios.push(u); save(db); return pub(u) }
    const u = db.usuarios.find((x) => x.id === Number(seg[1]))
    if (!u) throw new DemoError('No encontramos ese usuario.', 404, 'not-found')
    if (method === 'GET') return pub(u)
    if (method === 'PUT') { Object.assign(u, body); save(db); return pub(u) }
    if (method === 'DELETE') { db.usuarios = db.usuarios.filter((x) => x.id !== Number(seg[1])); save(db); return null }
  }
  throw new DemoError('Esa ruta todavía no está implementada en el backend.', 404, 'not-found')
}
