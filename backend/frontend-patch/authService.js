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
    throw new AuthError(data?.error ?? 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.')
  }
  if (!response.ok) {
    throw new AuthError('El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.', 'server')
  }
  return response.json()
}

/** El backend devuelve { token, user: { id, nombre, correo, rol, grupo, avatar } }. */
export async function login({ email, password }) {
  const data = await post('/login', { email, password })
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
    throw new AuthError(data?.error ?? 'El servidor tuvo un problema.', 'server')
  }
  return response.json()
}
