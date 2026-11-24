import { useCallback, useEffect, useRef, useState } from 'react'
import { LogOut, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import Avatar from '../components/Avatar'
import ConfirmModal from '../components/ConfirmModal'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/authService'
import { clearDemoData, loadExampleData } from '../services/mockApi'
import { isDemo } from '../services/api'
import { PASSWORD_RULES, validateStrongPassword } from '../services/validators'
import '../styles/pages.css'

export default function Configuracion() {
  const { user, logout } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmBorrar, setConfirmBorrar] = useState(false)
  const [confirmEjemplo, setConfirmEjemplo] = useState(false)
  // Datos demo (v5, solo en modo demo): borrar deja todo vacío sin cerrar
  // sesión; cargar ejemplo pone los datos de la demo anterior.
  const doBorrarDemo = () => { clearDemoData(); window.location.reload() }
  const doCargarEjemplo = () => { loadExampleData(); window.location.reload() }

  // Cambio de contraseña (POST /api/auth/change-password, con token).
  const [values, setValues] = useState({ actual: '', nueva: '', confirmar: '' })
  const [touched, setTouched] = useState({ actual: false, nueva: false, confirmar: false })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formOk, setFormOk] = useState('')
  const actualRef = useRef(null)
  const nuevaRef = useRef(null)
  const confirmarRef = useRef(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      setPerfil(await apiFetch('/auth/me'))
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const datos = perfil ?? user

  const errors = {
    actual: values.actual ? '' : 'Escribe tu contraseña actual.',
    nueva: validateStrongPassword(values.nueva),
    confirmar: values.confirmar ? (values.confirmar === values.nueva ? '' : 'Las contraseñas no coinciden.') : 'Confirma tu contraseña nueva.',
  }
  const visibleError = (name) => (touched[name] ? errors[name] : '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setTouched((t) => ({ ...t, [name]: true }))
    if (formError) setFormError('')
    if (formOk) setFormOk('')
  }
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setTouched({ actual: true, nueva: true, confirmar: true })
    if (errors.actual) return actualRef.current?.focus()
    if (errors.nueva) return nuevaRef.current?.focus()
    if (errors.confirmar) return confirmarRef.current?.focus()

    setSaving(true)
    setFormError('')
    setFormOk('')
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: values.actual, newPassword: values.nueva }),
      })
      setValues({ actual: '', nueva: '', confirmar: '' })
      setTouched({ actual: false, nueva: false, confirmar: false })
      setFormOk('Contraseña actualizada. La próxima vez que inicies sesión, usa la nueva.')
    } catch (err) {
      const detalles = err.detalles ? Object.values(err.detalles).join(' ') : ''
      setFormError(detalles || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Tu cuenta y tu sesión en Aulix.</p>
        </div>
      </div>

      {status === 'loading' && <p className="pg-loading">Cargando tu perfil…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar tu perfil. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}

      {status === 'ready' && datos && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="pg-profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={datos.nombre} src={datos.avatar} size={56} />
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{datos.nombre}</h2>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{datos.correo}</p>
              </div>
            </div>
            <dl>
              <dt>Rol</dt>
              <dd>{datos.rol === 'DOCENTE' ? 'Docente' : 'Estudiante'}</dd>
              {datos.grupo && (<><dt>Grupo</dt><dd>{datos.grupo}</dd></>)}
              {datos.ciclo && (<><dt>Ciclo</dt><dd>{datos.ciclo}</dd></>)}
              <dt>Cuenta</dt>
              <dd>Activa</dd>
            </dl>
          </section>

          <section className="pg-profile">
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Apariencia</h2>
            <p className="pg-hint">Elige cómo se ve Aulix. Se guarda en este navegador. &ldquo;Sistema&rdquo; sigue el modo claro u oscuro de tu dispositivo.</p>
            <ThemeToggle variant="segmented" />
          </section>

          <section className="pg-profile">
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Contraseña</h2>
            <form className="pg-form" onSubmit={handlePasswordSubmit} noValidate>
              {formError && (
                <div className="pg-alert" role="alert">
                  <TriangleAlert size={18} />
                  <span>{formError}</span>
                </div>
              )}
              {formOk && (
                <div className="pg-alert pg-alert--info" role="status">
                  <span>{formOk}</span>
                </div>
              )}
              <label className="pg-field">
                <span className="pg-label">Contraseña actual</span>
                <input
                  className="pg-input"
                  type="password"
                  name="actual"
                  autoComplete="current-password"
                  placeholder="Tu contraseña actual"
                  value={values.actual}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  ref={actualRef}
                  disabled={saving}
                />
                {visibleError('actual') && <span className="pg-error">{visibleError('actual')}</span>}
              </label>
              <label className="pg-field">
                <span className="pg-label">Contraseña nueva</span>
                <input
                  className="pg-input"
                  type="password"
                  name="nueva"
                  autoComplete="new-password"
                  placeholder="Crea una contraseña segura"
                  value={values.nueva}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  ref={nuevaRef}
                  disabled={saving}
                />
                {visibleError('nueva') && <span className="pg-error">{visibleError('nueva')}</span>}
              </label>
              <ul className="pg-rules" aria-label="Requisitos de la contraseña">
                {PASSWORD_RULES.map((r) => (
                  <li key={r.id} className={r.test(values.nueva) ? 'is-ok' : ''}>
                    {r.test(values.nueva) ? '✓' : '·'} {r.label}
                  </li>
                ))}
              </ul>
              <label className="pg-field">
                <span className="pg-label">Confirmar contraseña nueva</span>
                <input
                  className="pg-input"
                  type="password"
                  name="confirmar"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña nueva"
                  value={values.confirmar}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  ref={confirmarRef}
                  disabled={saving}
                />
                {visibleError('confirmar') && <span className="pg-error">{visibleError('confirmar')}</span>}
              </label>
              <div className="pg-actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </div>
              <p className="pg-hint">Tu sesión sigue activa: la contraseña nueva se usa la próxima vez que inicies sesión.</p>
            </form>
          </section>

          {isDemo() && (
            <section className="pg-profile">
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Datos demo</h2>
              <p className="pg-hint">Solo visible en modo demo. La demo arranca vacía para probar desde cero. Borra todo lo creado en este navegador, o carga los datos de ejemplo para ver cómo se ve lleno. Tu sesión sigue activa en ambos casos.</p>
              <div className="pg-actions" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--ghost btn-download" onClick={() => setConfirmBorrar(true)}>Borrar todos los datos demo</button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmEjemplo(true)}>Cargar datos de ejemplo</button>
              </div>
            </section>
          )}

          <section className="pg-profile">
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Sesión</h2>
            <p className="pg-hint">Si cierras sesión, tendrás que volver a iniciar sesión para acceder a tus clases.</p>
            <div className="pg-actions">
              <button type="button" className="btn btn--danger" onClick={() => setConfirmOpen(true)}>
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </section>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="¿Cerrar sesión?"
        message="Tendrás que volver a iniciar sesión para acceder a tus clases."
        confirmLabel="Cerrar sesión"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={logout}
      />
      <ConfirmModal
        open={confirmBorrar}
        title="¿Borrar todos los datos demo?"
        message="Se borrarán las clases, tareas, calificaciones, mensajes, avisos y materiales creados en modo demo en este navegador. Todo quedará vacío, como al entrar por primera vez. Tu sesión seguirá activa."
        confirmLabel="Borrar todo"
        danger
        onCancel={() => setConfirmBorrar(false)}
        onConfirm={doBorrarDemo}
      />
      <ConfirmModal
        open={confirmEjemplo}
        title="¿Cargar datos de ejemplo?"
        message="Se cargarán las clases, tareas, mensajes y videos de ejemplo de la demo anterior. Lo que hayas creado en modo demo se reemplazará."
        confirmLabel="Cargar ejemplo"
        onCancel={() => setConfirmEjemplo(false)}
        onConfirm={doCargarEjemplo}
      />
    </>
  )
}
