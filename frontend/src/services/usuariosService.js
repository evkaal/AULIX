// Usuarios: NO EXISTE en el backend real (ver backend/README.md).
// Este servicio solo funciona en modo demo (mockApi.js) y existe para
// que la vista /usuarios y el hook usePaginated tengan un contrato claro
// si el backend añade el módulo después. En modo real, apiRequest lanza
// 404 ("ruta no implementada") y la vista lo explica.
import { apiGet, apiPost, apiPut, apiDelete, normalizePage } from './api'

export async function listarUsuarios({ page = 0, size = 10, search = '' } = {}) {
  return normalizePage(await apiGet('/usuarios', { page, size, search }), page, size)
}
export async function crearUsuario(body) { return apiPost('/usuarios', body) }
export async function actualizarUsuario(id, body) { return apiPut(`/usuarios/${id}`, body) }
export async function eliminarUsuario(id) { return apiDelete(`/usuarios/${id}`) }
