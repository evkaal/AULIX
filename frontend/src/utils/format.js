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

/** "2026-10-26T08:00" (valor para <input type="datetime-local">). */
export function toDatetimeLocal(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function estadoTareaLabel(estado) {
  return { ACTIVA: 'Activa', PROGRAMADA: 'Programada', CERRADA: 'Cerrada' }[estado] ?? estado ?? '—'
}
