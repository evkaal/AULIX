 // ClassTheme — colores e iconos de las clases (Aulix v2).
// El backend guarda el color en el campo libre `tema` de Clase (String,
// sin validación de enum) y el icono en `icono` (String). Por eso un color
// personalizado se guarda tal cual como hexadecimal, ej. tema="#0EA47A",
// y funciona en modo real sin cambiar el backend. Si el backend algún día
// valida `tema` contra una lista, solo habrá que mapear el hex a un nombre.
import { useRef, useState } from 'react'
import {
  BookOpen, Brush, Calculator, Code2, Cpu, Dumbbell, FlaskConical, Globe,
  GraduationCap, Landmark, Languages, Leaf, Microscope, Music, Palette,
  Sigma, Star, Trophy,
} from 'lucide-react'

export const PALETTE = [
  { value: 'blue', label: 'Azul Aulix', hex: '#1675D1' },
  { value: 'mint', label: 'Menta', hex: '#0EA47A' },
  { value: 'green', label: 'Verde', hex: '#16A34A' },
  { value: 'teal', label: 'Turquesa', hex: '#0D9488' },
  { value: 'cyan', label: 'Celeste', hex: '#0891B2' },
  { value: 'indigo', label: 'Índigo', hex: '#4F46E5' },
  { value: 'purple', label: 'Morado', hex: '#7C3AED' },
  { value: 'pink', label: 'Rosa', hex: '#DB2777' },
  { value: 'rose', label: 'Rojo rosa', hex: '#E11D48' },
  { value: 'red', label: 'Rojo', hex: '#DC2626' },
  { value: 'orange', label: 'Naranja', hex: '#EA580C' },
  { value: 'amber', label: 'Ámbar', hex: '#D97706' },
]

export const ICONS = [
  { value: 'calculator', label: 'Matemáticas', Icon: Calculator },
  { value: 'sigma', label: 'Álgebra', Icon: Sigma },
  { value: 'flask', label: 'Química', Icon: FlaskConical },
  { value: 'microscope', label: 'Biología', Icon: Microscope },
  { value: 'leaf', label: 'Ciencias', Icon: Leaf },
  { value: 'book', label: 'Lengua / Libro', Icon: BookOpen },
  { value: 'languages', label: 'Idiomas', Icon: Languages },
  { value: 'landmark', label: 'Historia', Icon: Landmark },
  { value: 'globe', label: 'Geografía', Icon: Globe },
  { value: 'palette', label: 'Arte', Icon: Palette },
  { value: 'brush', label: 'Dibujo', Icon: Brush },
  { value: 'music', label: 'Música', Icon: Music },
  { value: 'trophy', label: 'Deporte', Icon: Trophy },
  { value: 'dumbbell', label: 'Educación física', Icon: Dumbbell },
  { value: 'code', label: 'Programación', Icon: Code2 },
  { value: 'cpu', label: 'Computación', Icon: Cpu },
  { value: 'graduation', label: 'Graduación', Icon: GraduationCap },
  { value: 'star', label: 'General', Icon: Star },
]

const ICON_MAP = Object.fromEntries(ICONS.map((i) => [i.value, i.Icon]))

export function classIcon(name) {
  return ICON_MAP[name] || BookOpen
}

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`.toUpperCase()
}

function softBg(hex) {
  const [h, s, l] = hexToHsl(hex)
  return `hsl(${h}, ${Math.min(s, 70)}%, ${Math.min(Math.max(l + 38, 88), 94)}%)`
}

// Resuelve el tema de una clase a { hex, bg, fg, name }.
// Acepta nombre predefinido ('blue'), hex ('#0EA47A') o nada (azul Aulix).
export function resolveClassTheme(claseOrTema) {
  const tema = typeof claseOrTema === 'string' ? claseOrTema : claseOrTema?.tema
  if (typeof tema === 'string' && tema.startsWith('#')) {
    return { hex: tema, bg: softBg(tema), fg: tema, name: 'personalizado' }
  }
  const preset = PALETTE.find((p) => p.value === tema) || PALETTE[0]
  return { hex: preset.hex, bg: softBg(preset.hex), fg: preset.hex, name: preset.label }
}


// Texto legible sobre un color sólido: blanco sobre colores oscuros,
// casi negro sobre colores claros.
export function textOn(hex) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return '#FFFFFF'
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.6 ? '#1F2937' : '#FFFFFF'
}

// Selector completo de color + icono para crear/editar una clase.
// value: { tema, icono } — onChange recibe el objeto nuevo.
// nombre/grupo alimentan la vista previa en vivo.
export function ThemePicker({ value, onChange, nombre, grupo }) {
  const tema = value?.tema ?? 'blue'
  const isCustom = typeof tema === 'string' && tema.startsWith('#')
  const customHex = isCustom ? tema : '#0EA47A'
  const preview = resolveClassTheme(tema)
  const Icon = classIcon(value?.icono)
  return (
    <div className="theme-picker">
      <span className="pg-label">Color de la clase</span>
      <div className="theme-swatches" role="group" aria-label="Colores predefinidos">
        {PALETTE.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`theme-swatch${tema === p.value ? ' is-selected' : ''}`}
            style={{ background: p.hex }}
            title={p.label}
            aria-label={`Color ${p.label}`}
            aria-pressed={tema === p.value}
            onClick={() => onChange({ ...value, tema: p.value })}
          />
        ))}
      </div>
      <div className="theme-custom">
        <ColorWheel value={customHex} onChange={(hex) => onChange({ ...value, tema: hex })} />
        <label className="theme-custom__exact">
          <span>Color exacto</span>
          <input
            type="color"
            value={customHex}
            onChange={(e) => onChange({ ...value, tema: e.target.value.toUpperCase() })}
            aria-label="Elegir color exacto"
          />
          <code>{isCustom ? tema : customHex}</code>
        </label>
      </div>
      <div className="theme-preview" style={{ background: preview.hex, color: textOn(preview.hex) }}>
        <Icon size={26} aria-hidden="true" />
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25 }}>
          <span>{nombre?.trim() ? nombre : 'Tu clase'} · {grupo?.trim() ? grupo : 'Sin grupo'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>Así se verá tu clase · {preview.name}</span>
        </span>
      </div>
      <span className="pg-label" style={{ marginTop: 8 }}>Icono de la clase</span>
      <div className="theme-icons" role="group" aria-label="Iconos de clase">
        {ICONS.map(({ value: v, label, Icon: I }) => (
          <button
            key={v}
            type="button"
            className={`theme-icon${value?.icono === v ? ' is-selected' : ''}`}
            title={label}
            aria-label={`Icono ${label}`}
            aria-pressed={value?.icono === v}
            onClick={() => onChange({ ...value, icono: v })}
          >
            <I size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
