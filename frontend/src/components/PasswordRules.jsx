import { Check, X } from 'lucide-react'
import { PASSWORD_RULES } from '../services/validators'

// Lista de requisitos de contraseña visible bajo el input (rúbrica).
export default function PasswordRules({ value = '' }) {
  return (
    <ul className="password-rules" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value)
        return (
          <li key={r.id} className={ok ? 'is-ok' : ''}>
            {ok ? <Check size={14} /> : <X size={14} />} {r.label}
          </li>
        )
      })}
    </ul>
  )
}
