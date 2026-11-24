import { apiFetch } from './authService'

// Clases. Backend real (ver backend/README.md):
// GET  /api/clases?ciclo=&q=            -> lista completa (NO pagina)
// GET  /api/clases/{id}  POST /api/clases  PUT /api/clases/{id}  DELETE /api/clases/{id}
// POST /api/clases/unirse {codigo}
// GET  /api/clases/{id}/alumnos?filtro=&q=&page=&size=  -> Page (sí pagina)
// GET  /api/clases/{id}/mis-tareas | /api/clases/{id}/mi-progreso (estudiante)
// GET  /api/docente/resumen | /api/estudiante/resumen (Inicio)
export { getResumenInicio, getResumenDocente, getResumenEstudiante } from './classService'
export async function listarClases({ ciclo = '', q = '' } = {}) {
  const params = new URLSearchParams()
  if (ciclo) params.set('ciclo', ciclo)
  if (q.trim()) params.set('q', q.trim())
  const data = await apiFetch(`/clases?${params}`)
  return Array.isArray(data) ? data : []
}
export async function getClase(id) { return apiFetch(`/clases/${id}`) }
export async function crearClase(body) { return apiFetch('/clases', { method: 'POST', body: JSON.stringify(body) }) }
export async function actualizarClase(id, body) { return apiFetch(`/clases/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function eliminarClase(id) { return apiFetch(`/clases/${id}`, { method: 'DELETE' }) }
export async function unirseClase(codigo) { return apiFetch('/clases/unirse', { method: 'POST', body: JSON.stringify({ codigo }) }) }
export async function listarAlumnosClase(id, { page = 0, size = 8, filtro = '', q = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filtro) params.set('filtro', filtro)
  if (q.trim()) params.set('q', q.trim())
  return apiFetch(`/clases/${id}/alumnos?${params}`)
}
export async function getMisTareasClase(id) { return apiFetch(`/clases/${id}/mis-tareas`) }
export async function getMiProgresoClase(id) { return apiFetch(`/clases/${id}/mi-progreso`) }
