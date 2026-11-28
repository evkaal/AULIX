import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Printer, RefreshCw, Search, TriangleAlert, WifiOff } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch, apiFetchText } from '../services/authService'
import { fmtFecha, fmtFechaHora } from '../utils/format'
import { scrollToRef } from '../utils/scroll'
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
  // Lote 2C: al elegir una acción se baja sola hasta su panel.
  const alumnosRef = useRef(null)
  const entregasRef = useRef(null)
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

  // Última búsqueda ya pedida al servidor (evita repetir la petición
  // cuando el mismo texto llega por Enter, por pestaña o por el debounce).
  const ultimaBusqueda = useRef('')
  const cargarAlumnos = useCallback(async (claseId, p = 0, f = filtro, query = q) => {
    setAlumnosStatus('loading')
    setAlumnosError('')
    try {
      const params = new URLSearchParams({ page: String(p), size: String(PAGE_SIZE) })
      if (f) params.set('filtro', f)
      if (query.trim()) params.set('q', query.trim())
      ultimaBusqueda.current = query.trim()
      setAlumnos(await apiFetch(`/clases/${claseId}/alumnos?${params}`))
      setPage(p)
      setAlumnosStatus('ready')
    } catch (err) {
      setAlumnosError(err.message)
      setAlumnosStatus('error')
    }
  }, [filtro, q])

  // Búsqueda en vivo: al escribir se espera 400 ms y se busca en el
  // servidor (?q=), igual que al pulsar Enter. Antes la búsqueda solo se
  // disparaba con Enter y el texto no parecía hacer nada al teclear.
  useEffect(() => {
    if (!claseSel) return undefined
    if (q.trim() === ultimaBusqueda.current) return undefined
    const t = setTimeout(() => {
      ultimaBusqueda.current = q.trim()
      cargarAlumnos(claseSel.claseId, 0, filtro, q)
    }, 400)
    return () => clearTimeout(t)
  }, [q, claseSel, filtro, cargarAlumnos])

  const verClase = (clase) => {
    setClaseSel(clase)
    setAlumnoSel(null)
    setEntregas([])
    setFiltro('')
    setQ('')
    cargarAlumnos(clase.claseId, 0, '', '')
    setTimeout(() => scrollToRef(alumnosRef), 50)
  }

  const verAlumno = async (alumno) => {
    setAlumnoSel(alumno)
    setEntregasStatus('loading')
    setEntregasError('')
    try {
      setEntregas(await apiFetch(`/clases/${claseSel.claseId}/alumnos/${alumno.id}/entregas`))
      setTimeout(() => scrollToRef(entregasRef), 50)
      setEntregasStatus('ready')
    } catch (err) {
      setEntregasError(err.message)
      setEntregasStatus('error')
    }
  }

  // Lee el CSV del backend (GET /api/calificaciones/exportar, endpoint que
  // ya existe) y lo convierte a filas para armar una exportacion bonita.
  const obtenerFilasExport = async (claseParam) => {
    const params = new URLSearchParams()
    const claseExport = claseParam ?? claseSel
    if (claseExport) params.set('materiaId', claseExport.claseId)
    params.set('ciclo', '2026')
    const csv = await apiFetchText(`/calificaciones/exportar?${params}`)
    const rows = parseCsv(csv)
    return rows.slice(1).map((r) => ({ alumno: r[0] ?? '', correo: r[1] ?? '', tarea: r[2] ?? '', clase: r[3] ?? '', nota: r[4] ?? '', comentario: r[5] ?? '', fecha: r[6] ?? '' }))
  }
  const descargar = (blob, nombre) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const fechaExport = () => new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())

  // Lote 4C: exportarCSV(claseParam) exporta solo esa materia; sin
  // parámetro exporta todas, agrupadas por materia en secciones.
  const exportarCSV = async (claseParam) => {
    setExportando(true)
    setExportError('')
    try {
      const filas = await obtenerFilasExport(claseParam)
      const claseExport = claseParam ?? claseSel

      const lineas = lineasCSV(filas, claseExport, fechaExport())









      if (!filas.length) lineas.push('Sin calificaciones registradas.')
      const hoy = new Date().toISOString().slice(0, 10)
      descargar(new Blob(['\ufeff' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' }), `calificaciones-${claseExport ? claseExport.claseId : 'todas'}-${hoy}.csv`)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExportando(false)
    }
  }

  // Tabla para imprimir / guardar como PDF (ventana de impresion del
  // navegador, sin librerias nuevas): en el dialogo elige "Guardar como PDF".
  const imprimirTabla = async () => {
    setExportando(true)
    setExportError('')
    try {
      const filas = await obtenerFilasExport()
      const claseNombre = claseSel?.claseNombre ?? 'Todas las clases'
      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) {
        setExportError('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para Aulix e inténtalo de nuevo.')
        return
      }
      const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Calificaciones — Aulix</title><style>
        body{font-family:system-ui,sans-serif;color:#12365b;margin:32px} h1{font-size:20px;margin:0 0 4px}
        p{margin:2px 0;color:#5a6b80;font-size:13px} table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
        th,td{border:1px solid #c8d3e0;padding:8px 10px;text-align:left} th{background:#eaf4ff} tr:nth-child(even) td{background:#f4f7fb}
        @media print{body{margin:0}}
      </style></head><body><h1>Aulix — Calificaciones</h1><p>Clase: ${esc(claseNombre)} · Ciclo: 2026 · Fecha de exportación: ${esc(fechaExport())} · Total: ${filas.length}</p>
      ${filas.length ? `<table><thead><tr><th>Alumno</th><th>Correo</th><th>Tarea</th><th>Clase</th><th>Nota</th><th>Comentario</th><th>Fecha</th></tr></thead><tbody>${filas.map((f) => `<tr><td>${esc(f.alumno)}</td><td>${esc(f.correo)}</td><td>${esc(f.tarea)}</td><td>${esc(f.clase)}</td><td>${esc(f.nota)}</td><td>${esc(f.comentario)}</td><td>${esc(f.fecha)}</td></tr>`).join('')}</tbody></table>` : '<p>Sin calificaciones registradas.</p>'}
      </body></html>`)
      win.document.close()
      win.focus()
      win.print()
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
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--ghost btn-download" onClick={exportarCSV} disabled={exportando}>
              <Download size={16} /> {exportando ? 'Exportando…' : 'Exportar calificaciones (CSV)'}
            </button>
            <button type="button" className="btn btn--ghost btn-download" onClick={imprimirTabla} disabled={exportando}>
              <Printer size={16} /> Imprimir tabla de calificaciones (PDF)
            </button>
          </span>
        )}
      </div>
      <p className="pg-hint">El CSV trae encabezado con clase, ciclo y fecha de exportación. &ldquo;Imprimir tabla&rdquo; abre la tabla lista para imprimir o guardar como PDF.</p>
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

          </div>

          <div className="section-head"><h2>Por materia</h2></div>
          {resumen.porClase?.length === 0 ? (
            <p className="pg-empty">Aún no hay entregas en tus materias.</p>
          ) : (
            <div className="pg-cards">
              {(resumen.porClase ?? []).map((c) => (
                <article key={c.claseId} className={`pg-card${claseSel?.claseId === c.claseId ? ' is-selected' : ''}`}>
                  <h3>{c.claseNombre}</h3>
                  <p>{c.entregasRecibidas ?? 0} entregas recibidas</p>
                  <div className="pg-card__footer">
                    <span>{c.porCalificar > 0 ? <span className="pg-badge pg-badge--pendiente">{c.porCalificar} por calificar</span> : 'Al día'}</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => verClase(c)}>Ver alumnos →</button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => exportarCSV(c)} disabled={exportando}>Exportar CSV de esta materia</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {claseSel && esDocente && (
        <section ref={alumnosRef} style={{ marginTop: 8 }}>
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
                      {(alumnos.content ?? []).map((a) => (
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
        <section ref={entregasRef} style={{ marginTop: 16 }}>
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
            className="btn btn--ghost btn--sm btn-download"
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

// Mini parser CSV (respeta comillas y comas dentro de comillas) para leer
// el CSV que devuelve GET /api/calificaciones/exportar.
function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQ = false
  const pushCell = () => { row.push(cur); cur = '' }
  const pushRow = () => { rows.push(row); row = [] }
  for (let i = 0; i < (text || '').length; i += 1) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1 } else inQ = false
      } else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') pushCell()
    else if (ch === '\n') { pushCell(); pushRow() }
    else if (ch !== '\r') cur += ch
  }
  if (cur !== '' || row.length) { pushCell(); pushRow() }
  return rows.filter((r) => r.length > 1 || (r[0] ?? '').trim() !== '')
}
// Lote 4C: arma el texto del CSV. Con una materia, encabezado simple;
// sin materia (general), agrupa las filas por materia en secciones.
function lineasCSV(filas, claseExport, fecha) {
  const encabezado = ['Alumno', 'Correo', 'Tarea', 'Clase', 'Nota', 'Comentario', 'Fecha'].map(csvCellOut).join(',')
  const filaCSV = (f) => [f.alumno, f.correo, f.tarea, f.clase, f.nota, f.comentario, f.fecha].map(csvCellOut).join(',')
  if (claseExport) {
    return [
      'Aulix — Calificaciones',
      `Clase: ${claseExport.claseNombre ?? ''}`,
      'Ciclo: 2026',
      `Fecha de exportación: ${fecha}`,
      `Total de calificaciones: ${filas.length}`,
      '',
      encabezado,
      ...filas.map(filaCSV),
    ]
  }
  const porClase = {}
  for (const f of filas) { (porClase[f.clase || 'Sin materia'] ??= []).push(f) }
  const lineas = [
    'Aulix — Calificaciones',
    'Clase: Todas las clases',
    'Ciclo: 2026',
    `Fecha de exportación: ${fecha}`,
    `Total de calificaciones: ${filas.length}`,
    '',
  ]
  for (const [clase, grupo] of Object.entries(porClase)) {
    lineas.push('---', clase, encabezado, ...grupo.map(filaCSV), '')
  }
  return lineas
}
function csvCellOut(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}
