import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, RefreshCw, Search, TriangleAlert, WifiOff } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch, apiFetchText } from '../services/authService'
import { fmtFecha, fmtFechaHora } from '../utils/format'
import '../styles/pages.css'

const PAGE_SIZE = 8

export default function Calificaciones() {
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const [resumen, setResumen] = useState(null)
  const [misNotas, setMisNotas] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [claseSel, setClaseSel] = useState(null)
  const [alumnos, setAlumnos] = useState(null)
  const [alumnosStatus, setAlumnosStatus] = useState('idle')
  const [alumnosError, setAlumnosError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [alumnoSel, setAlumnoSel] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [entregasStatus, setEntregasStatus] = useState('idle')
  const [entregasError, setEntregasError] = useState('')
  const [exportando, setExportando] = useState(false)
  const [exportError, setExportError] = useState('')

  const loadResumen = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      if (esDocente) {
        setResumen(await apiFetch('/calificaciones/resumen'))
      } else {
        setMisNotas(await apiFetch('/estudiante/calificaciones'))
      }
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [esDocente])

  useEffect(() => { loadResumen() }, [loadResumen])

  const cargarAlumnos = useCallback(async (claseId, p = 0, f = filtro, query = q) => {
    setAlumnosStatus('loading')
    setAlumnosError('')
    try {
      const params = new URLSearchParams({ page: String(p), size: String(PAGE_SIZE) })
      if (f) params.set('filtro', f)
      if (query.trim()) params.set('q', query.trim())
      setAlumnos(await apiFetch(`/clases/${claseId}/alumnos?${params}`))
      setPage(p)
      setAlumnosStatus('ready')
    } catch (err) {
      setAlumnosError(err.message)
      setAlumnosStatus('error')
    }
  }, [filtro, q])

  const verClase = (clase) => {
    setClaseSel(clase)
    setAlumnoSel(null)
    setEntregas([])
    setFiltro('')
    setQ('')
    cargarAlumnos(clase.claseId, 0, '', '')
  }

  const verAlumno = async (alumno) => {
    setAlumnoSel(alumno)
    setEntregasStatus('loading')
    setEntregasError('')
    try {
      setEntregas(await apiFetch(`/clases/${claseSel.claseId}/alumnos/${alumno.id}/entregas`))
      setEntregasStatus('ready')
    } catch (err) {
      setEntregasError(err.message)
      setEntregasStatus('error')
    }
  }

  const exportar = async () => {
    setExportando(true)
    setExportError('')
    try {
      const params = new URLSearchParams()
      if (claseSel) params.set('materiaId', claseSel.claseId)
      params.set('ciclo', '2026')
      const csv = await apiFetchText(`/calificaciones/exportar?${params}`)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'calificaciones.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExportando(false)
    }
  }

  const porCalificarTotal = resumen?.porClase?.reduce((a, c) => a + (c.porCalificar ?? 0), 0) ?? 0

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{esDocente ? 'Calificaciones' : 'Mis calificaciones'}</h1>
          <p className="page-subtitle">{esDocente ? 'Revisa y califica los trabajos entregados.' : 'Tus notas y la retroalimentación de tus docentes.'}</p>
        </div>
        {esDocente && (
          <button type="button" className="btn btn--ghost" onClick={exportar} disabled={exportando}>
            <Download size={16} /> {exportando ? 'Exportando...' : 'Exportar calificaciones'}
          </button>
        )}
      </div>
      {exportError && <p className="pg-error" role="alert">{exportError}</p>}

      {status === 'loading' && <p className="pg-loading">Cargando calificaciones…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar las calificaciones. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={loadResumen}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}

      {status === 'ready' && !esDocente && (
        <>
          {misNotas.length === 0 ? (
            <p className="pg-empty">Aún no tienes trabajos calificados.</p>
          ) : (
            <div className="pg-table-wrap">
              <table className="pg-table">
                <thead><tr><th>TRABAJO</th><th>NOTA</th><th>REVISIÓN</th><th>FECHA</th></tr></thead>
                <tbody>
                  {misNotas.map((c) => (
                    <tr key={c.id}>
                      <td className="pg-strong">{c.tareaTitulo}</td>
                      <td>{c.nota}/10</td>
                      <td>{c.comentario ?? '—'}<br /><span className="pg-sub">{c.docenteNombre}</span></td>
                      <td>{fmtFecha(c.fechaCalificacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {status === 'ready' && esDocente && resumen && (
        <>
          <div className="pg-kpis">
            <div className="pg-kpi"><span className="pg-kpi__value">{porCalificarTotal}</span><span className="pg-kpi__label">Entregas por calificar</span></div>
            <div className="pg-kpi"><span className="pg-kpi__value">{resumen.calificacionesTotales ?? 0}</span><span className="pg-kpi__label">Entregas calificadas</span></div>
            <div className="pg-kpi"><span className="pg-kpi__value">{resumen.promedioGeneral ?? 0}/10</span><span className="pg-kpi__label">Promedio general</span></div>
          </div>

          <div className="section-head"><h2>Por materia</h2></div>
          {resumen.porClase?.length === 0 ? (
            <p className="pg-empty">Aún no hay entregas en tus materias.</p>
          ) : (
            <div className="pg-cards">
              {resumen.porClase.map((c) => (
                <article key={c.claseId} className={`pg-card${claseSel?.claseId === c.claseId ? ' is-selected' : ''}`}>
                  <h3>{c.claseNombre}</h3>
                  <p>{c.entregasRecibidas ?? 0} entregas recibidas</p>
                  <div className="pg-card__footer">
                    <span>{c.porCalificar > 0 ? <span className="pg-badge pg-badge--pendiente">{c.porCalificar} por calificar</span> : 'Al día'}</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => verClase(c)}>Ver alumnos →</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {claseSel && esDocente && (
        <section style={{ marginTop: 8 }}>
          <div className="section-head">
            <h2>Alumnos · {claseSel.claseNombre}</h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setClaseSel(null); setAlumnoSel(null); setEntregas([]) }}>Cerrar</button>
          </div>
          <div className="pg-toolbar" style={{ marginBottom: 12 }}>
            <div className="pg-tabs" role="tablist" aria-label="Filtrar alumnos">
              {[
                { value: '', label: 'Todos' },
                { value: 'pendientes', label: 'Con pendientes' },
              ].map((t) => (
                <button key={t.value || 'todos'} type="button" role="tab" aria-selected={filtro === t.value} className={`pg-tab${filtro === t.value ? ' is-active' : ''}`} onClick={() => { setFiltro(t.value); cargarAlumnos(claseSel.claseId, 0, t.value, q) }}>
                  {t.label}
                </button>
              ))}
            </div>
            <label className="pg-search">
              <Search size={17} aria-hidden="true" />
              <input type="search" placeholder="Buscar alumno…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') cargarAlumnos(claseSel.claseId, 0, filtro, e.target.value) }} aria-label="Buscar alumno" />
            </label>
          </div>

          {alumnosStatus === 'loading' && <p className="pg-loading">Cargando alumnos…</p>}
          {alumnosStatus === 'error' && (
            <div className="pg-alert" role="alert">
              <TriangleAlert size={18} />
              <span>{alumnosError}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => cargarAlumnos(claseSel.claseId, page)}>Reintentar</button>
            </div>
          )}
          {alumnosStatus === 'ready' && alumnos && (
            <>
              {alumnos.content?.length === 0 ? (
                <p className="pg-empty">Sin alumnos con ese filtro.</p>
              ) : (
                <div className="pg-table-wrap">
                  <table className="pg-table">
                    <thead><tr><th>ALUMNO</th><th>ENTREGAS</th><th>POR CALIFICAR</th><th>PROMEDIO</th></tr></thead>
                    <tbody>
                      {alumnos.content.map((a) => (
                        <tr key={a.id} className="is-clickable" onClick={() => verAlumno(a)}>
                          <td><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={a.nombre} src={a.avatar} size={32} /><span><span className="pg-strong">{a.nombre}</span><br /><span className="pg-sub">{a.correo}</span></span></span></td>
                          <td>{a.entregasRecibidas}/{a.entregasTotales}</td>
                          <td>{a.porCalificar > 0 ? <span className="pg-badge pg-badge--pendiente">{a.porCalificar} por calificar</span> : 'Al día'}</td>
                          <td>{a.promedio == null ? '—' : `${a.promedio}/10`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="pg-pager">
                <span>Mostrando {alumnos.content?.length ?? 0} de {alumnos.totalElements ?? 0} alumnos</span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 0} onClick={() => cargarAlumnos(claseSel.claseId, page - 1)}>← Anterior</button>
                  <button type="button" className="btn btn--ghost btn--sm" disabled={page + 1 >= (alumnos.totalPages ?? 1)} onClick={() => cargarAlumnos(claseSel.claseId, page + 1)}>Siguiente →</button>
                </span>
              </div>
            </>
          )}
        </section>
      )}

      {alumnoSel && claseSel && esDocente && (
        <section style={{ marginTop: 16 }}>
          <div className="section-head">
            <h2>{alumnoSel.nombre} · Trabajos entregados</h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setAlumnoSel(null); setEntregas([]) }}>Cerrar</button>
          </div>
          {entregasStatus === 'loading' && <p className="pg-loading">Cargando entregas…</p>}
          {entregasStatus === 'error' && (
            <div className="pg-alert" role="alert">
              <TriangleAlert size={18} />
              <span>{entregasError}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => verAlumno(alumnoSel)}>Reintentar</button>
            </div>
          )}
          {entregasStatus === 'ready' && entregas.length === 0 && <p className="pg-empty">Este alumno aún no ha entregado trabajos en esta materia.</p>}
          {entregasStatus === 'ready' && entregas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entregas.map((e) => (
                <EntregaCard key={e.id} entrega={e} onCalificada={() => { verAlumno(alumnoSel); loadResumen() }} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  )
}

function EntregaCard({ entrega, onCalificada }) {
  const [nota, setNota] = useState(entrega.nota ?? '')
  const [comentario, setComentario] = useState(entrega.comentarioCalificacion ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setOk(false)
    const n = Number(nota)
    if (Number.isNaN(n) || n < 0 || n > 10) {
      setError('La nota debe estar entre 0 y 10.')
      return
    }
    setSaving(true)
    try {
      // POST para la primera calificación, PUT para volver a calificar.
      await apiFetch(`/entregas/${entrega.id}/calificacion`, {
        method: entrega.estado === 'CALIFICADA' ? 'PUT' : 'POST',
        body: JSON.stringify({ nota: n, comentario: comentario.trim() || null }),
      })
      setOk(true)
      onCalificada()
    } catch (err) {
      setError(err.detalles ? Object.values(err.detalles).join(' ') : err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="pg-card">
      <div className="pg-card__row">
        <div>
          <h3 style={{ fontSize: 15 }}>{entrega.tareaTitulo}</h3>
          <p>{entrega.archivoNombre ?? 'Sin archivo'} · Entregado {fmtFechaHora(entrega.fechaEntrega)} · {entrega.aTiempo ? 'A tiempo' : 'Tarde'}</p>
        </div>
        {entrega.estado === 'CALIFICADA'
          ? <span className="pg-badge pg-badge--calificada">Calificado · {entrega.nota}/10</span>
          : <span className="pg-badge pg-badge--pendiente">Por calificar</span>}
      </div>
      {entrega.comentario && <p>Comentario del alumno: “{entrega.comentario}”</p>}
      {entrega.archivoNombre && (
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--ghost btn--sm" to={`/calificaciones/entrega/${entrega.id}`}>Vista previa →</Link>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => apiDownload(`/entregas/${entrega.id}/archivo`, entrega.archivoNombre).catch(() => {})}
          >
            <Download size={14} /> Descargar {entrega.archivoNombre}
          </button>
        </span>
      )}
      <form className="pg-form" onSubmit={guardar}>
        <div className="pg-grid" style={{ gridTemplateColumns: '160px 1fr' }}>
          <label className="pg-field">
            <span className="pg-label">Calificación (0–10)</span>
            <input className="pg-input" type="number" min="0" max="10" step="0.1" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="9.0" />
          </label>
          <label className="pg-field">
            <span className="pg-label">Comentario para el alumno</span>
            <input className="pg-input" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Buen trabajo, revisa la comprobación." />
          </label>
        </div>
        {error && <p className="pg-error" role="alert">{error}</p>}
        {ok && <p className="pg-hint" style={{ color: '#1b6b57', fontWeight: 700 }}>Calificación guardada.</p>}
        <div className="pg-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar calificación'}</button>
        </div>
      </form>
    </article>
  )
}
