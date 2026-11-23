import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, TriangleAlert, UserRound } from 'lucide-react'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { PASSWORD_RULES, validateEmail, validateStrongPassword } from '../services/validators'
import logo from '../assets/logo-aulix.png'
import '../styles/login.css'

export default function Registro() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ nombre: '', email: '', password: '', confirmar: '', rol: 'ESTUDIANTE', grupo: '' })
  const [touched, setTouched] = useState({ nombre: false, email: false, password: false, confirmar: false, grupo: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null) // { message, detalles }
  const nombreRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmarRef = useRef(null)
  const grupoRef = useRef(null)

  if (isAuthenticated) return <Navigate to="/inicio" replace />

  const errors = {
    nombre: values.nombre.trim() ? '' : 'El nombre es obligatorio.',
    email: validateEmail(values.email),
    password: validateStrongPassword(values.password),
    confirmar: values.confirmar ? (values.confirmar === values.password ? '' : 'Las contraseñas no coinciden.') : 'Confirma tu contraseña.',
    grupo: values.rol === 'ESTUDIANTE' && !values.grupo.trim() ? 'El grupo es obligatorio para estudiantes.' : '',
  }
  const visibleError = (name) => (touched[name] ? errors[name] : '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setTouched((t) => ({ ...t, [name]: true }))
    if (apiError) setApiError(null)
  }
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ nombre: true, email: true, password: true, confirmar: true, grupo: true })
    if (errors.nombre) return nombreRef.current?.focus()
    if (errors.email) return emailRef.current?.focus()
    if (errors.password) return passwordRef.current?.focus()
    if (errors.confirmar) return confirmarRef.current?.focus()
    if (errors.grupo) return grupoRef.current?.focus()

    setLoading(true)
    setApiError(null)
    try {
      // register() crea el usuario en MySQL (POST /api/auth/register) y
      // guarda la sesión igual que el login.
      await register({
        nombre: values.nombre.trim(),
        email: values.email.trim(),
        password: values.password,
        rol: values.rol,
        grupo: values.rol === 'ESTUDIANTE' ? values.grupo.trim() : null,
      })
      navigate('/inicio', { replace: true })
    } catch (err) {
      const detalles = err.detalles ? Object.values(err.detalles).join(' ') : ''
      setApiError({ message: detalles || err.message, detalles: err.detalles ?? null })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login">
      <section className="login__brand" aria-label="Bienvenida a Aulix">
        <div className="brand-identity">
          <span className="brand-identity__badge"><img src={logo} alt="" /></span>
          <span className="brand-identity__name">Aulix</span>
        </div>
        <div className="brand-promise">
          <span className="brand-promise__tag">UN ESPACIO PARA CRECER JUNTOS</span>
          <h1 className="brand-promise__title">
            Tu clase, conectada.<br />El aprendizaje, sin límites.
          </h1>
        </div>
      </section>

      <section className="login__access">
        <div className="login__mobile-brand">
          <img src={logo} alt="" />
          <span>Aulix</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-form__header">
            <p className="login-form__eyebrow">CREA TU CUENTA</p>
            <h2 className="login-form__title">Regístrate gratis</h2>
            <p className="login-form__subtitle">Tu cuenta se guarda en Aulix y podrás entrar con tu correo.</p>
          </header>

          {apiError && (
            <div className="alert alert--error" role="alert">
              <TriangleAlert size={18} />
              <span>{apiError.message}</span>
            </div>
          )}

          <FormField
            label="Nombre completo"
            icon={UserRound}
            name="nombre"
            type="text"
            autoComplete="name"
            placeholder="Ana Sofía García"
            value={values.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('nombre')}
            inputRef={nombreRef}
            disabled={loading}
          />

          <FormField
            label="Correo electrónico"
            icon={Mail}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@colegio.edu"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('email')}
            inputRef={emailRef}
            disabled={loading}
          />

          <div className="field">
            <span className="field__label">Soy</span>
            <div className="pg-radio-row" role="radiogroup" aria-label="Rol">
              {[
                { value: 'ESTUDIANTE', label: 'Estudiante' },
                { value: 'DOCENTE', label: 'Docente' },
              ].map(({ value, label }) => (
                <label key={value} className="pg-check">
                  <input
                    type="radio"
                    name="rol"
                    value={value}
                    checked={values.rol === value}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {values.rol === 'ESTUDIANTE' && (
            <FormField
              label="Grupo"
              icon={UserRound}
              name="grupo"
              type="text"
              autoComplete="off"
              placeholder="3° A"
              value={values.grupo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={visibleError('grupo')}
              inputRef={grupoRef}
              disabled={loading}
            />
          )}

          <FormField
            label="Contraseña"
            icon={LockKeyhole}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Crea una contraseña segura"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('password')}
            inputRef={passwordRef}
            disabled={loading}
            action={
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <ul className="pg-rules" aria-label="Requisitos de la contraseña">
            {PASSWORD_RULES.map((r) => (
              <li key={r.id} className={r.test(values.password) ? 'is-ok' : ''}>
                {r.test(values.password) ? '✓' : '·'} {r.label}
              </li>
            ))}
          </ul>

          <FormField
            label="Confirmar contraseña"
            icon={LockKeyhole}
            name="confirmar"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            value={values.confirmar}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('confirmar')}
            inputRef={confirmarRef}
            disabled={loading}
            action={
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
                Creando tu cuenta...
              </>
            ) : (
              <>
                Crear mi cuenta
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          <p className="login-form__register">
            ¿Ya tienes cuenta?
            <Link className="link" to="/login">Inicia sesión</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
