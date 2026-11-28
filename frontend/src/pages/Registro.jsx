import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone, TriangleAlert, UserRound } from 'lucide-react'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { PASSWORD_RULES, validateEmail, validateStrongPassword, validateTelefono } from '../services/validators'
import logo from '../assets/logo-aulix.png'
import '../styles/login.css'

export default function Registro() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ nombre: '', email: '', telefono: '', password: '', confirmar: '', rol: 'ESTUDIANTE' })
  const [touched, setTouched] = useState({ nombre: false, email: false, telefono: false, password: false, confirmar: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null) // { message, detalles }
  const nombreRef = useRef(null)
  const emailRef = useRef(null)
  const telefonoRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmarRef = useRef(null)

  // Igual que en Login.jsx: el fondo cambia según la hora de la visita.
  const hora = new Date().getHours()
  const fondoHora = hora < 6 ? 'noche' : hora < 12 ? 'manana' : hora < 19 ? 'tarde' : 'noche'

  if (isAuthenticated) return <Navigate to="/inicio" replace />

  const errors = {
    nombre: values.nombre.trim() ? '' : 'El nombre es obligatorio.',
    email: validateEmail(values.email),
    telefono: validateTelefono(values.telefono),
    password: validateStrongPassword(values.password),
    confirmar: values.confirmar ? (values.confirmar === values.password ? '' : 'Las contraseñas no coinciden.') : 'Confirma tu contraseña.',
  }
  const visibleError = (name) => (touched[name] ? errors[name] : '')

  const handleChange = (e) => {
    const { name } = e.target
    // El teléfono solo acepta dígitos (México: 10 dígitos).
    const value = name === 'telefono' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value
    setValues((v) => ({ ...v, [name]: value }))
    setTouched((t) => ({ ...t, [name]: true }))
    if (apiError) setApiError(null)
  }
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ nombre: true, email: true, telefono: true, password: true, confirmar: true })
    if (errors.nombre) return nombreRef.current?.focus()
    if (errors.email) return emailRef.current?.focus()
    if (errors.telefono) return telefonoRef.current?.focus()
    if (errors.password) return passwordRef.current?.focus()
    if (errors.confirmar) return confirmarRef.current?.focus()

    setLoading(true)
    setApiError(null)
    try {
      // register() crea el usuario en MySQL (POST /api/auth/register) y
      // guarda la sesión igual que el login. El teléfono se manda al
      // backend, pero hoy el backend no tiene ese campo (pendiente del
      // compañero): lo ignora hasta que lo agregue.
      await register({
        nombre: values.nombre.trim(),
        email: values.email.trim(),
        telefono: values.telefono.replace(/\D/g, ''),
        password: values.password,
        rol: values.rol,
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
    <main className={`login2 login2--${fondoHora}`}>
      <div className="login2__bg" aria-hidden="true">
        <span className="login2__moon" />
        <span className="login2__dune login2__dune--a" />
        <span className="login2__dune login2__dune--b" />
        <span className="login2__dune login2__dune--c" />
      </div>

      <section className="login2__card" aria-label="Crear cuenta en Aulix">
        <div className="login2__logo">
          <img src={logo} alt="Logotipo de Aulix" />
          <span>Aulix</span>
        </div>

        <header className="login2__header">
          <h1 className="login2__title">Crear cuenta</h1>
          <p className="login2__subtitle">Tu cuenta se guarda en Aulix y podrás entrar con tu correo.</p>
        </header>

        {apiError && (
          <div className="alert alert--error" role="alert">
            <TriangleAlert size={18} />
            <span>{apiError.message}</span>
          </div>
        )}

        <form className="login2__form" onSubmit={handleSubmit} noValidate>
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

          <FormField
            label="Número de teléfono"
            icon={Phone}
            name="telefono"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9511234567"
            maxLength={10}
            value={values.telefono}
            onChange={handleChange}
            onBlur={handleBlur}
            error={visibleError('telefono')}
            inputRef={telefonoRef}
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

          <button type="submit" className="btn-primary login2__submit" disabled={loading} aria-busy={loading}>
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

      <p className="login2__foot">Aulix · Tu clase, conectada. El aprendizaje, sin límites.</p>
    </main>
  )
}
