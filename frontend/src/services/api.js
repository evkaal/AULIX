// Capa de API del frontend (compatibilidad + modo demo).
// - Base URL: VITE_API_URL (por defecto http://localhost:8106/api, el
//   backend real de AULIX, puerto 8106).
// - VITE_DEMO_MODE=true: NO se hace ninguna petición de red; todo lo
//   resuelve mockApi.js (datos en localStorage).
// - Por defecto (VITE_DEMO_MODE=false) se usa el backend real; si el
//   backend no responde (error de red) y VITE_DEMO_FALLBACK no es
//   'false', se cae al modo demo para que la demo en vivo no se caiga.
//   En ese caso la sesión pasa a ser demo y la UI muestra el banner.
// - JWT: Authorization: Bearer <token> en cada petición protegida.
// - Paginación: el backend real solo pagina /clases/{id}/alumnos y
//   /mensajes/.../mensajes (Page {content,totalElements,totalPages});
//   el resto devuelve la lista completa. normalizePage() acepta ambas.
import { mockRequest } from './mockApi'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8106/api').replace(/\/$/, '')
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export const DEMO_FALLBACK = import.meta.env.VITE_DEMO_FALLBACK === 'true'
export const isDemo = () => {
  if (DEMO_MODE) return true
  try {
    // Caida al demo por backend caido (la marca authService con
    // marcarFallbackDemo()): tambien es demo aunque el token sea real.
    if (sessionStorage.getItem('aulix_demo_fallback') === '1') return true
  } catch { /* sin storage */ }
  try {
    const raw = localStorage.getItem('aulix_session') ?? sessionStorage.getItem('aulix_session')
    return String(JSON.parse(raw)?.token || '').startsWith('demo-')
  } catch { return false }
}
export const isFallback = () => {
  try { return sessionStorage.getItem('aulix_demo_fallback') === '1' } catch { return false }
}
const SESSION_KEY = 'aulix_session'
export function getToken() {
  try { const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw)?.token ?? null : null } catch { return null }
}
export class ApiError extends Error {
  constructor(message, status = 0, type = 'server') { super(message); this.status = status; this.type = type }
}
function toApiError(status, body) {
  const msg = body?.error || body?.message
  if (status === 401) return new ApiError(msg || 'Tu sesión expiró. Inicia sesión de nuevo.', 401, 'auth')
  if (status === 403) return new ApiError(msg || 'No tienes permiso para hacer eso.', 403, 'forbidden')
  if (status === 404) return new ApiError(msg || 'No encontramos ese recurso.', 404, 'not-found')
  if (status === 400 || status === 422) return new ApiError(msg || 'Revisa los datos del formulario.', status, 'validation')
  return new ApiError(msg || 'El servidor tuvo un problema. Inténtalo de nuevo.', status, 'server')
}
async function realRequest(path, { method = 'GET', body, params } = {}) {
  const url = new URL(API_URL + path)
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v) })
  let res
  try {
    res = await fetch(url.toString(), { method, headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  } catch { throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión o que el backend esté encendido.', 0, 'network') }
  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw toApiError(res.status, data)
  return data
}
export async function apiRequest(path, options = {}) {
  if (DEMO_MODE) return mockRequest(path, options)
  try { return await realRequest(path, options) }
  catch (e) { if (e.type === 'network' && DEMO_FALLBACK) return mockRequest(path, options); throw e }
}
export const apiGet = (path, params) => apiRequest(path, { method: 'GET', params })
export const apiPost = (path, body) => apiRequest(path, { method: 'POST', body })
export const apiPut = (path, body) => apiRequest(path, { method: 'PUT', body })
export const apiDelete = (path) => apiRequest(path, { method: 'DELETE' })
export function normalizePage(data, page = 0, size = 10) {
  if (Array.isArray(data)) return { items: data, totalElements: data.length, totalPages: 1, page: 0, size: data.length || size }
  return { items: data?.content ?? data?.items ?? [], totalElements: data?.totalElements ?? data?.total ?? (data?.content?.length ?? 0), totalPages: data?.totalPages ?? 1, page: data?.number ?? page, size: data?.size ?? size }
}
