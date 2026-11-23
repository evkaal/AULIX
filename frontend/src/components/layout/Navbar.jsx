import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../Avatar'
import ConfirmModal from '../ConfirmModal'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const ref = useRef(null)

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

  return (
    <header className="navbar">
      <button type="button" className="icon-btn navbar__menu" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu size={22} />
      </button>
      <span className="navbar__brand">Aulix</span>

      <div className="navbar__account">
        <button type="button" className="icon-btn" aria-label="Notificaciones">
          <Bell size={20} />
        </button>
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
              <span className="profile__role">{user?.rol === 'ESTUDIANTE' ? 'Estudiante' : 'Docente'}</span>
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
              <button type="button" role="menuitem" className="menu__item" onClick={() => setOpen(false)}>
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
