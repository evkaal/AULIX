import { apiFetch, apiFetchForm } from './authService'
import { isDemo } from './api'

// Materiales de una clase. Backend real:
// GET  /api/clases/{id}/materiales -> [RecursoResponse]
// POST /api/clases/{id}/materiales (multipart: archivo?, tipo=ARCHIVO|VIDEO,
//      nombre?, url?, duracionMin?) -> 201 RecursoResponse
// - tipo VIDEO = URL externa (YouTube/Vimeo/mp4 directo). El video se ve
//   dentro de la app con <video> o iframe.
// - tipo ARCHIVO = archivo subido; el backend solo acepta PDF, DOCX o
//   imagen (máx. 20 MB). Un video por archivo lo rechaza el backend en
//   modo real; en demo sí se guarda (en memoria, objectURL).
// - Descarga de archivos: GET /api/archivos/{nombreGuardado} con Bearer.
export async function listarMateriales(claseId) {
  const data = await apiFetch(`/clases/${claseId}/materiales`)
  return Array.isArray(data) ? data : []
}

export async function subirMaterial(claseId, { archivo, tipo = 'ARCHIVO', nombre, url, duracionMin, unidad, tema }) {
  const fd = new FormData()
  if (archivo) fd.append('archivo', archivo)
  fd.append('tipo', tipo)
  if (nombre) fd.append('nombre', nombre)
  if (url) fd.append('url', url)
  if (duracionMin) fd.append('duracionMin', String(duracionMin))
  // Unidad/Tema: el backend real no tiene esos campos; solo se mandan en demo.
  if (isDemo()) {
    if (unidad) fd.append('unidad', unidad)
    if (tema) fd.append('tema', tema)
  }
  return apiFetchForm(`/clases/${claseId}/materiales`, fd)
}

export async function listarAnuncios(claseId) {
  const data = await apiFetch(`/clases/${claseId}/anuncios`)
  return Array.isArray(data) ? data : []
}

export async function crearAnuncio(claseId, texto) {
  return apiFetch(`/clases/${claseId}/anuncios`, { method: 'POST', body: JSON.stringify({ texto }) })
}
