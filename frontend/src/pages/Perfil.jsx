import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ShieldCheck, LogOut } from 'lucide-react'
import Avatar from '../components/Avatar'
import ConfirmModal from '../components/ConfirmModal'
import { DemoBanner } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import { clearDemoData, loadExampleData } from '../services/mockApi'
import { isDemo } from '../services/api'
import '../styles/pages.css'

// Mi perfil: nombre, correo, rol, avatar por defecto con iniciales.
// El cambio de contraseña real vive en Configuración
// (POST /api/auth/change-password); aquí solo se muestra el perfil y
// se gestiona la sesión y los datos demo.
export default function Perfil() {
  const { user, logout } = useAuth()
  const rolLabel = user?.rol === 'ESTUDIANTE' ? 'Estudiante' : user?.rol === 'DOCENTE' ? 'Docente' : user?.rol === 'ADMIN' ? 'Administrador' : user?.rol ?? ''
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmBorrar, setConfirmBorrar] = useState(false)
  const [confirmEjemplo, setConfirmEjemplo] = useState(false)
  // v5: la demo arranca VACÍA. "Borrar" deja todo limpio (sin cerrar sesión);
  // "Cargar ejemplo" pone los datos de la demo anterior para ver cómo se ve lleno.
  const doBorrarDemo = () => { clearDemoData(); window.location.reload() }
  const doCargarEjemplo = () => { loadExampleData(); window.location.reload() }
  return (
    <>
      <DemoBanner />
      <div className="page-head"><div><h1 className="page-title">Mi perfil</h1><p className="page-subtitle">Tus datos y tu sesión en Aulix.</p></div></div>
      <div className="split">
        <section className="card profile-card">
          <Avatar name={user?.nombre} src={user?.avatar} size={72} />
          <h2>{user?.nombre}</h2>
          <p><Mail size={15} /> {user?.correo}</p>
          <p><ShieldCheck size={15} /> Rol: <strong>{rolLabel}</strong></p>
          {user?.grupo && <p>Grupo: <strong>{user.grupo}</strong></p>}
          <p className="page-text">Si no tienes foto de perfil, Aulix muestra tus iniciales como avatar por defecto.</p>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmLogout(true)}><LogOut size={16} /> Cerrar sesión</button>
        </section>
        <section className="card">
          <h2>Configuración de la cuenta</h2>
          
          <Link className="btn btn--primary" to="/configuracion">Ir a Configuración</Link>
          {isDemo() && (
            <>
              <hr className="sidebar__rule" />
              <h2>Datos demo</h2>
              <p className="page-text">La demo arranca vacía para probar desde cero. Borra todo lo creado en este navegador, o carga los datos de ejemplo para ver cómo se ve lleno. Tu sesión sigue activa en ambos casos.</p>
              <div className="pg-actions" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--ghost btn-download" onClick={() => setConfirmBorrar(true)}>Borrar todos los datos demo</button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmEjemplo(true)}>Cargar datos de ejemplo</button>
              </div>
            </>
          )}
        </section>
      </div>
      <ConfirmModal open={confirmLogout} title="¿Cerrar sesión?" message="Tendrás que volver a iniciar sesión para acceder a tus clases." confirmLabel="Cerrar sesión" danger onCancel={() => setConfirmLogout(false)} onConfirm={logout} />
      <ConfirmModal open={confirmBorrar} title="¿Borrar todos los datos demo?" message="Se borrarán las clases, tareas, calificaciones, mensajes, avisos y materiales creados en modo demo en este navegador. Todo quedará vacío, como al entrar por primera vez. Tu sesión seguirá activa." confirmLabel="Borrar todo" danger onCancel={() => setConfirmBorrar(false)} onConfirm={doBorrarDemo} />
      <ConfirmModal open={confirmEjemplo} title="¿Cargar datos de ejemplo?" message="Se cargarán las clases, tareas, mensajes y videos de ejemplo de la demo anterior. Lo que hayas creado en modo demo se reemplazará." confirmLabel="Cargar ejemplo" onCancel={() => setConfirmEjemplo(false)} onConfirm={doCargarEjemplo} />
    </>
  )
}
