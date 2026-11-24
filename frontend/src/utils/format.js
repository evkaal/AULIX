// Formato de fechas y horas (zona del navegador, es-MX).

export function fmtFecha(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export function fmtFechaHora(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function fmtHora(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(d)
  }
  return String(value).slice(0, 5)
}

/** Normaliza una hora a "HH:MM" para <input type="time">.
 *  El backend serializa LocalTime como "08:00:00" y un <input type="time">
 *  con ese valor se ve vacío ("--:--"); al guardar, ese vacío se volvía
 *  null y la hora se perdía. También acepta "08:00" y Date. */
export function normHora(value) {
  if (!value) return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    const p = (n) => String(n).padStart(2, '0')
    return `${p(value.getHours())}:${p(value.getMinutes())}`
  }
  const s = String(value).trim()
  const m = s.match(/T(\d{2}):(\d{2})/)
  if (m) return `${m[1]}:${m[2]}`
  const m2 = s.match(/^(\d{1,2}):(\d{2})/)
  if (m2) return `${m2[1].padStart(2, '0')}:${m2[2]}`
  return ''
}

/** "2026-10-26T08:00" (valor para <input type="datetime-local">). */
export function toDatetimeLocal(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Badge + etiqueta para el estado de MI entrega (pendiente/entregada/calificada).
export function miEstadoBadge(miEstado) {
  const m = String(miEstado ?? '').toLowerCase()
  if (m === 'entregada') return { clase: 'entregada', label: 'Entregada' }
  if (m === 'calificada') return { clase: 'calificada', label: 'Calificada' }
  return { clase: 'pendiente', label: 'Pendiente' }
}

export function estadoTareaLabel(estado) {
  return { ACTIVA: 'Activa', PROGRAMADA: 'Programada', CERRADA: 'Cerrada' }[estado] ?? estado ?? '—'
}

/** Estado que debe llevar una tarea al crearla/programarla (v7).
 *  El backend NO deriva PROGRAMADA solo: usa el `estado` que recibe
 *  (ACTIVA por defecto). Si la activación es futura y la activación
 *  automática está encendida, la tarea nace PROGRAMADA y así aparece en
 *  la pestaña Programadas y en el Calendario el día de activación.
 *  Un estado explícito CERRADA o PROGRAMADA se respeta; ACTIVA (o AUTO,
 *  o ausente) se deriva de la fecha: con activación futura y activación
 *  automática, la tarea es PROGRAMADA aunque el formulario trajera ACTIVA. */
export function derivarEstadoTarea({ fechaActivacion, activacionAutomatica, estado } = {}) {
  if (estado === 'CERRADA' || estado === 'PROGRAMADA') return estado
  const act = fechaActivacion ? new Date(fechaActivacion) : null
  if (act && !Number.isNaN(act.getTime()) && act.getTime() > Date.now() && activacionAutomatica !== false) return 'PROGRAMADA'
  return 'ACTIVA'
}
