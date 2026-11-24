import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Pencil, Plus, RefreshCw, Search, Trash2, WifiOff, X } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch } from '../services/authService'
import { estadoTareaLabel, derivarEstadoTarea, fmtFechaHora, miEstadoBadge, toDatetimeLocal } from '../utils/format'
import '../styles/pages.css'

const TABS = [
  { value: '', label: 'Todas' },
  { value: 'ACTIVA', label: 'Activas' },
  { value: 'PROGRAMADA', label: 'Programadas' },
  { value: 'CERRADA', label: 'Cerradas' },
]

const emptyForm = {
  claseId: '', titulo: '', descripcion: '', instrucciones: '',
  fechaActivacion: '', fechaVencimiento: '', activacionAutomatica: true, estado: 'AUTO',
}

export default function Tareas() {
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const [tareas, setTareas] = useState([])
  const [clases, setClases] = useState([])
  const [tab, setTab] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [programando, setProgramando] = useState(null)
  const [prog, setProg] = useState({ fechaActivacion: '', fechaVencimiento: '', activacionAutomatica: true, estado: 'ACTIVA' })
  const [progSaving, setProgSaving] = useState(false)
  const [progError, setProgError] = useState('')
  // Editar: reutiliza el mismo formulario de creación, precargado. El
  // backend ya tenía PUT /api/tareas/{id}; la vista no lo usaba.
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  // Panel "Ver entregas / Calificar" del docente (bug 2).
  const [entregasTarea, setEntregasTarea] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [entregasStatus, setEntregasStatus] = useState('idle')
  const [entregasError, setEntregasError] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [eliminarError, setEliminarError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const params = new URLSearchParams()
      if (materiaId) params.set('materiaId', materiaId)
      // BUG 3 (v8): al estudiante NO se le manda `estado` al backend: el
      // backend real lo compara con miEstado (pendiente/entregada/...) y
      // ?estado=ACTIVA devolvia siempre 0 tareas. El filtro por estado de
      // la tarea se hace aqui, en el cliente, con t.estado.
      if (esDocente && tab) params.set('estado', tab)
      if (q.trim()) params.set('q', q.trim())
      const data = await apiFetch(esDocente ? `/tareas?${params}` : `/estudiante/tareas?${params}`)
      let lista = Array.isArray(data) ? data : []
      if (!esDocente && tab) lista = lista.filter((t) => t.estado === tab)
      lista = [...lista].sort((a, b) => String(a.fechaVencimiento || '').localeCompare(String(b.fechaVencimiento || '')))
      setTareas(lista)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [materiaId, tab, q, esDocente])

  useEffect(() => {
    apiFetch('/clases').then(setClases).catch(() => setClases([]))
  }, [])

  useEffect(() => { load() }, [load])

  const crearTarea = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.claseId || !form.titulo.trim()) {
      setFormError('La materia y el título son obligatorios.')
      return
    }
    setSaving(true)
    try {
      await apiFetch('/tareas', {
        method: 'POST',
        body: JSON.stringify({
          claseId: Number(form.claseId),
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim() || null,
          instrucciones: form.instrucciones.trim() || null,
          fechaActivacion: form.fechaActivacion || null,
          fechaVencimiento: form.fechaVencimiento || null,
          activacionAutomatica: form.activacionAutomatica,
          // BUG CORREGIDO (v7): antes no se mandaba `estado` y el backend
          // lo dejaba en ACTIVA siempre, así que programar no funcionaba.
          estado: derivarEstadoTarea(form),
        }),
      })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err.detalles ? Object.values(err.detalles).join(' ') : err.message)
    } finally {
      setSaving(false)
    }
  }

  const abrirEditar = (t) => {
    setEditando(t)
    setEditForm({
      claseId: String(t.claseId),
      titulo: t.titulo ?? '',
      descripcion: t.descripcion ?? '',
      instrucciones: t.instrucciones ?? '',
      fechaActivacion: toDatetimeLocal(t.fechaActivacion),
      fechaVencimiento: toDatetimeLocal(t.fechaVencimiento),
      activacionAutomatica: t.activacionAutomatica ?? true,
    })
    setEditError('')
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    setEditError('')
    if (!editForm.titulo.trim()) {
      setEditError('El título es obligatorio.')
      return
    }
    setEditSaving(true)
    try {
      // PUT exige claseId y título (validación del backend); la materia no
      // se cambia al editar, se reenvía la misma.
      await apiFetch(`/tareas/${editando.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          claseId: Number(editForm.claseId),
          titulo: editForm.titulo.trim(),
          descripcion: editForm.descripcion.trim() || null,
          instrucciones: editForm.instrucciones.trim() || null,
          fechaActivacion: editForm.fechaActivacion || null,
          fechaVencimiento: editForm.fechaVencimiento || null,
          activacionAutomatica: editForm.activacionAutomatica,
          estado: editando.estado === 'CERRADA' ? 'CERRADA' : derivarEstadoTarea(editForm),
        }),
      })
      setEditando(null)
      load()
    } catch (err) {
      setEditError(err.detalles ? Object.values(err.detalles).join(' ') : err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!confirmEliminar) return
    setEliminando(true)
    setEliminarError('')
    try {
      await apiFetch(`/tareas/${confirmEliminar.id}`, { method: 'DELETE' })
      setConfirmEliminar(null)
      load()
    } catch (err) {
      setEliminarError(err.message)
      setConfirmEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  // Ver entregas / Calificar (bug 2): SOLO endpoints que ya existen en el
  // backend real — GET /clases/{id}/alumnos (Page) y GET
  // /clases/{id}/alumnos/{alumnoId}/entregas. No existe endpoint para
  // listar las entregas de una tarea, asi que se juntan por alumno y se
  // filtran por tareaId. En demo el mock ya implementa esos dos endpoints.
  const verEntregas = useCallback(async (t) => {
    setEntregasTarea(t)
    setEntregas([])
    setEntregasStatus('loading')
    setEntregasError('')
    try {
      const todas = []
      let page = 0
      let totalPages = 1
      do {
        const pg = await apiFetch(`/clases/${t.claseId}/alumnos?page=${page}&size=100`)
        const alumnos = pg.content ?? []
        for (const a of alumnos) {
          try {
            const es = await apiFetch(`/clases/${t.claseId}/alumnos/${a.id}/entregas`)
            for (const e of (Array.isArray(es) ? es : [])) if (e.tareaId === t.id) todas.push(e)
          } catch { /* un alumno sin entregas no rompe la lista */ }
        }
        totalPages = pg.totalPages ?? 1
        page += 1
      } while (page < totalPages)
      todas.sort((a, b) => String(a.fechaEntrega || '').localeCompare(String(b.fechaEntrega || '')))
      setEntregas(todas)
      setEntregasStatus('ready')
    } catch (err) {
      setEntregasError(err.message)
      setEntregasStatus('error')
    }
  }, [])

  const abrirProgramar = (t) => {
    setProgramando(t)
    setProg({
      fechaActivacion: toDatetimeLocal(t.fechaActivacion),
      fechaVencimiento: toDatetimeLocal(t.fechaVencimiento),
      activacionAutomatica: t.activacionAutomatica ?? true,
      estado: t.estado ?? 'ACTIVA',
    })
    setProgError('')
  }

  const guardarProgramacion = async (e) => {
    e.preventDefault()
    setProgError('')
    setProgSaving(true)
    try {
      await apiFetch(`/tareas/${programando.id}/programacion`, {
        method: 'PUT',
        body: JSON.stringify({
          fechaActivacion: prog.fechaActivacion || null,
          fechaVencimiento: prog.fechaVencimiento || null,
          activacionAutomatica: prog.activacionAutomatica,
          estado: derivarEstadoTarea(prog),
        }),
      })
      setProgramando(null)
      load()
    } catch (err) {
      setProgError(err.message)
    } finally {
      setProgSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{esDocente ? 'Tareas' : 'Mis tareas'}</h1>
          <p className="page-subtitle">{esDocente ? 'Crea, programa y sigue las tareas de tus clases.' : 'Tus trabajos, ordenados por vencimiento.'}</p>
        </div>
        {esDocente && (
          <button type="button" className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Crear tarea'}
          </button>
        )}
      </div>

      {showForm && esDocente && (
        <section className="pg-form-panel" aria-label="Crear tarea">
          <h3>Crear tarea</h3>
          {formError && <p className="pg-error" role="alert">{formError}</p>}
          <form className="pg-form" onSubmit={crearTarea}>
            <div className="pg-grid">
              <label className="pg-field">
                <span className="pg-label">Materia *</span>
                <select className="pg-select" value={form.claseId} onChange={(e) => setForm({ ...form, claseId: e.target.value })}>
                  <option value="">Elige una materia…</option>
                  {clases.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.grupo}</option>)}
                </select>
              </label>
              <label className="pg-field">
                <span className="pg-label">Título *</span>
                <input className="pg-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ecuaciones de primer grado" />
              </label>
              <label className="pg-field">
                <span className="pg-label">Fecha y hora de activación</span>
                <input className="pg-input" type="datetime-local" value={form.fechaActivacion} onChange={(e) => setForm({ ...form, fechaActivacion: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Fecha y hora de vencimiento</span>
                <input className="pg-input" type="datetime-local" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
              </label>
            </div>
            <label className="pg-field">
              <span className="pg-label">Descripción</span>
              <textarea className="pg-textarea" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Resumen corto de la tarea." />
            </label>
            <label className="pg-field">
              <span className="pg-label">Instrucciones</span>
              <textarea className="pg-textarea" value={form.instrucciones} onChange={(e) => setForm({ ...form, instrucciones: e.target.value })} placeholder="Pasos que deben seguir los estudiantes." />
            </label>
            <label className="pg-field">
              <span className="pg-label">Publicar como</span>
              <select className="pg-select" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <option value="AUTO">Automático (según la fecha de activación)</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="ACTIVA">Activa ahora</option>
              </select>
            </label>
            <label className="pg-check">
              <input type="checkbox" checked={form.activacionAutomatica} onChange={(e) => setForm({ ...form, activacionAutomatica: e.target.checked })} />
              Activación automática (se publica en la fecha indicada)
            </label>
            {form.fechaActivacion && new Date(form.fechaActivacion) > new Date() && form.activacionAutomatica && (
              <p className="pg-hint">Se guardará como <strong>Programada</strong> y aparecerá en el Calendario el día de su activación.</p>
            )}
            <div className="pg-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Creando...' : 'Crear tarea'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <div className="pg-tabs" role="tablist" aria-label="Filtrar tareas por estado">
        {TABS.map((t) => (
          <button key={t.value || 'todas'} type="button" role="tab" aria-selected={tab === t.value} className={`pg-tab${tab === t.value ? ' is-active' : ''}`} onClick={() => setTab(t.value)}>
            {t.label}{tab === t.value ? ` (${tareas.length})` : ''}
          </button>
        ))}
      </div>

      <div className="pg-toolbar">
        <label className="pg-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" placeholder="Buscar una tarea…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar una tarea" />
        </label>
        <select className="pg-select" style={{ width: 220 }} value={materiaId} onChange={(e) => setMateriaId(e.target.value)} aria-label="Filtrar por materia">
          <option value="">Todas las materias</option>
          {clases.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.grupo}</option>)}
        </select>
      </div>

      {eliminarError && <p className="pg-error" role="alert">{eliminarError}</p>}
      {status === 'loading' && <p className="pg-loading">Cargando tareas…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar las tareas. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {status === 'ready' && tareas.length === 0 && (
        <p className="pg-empty">
          {esDocente
            ? 'Sin resultados. Prueba con otro filtro o crea tu primera tarea.'
            : tab === 'ACTIVA'
              ? 'No tienes tareas activas en tus clases. Revisa la pestaña "Todas" o únete a una clase con su código.'
              : 'No tienes tareas en tus clases con ese filtro.'}
        </p>
      )}
      {status === 'ready' && tareas.length > 0 && (
        <div className="pg-table-wrap">
          <table className="pg-table">
            <thead><tr><th>TAREA Y MATERIA</th><th>VENCIMIENTO</th><th>ENTREGAS</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead>
            <tbody>
              {tareas.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="pg-strong">{t.titulo}</span>
                    <br /><span className="pg-sub">{t.claseNombre}</span>
                  </td>
                  <td>
                    {t.fechaVencimiento ? fmtFechaHora(t.fechaVencimiento) : '—'}
                    {t.estado === 'PROGRAMADA' && t.fechaActivacion && <><br /><span className="pg-sub">Se activa: {fmtFechaHora(t.fechaActivacion)}</span></>}
                  </td>
                  <td>
                    {esDocente
                      ? `${t.entregasRecibidas ?? 0}/${t.entregasTotales ?? 0}`
                      // v9 (bug 2): badge con el estado real (Pendiente /
                      // Entregada / Calificada + nota) en vez del texto
                      // crudo; miEstado ya viene actualizado tras entregar
                      // y tras calificar.
                      : (() => { const b = miEstadoBadge(t.miEstado); return (<><span className={`pg-badge pg-badge--${b.clase}`}>{b.label}</span>{t.miNota != null ? ` · ${t.miNota}/10` : ''}</>) })()}
                  </td>
                  <td>
                    <span className={`pg-badge pg-badge--${String(t.estado ?? '').toLowerCase()}`}>{estadoTareaLabel(t.estado)}</span>
                  </td>
                  <td>
                    {esDocente ? (
                      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => abrirEditar(t)}>
                          <Pencil size={14} /> Editar
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => abrirProgramar(t)}>
                          <Clock size={14} /> Programar
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => verEntregas(t)}>
                          Ver entregas
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => verEntregas(t)}>
                          Calificar
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEliminarError(''); setConfirmEliminar(t) }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </span>
                    ) : (
                      <Link className="btn btn--ghost btn--sm" to={`/tareas/${t.id}`}>
                        {t.miEstado === 'entregada' || t.miEstado === 'calificada' ? 'Ver entrega' : 'Entregar'}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {status === 'ready' && tareas.length > 0 && (
        <p className="pg-hint">Mostrando {tareas.length} de {tareas.length} tareas.</p>
      )}

      {entregasTarea && esDocente && (
        <section className="pg-form-panel" aria-label="Entregas de la tarea" style={{ marginTop: 16 }}>
          <div className="section-head">
            <h3 style={{ margin: 0 }}>Entregas: {entregasTarea.titulo}</h3>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEntregasTarea(null)}>Cerrar</button>
          </div>
          <p className="pg-hint" style={{ margin: 0 }}>{entregasTarea.claseNombre} · Vence {entregasTarea.fechaVencimiento ? fmtFechaHora(entregasTarea.fechaVencimiento) : '—'} · {entregas.length} entrega(s)</p>
          {entregasStatus === 'loading' && <p className="pg-loading">Cargando entregas…</p>}
          {entregasStatus === 'error' && (
            <div className="pg-alert" role="alert">
              <WifiOff size={18} />
              <span>No pudimos cargar las entregas. {entregasError}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => verEntregas(entregasTarea)}><RefreshCw size={14} /> Reintentar</button>
            </div>
          )}
          {entregasStatus === 'ready' && entregas.length === 0 && <p className="pg-empty">Aún nadie ha entregado esta tarea.</p>}
          {entregasStatus === 'ready' && entregas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entregas.map((e) => (
                <EntregaRow
                  key={e.id}
                  entrega={e}
                  autoFocusNota={entregas.findIndex((x) => x.estado !== 'CALIFICADA') === entregas.indexOf(e)}
                  onCalificada={() => { verEntregas(entregasTarea); load() }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {programando && esDocente && (
        <section className="pg-form-panel" aria-label="Programar tarea" style={{ marginTop: 16 }}>
          <h3>Programar tarea: {programando.titulo}</h3>
          <p className="pg-hint">Zona horaria del colegio: Ciudad de México (UTC−6). La tarea se publicará en la fecha de activación si la activación automática está encendida.</p>
          {progError && <p className="pg-error" role="alert">{progError}</p>}
          <form className="pg-form" onSubmit={guardarProgramacion}>
            <div className="pg-grid">
              <label className="pg-field">
                <span className="pg-label">Fecha y hora de activación</span>
                <input className="pg-input" type="datetime-local" value={prog.fechaActivacion} onChange={(e) => setProg({ ...prog, fechaActivacion: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Fecha y hora de vencimiento</span>
                <input className="pg-input" type="datetime-local" value={prog.fechaVencimiento} onChange={(e) => setProg({ ...prog, fechaVencimiento: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Estado</span>
                <select className="pg-select" value={prog.estado} onChange={(e) => setProg({ ...prog, estado: e.target.value })}>
                  <option value="ACTIVA">Activa</option>
                  <option value="PROGRAMADA">Programada</option>
                  <option value="CERRADA">Cerrada</option>
                </select>
              </label>
            </div>
            <label className="pg-check">
              <input type="checkbox" checked={prog.activacionAutomatica} onChange={(e) => setProg({ ...prog, activacionAutomatica: e.target.checked })} />
              Activación automática (se publicará en la fecha indicada)
            </label>
            <div className="pg-actions">
              <button type="submit" className="btn btn--primary" disabled={progSaving}>{progSaving ? 'Guardando...' : 'Guardar programación'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setProgramando(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}
      {editando && esDocente && (
        <section className="pg-form-panel" aria-label="Editar tarea" style={{ marginTop: 16 }}>
          <h3>Editar tarea: {editando.titulo}</h3>
          <p className="pg-hint">Materia: {editando.claseNombre} (no se cambia al editar).</p>
          {editError && <p className="pg-error" role="alert">{editError}</p>}
          <form className="pg-form" onSubmit={guardarEdicion}>
            <div className="pg-grid">
              <label className="pg-field">
                <span className="pg-label">Título *</span>
                <input className="pg-input" value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Fecha y hora de activación</span>
                <input className="pg-input" type="datetime-local" value={editForm.fechaActivacion} onChange={(e) => setEditForm({ ...editForm, fechaActivacion: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Fecha y hora de vencimiento</span>
                <input className="pg-input" type="datetime-local" value={editForm.fechaVencimiento} onChange={(e) => setEditForm({ ...editForm, fechaVencimiento: e.target.value })} />
              </label>
            </div>
            <label className="pg-field">
              <span className="pg-label">Descripción</span>
              <textarea className="pg-textarea" value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
            </label>
            <label className="pg-field">
              <span className="pg-label">Instrucciones</span>
              <textarea className="pg-textarea" value={editForm.instrucciones} onChange={(e) => setEditForm({ ...editForm, instrucciones: e.target.value })} />
            </label>
            <label className="pg-check">
              <input type="checkbox" checked={editForm.activacionAutomatica} onChange={(e) => setEditForm({ ...editForm, activacionAutomatica: e.target.checked })} />
              Activación automática (se publica en la fecha indicada)
            </label>
            <div className="pg-actions">
              <button type="submit" className="btn btn--primary" disabled={editSaving}>{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <ConfirmModal
        open={!!confirmEliminar}
        title="Eliminar tarea"
        message={confirmEliminar ? `¿Seguro que quieres eliminar "${confirmEliminar.titulo}"? Solo se puede eliminar si aún no tiene entregas de estudiantes.` : ''}
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmEliminar(null)}
      />
    </>
  )
}

// Fila de una entrega con su formulario de calificacion (docente).
// POST para la primera calificacion, PUT para volver a calificar
// (endpoints que ya existen: /api/entregas/{id}/calificacion).
function EntregaRow({ entrega, autoFocusNota, onCalificada }) {
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
          <h3 style={{ fontSize: 15 }}>{entrega.estudianteNombre ?? 'Estudiante'}</h3>
          <p>{entrega.archivoNombre ?? 'Sin archivo'} · Entregado {fmtFechaHora(entrega.fechaEntrega)} · {entrega.aTiempo ? 'A tiempo' : 'Tarde'}</p>
        </div>
        {entrega.estado === 'CALIFICADA'
          ? <span className="pg-badge pg-badge--calificada">Calificado · {entrega.nota}/10</span>
          : <span className="pg-badge pg-badge--pendiente">Por calificar</span>}
      </div>
      {entrega.comentario && <p>Comentario del alumno: &ldquo;{entrega.comentario}&rdquo;</p>}
      {entrega.archivoNombre && (
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--ghost btn--sm" to={`/calificaciones/entrega/${entrega.id}`}>Vista previa &rarr;</Link>
          <button type="button" className="btn btn--ghost btn--sm btn-download" onClick={() => apiDownload(`/entregas/${entrega.id}/archivo`, entrega.archivoNombre).catch(() => {})}>
            Descargar {entrega.archivoNombre}
          </button>
        </span>
      )}
      <form className="pg-form" onSubmit={guardar}>
        <div className="pg-grid" style={{ gridTemplateColumns: '160px 1fr' }}>
          <label className="pg-field">
            <span className="pg-label">Calificaci&oacute;n (0&ndash;10)</span>
            <input className="pg-input" type="number" min="0" max="10" step="0.1" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="9.0" autoFocus={autoFocusNota} />
          </label>
          <label className="pg-field">
            <span className="pg-label">Comentario para el alumno</span>
            <input className="pg-input" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Buen trabajo, revisa la comprobaci&oacute;n." />
          </label>
        </div>
        {error && <p className="pg-error" role="alert">{error}</p>}
        {ok && <p className="pg-hint" style={{ color: '#1b6b57', fontWeight: 700 }}>Calificaci&oacute;n guardada.</p>}
        <div className="pg-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar calificaci&oacute;n'}</button>
        </div>
      </form>
    </article>
  )
}
