// Tema claro / oscuro / sistema (Aulix v8).
// - La preferencia se guarda en localStorage ('aulix_tema').
// - 'sistema' sigue prefers-color-scheme del dispositivo y cambia solo si
//   el sistema cambia de modo.
// - Se aplica con data-theme="light|dark" en <html>; el CSS vive en
//   styles/theme.css. No depende del backend ni de la red.
export const THEME_KEY = 'aulix_tema'
export const THEMES = ['claro', 'oscuro', 'sistema']

export function getSavedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return THEMES.includes(v) ? v : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function resolveTheme(mode) {
  if (mode === 'oscuro') return 'dark'
  if (mode === 'claro') return 'light'
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(mode) {
  const resolved = resolveTheme(mode)
  try {
    document.documentElement.setAttribute('data-theme', resolved)
  } catch { /* sin DOM */ }
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch { /* sin storage */ }
  try {
    window.dispatchEvent(new CustomEvent('aulix-tema', { detail: mode }))
  } catch { /* sin DOM */ }
  return resolved
}

// Se llama una vez al arrancar (main.jsx) y se suscribe al cambio del sistema.
export function initTheme() {
  const mode = getSavedTheme()
  applyTheme(mode)
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (getSavedTheme() === 'sistema') applyTheme('sistema')
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else if (mq.addListener) mq.addListener(onChange)
  } catch { /* sin matchMedia */ }
  return mode
}
