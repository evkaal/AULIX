import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { House, BookOpen, ClipboardList, ChartNoAxesCombined, CalendarDays, MessageCircle, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/authService'

// Los badges ya NO son fijos (antes: Tareas 8, Mensajes 3). Se cargan del
// backend al montar: sin leer de GET /api/mensajes/sin-leer ({ totalSinLeer })
// y tareas pendientes del resumen según el rol (estudiante: tareasPendientes;
// docente: suma de tareasActivas de sus clases). Si la llamada falla, no se
// muestra badge, pero la navegación sigue funcionando.

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const esEstudiante = user?.rol === 'ESTUDIANTE'
  const [badges, setBadges] = useState({ tareas: null, mensajes: null })

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      let mensajes = null
      let tareas = null
      try {
        const sinLeer = await apiFetch('/mensajes/sin-leer')
        if (typeof sinLeer?.totalSinLeer === 'number' && sinLeer.totalSinLeer > 0) {
          mensajes = sinLeer.totalSinLeer
        }
      } catch {
        // Sin badge de mensajes; la navegación no se rompe.
      }
      try {
        const resumen = await apiFetch(esEstudiante ? '/estudiante/resumen' : '/docente/resumen')
        if (esEstudiante) {
          if (typeof resumen?.tareasPendientes === 'number' && resumen.tareasPendientes > 0) {
            tareas = resumen.tareasPendientes
          }
        } else {
          const activas = (resumen?.clases ?? []).reduce((acc, c) => acc + (c.tareasActivas ?? 0), 0)
          if (activas > 0) tareas = activas
        }
      } catch {
        // Sin badge de tareas; la navegación no se rompe.
      }
      if (!cancelado) setBadges({ tareas, mensajes })
    }
    cargar()
    return () => { cancelado = true }
  }, [esEstudiante])

  const links = [
    { to: '/inicio', label: 'Inicio', icon: House },
    { to: '/mis-clases', label: 'Mis clases', icon: BookOpen },
    { to: '/tareas', label: 'Tareas', icon: ClipboardList, badge: badges.tareas },
    { to: '/calificaciones', label: 'Calificaciones', icon: ChartNoAxesCombined },
    { to: '/calendario', label: 'Calendario', icon: CalendarDays },
    { to: '/mensajes', label: 'Mensajes', icon: MessageCircle, badge: badges.mensajes },
  ]

  return (
    <>
      <div className={`sidebar-overlay${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Navegación principal">
        <nav className="sidebar__menu">
          <p className="sidebar__title">{esEstudiante ? 'ESPACIO ESTUDIANTE' : 'ESPACIO DOCENTE'}</p>
          {links.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
              {badge && <span className="sidebar__badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <hr className="sidebar__rule" />
        <div className="sidebar__spacer" />
        <NavLink to="/configuracion" onClick={onClose} className="sidebar__settings">
          <Settings size={18} aria-hidden="true" />
          Configuración
        </NavLink>
      </aside>
    </>
  )
}
