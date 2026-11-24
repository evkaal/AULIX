import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw, WifiOff } from 'lucide-react'
import Avatar from '../components/Avatar'
import { DemoBanner } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/authService'
import { fmtFecha, fmtFechaHora, miEstadoBadge } from '../utils/format'
import AvisosClase from '../components/AvisosClase'
import ChatClase from '../components/ChatClase'
import MaterialesSection from '../components/MaterialesSection'
import '../styles/pages.css'

// Detalle de una materia (ruta /mis-clases/:id, Figma "Matemáticas · Alumnos").
// Backend real: GET /api/clases/{id}, GET /api/clases/{id}/alumnos?page&size&q
// (Page), GET /api/clases/{id}/mis-tareas (estudiante) o /api/tareas?materiaId=
// (docente), GET /api/clases/{id}/mi-progreso (estudiante).
export default function ClaseDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const [clase, setClase] = useState(null)
  const [alumnos, setAlumnos] = useState(null)
  const [tareas, setTareas] = useState([])
  const [progreso, setProgreso] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  // Pestañas de la clase (v5): Avisos | Mensajes | Materiales/Videos, todo
  // junto y por clase. Las tareas y los alumnos siguen arriba, fuera de las pestañas.
  const [tab, setTab] = useState('avisos')

  const loadAlumnos = useCallback(async (p = 0, query = '') => {
    try {
      const params = new URLSearchParams({ page: String(p), size: '8' })
      if (query.trim()) params.set('q', query.trim())
      setAlumnos(await apiFetch(`/clases/${id}/alumnos?${params}`))
      setPage(p)
    } catch { setAlumnos(null) }
  }, [id])

  const load = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      const c = await apiFetch(`/clases/${id}`)
      setClase(c)
      if (esDocente) {
        setTareas(await apiFetch(`/tareas?materiaId=${id}`))
        await loadAlumnos(0, '')
      } else {
        setTareas(await apiFetch(`/clases/${id}/mis-tareas`))
        setProgreso(await apiFetch(`/clases/${id}/mi-progreso`))
      }
      setStatus('ready')
    } catch (err) { setError(err.message); setStatus('error') }
  }, [id, esDocente, loadAlumnos])
  useEffect(() => { load() }, [load])

  return (
    <>
      <DemoBanner />
      <Link className="back-link" to="/mis-clases"><ArrowLeft size={16} /> Volver a Mis clases</Link>
      <div className="page-head" style={{ marginTop: 8 }}>
        <div>
          <h1 className="page-title">{clase?.nombre ?? 'Materia'}</h1>
          <p className="page-subtitle">{clase ? `${clase.grupo} · Ciclo ${clase.ciclo} · ${clase.docenteNombre ?? ''} · Código: ${clase.codigoInvitacion ?? '—'}` : 'Detalle de la materia.'}</p>
        </div>
      </div>
      {status === 'loading' && <p className="pg-loading">Cargando materia…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert"><WifiOff size={18} /><span>No pudimos cargar la materia. {error}</span><button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button></div>
      )}
      {status === 'ready' && clase && (
        <>
          <div className="pg-kpis">
            <div className="pg-kpi"><span className="pg-kpi__value">{clase.estudiantes ?? 0}</span><span className="pg-kpi__label">Estudiantes</span></div>
            <div className="pg-kpi"><span className="pg-kpi__value">{clase.tareasActivas ?? tareas.length}</span><span className="pg-kpi__label">Tareas activas</span></div>
            {progreso && <div className="pg-kpi"><span className="pg-kpi__value">{progreso.promedio != null ? `${progreso.promedio}/10` : '—'}</span><span className="pg-kpi__label">Mi promedio{progreso.promedio == null ? ' · Sin calificaciones aún' : ''}</span></div>}
            {progreso && <div className="pg-kpi"><span className="pg-kpi__value">{progreso.entregadas}/{progreso.tareasTotales}</span><span className="pg-kpi__label">Entregadas</span></div>}
          </div>
          <div className="section-head"><h2>{esDocente ? 'Tareas de la materia' : 'Mis tareas'}</h2></div>
          {tareas.length === 0 ? <p className="pg-empty">Aún no hay tareas en esta materia.</p> : (
            <div className="pg-table-wrap"><table className="pg-table"><thead><tr><th>TAREA</th><th>VENCIMIENTO</th><th>ESTADO</th>{!esDocente && <th>MI ESTADO</th>}<th>ACCIÓN</th></tr></thead>
              <tbody>{[...tareas].sort((a, b) => String(a.fechaVencimiento || '').localeCompare(String(b.fechaVencimiento || ''))).map((t) => {
                const b = miEstadoBadge(t.miEstado)
                const entregada = b.clase !== 'pendiente'
                return (
                  <tr key={t.id}>
                    <td className="pg-strong">{t.titulo}</td>
                    <td>{fmtFecha(t.fechaVencimiento)}</td>
                    <td><span className={`pg-badge pg-badge--${t.estado === 'ACTIVA' ? 'activa' : t.estado === 'PROGRAMADA' ? 'programada' : 'cerrada'}`}>{t.estado}</span></td>
                    {!esDocente && <td><span className={`pg-badge pg-badge--${b.clase}`}>{b.label}</span>{t.miNota != null ? ` · ${t.miNota}/10` : ''}</td>}
                    <td><Link className="btn btn--ghost btn--sm" to={`/tareas/${t.id}`}>{!esDocente ? (entregada ? 'Ver entrega' : 'Entregar') : 'Ver tarea'}</Link></td>
                  </tr>
                )
              })}</tbody></table></div>
          )}
          {esDocente && (
            <>
              <div className="section-head"><h2>Alumnos</h2></div>
              <div className="pg-toolbar" style={{ marginBottom: 12 }}>
                <label className="pg-search"><input type="search" placeholder="Buscar alumno…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadAlumnos(0, e.target.value) }} aria-label="Buscar alumno" /></label>
              </div>
              {!alumnos ? <p className="pg-empty">No se pudieron cargar los alumnos.</p> : alumnos.content?.length === 0 ? <p className="pg-empty">Aún no hay alumnos en esta materia.</p> : (
                <>
                  <div className="pg-table-wrap"><table className="pg-table"><thead><tr><th>ALUMNO</th><th>CORREO</th><th>ENTREGAS</th><th>POR CALIFICAR</th><th>PROMEDIO</th></tr></thead>
                    <tbody>{(alumnos.content ?? []).map((a) => (
                      <tr key={a.id}><td><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={a.nombre} src={a.avatar} size={28} /><strong>{a.nombre}</strong></span></td><td>{a.correo}</td><td>{a.entregasRecibidas}/{a.entregasTotales}</td><td>{a.porCalificar ?? 0}</td><td>{a.promedio != null ? `${a.promedio}/10` : '—'}</td></tr>
                    ))}</tbody></table></div>
                  <div className="pg-pager"><span>Mostrando {alumnos.content?.length ?? 0} de {alumnos.totalElements ?? 0} alumnos</span><span><button type="button" className="btn btn--ghost btn--sm" disabled={page <= 0} onClick={() => loadAlumnos(page - 1, q)}>← Anterior</button>{' '}<button type="button" className="btn btn--ghost btn--sm" disabled={page + 1 >= (alumnos.totalPages ?? 1)} onClick={() => loadAlumnos(page + 1, q)}>Siguiente →</button></span></div>
                </>
              )}
            </>
          )}
          <div className="pg-tabs" role="tablist" aria-label="Secciones de la clase" style={{ marginTop: 20 }}>
            {[
              { value: 'avisos', label: 'Avisos' },
              { value: 'mensajes', label: 'Mensajes' },
              { value: 'materiales', label: 'Materiales / Videos' },
            ].map((t) => (
              <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} className={`pg-tab${tab === t.value ? ' is-active' : ''}`} onClick={() => setTab(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'avisos' && <AvisosClase claseId={Number(id)} claseNombre={clase.nombre || 'esta materia'} esDocente={esDocente} />}
          {tab === 'mensajes' && <ChatClase claseId={Number(id)} claseNombre={clase.nombre || 'esta materia'} grupo={clase.grupo || ''} />}
          {tab === 'materiales' && <MaterialesSection claseId={Number(id)} esDocente={esDocente} claseNombre={clase.nombre} />}
          <p className="pg-hint" style={{ marginTop: 12 }}>Última actualización: {fmtFechaHora(new Date().toISOString())}</p>
        </>
      )}
    </>
  )
}
