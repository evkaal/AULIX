import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/authService'
import Avatar from '../Avatar'
import ConfirmModal from '../ConfirmModal'
import ThemeToggle from '../ThemeToggle'
import logoAulix from '../../assets/logo-aulix.png'

export default function Navbar({ menuAbierto, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const ref = useRef(null)
  // Lote 2A/2B: contador de sin leer + desplegable de notificaciones.
  // El badge se carga de GET /mensajes/sin-leer ({ totalSinLeer }) y se
  // refresca cada 10 s y cuando llega el evento 'aulix-leido' (se dispara
  // al marcar leído en ChatClase o en Mensajes). El desplegable usa
  // GET /mensajes/conversaciones?filtro=sin-leer, que ya devuelve por
  // clase { claseId, claseNombre, sinLeer, ultimoMensaje }: no hay
  // endpoint de notificaciones por mensaje, así que no se inventa uno.
  const [sinLeer, setSinLeer] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [marcandoTodo, setMarcandoTodo] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    const cargar = () => apiFetch('/mensajes/sin-leer')
      .then((d) => setSinLeer(d?.totalSinLeer ?? 0)).catch(() => {})
    cargar()
    const t = setInterval(cargar, 10000)
    window.addEventListener('aulix-leido', cargar)
    return () => { clearInterval(t); window.removeEventListener('aulix-leido', cargar) }
  }, [])

  useEffect(() => {
    if (!notifOpen) return
    const onClick = (e) => !notifRef.current?.contains(e.target) && setNotifOpen(false)
    const onKey = (e) => e.key === 'Escape' && setNotifOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [notifOpen])

  const cargarNotifs = () => apiFetch('/mensajes/conversaciones?filtro=sin-leer')
    .then((d) => setNotifs(Array.isArray(d) ? d : [])).catch(() => {})

  const abrirNotifs = () => {
    if (!notifOpen) cargarNotifs()
    setNotifOpen((o) => !o)
  }

  const marcarTodoLeido = async () => {
    const pendientes = notifs.filter((n) => (n.sinLeer ?? 0) > 0)
    if (!pendientes.length) return
    setMarcandoTodo(true)
    try {
      await Promise.all(pendientes.map((n) => apiFetch(`/mensajes/conversaciones/${n.claseId}/leido`, { method: 'POST' }).catch(() => {})))
      setSinLeer(0)
      setNotifs([])
      try { window.dispatchEvent(new Event('aulix-leido')) } catch { /* sin evento */ }
    } finally {
      setMarcandoTodo(false)
    }
  }

  return (
    <header className="navbar">
      <button type="button" className="icon-btn navbar__menu" onClick={onMenuClick} aria-label={menuAbierto ? 'Ocultar menú' : 'Mostrar menú'} aria-expanded={menuAbierto}>
        {menuAbierto ? <X size={22} /> : <Menu size={22} />}
      </button>
      <span className="navbar__brand"><img src={logoAulix} alt="Logo de Aulix" className="navbar__logo" />Aulix</span>

      <div className="navbar__account">
        <ThemeToggle />
        <div className="profile" ref={notifRef}>
          <button type="button" className="icon-btn" aria-label={`Ver mensajes${sinLeer ? `, ${sinLeer} sin leer` : ''}`} title="Ver mensajes" onClick={abrirNotifs} aria-expanded={notifOpen} style={{ position: 'relative' }}>
            <Bell size={20} />
            {sinLeer > 0 && <span className="sidebar__badge" style={{ position: 'absolute', top: -4, right: -4 }}>{sinLeer}</span>}
          </button>
          {notifOpen && (
            <div className="menu" role="menu" aria-label="Notificaciones sin leer" style={{ width: 320 }}>
              <div className="menu__header">
                <div className="menu__user">
                  <strong>Notificaciones</strong>
                  <span>{sinLeer > 0 ? `${sinLeer} mensaje(s) sin leer` : 'Sin mensajes sin leer'}</span>
                </div>
              </div>
              {notifs.length === 0 ? (
                <p className="pg-empty" style={{ margin: '8px 10px' }}>No tienes notificaciones sin leer.</p>
              ) : (
                notifs.map((n) => (
                  <button key={n.claseId} type="button" role="menuitem" className="menu__item" onClick={() => { setNotifOpen(false); navigate(`/mensajes/${n.claseId}`) }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 800 }}>{n.claseNombre || 'Materia'} {n.sinLeer > 0 ? `· ${n.sinLeer} sin leer` : ''}</span>
                      <span style={{ display: 'block', fontWeight: 400, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.ultimoMensaje ? `${n.ultimoMensaje.autorNombre ?? ''}: ${n.ultimoMensaje.texto ?? ''}` : 'Sin mensajes todavía.'}
                      </span>
                    </span>
                  </button>
                ))
              )}
              {notifs.length > 0 && (
                <button type="button" className="menu__item" onClick={marcarTodoLeido} disabled={marcandoTodo}>
                  {marcandoTodo ? 'Marcando…' : 'Marcar todo como leído'}
                </button>
              )}
              <button type="button" className="menu__item" onClick={() => { setNotifOpen(false); navigate('/mensajes') }}>
                Ver todos los mensajes
              </button>
            </div>
          )}
        </div>
        <span className="navbar__sep" aria-hidden="true" />

        <div className="profile" ref={ref}>
          <button
            type="button"
            className="profile__trigger"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Avatar name={user?.nombre} src={user?.avatar} />
            <span className="profile__info">
              <span className="profile__name">{user?.nombre}</span>
              <span className="profile__role">{user?.rol === 'ESTUDIANTE' ? 'Estudiante' : user?.rol === 'ADMIN' ? 'Administrador' : 'Docente'}</span>
            </span>
            <ChevronDown size={16} className={`profile__chevron${open ? ' is-open' : ''}`} />
          </button>

          {open && (
            <div className="menu" role="menu">
              <div className="menu__header">
                <Avatar name={user?.nombre} src={user?.avatar} size={40} />
                <div className="menu__user">
                  <strong>{user?.nombre}</strong>
                  <span title={user?.correo}>{user?.correo}</span>
                </div>
              </div>
              <button type="button" role="menuitem" className="menu__item" onClick={() => { setOpen(false); navigate('/perfil') }}>
                <UserRound size={17} /> Mi perfil
              </button>
              <button type="button" role="menuitem" className="menu__item menu__item--danger" onClick={() => { setOpen(false); setConfirmOpen(true) }}>
                <LogOut size={17} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="¿Cerrar sesión?"
        message="Tendrás que volver a iniciar sesión para acceder a tus clases."
        confirmLabel="Cerrar sesión"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={logout}
      />
    </header>
  )
}
