import { apiFetch, apiFetchForm } from './authService'

// Mensajes (una conversación grupal por clase). Backend real:
// GET  /api/mensajes/conversaciones?filtro=&q=
// GET  /api/mensajes/conversaciones/{claseId}/mensajes?page=&size= -> Page (sí pagina, DESC)
// POST /api/mensajes/conversaciones/{claseId}/mensajes (multipart: texto + adjunto)
// POST /api/mensajes/conversaciones/{claseId}/leido
// GET  /api/mensajes/conversaciones/{claseId}/archivos
// GET  /api/mensajes/sin-leer
export async function listarConversaciones({ filtro = '', q = '' } = {}) {
  const params = new URLSearchParams()
  if (filtro) params.set('filtro', filtro)
  if (q.trim()) params.set('q', q.trim())
  const data = await apiFetch(`/mensajes/conversaciones?${params}`)
  return Array.isArray(data) ? data : []
}
export async function listarMensajes(claseId, { page = 0, size = 50 } = {}) {
  return apiFetch(`/mensajes/conversaciones/${claseId}/mensajes?page=${page}&size=${size}`)
}
export async function enviarMensaje(claseId, { texto, adjunto }) {
  const fd = new FormData()
  // v7: sin texto de relleno; una nota de voz sola se manda con texto vacío.
  fd.append('texto', (texto || '').trim())
  if (adjunto) fd.append('adjunto', adjunto)
  return apiFetchForm(`/mensajes/conversaciones/${claseId}/mensajes`, fd)
}
export async function marcarLeido(claseId) { return apiFetch(`/mensajes/conversaciones/${claseId}/leido`, { method: 'POST' }) }
export async function listarArchivosConversacion(claseId) { return apiFetch(`/mensajes/conversaciones/${claseId}/archivos`) }
export async function getSinLeer() { return apiFetch('/mensajes/sin-leer') }
