// classService.js — ADAPTADO al backend Spring Boot de AULIX.
// Copiar a frontend/src/services/classService.js (reemplaza los datos simulados).
// Usa GET /api/docente/resumen o /api/estudiante/resumen según el rol guardado
// en la sesión ('aulix_session'), y adapta la respuesta al formato que
// ya espera Inicio.jsx: { clases: [...], actividad: [...] }.

import { apiFetch, getSession } from './authService'

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
    formula: c.simbolo ?? c.formula ?? '',
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
  const data = await apiFetch('/docente/resumen')
  return {
    clases: (data.clases ?? []).map(adaptarClase),
    actividad: (data.actividad ?? []).map(adaptarActividad),
    proximasEntregas: data.proximasEntregas ?? [],
  }
}

export async function getResumenEstudiante() {
  const data = await apiFetch('/estudiante/resumen')
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
    trabajosCalificados: data.trabajosCalificados ?? 0,
    proximasEntregas: data.proximasEntregas ?? [],
  }
}

/** La que usa Inicio.jsx: elige el resumen según el rol de la sesión. */
export async function getResumenInicio() {
  const rol = getSession()?.user?.rol
  if (rol === 'DOCENTE') return getResumenDocente()
  return getResumenEstudiante()
}
