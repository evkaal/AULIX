// Login rediseñado (Aulix v2) — tarjeta blanca centrada, bordes muy
// redondeados, fondo propio con gradiente azul marino → menta (colores de
// Aulix, NO el morado/rosa de la imagen de referencia) y el logotipo
// Aulix visible. La lógica es la misma de antes: validación bajo cada
// campo en tiempo real y al enviar, "recordarme", recuperar contraseña,
// registro y acceso rápido demo solo cuando VITE_DEMO_MODE=true.
import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, LockKeyhole, Eye, EyeOff, ArrowRight, LoaderCircle, TriangleAlert, WifiOff, Info } from 'lucide-react'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { DEMO_MODE } from '../services/authService'
import { DEMO_USERS } from '../services/mockApi'
import { validateEmail, validateLoginPassword } from '../services/validators'
import logo from '../assets/logo-aulix.png'
import '../styles/login.css'

const validators = { email: validateEmail, password: validateLoginPassword }

/** Carga el script de Google Identity Services bajo demanda (una sola vez
 *  por carga de página). Si falla, la promesa se rechaza y se puede reintentar. */
let googleScriptPromise = null
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise
  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      googleScriptPromise = null
      reject(new Error('No se pudo cargar el inicio de sesión con Google. Revisa tu conexión e inténtalo de nuevo.'))
    }
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

export default function Login() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname ?? '/inicio'

  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [apiError, setApiError] = useState(null) // { message, type }
  const [notice, setNotice] = useState(() => (new URLSearchParams(window.location.search).get('expirada') ? 'Tu sesión expiró. Inicia sesión de nuevo.' : ''))

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

  /** Inicio con Google (Google Identity Services, flujo ID token).
   *  Se mantiene el botón propio con su estilo: no se usa el botón
   *  renderizado de Google. Al hacer clic se carga el script de Google,
   *  se abre el selector de cuenta y el ID token va al backend. */
  const handleGoogleLogin = () => {
    setNotice('')
    setApiError(null)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setNotice('El inicio con Google no está configurado')
      return
    }
    setGoogleLoading(true)
    loadGoogleScript()
      .then(() => {
        if (!window.google?.accounts?.id) {
          throw new Error('No se pudo cargar el inicio de sesión con Google. Revisa tu conexión e inténtalo de nuevo.')
        }
        return new Promise((resolve) => {
          let settled = false
          const done = () => { if (!settled) { settled = true; resolve() } }
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              try {
                await loginWithGoogle({ idToken: response.credential, remember })
                navigate(redirectTo, { replace: true })
              } catch (err) {
                setApiError({ message: err.message, type: err.type })
              } finally {
                done()
              }
            },
          })
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              setNotice('No se pudo mostrar la ventana de Google. Inténtalo de nuevo en unos minutos o en otro navegador.')
              done()
            } else if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
              done() // el usuario cerró la ventana: no es un error
            }
          })
        })
      })
      .catch((err) => setApiError({ message: err.message, type: 'network' }))
      .finally(() => setGoogleLoading(false))
  }

  // Acceso rápido demo (solo VITE_DEMO_MODE=true): rellena una cuenta demo.
  const entrarDemo = (correo) => {
    const u = DEMO_USERS.find((x) => x.correo === correo)
    if (!u) return
    setValues({ email: u.correo, password: u.password })
    setTouched({ email: true, password: true })
  }

  return (
    <main className="login2">
      <div className="login2__bg" aria-hidden="true">
        <span className="login2__moon" />
        <span className="login2__dune login2__dune--a" />
        <span className="login2__dune login2__dune--b" />
        <span className="login2__dune login2__dune--c" />
      </div>

      <section className="login2__card" aria-label="Iniciar sesión en Aulix">
        <div className="login2__logo">
          <img src={logo} alt="Logotipo de Aulix" />
          <span>Aulix</span>
        </div>

        <header className="login2__header">
          <h1 className="login2__title">Login</h1>
          <p className="login2__subtitle">¡Qué gusto verte! Tu clase, conectada.</p>
        </header>

          <button type="button" className="btn-google login2__google" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
            <span className="btn-google__g" aria-hidden="true">G</span>
            {googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
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

        <form className="login2__form" onSubmit={handleSubmit} noValidate>
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
            <button type="button" className="link link--sm" onClick={() => navigate('/recuperar')}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="btn-primary login2__submit" disabled={loading} aria-busy={loading}>
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
            <button type="button" className="link" onClick={() => navigate('/registro')}>Crear cuenta</button>
          </p>

          <p className="login-form__demo">
           
          </p>
          {DEMO_MODE && (
            <div className="demo-accounts" role="group" aria-label="Cuentas demo">
              <p><strong>Modo demo sin backend.</strong> Elige una cuenta para entrar (contraseña: Demo123!):</p>
              <div className="demo-accounts__row">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => entrarDemo('admin@aulix.mx')}>Admin demo</button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => entrarDemo('docente@aulix.mx')}>Docente demo</button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => entrarDemo('alumno@aulix.mx')}>Estudiante demo</button>
              </div>
            </div>
          )}
        </form>
      </section>

      <p className="login2__foot">Aulix · Tu clase, conectada. El aprendizaje, sin límites.</p>
    </main>
  )
}
