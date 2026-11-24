import { apiFetch } from './authService'

// Calendario. Backend real:
// GET /api/calendario?mes=YYYY-MM&materiaId= (docente: activaciones y vencimientos)
// GET /api/estudiante/calendario?mes=YYYY-MM (estudiante: horario + vencimientos)
// Devuelve { eventos: [...] }. Programar una tarea = PUT /api/tareas/{id}/programacion.
export async function getCalendario({ mes, materiaId = '', esDocente = true } = {}) {
  const params = new URLSearchParams({ mes })
  if (esDocente && materiaId) params.set('materiaId', materiaId)
  const data = await apiFetch(esDocente ? `/calendario?${params}` : `/estudiante/calendario?mes=${mes}`)
  return Array.isArray(data?.eventos) ? data.eventos : []
}
export async function programarTarea(id, body) {
  return apiFetch(`/tareas/${id}/programacion`, { method: 'PUT', body: JSON.stringify(body) })
}
