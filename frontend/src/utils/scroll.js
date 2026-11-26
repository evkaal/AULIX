// Utilidad compartida (Lote 0): baja suavemente hasta una sección y
// pone el foco en su primer elemento enfocable, sin romper el scroll.
export function scrollToRef(ref) {
  if (!ref?.current) return
  ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const el = ref.current.querySelector('h2, h3, button, [tabindex]')
  if (el && el.focus) { try { el.focus({ preventScroll: true }) } catch { /* sin foco */ } }
}
