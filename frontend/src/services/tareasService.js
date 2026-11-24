import { apiFetch, apiFetchForm } from './authService'

// Tareas y entregas. Backend real:
// GET  /api/tareas?materiaId=&estado=&q= (docente, lista completa)
// GET  /api/estudiante/tareas?estado=&materiaId=&q= (estudiante)
// POST /api/tareas {claseId,titulo,descripcion,instrucciones,fechaActivacion,fechaVencimiento,activacionAutomatica,estado}
// PUT  /api/tareas/{id}  DELETE /api/tareas/{id}  GET /api/tareas/{id}
// PUT  /api/tareas/{id}/programacion {fechaActivacion,fechaVencimiento,activacionAutomatica,estado}
// POST /api/tareas/{id}/entregas (multipart: archivo + comentario + paginas) -> 201
// GET  /api/entregas/{id} | /api/entregas/{id}/archivo | /api/entregas/{id}/revision
export async function listarTareas({ materiaId = '', estado = '', q = '', esDocente = true } = {}) {
  const params = new URLSearchParams()
  if (materiaId) params.set('materiaId', materiaId)
  if (estado) params.set('estado', estado)
  if (q.trim()) params.set('q', q.trim())
  const data = await apiFetch(esDocente ? `/tareas?${params}` : `/estudiante/tareas?${params}`)
  return Array.isArray(data) ? data : []
}
export async function getTarea(id) { return apiFetch(`/tareas/${id}`) }
export async function crearTarea(body) { return apiFetch('/tareas', { method: 'POST', body: JSON.stringify(body) }) }
export async function actualizarTarea(id, body) { return apiFetch(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function eliminarTarea(id) { return apiFetch(`/tareas/${id}`, { method: 'DELETE' }) }
export async function programarTarea(id, body) { return apiFetch(`/tareas/${id}/programacion`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function entregarTarea(id, { archivo, comentario = '', paginas = '' }) {
  const fd = new FormData()
  if (archivo) fd.append('archivo', archivo)
  if (comentario.trim()) fd.append('comentario', comentario.trim())
  if (paginas) fd.append('paginas', paginas)
  return apiFetchForm(`/tareas/${id}/entregas`, fd)
}
export async function getEntrega(id) { return apiFetch(`/entregas/${id}`) }
export async function getRevisionEntrega(id) { return apiFetch(`/entregas/${id}/revision`) }
