// authService.js — ADAPTADO al backend Spring Boot de AULIX.
// Copiar a frontend/src/services/authService.js (reemplaza el servicio temporal).
// El login ya NO usa username: envía { email, password } y recibe { token, user }.

// VITE_API_URL es la base de la API (http://localhost:8106/api, SIN /auth).
// BUG CORREGIDO: apiFetch tenía 'http://localhost:8106/api' hardcodeado; ahora
// usa esta misma base, así que cambiar VITE_API_URL cambia login y apiFetch.
//
// MODO DEMO (mezcla 2026-11-23): VITE_DEMO_MODE=true usa mockApi.js sin red.
// Si es false y el backend no responde, apiFetch/login caen al demo cuando
// VITE_DEMO_FALLBACK no es 'false', para que la demo en vivo no se caiga.
// La UI avisa con el banner de DemoBanner (services/api.js: isDemo()).
import { mockRequest } from './mockApi'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
// OPT-IN: solo se activa con VITE_DEMO_FALLBACK=true. Antes estaba activo por
// defecto y, si el backend no respondía, el login y los datos caían en
// silencio al demo: por eso "solo entraban usuarios demo" y las tareas /
// el dashboard salían en 0 (se leía el mock, no el backend).
export const DEMO_FALLBACK = import.meta.env.VITE_DEMO_FALLBACK === 'true'
const FALLBACK_KEY = 'aulix_demo_fallback'
// Si el backend no responde y caemos al demo, se marca para que la UI
// muestre el banner de demo (isDemo() en services/api.js lo lee). Se
// limpia en cuanto una peticion real vuelve a funcionar: nunca se queda
// pegado mostrando datos demo como si fueran reales.
export function marcarFallbackDemo() { try { sessionStorage.setItem(FALLBACK_KEY, '1') } catch { /* sin storage */ } }
export function limpiarFallbackDemo() { try { sessionStorage.removeItem(FALLBACK_KEY) } catch { /* sin storage */ } }
const normalizeRol = (rol) => (rol === 'ALUMNO' ? 'ESTUDIANTE' : rol)
function parsePath(path) {
  const [pp, qs] = String(path).split('?')
  const params = {}
  if (qs) new URLSearchParams(qs).forEach((v, k) => { params[k] = v })
  return { p: pp, params }
}
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8106/api').replace(/\/$/, '')
const API_URL = `${API_BASE}/auth`

/** Sesión inválida (token vencido, o token demo con el backend real): se borra
 *  y se manda al login. Sin esto la app seguía "logueada" con un token malo y
 *  todas las pantallas mostraban 0 o errores. */
export function cerrarSesionExpirada() {
  try { localStorage.removeItem('aulix_session'); sessionStorage.removeItem('aulix_session') } catch { /* sin storage */ }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login?expirada=1')
  }
}

export class AuthError extends Error {
  constructor(message, type = 'credentials') {
    super(message)
    this.type = type // 'credentials' | 'network' | 'server'
  }
}

async function post(path, body) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AuthError(
      `No pudimos conectar con el servidor (${API_BASE}). Verifica que el backend esté encendido y que abriste la app en http://localhost:5173.`,
      'network',
    )
  }

  if (response.status === 400 || response.status === 401) {
    const data = await response.json().catch(() => null)
    const err = new AuthError(data?.error ?? 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.')
    err.status = response.status
    err.detalles = data?.detalles ?? null
    throw err
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const err = new AuthError(data?.error ?? 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.', 'server')
    err.status = response.status
    err.detalles = data?.detalles ?? null
    throw err
  }
  return response.json()
}

/** El backend devuelve { token, user: { id, nombre, correo, rol, grupo, avatar } }. */
export async function login({ email, password }) {
  if (DEMO_MODE) {
    const data = await mockRequest('/auth/login', { method: 'POST', body: { email, password } })
    return { token: data.token, user: { ...data.user, rol: normalizeRol(data.user.rol) } }
  }
  try {
    const data = await post('/login', { email, password })
    return { token: data.token, user: { ...data.user, rol: normalizeRol(data.user.rol) } }
  } catch (err) {
    if (DEMO_FALLBACK && err?.type === 'network') {
      const data = await mockRequest('/auth/login', { method: 'POST', body: { email, password } })
      return { token: data.token, user: { ...data.user, rol: normalizeRol(data.user.rol) } }
    }
    throw err
  }
}

/** Inicio de sesión con Google: envía el ID token de Google Identity
 *  Services y recibe { token, user } igual que el login normal. */
export async function loginWithGoogle(idToken) {
  const data = await post('/google', { idToken })
  return { token: data.token, user: data.user }
}

export async function register({ nombre, email, password, rol, telefono }) {
  const rolReal = normalizeRol(rol)
  if (DEMO_MODE) {
    const data = await mockRequest('/auth/register', { method: 'POST', body: { nombre, email, password, rol: rolReal, telefono } })
    return { token: data.token, user: { ...data.user, rol: normalizeRol(data.user.rol) } }
  }
  try {
    const data = await post('/register', { nombre, email, password, rol: rolReal, telefono })
    return { token: data.token, user: { ...data.user, rol: normalizeRol(data.user.rol) } }
  } catch (err) {
    if (DEMO_FALLBACK && err?.type === 'network') {
      const data = await mockRequest('/auth/register', { method: 'POST', body: { nombre, email, password, rol: rolReal, telefono } })
      return { token: data.token, user: { ...data.user, rol: normalizeRol(data.user.rol) } }
    }
    throw err
  }
}

/** Recuperar contraseña: el backend real NO tiene endpoint (fuera de
 *  alcance). En demo simula el envío; en real lanza error claro. */
export async function recuperarPassword(email) {
  if (DEMO_MODE) return mockRequest('/auth/recuperar', { method: 'POST', body: { email } })
  throw new AuthError('La recuperación de contraseña no está implementada en el backend. Pídele a tu docente que te ayude a restablecerla.', 'server')
}

/** Sesión guardada por AuthContext en 'aulix_session' (localStorage o sessionStorage). */
export function getSession() {
  try {
    const raw = localStorage.getItem('aulix_session') ?? sessionStorage.getItem('aulix_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getToken() {
  return getSession()?.token ?? null
}

/** Llamada autenticada genérica para los demás servicios (classService, etc.).
 *  BUG CORREGIDO (v3): con una sesión demo (token "demo-...") el backend real
 *  rechaza el token con 401, y antes eso dejaba las páginas vacías con
 *  error aunque el fallback demo estaba activado (solo se caía al demo en
 *  error de red). Ahora, con sesión demo y DEMO_FALLBACK, cualquier error
 *  del backend (401, 404, 500 o respuesta no-JSON) cae al mock demo. */
export async function apiFetch(path, options = {}) {
  if (DEMO_MODE) {
    const { p, params } = parsePath(path)
    return mockRequest(p, { ...options, params })
  }
  const token = getToken()
  const esDemo = String(token || '').startsWith('demo-')
  const useMock = async () => {
    marcarFallbackDemo()
    const { p, params } = parsePath(path)
    return mockRequest(p, { ...options, params })
  }
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    })
  } catch {
    if (DEMO_FALLBACK) return useMock()
    throw new AuthError(`No pudimos conectar con el servidor (${API_BASE}). Verifica que el backend esté encendido y que abriste la app en http://localhost:5173.`, 'network')
  }
  if (response.status === 204) return null
  if (response.status === 401) {
    if (DEMO_FALLBACK && esDemo) return useMock()
    cerrarSesionExpirada()
    throw new AuthError('Tu sesión expiró. Inicia sesión de nuevo.')
  }
  if (!response.ok) {
    if (DEMO_FALLBACK && esDemo) return useMock()
    const data = await response.json().catch(() => null)
    const err = new AuthError(data?.error ?? 'El servidor tuvo un problema.', 'server')
    err.status = response.status
    err.detalles = data?.detalles ?? null
    throw err
  }
  limpiarFallbackDemo()
  try {
    return await response.json()
  } catch {
    if (DEMO_FALLBACK && esDemo) return useMock()
    throw new AuthError('El servidor devolvió una respuesta que no pudimos leer.', 'server')
  }
}

/** Llamada autenticada con FormData (subida de archivos). No se pone
 *  Content-Type: el navegador lo genera con el boundary del multipart. */
export async function apiFetchForm(path, formData, options = {}) {
  if (DEMO_MODE) {
    const body = {}
    if (formData && typeof formData.forEach === 'function') {
      formData.forEach((v, k) => { body[k] = v instanceof File ? v.name : v; if (v instanceof File) body[`${k}File`] = v })
      if (body.archivo) body.archivoNombre = body.archivo
      if (body.adjunto) body.adjuntoNombre = body.adjunto
    }
    const { p, params } = parsePath(path)
    return mockRequest(p, { method: options.method ?? 'POST', body, params })
  }
  const token = getToken()
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'POST',
    body: formData,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
  })
  } catch (err) {
    if (err instanceof AuthError) throw err
    if (DEMO_FALLBACK) {
      marcarFallbackDemo()
      const body = {}
      if (formData && typeof formData.forEach === 'function') {
        formData.forEach((v, k) => { body[k] = v instanceof File ? v.name : v; if (v instanceof File) body[`${k}File`] = v })
        if (body.archivo) body.archivoNombre = body.archivo
        if (body.adjunto) body.adjuntoNombre = body.adjunto
      }
      const { p, params } = parsePath(path)
      return mockRequest(p, { method: options.method ?? 'POST', body, params })
    }
    throw new AuthError(`No pudimos conectar con el servidor (${API_BASE}). Verifica que el backend esté encendido y que abriste la app en http://localhost:5173.`, 'network')
  }
  if (response.status === 401) {
    throw new AuthError('Tu sesión expiró. Inicia sesión de nuevo.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const err = new AuthError(data?.error ?? 'El servidor tuvo un problema.', 'server')
    err.status = response.status
    err.detalles = data?.detalles ?? null
    throw err
  }
  if (response.status === 204) return null
  limpiarFallbackDemo()
  return response.json()
}

/** Descarga autenticada (archivos de entregas y adjuntos de mensajes).
 *  No se puede usar un <a href> directo: el navegador no enviaría el
 *  Bearer y el backend devolvería 401.
 *  v9 (bug 1): en modo demo SÍ hay archivo: el contenido guardado como
 *  data URL al entregar/subir. Antes lanzaba error siempre en demo. */
async function downloadFromMock(path, filename) {
  const data = await mockRequest(path, { method: 'GET' })
  const contenido = data?.contenido ?? data?.adjuntoContenido
  if (!contenido) throw new AuthError('En modo demo no hay archivo guardado para descargar.', 'server')
  const blob = await dataUrlToBlob(contenido)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || data?.nombre || 'archivo'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((r) => r.blob())
}

export async function apiDownload(path, filename) {
  if (DEMO_MODE) return downloadFromMock(path, filename)
  const token = getToken()
  const esDemo = String(token || '').startsWith('demo-')
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  } catch {
    if (DEMO_FALLBACK && esDemo) return downloadFromMock(path, filename)
    throw new AuthError(`No pudimos conectar con el servidor (${API_BASE}). Verifica que el backend esté encendido y que abriste la app en http://localhost:5173.`, 'network')
  }
  if (response.status === 401) {
    if (DEMO_FALLBACK && esDemo) return downloadFromMock(path, filename)
    throw new AuthError('Tu sesión expiró. Inicia sesión de nuevo.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new AuthError(data?.error ?? 'No se pudo descargar el archivo.', 'server')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'archivo'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Llamada autenticada que devuelve el cuerpo como Blob (vista previa de
 *  archivos: PDF o imagen). Igual que apiDownload, pero sin forzar la
 *  descarga: el llamador decide si lo muestra en un <iframe> o <img>.
 *  v9 (bug 1): en modo demo SÍ hay archivo (data URL guardada al
 *  entregar); antes lanzaba error siempre y la vista previa del docente
 *  fallaba con "No se pudo cargar la vista previa". Con sesión demo y
 *  backend sin respuesta también cae al mock. */
export async function apiFetchBlob(path) {
  if (DEMO_MODE) {
    const data = await mockRequest(path, { method: 'GET' })
    if (!data?.contenido) throw new AuthError('En modo demo no hay archivo guardado para previsualizar.', 'server')
    return dataUrlToBlob(data.contenido)
  }
  const token = getToken()
  const esDemo = String(token || '').startsWith('demo-')
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  } catch {
    if (DEMO_FALLBACK && esDemo) {
      marcarFallbackDemo()
      const data = await mockRequest(path, { method: 'GET' })
      if (!data?.contenido) throw new AuthError('En modo demo no hay archivo guardado para previsualizar.', 'server')
      return dataUrlToBlob(data.contenido)
    }
    throw new AuthError(`No pudimos conectar con el servidor (${API_BASE}). Verifica que el backend esté encendido y que abriste la app en http://localhost:5173.`, 'network')
  }
  if (response.status === 401) {
    if (DEMO_FALLBACK && esDemo) {
      marcarFallbackDemo()
      const data = await mockRequest(path, { method: 'GET' })
      if (!data?.contenido) throw new AuthError('En modo demo no hay archivo guardado para previsualizar.', 'server')
      return dataUrlToBlob(data.contenido)
    }
    throw new AuthError('Tu sesión expiró. Inicia sesión de nuevo.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new AuthError(data?.error ?? 'No se pudo cargar el archivo.', 'server')
  }
  return response.blob()
}

/** Llamada autenticada que devuelve texto plano (p. ej. el CSV de
 *  GET /api/calificaciones/exportar). */
export async function apiFetchText(path, options = {}) {
  if (DEMO_MODE) {
    const { p, params } = parsePath(path)
    const data = await mockRequest(p, { ...options, params })
    return typeof data === 'string' ? data : JSON.stringify(data)
  }
  const token = getToken()
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
    })
  } catch {
    if (DEMO_FALLBACK) {
      marcarFallbackDemo()
      const { p, params } = parsePath(path)
      const data = await mockRequest(p, { ...options, params })
      return typeof data === 'string' ? data : JSON.stringify(data)
    }
    throw new AuthError(`No pudimos conectar con el servidor (${API_BASE}). Verifica que el backend esté encendido y que abriste la app en http://localhost:5173.`, 'network')
  }
  limpiarFallbackDemo()
  if (response.status === 401) {
    throw new AuthError('Tu sesión expiró. Inicia sesión de nuevo.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const err = new AuthError(data?.error ?? 'El servidor tuvo un problema.', 'server')
    err.status = response.status
    throw err
  }
  return response.text()
}
