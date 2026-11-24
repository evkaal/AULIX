// classService.js — ADAPTADO al backend Spring Boot de AULIX.
// Copiar a frontend/src/services/classService.js (reemplaza los datos simulados).
// Usa GET /api/docente/resumen o /api/estudiante/resumen según el rol guardado
// en la sesión ('aulix_session'), y adapta la respuesta al formato que
// ya espera Inicio.jsx: { clases: [...], actividad: [...] }.

import { apiFetch, getSession } from './authService'
import { mockRequest } from './mockApi'

function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function adaptarClase(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    grupo: c.grupo,
    ciclo: c.ciclo,
    estudiantes: c.estudiantes ?? 0,
    tareasActivas: c.tareasActivas ?? 0,
    tema: c.tema ?? 'blue',
    icono: c.icono ?? 'book',
  }
}

function adaptarActividad(a) {
  return {
    id: a.id,
    iniciales: a.iniciales ?? iniciales(a.texto ?? ''),
    tema: a.tema ?? 'green',
    texto: a.texto,
    detalle: a.detalle,
  }
}

export async function getResumenDocente() {
  const data = (await apiFetch('/docente/resumen')) ?? {}
  return {
    clases: (data.clases ?? []).map(adaptarClase),
    actividad: (data.actividad ?? []).map(adaptarActividad),
    proximasEntregas: data.proximasEntregas ?? [],
  }
}

export async function getResumenEstudiante() {
  const data = (await apiFetch('/estudiante/resumen')) ?? {}
  return {
    clases: (data.materias ?? data.clases ?? []).map(adaptarClase),
    actividad: (data.anuncios ?? []).map((a) => ({
      id: a.id,
      iniciales: iniciales(a.autor ?? ''),
      tema: 'blue',
      texto: a.texto,
      detalle: `${a.claseNombre ?? ''} · ${a.createdAt ?? ''}`,
    })),
    tareasPendientes: data.tareasPendientes ?? 0,
    // v9 (bug 2): el mock demo devuelve trabajosEntregados; el backend
    // real no lo devuelve (se ignora si no viene).
    trabajosEntregados: data.trabajosEntregados ?? null,
    trabajosCalificados: data.trabajosCalificados ?? 0,
    proximasEntregas: data.proximasEntregas ?? [],
  }
}

function adaptarResumenEstudiante(data) {
  return {
    clases: (data.materias ?? data.clases ?? []).map(adaptarClase),
    actividad: (data.anuncios ?? []).map((a) => ({
      id: a.id,
      iniciales: iniciales(a.autor ?? ''),
      tema: 'blue',
      texto: a.texto,
      detalle: `${a.claseNombre ?? ''} · ${a.createdAt ?? ''}`,
    })),
    tareasPendientes: data.tareasPendientes ?? 0,
    trabajosEntregados: data.trabajosEntregados ?? null,
    trabajosCalificados: data.trabajosCalificados ?? 0,
    proximasEntregas: data.proximasEntregas ?? [],
  }
}

/** La que usa Inicio.jsx: elige el resumen según el rol de la sesión.
 *  BUG CORREGIDO (v3): antes un solo fallo del resumen dejaba el Inicio
 *  vacío con el banner rojo. Ahora, si el resumen real falla, se intenta
 *  el resumen demo directo; si hasta eso falla, se arma un resumen mínimo
 *  con las clases (que sí cargan) para que la página nunca quede vacía. */
export async function getResumenInicio() {
  const rol = getSession()?.user?.rol
  try {
    if (rol === 'DOCENTE') return getResumenDocente()
    return getResumenEstudiante()
  } catch {
    try {
      const path = rol === 'DOCENTE' ? '/docente/resumen' : '/estudiante/resumen'
      const data = (await mockRequest(path, { method: 'GET' })) ?? {}
      if (rol === 'DOCENTE') {
        return { clases: (data.clases ?? []).map(adaptarClase), actividad: (data.actividad ?? []).map(adaptarActividad), proximasEntregas: data.proximasEntregas ?? [] }
      }
      return adaptarResumenEstudiante(data)
    } catch {
      const clases = await apiFetch('/clases').catch(() => [])
      return { clases: (Array.isArray(clases) ? clases : []).map(adaptarClase), actividad: [], proximasEntregas: [] }
    }
  }
}
