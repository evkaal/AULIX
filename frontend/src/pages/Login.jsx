import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, LockKeyhole, Eye, EyeOff, ArrowRight, LoaderCircle, TriangleAlert, WifiOff, Info } from 'lucide-react'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { validateEmail, validateLoginPassword } from '../services/validators'
import logo from '../assets/logo-aulix.png'
import '../styles/login.css'

const validators = { email: validateEmail, password: validateLoginPassword }

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname ?? '/inicio'

  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null) // { message, type }
  const [notice, setNotice] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  const errors = {
    email: validators.email(values.email),
    password: validators.password(values.password),
  }
  const visibleError = (name) => (touched[name] ? errors[name] : '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setTouched((t) => ({ ...t, [name]: true })) // validación en tiempo real al escribir
    if (apiError) setApiError(null)
  }
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice('')
    setTouched({ email: true, password: true })
    if (errors.email) return emailRef.current?.focus()
    if (errors.password) return passwordRef.current?.focus()

    setLoading(true)
    setApiError(null)
    try {
      await login({ ...values, remember })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setApiError({ message: err.message, type: err.type })
    } finally {
      setLoading(false)
    }
  }

  const comingSoon = (feature) => () => setNotice(`${feature} estará disponible en la siguiente entrega.`)

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

        {!imageFailed && (
          <div className="brand-illustration">
            <img
              src="/images/comunidad.png"
              alt="Estudiantes colaborando alrededor de una mesa"
              onError={() => setImageFailed(true)}
            />
          </div>
        )}
      </section>

      <section className="login__access">
        <div className="login__mobile-brand">
          <img src={logo} alt="" />
          <span>Aulix</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-form__header">
            <p className="login-form__eyebrow">BIENVENIDO A TU COMUNIDAD</p>
            <h2 className="login-form__title">¡Qué gusto verte!</h2>
            <p className="login-form__subtitle">Inicia sesión para continuar aprendiendo.</p>
          </header>

          <button type="button" className="btn-google" onClick={comingSoon('El acceso con Google')}>
            <span className="btn-google__g" aria-hidden="true">G</span>
            Continuar con Google
          </button>

          <div className="divider"><span>o con tu correo</span></div>

          {apiError && (
            <div className="alert alert--error" role="alert">
              {apiError.type === 'network' ? <WifiOff size={18} /> : <TriangleAlert size={18} />}
              <span>{apiError.message}</span>
            </div>
          )}
          {notice && (
            <div className="alert alert--info" role="status">
              <Info size={18} />
              <span>{notice}</span>
            </div>
          )}

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
            label="Contraseña"
            icon={LockKeyhole}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
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

          <div className="login-form__options">
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="check__box" aria-hidden="true" />
              Recordarme
            </label>
            <button type="button" className="link link--sm" onClick={comingSoon('La recuperación de contraseña')}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          <p className="login-form__register">
            ¿Aún no tienes cuenta?
            <button type="button" className="link" onClick={() => navigate('/registro')}>Regístrate gratis</button>
          </p>

          <p className="login-form__demo">
            Docente: <strong>laura@colegio.edu</strong> / <strong>Docente123*</strong>
            <br />
            Estudiante: <strong>ana.sofia@colegio.edu</strong> / <strong>Estudiante123*</strong>
          </p>
        </form>
      </section>
    </main>
  )
}
