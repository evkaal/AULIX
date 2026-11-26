import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, CircleCheck, Ellipsis, Megaphone, RefreshCw, WifiOff } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { getResumenInicio } from '../services/classService'
import { apiFetch } from '../services/authService'
import { resolveClassTheme, classIcon } from '../components/ClassTheme'
import { fmtAviso } from '../components/AvisosClase'
import '../styles/inicio.css'
import '../styles/pages.css'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
// Lote 5B: frase según la hora (el saludo ya existía).
function frasePorHora() {
  const h = new Date().getHours()
  if (h < 12) return 'Empieza el día con energía, revisa tus pendientes.'
  if (h < 19) return 'Vas a mitad del día, sigue con tus clases.'
  return 'Cierra el día revisando lo entregado.'
}
function fechaHoy() {
  const f = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function ClassCard({ clase }) {
  const Icon = classIcon(clase.icono)
  const theme = resolveClassTheme(clase)
  // BUG CORREGIDO (v7): el botón de tres puntos no hacía nada. Ahora
  // abre un menú que SÍ funciona: ver la clase, sus tareas y sus
  // calificaciones. Se cierra al elegir una opción o al pulsar fuera.
  const [menu, setMenu] = useState(false)
  return (
    <article className="class-card">
      <div className="class-card__cover" style={{ background: theme.bg, color: theme.fg }}>
        <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="class-card__info">
        <div className="class-card__row">
          <h3 className="class-card__name">{clase.nombre || 'Clase sin nombre'}</h3>
          <div className="class-card__menu">
            <button type="button" className="icon-btn icon-btn--sm" aria-label={`Opciones de ${clase.nombre || 'esta clase'}`} aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu((m) => !m)}><Ellipsis size={18} /></button>
            {menu && (
              <>
      
      
                <button type="button" className="class-menu__backdrop" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
                <div className="class-menu" role="menu">
                  <Link role="menuitem" to="/mis-clases" onClick={() => setMenu(false)}>Ver clase</Link>
                  <Link role="menuitem" to="/tareas" onClick={() => setMenu(false)}>Ver tareas</Link>
                  <Link role="menuitem" to="/calificaciones" onClick={() => setMenu(false)}>Ver calificaciones</Link>
                </div>
      
        </>
            )}
          </div>
        </div>
        <p>{clase.grupo || ''} · Ciclo {clase.ciclo}</p>
        <p>{clase.estudiantes} estudiantes</p>
        <div className="class-card__footer">
          <span>{clase.tareasActivas} tareas activas</span>
          <Link to="/mis-clases" aria-label={`Entrar a ${clase.nombre || 'esta clase'}`}><ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </article>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando clases">
      <div className="classes">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--card" />)}
      </div>
      <div className="skeleton skeleton--feed" />
    </div>
  )
}

export default function Inicio() {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', data: null })
  const [post, setPost] = useState('')
  const [avisos, setAvisos] = useState([])
  // Publicaciones locales del Home (v7): el cuadro "¿Qué quieres
  // compartir?" y su botón de imagen no hacían nada. Ahora publicar
  // añade el texto a la actividad reciente (solo en esta sesión).
  const [publicaciones, setPublicaciones] = useState([])
  const publicar = (e) => {
    e.preventDefault()
    if (!post.trim()) return
    const iniciales = (user?.nombre || '?').split(' ').slice(0, 2).map((p) => p[0]).join('')
    setPublicaciones((p) => [{ id: Date.now(), iniciales, tema: 'blue', texto: post.trim(), detalle: 'Ahora mismo · Tú' }, ...p])
    setPost('')
  }

  const loadAvisos = useCallback(async (clases) => {
    try {
      const listas = await Promise.all(
        (clases || []).slice(0, 3).map((c) =>
          apiFetch(`/clases/${c.id}/anuncios`).then((a) => (Array.isArray(a) ? a : []).map((x) => ({ ...x, claseNombre: c.nombre, claseId: c.id }))).catch(() => [])
        )
      )
      setAvisos(listas.flat().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5))
    } catch { setAvisos([]) }
  }, [])

  const load = useCallback(async () => {
    setState({ status: 'loading', data: null })
    try {
      const data = await getResumenInicio()
      setState({ status: 'ready', data })
      loadAvisos(data.clases)
    } catch {
      setState({ status: 'error', data: null })
    }
  }, [loadAvisos])
  useEffect(() => { load() }, [load])

  const firstName = user?.nombre?.split(' ')[0] ?? ''
  // v9 (bug 2): "Próximas entregas" solo muestra tareas PENDIENTES. El
  // backend real incluye en proximasEntregas también las ya entregadas
  // (con miEstado), así que se filtran aquí en el cliente; en demo el
  // mock ya las excluye. Sin este filtro, una tarea entregada seguía
  // apareciendo como próxima aunque pendientes fuera 0.
  const esEstudiante = user?.rol === 'ESTUDIANTE'
  const proximas = (state.data?.proximasEntregas ?? []).filter((t) => !esEstudiante || !t.miEstado || String(t.miEstado).toLowerCase() === 'pendiente')
  // Contador de entregadas por calificar: solo se muestra si el resumen
  // lo trae (el mock demo sí; el backend real no lo devuelve y no se
  // inventa un número parcial a partir de las próximas).
  const entregadas = state.data?.trabajosEntregados ?? null

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">¡{saludo()}, {firstName}!</h1>
          <p className="page-subtitle">{frasePorHora()}</p>
        </div>
        <p className="page-date"><CalendarDays size={17} aria-hidden="true" />{fechaHoy()}</p>
      </div>

      {state.status === 'loading' && <Skeleton />}

      {state.status === 'error' && (
        <div className="alert alert--error" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar tu información. Revisa tu conexión e inténtalo de nuevo.</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          {/* Lote 4A: menú horizontal para saltar a cada sección sin scrollear. Es la misma página para docente y estudiante. */}
          <nav className="pg-tabs" aria-label="Ir a sección" style={{ marginBottom: 8 }}>
            <a className="pg-tab" href="#sec-clases">Mis clases</a>
            <a className="pg-tab" href="#sec-avisos">Avisos recientes</a>
            <a className="pg-tab" href="#sec-actividad">Actividad reciente</a>
          </nav>
          {(state.data.tareasPendientes != null || entregadas != null || state.data.trabajosCalificados != null || proximas.length > 0) && (
            <section className="pg-kpis" aria-label="Resumen">
              {state.data.tareasPendientes != null && (
                <div className="pg-kpi"><span className="pg-kpi__value">{state.data.tareasPendientes}</span><span className="pg-kpi__label">Tareas pendientes</span></div>
              )}
              {entregadas != null && (
                <div className="pg-kpi"><span className="pg-kpi__value">{entregadas}</span><span className="pg-kpi__label">Entregadas · por calificar</span></div>
              )}
              {state.data.trabajosCalificados != null && (
                <div className="pg-kpi"><span className="pg-kpi__value">{state.data.trabajosCalificados}</span><span className="pg-kpi__label">Trabajos calificados</span></div>
              )}
              {proximas.length > 0 && (
                <div className="pg-kpi"><span className="pg-kpi__value">{proximas.length}</span><span className="pg-kpi__label">Próximas entregas</span></div>
              )}
            </section>
          )}

          <section>
            <div className="section-head">
              <h2 id="sec-clases">Mis clases</h2>
              <Link to="/mis-clases">Ver todas →</Link>
            </div>
            {(state.data.clases ?? []).length === 0 ? (
              <div className="pg-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <span>Aún no tienes clases. {user?.rol === 'DOCENTE' ? 'Crea tu primera clase y empieza desde cero.' : user?.rol === 'ADMIN' ? 'Aún no hay clases en Aulix.' : 'Pide el código a tu docente y únete desde Mis clases.'}</span>
                {user?.rol === 'DOCENTE'
                  ? <Link className="btn btn--primary btn--sm" to="/mis-clases">Crear mi primera clase</Link>
                  : user?.rol !== 'ADMIN' && <Link className="btn btn--primary btn--sm" to="/mis-clases">Ir a Mis clases</Link>}
              </div>
            ) : (
              <div className="classes">
                {(state.data.clases ?? []).map((c) => <ClassCard key={c.id} clase={c} />)}
              </div>
            )}
          </section>

          {avisos.length > 0 && (
            <section>
              <div className="section-head">
                <h2 id="sec-avisos"><Megaphone size={18} style={{ verticalAlign: '-3px', marginRight: 6 }} />Avisos recientes</h2>
                <Link to="/mis-clases">Ver clases →</Link>
              </div>
              <div className="avisos-list">
                {avisos.map((a) => (
                  <article key={`${a.claseId}-${a.id}`} className="aviso">
                    <div className="aviso__body">
                      <div className="aviso__meta">
                        <strong>{a.autorNombre} · {a.claseNombre}</strong>
                        <span>{fmtAviso(a.createdAt)}</span>
                      </div>
                      <p className="aviso__texto">{a.texto}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {proximas.length > 0 && (
            <section>
              <div className="section-head">
                <h2>Próximas entregas</h2>
                <Link to="/tareas">Ver tareas →</Link>
              </div>
              <div className="feed">
                {proximas.map((t) => (
                  <div key={t.id} className="feed__item">
                    <div className="feed__text">
                      <p className="feed__title">{t.titulo}</p>
                      <p className="feed__detail">{t.claseNombre ?? ''}{t.fechaVencimiento ? ` · Vence ${new Date(t.fechaVencimiento).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="section-head">
              <h2 id="sec-actividad">Actividad reciente</h2>
              <Link to="/tareas">Ver actividad →</Link>
            </div>
            <div className="feed">
              <form className="feed__composer" onSubmit={publicar}>
                <Avatar name={user?.nombre} src={user?.avatar} />
                <input
                  className="feed__input"
                  type="text"
                  placeholder="¿Qué quieres compartir con tu clase?"
                  aria-label="Escribe una publicación"
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                />
                <button type="submit" className="btn btn--primary btn--sm" disabled={!post.trim()}>Publicar</button>
              </form>
              {publicaciones.map((a) => (
                <div key={a.id} className="feed__item">
                  <Avatar name={a.iniciales} tone={a.tema} />
                  <div className="feed__text">
                    <p className="feed__title">{a.texto}</p>
                    <p className="feed__detail">{a.detalle}</p>
                  </div>
                  <CircleCheck size={34} strokeWidth={1.3} className="feed__check" aria-hidden="true" />
                </div>
              ))}
              {(state.data.actividad ?? []).map((a) => (
                <div key={a.id} className="feed__item">
                  <Avatar name={a.iniciales} tone={a.tema} />
                  <div className="feed__text">
                    <p className="feed__title">{a.texto}</p>
                    <p className="feed__detail">{a.detalle}</p>
                  </div>
                  <CircleCheck size={34} strokeWidth={1.3} className="feed__check" aria-hidden="true" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
