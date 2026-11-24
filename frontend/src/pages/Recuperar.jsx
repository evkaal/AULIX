import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, LoaderCircle, TriangleAlert, CircleCheck } from 'lucide-react'
import FormField from '../components/FormField'
import { validateEmail } from '../services/validators'
import { isDemo } from '../services/api'
import { recuperarPassword } from '../services/authService'
import logo from '../assets/logo-aulix.png'
import '../styles/login.css'

// Recuperar contraseña. OJO: el backend real NO tiene endpoint de
// recuperación (fuera de alcance, ver backend/README.md). En modo real
// esta pantalla lo dice claro en vez de inventar un envío; en modo demo
// simula el envío del enlace.
export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')
  const err = validateEmail(email)
  const handleSubmit = async (e) => {
    e.preventDefault(); setTouched(true)
    if (err) return
    if (!isDemo()) { setSent(''); setError('La recuperación de contraseña no está implementada en el backend (fuera de alcance). Pídele a tu docente que te ayude a restablecerla, o entra con tu cuenta registrada.'); return }
    setLoading(true); setError('')
    try { const r = await recuperarPassword(email); setSent(r.message || 'Te enviamos un enlace de recuperación.') }
    catch (e2) { setError(e2.message) }
    finally { setLoading(false) }
  }
  return (
    <main className="login">
      <section className="login__brand"><div className="brand-identity"><span className="brand-identity__badge"><img src={logo} alt="" /></span><span className="brand-identity__name">Aulix</span></div>
        <div className="brand-promise"><span className="brand-promise__tag">UN ESPACIO PARA CRECER JUNTOS</span><h1 className="brand-promise__title">Tu clase, conectada.<br />El aprendizaje, sin límites.</h1></div></section>
      <section className="login__access">
        <div className="login__mobile-brand"><img src={logo} alt="" /><span>Aulix</span></div>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-form__header"><p className="login-form__eyebrow">RECUPERAR CONTRASEÑA</p><h2 className="login-form__title">¿Olvidaste tu contraseña?</h2><p className="login-form__subtitle">Te enviamos un enlace para crear una nueva.</p></header>
          {error && <div className="alert alert--error" role="alert"><TriangleAlert size={18} /><span>{error}</span></div>}
          {sent && <div className="alert alert--info" role="status"><CircleCheck size={18} /><span>{sent}</span></div>}
          <FormField label="Correo electrónico" icon={Mail} name="email" type="email" placeholder="nombre@colegio.edu" value={email} onChange={(e) => { setEmail(e.target.value); setTouched(true); setError('') }} error={touched ? err : ''} disabled={loading || !!sent} />
          <button type="submit" className="btn-primary" disabled={loading || !!sent}>{loading ? <><LoaderCircle size={18} className="spin" /> Enviando...</> : <>Enviar enlace <ArrowRight size={18} /></>}</button>
          <p className="login-form__register"><Link className="link" to="/login">Volver al inicio de sesión</Link></p>
        </form>
      </section>
    </main>
  )
}
