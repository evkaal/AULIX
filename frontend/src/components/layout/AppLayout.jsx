import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import ErrorBoundary from '../ErrorBoundary'
import Sidebar from './Sidebar'
import '../../styles/layout.css'

// La preferencia del menú lateral (escritorio) se guarda en localStorage,
// igual que el tema ('aulix_tema'): al recargar, el menú sigue como lo
// dejaste. En móvil no se guarda: el menú es un drawer que siempre
// empieza cerrado.
const SIDEBAR_KEY = 'aulix_sidebar'

function leerPreferencia() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'oculto'
  } catch {
    return false
  }
}

export default function AppLayout() {
  const [oculto, setOculto] = useState(leerPreferencia)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [esMovil, setEsMovil] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false,
  )
  const { pathname } = useLocation()
  useEffect(() => setDrawerAbierto(false), [pathname])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const onChange = (e) => setEsMovil(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, oculto ? 'oculto' : 'visible')
    } catch {
      /* sin storage */
    }
  }, [oculto])

  // En móvil la hamburguesa abre/cierra el drawer; en escritorio oculta
  // o muestra el menú lateral (el contenido se expande solo).
  const menuAbierto = esMovil ? drawerAbierto : !oculto
  const toggleMenu = () => {
    if (esMovil) setDrawerAbierto((o) => !o)
    else setOculto((o) => !o)
  }

  return (
    <div className={`app${oculto ? ' app--menu-oculto' : ''}`}>
      <Navbar menuAbierto={menuAbierto} onMenuClick={toggleMenu} />
      <div className="app__body">
        <Sidebar open={drawerAbierto} onClose={() => setDrawerAbierto(false)} />
        <main className="app__content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
