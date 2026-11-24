// authService.js — ADAPTADO al backend Spring Boot de AULIX.
// Copiar a frontend/src/services/authService.js (reemplaza el servicio temporal).
// El login ya NO usa username: envía { email, password } y recibe { token, user }.

// VITE_API_URL es la base de la API (http://localhost:8106/api, SIN /auth).
// BUG CORREGIDO: apiFetch tenía 'http://localhost:8106/api' hardcodeado; ahora
// usa esta misma base, así que cambiar VITE_API_URL cambia login y apiFetch.
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8106/api').replace(/\/$/, '')
const API_URL = `${API_BASE}/auth`

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
      'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.',
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
  const data = await post('/login', { email, password })
  return { token: data.token, user: data.user }
}

/** Inicio de sesión con Google: envía el ID token de Google Identity
 *  Services y recibe { token, user } igual que el login normal. */
export async function loginWithGoogle(idToken) {
  const data = await post('/google', { idToken })
  return { token: data.token, user: data.user }
}

export async function register({ nombre, email, password, rol, grupo }) {
  const data = await post('/register', { nombre, email, password, rol, grupo })
  return { token: data.token, user: data.user }
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

/** Llamada autenticada genérica para los demás servicios (classService, etc.). */
export async function apiFetch(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
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
  return response.json()
}

/** Llamada autenticada con FormData (subida de archivos). No se pone
 *  Content-Type: el navegador lo genera con el boundary del multipart. */
export async function apiFetchForm(path, formData, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'POST',
    body: formData,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
  })
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
  return response.json()
}

/** Descarga autenticada (archivos de entregas y adjuntos de mensajes).
 *  No se puede usar un <a href> directo: el navegador no enviaría el
 *  Bearer y el backend devolvería 401. */
export async function apiDownload(path, filename) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) {
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
 *  descarga: el llamador decide si lo muestra en un <iframe> o <img>. */
export async function apiFetchBlob(path) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (response.status === 401) {
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
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
  })
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
