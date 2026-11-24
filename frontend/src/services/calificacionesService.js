import { apiFetch, apiFetchText } from './authService'

// Calificaciones. Backend real, nota 0-10 (no 0-100):
// POST /api/entregas/{id}/calificacion {nota, comentario} (docente)
// PUT  /api/entregas/{id}/calificacion {nota, comentario}
// GET  /api/calificaciones/resumen (docente)
// GET  /api/clases/{id}/calificaciones/resumen (docente)
// GET  /api/estudiante/calificaciones?materiaId= (estudiante)
// GET  /api/calificaciones/exportar?materiaId=&ciclo= (CSV, docente)
export async function calificarEntrega(entregaId, { nota, comentario }) {
  return apiFetch(`/entregas/${entregaId}/calificacion`, { method: 'POST', body: JSON.stringify({ nota, comentario: comentario?.trim() || null }) })
}
export async function actualizarCalificacion(entregaId, { nota, comentario }) {
  return apiFetch(`/entregas/${entregaId}/calificacion`, { method: 'PUT', body: JSON.stringify({ nota, comentario: comentario?.trim() || null }) })
}
export async function getResumenCalificaciones() { return apiFetch('/calificaciones/resumen') }
export async function getResumenCalificacionesClase(claseId) { return apiFetch(`/clases/${claseId}/calificaciones/resumen`) }
export async function listarMisCalificaciones({ materiaId = '' } = {}) {
  const params = new URLSearchParams()
  if (materiaId) params.set('materiaId', materiaId)
  const data = await apiFetch(`/estudiante/calificaciones?${params}`)
  return Array.isArray(data) ? data : []
}
export async function exportarCalificaciones({ materiaId = '', ciclo = 2026 } = {}) {
  const params = new URLSearchParams({ ciclo: String(ciclo) })
  if (materiaId) params.set('materiaId', materiaId)
  return apiFetchText(`/calificaciones/exportar?${params}`)
}
