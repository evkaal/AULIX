// Interruptor de apariencia: claro / oscuro / sistema (Aulix v8).
// - variant="segmented": los 3 modos a la vista (Configuración).
// - variant="cycle" (por defecto): un solo botón en la barra superior que
//   cicla claro -> oscuro -> sistema. La preferencia se guarda en
//   localStorage y se sincroniza entre instancias con el evento 'aulix-tema'.
import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { applyTheme, getSavedTheme, THEMES } from '../theme'

const META = {
  claro: { Icon: Sun, label: 'Modo claro' },
  oscuro: { Icon: Moon, label: 'Modo oscuro' },
  sistema: { Icon: Monitor, label: 'Modo sistema (sigue tu dispositivo)' },
}

export default function ThemeToggle({ variant = 'cycle' }) {
  const [mode, setMode] = useState(getSavedTheme())

  useEffect(() => {
    const onChange = (e) => setMode(e.detail)
    window.addEventListener('aulix-tema', onChange)
    return () => window.removeEventListener('aulix-tema', onChange)
  }, [])

  const elegir = (m) => {
    setMode(m)
    applyTheme(m)
  }

  if (variant === 'segmented') {
    return (
      <div className="theme-toggle" role="group" aria-label="Apariencia">
        {THEMES.map((m) => {
          const { Icon, label } = META[m]
          return (
            <button
              key={m}
              type="button"
              className={`theme-toggle__btn${mode === m ? ' is-active' : ''}`}
              aria-pressed={mode === m}
              title={label}
              onClick={() => elegir(m)}
            >
              <Icon size={16} /> {m === 'claro' ? 'Claro' : m === 'oscuro' ? 'Oscuro' : 'Sistema'}
            </button>
          )
        })}
      </div>
    )
  }

  const siguiente = THEMES[(THEMES.indexOf(mode) + 1) % THEMES.length]
  const { Icon, label } = META[mode]
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`${label}. Pulsa para cambiar a modo ${siguiente}`}
      title={`${label} — pulsa para cambiar a modo ${siguiente}`}
      onClick={() => elegir(siguiente)}
    >
      <Icon size={20} />
    </button>
  )
}
