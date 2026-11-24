import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, RefreshCw, Search, Trash2, TriangleAlert, WifiOff, X } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/authService'
import { ThemePicker, resolveClassTheme, classIcon } from '../components/ClassTheme'
import AvisosClase from '../components/AvisosClase'
import ChatClase from '../components/ChatClase'
import MaterialesSection from '../components/MaterialesSection'
import { fmtHora, normHora, miEstadoBadge } from '../utils/format'
import '../styles/pages.css'

const DIAS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
const emptyForm = {
  nombre: '', grupo: '', ciclo: 2026, descripcion: '', dias: ['LUN', 'MIE', 'VIE'],
  horaInicio: '08:00', horaFin: '09:00', aula: '', tema: 'blue', icono: 'book',
}

export default function MisClases() {
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const [clases, setClases] = useState([])
  const [q, setQ] = useState('')
  const [ciclo, setCiclo] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [detalleStatus, setDetalleStatus] = useState('idle')
  // Unirse con código (solo estudiante): el backend ya tiene
  // POST /api/clases/unirse, pero la vista no tenía dónde escribir el código.
  const [showUnirse, setShowUnirse] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [unirseError, setUnirseError] = useState('')
  const [unirseOk, setUnirseOk] = useState('')
  const [uniendose, setUniendose] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (ciclo) params.set('ciclo', ciclo)
      const data = await apiFetch(`/clases?${params}`)
      setClases(Array.isArray(data) ? data : [])
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [q, ciclo])

  useEffect(() => { load() }, [load])

  const abrirDetalle = useCallback(async (clase) => {
    setSeleccionada(clase)
    setDetalle(null)
    setDetalleStatus('loading')
    try {
      const [anuncios, materiales] = await Promise.all([
        apiFetch(`/clases/${clase.id}/anuncios`),
        apiFetch(`/clases/${clase.id}/materiales`),
      ])
      let alumnos = null
      let misTareas = null
      if (esDocente) {
        alumnos = await apiFetch(`/clases/${clase.id}/alumnos?page=0&size=20`)
      } else {
        misTareas = await apiFetch(`/clases/${clase.id}/mis-tareas`)
      }
      setDetalle({ anuncios, materiales, alumnos, misTareas })
      setDetalleStatus('ready')
    } catch (err) {
      setDetalle({ anuncios: [], materiales: [], alumnos: null, misTareas: null, error: err.message })
      setDetalleStatus('error')
    }
  }, [esDocente])

  const crearClase = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.nombre.trim() || !form.grupo.trim()) {
      setFormError('El nombre y el grupo son obligatorios.')
      return
    }
    setSaving(true)
    try {
      await apiFetch('/clases', {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          grupo: form.grupo.trim(),
          ciclo: form.ciclo ? Number(form.ciclo) : null,
          descripcion: form.descripcion.trim() || null,
          diasSemana: form.dias.join(','),
          horaInicio: form.horaInicio || null,
          horaFin: form.horaFin || null,
          aula: form.aula.trim() || null,
          tema: form.tema,
          icono: form.icono,
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

  const toggleDia = (dia) => setForm((f) => ({
    ...f,
    dias: f.dias.includes(dia) ? f.dias.filter((d) => d !== dia) : [...f.dias, dia],
  }))

  const unirseConCodigo = async (e) => {
    e.preventDefault()
    setUnirseError('')
    setUnirseOk('')
    if (!codigo.trim()) {
      setUnirseError('Escribe el código que te dio tu docente, por ejemplo MAT-3A-2026.')
      return
    }
    setUniendose(true)
    try {
      const clase = await apiFetch('/clases/unirse', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() }),
      })
      setUnirseOk(`Te uniste a ${clase.nombre} (${clase.grupo}).`)
      setCodigo('')
      setShowUnirse(false)
      load()
    } catch (err) {
      setUnirseError(err.detalles ? Object.values(err.detalles).join(' ') : err.message)
    } finally {
      setUniendose(false)
    }
  }

  if (seleccionada) {
    return <DetalleClase clase={seleccionada} detalle={detalle} status={detalleStatus} esDocente={esDocente} onVolver={() => { setSeleccionada(null); setDetalle(null) }} onRecargar={() => abrirDetalle(seleccionada)} onActualizada={(actualizada) => { load(); abrirDetalle(actualizada) }} onEliminada={() => { setSeleccionada(null); setDetalle(null); load() }} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{esDocente ? 'Mis clases' : 'Mis clases'}</h1>
          <p className="page-subtitle">Tus materias del ciclo escolar.</p>
        </div>
        {esDocente && (
          <button type="button" className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancelar' : 'Crear clase'}
          </button>
        )}
      </div>

      {!esDocente && (
        <div className="pg-alert pg-alert--info" role="status">
          <span>Solo tu docente puede crear clases. Aquí ves las materias en las que estás inscrito; para entrar a una nueva, pide su código y únete abajo.</span>
        </div>
      )}

      {!esDocente && (
        <section className="pg-form-panel" aria-label="Unirse a una clase con código">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Unirse a una clase</h3>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowUnirse((s) => !s)}>
              {showUnirse ? 'Cancelar' : 'Unirse con código'}
            </button>
          </div>
          {unirseOk && <p role="status" style={{ color: 'var(--green, #1B6B57)', margin: '8px 0 0' }}>{unirseOk}</p>}
          {showUnirse && (
            <form className="pg-form" onSubmit={unirseConCodigo} style={{ marginTop: 12 }}>
              <label className="pg-field">
                <span className="pg-label">Código de invitación *</span>
                <input
                  className="pg-input"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="MAT-3A-2026"
                  autoComplete="off"
                />
              </label>
              {unirseError && <p className="pg-error" role="alert">{unirseError}</p>}
              <div className="pg-actions">
                <button type="submit" className="btn btn--primary" disabled={uniendose}>{uniendose ? 'Uniéndote…' : 'Unirme a la clase'}</button>
              </div>
            </form>
          )}
        </section>
      )}

      {showForm && esDocente && (
        <section className="pg-form-panel" aria-label="Crear clase">
          <h3>Crear clase</h3>
          {formError && <p className="pg-error" role="alert">{formError}</p>}
          <form className="pg-form" onSubmit={crearClase}>
            <div className="pg-grid">
              <label className="pg-field">
                <span className="pg-label">Nombre *</span>
                <input className="pg-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Matemáticas" />
              </label>
              <label className="pg-field">
                <span className="pg-label">Grupo *</span>
                <input className="pg-input" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} placeholder="3° A" />
              </label>
              <label className="pg-field">
                <span className="pg-label">Ciclo</span>
                <input className="pg-input" type="number" value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Aula</span>
                <input className="pg-input" value={form.aula} onChange={(e) => setForm({ ...form, aula: e.target.value })} placeholder="Aula 3" />
              </label>
              <label className="pg-field">
                <span className="pg-label">Hora de inicio</span>
                <input className="pg-input" type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Hora de fin</span>
                <input className="pg-input" type="time" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} />
              </label>
              <div className="pg-field" style={{ gridColumn: '1 / -1' }}>
                <ThemePicker value={{ tema: form.tema, icono: form.icono }} nombre={form.nombre} grupo={form.grupo} onChange={(v) => setForm({ ...form, tema: v.tema, icono: v.icono })} />
              </div>
            </div>
            <label className="pg-field">
              <span className="pg-label">Descripción</span>
              <textarea className="pg-textarea" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Aprendemos a resolver, paso a paso." />
            </label>
            <div className="pg-field">
              <span className="pg-label">Días de clase</span>
              <div className="pg-checks">
                {DIAS.map((d) => (
                  <label key={d} className="pg-check">
                    <input type="checkbox" checked={form.dias.includes(d)} onChange={() => toggleDia(d)} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="pg-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Creando...' : 'Crear clase'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <div className="pg-toolbar">
        <label className="pg-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" placeholder="Buscar una materia…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar una materia" />
        </label>
        <select className="pg-select" style={{ width: 160 }} value={ciclo} onChange={(e) => setCiclo(e.target.value)} aria-label="Filtrar por ciclo">
          <option value="">Todos los ciclos</option>
          <option value="2026">Ciclo 2026</option>
          <option value="2025">Ciclo 2025</option>
        </select>
      </div>

      {status === 'loading' && <p className="pg-loading">Cargando clases…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar tus clases. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {status === 'ready' && clases.length === 0 && (
        <p className="pg-empty">
          {esDocente
            ? 'Sin resultados. Prueba con otra búsqueda o crea tu primera clase.'
            : 'Aún no estás inscrito en ninguna clase. Pide el código a tu docente y únete con el formulario de arriba.'}
        </p>
      )}
      {status === 'ready' && clases.length > 0 && (
        <>
          <div className="pg-cards">
            {clases.map((c) => {
              const theme = resolveClassTheme(c)
              const CardIcon = classIcon(c.icono)
              return (
              <article key={c.id} className="class-card">
                <div className="class-card__cover" style={{ background: theme.bg, color: theme.fg }}>
                  <CardIcon size={30} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="class-card__info">
                  <div className="class-card__row">
                    <h3 className="class-card__name">{c.nombre || "Clase sin nombre"}</h3>
                  </div>
                  <p>{c.grupo || "Sin grupo"} · Ciclo {c.ciclo}</p>
                  <p>{c.estudiantes ?? 0} estudiantes · {c.horaInicio ? `${fmtHora(`2000-01-01T${c.horaInicio}`)}–${fmtHora(`2000-01-01T${c.horaFin}`)}` : 'Sin horario'} {c.aula ? `· ${c.aula}` : ''}</p>
                  <div className="class-card__footer">
                    <span>{c.tareasActivas ?? 0} tareas activas</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => abrirDetalle(c)}>Ver clase →</button>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
          <p className="pg-hint">
            {clases.length} {clases.length === 1 ? 'materia' : 'materias'} · {clases.reduce((a, c) => a + (c.estudiantes ?? 0), 0)} inscripciones · Ciclo 2026
          </p>
        </>
      )}
    </>
  )
}

function DetalleClase({ clase, detalle, status, esDocente, onVolver, onRecargar, onActualizada, onEliminada }) {
  // Pestañas de la clase (v5): Avisos | Mensajes | Materiales/Videos.
  const [tab, setTab] = useState('avisos')
  // Editar clase: el backend ya tenía PUT /api/clases/{id}; la vista no lo usaba.
  const [showEditar, setShowEditar] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [eliminarError, setEliminarError] = useState('')

  // BUG CORREGIDO (v3): antes se pre-llenaba con el objeto de la lista,
  // que podía venir incompleto (o con horas "08:00:00" que el input
  // type=time muestra vacías). Ahora se pide la clase fresca por id y
  // las horas se normalizan a "HH:MM" antes de ponerlas en el formulario.
  const abrirEditar = async () => {
    let actual = clase
    try {
      const fresca = await apiFetch(`/clases/${clase.id}`)
      if (fresca && typeof fresca === 'object') actual = fresca
    } catch { /* se usa la clase de la lista */ }
    setEditForm({
      nombre: actual.nombre ?? '',
      grupo: actual.grupo ?? '',
      ciclo: actual.ciclo ?? 2026,
      descripcion: actual.descripcion ?? '',
      dias: actual.diasSemana ? actual.diasSemana.split(',') : ['LUN', 'MIE', 'VIE'],
      horaInicio: normHora(actual.horaInicio),
      horaFin: normHora(actual.horaFin),
      aula: actual.aula ?? '',
      tema: actual.tema ?? 'blue',
      icono: actual.icono ?? 'book',
    })
    setEditError('')
    setShowEditar(true)
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    setEditError('')
    if (!editForm.nombre.trim() || !editForm.grupo.trim()) {
      setEditError('El nombre y el grupo son obligatorios.')
      return
    }
    setEditSaving(true)
    try {
      // PUT exige nombre y grupo; se reenvían todos los campos.
      const actualizada = await apiFetch(`/clases/${clase.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: editForm.nombre.trim(),
          grupo: editForm.grupo.trim(),
          ciclo: editForm.ciclo ? Number(editForm.ciclo) : null,
          descripcion: editForm.descripcion.trim() || null,
          diasSemana: editForm.dias.join(','),
          horaInicio: normHora(editForm.horaInicio) || null,
          horaFin: normHora(editForm.horaFin) || null,
          aula: editForm.aula.trim() || null,
          tema: editForm.tema,
          icono: editForm.icono,
        }),
      })
      setShowEditar(false)
      onActualizada(actualizada)
    } catch (err) {
      setEditError(err.detalles ? Object.values(err.detalles).join(' ') : err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    setEliminarError('')
    try {
      await apiFetch(`/clases/${clase.id}`, { method: 'DELETE' })
      setConfirmEliminar(false)
      onEliminada()
    } catch (err) {
      setEliminarError(err.message)
      setConfirmEliminar(false)
    } finally {
      setEliminando(false)
    }
  }

  const toggleDiaEdit = (dia) => setEditForm((f) => ({
    ...f,
    dias: f.dias.includes(dia) ? f.dias.filter((d) => d !== dia) : [...f.dias, dia],
  }))
  // Código de invitación (solo docente): viene en clase.codigoInvitacion
  // pero la vista nunca lo mostraba, así que nadie podía compartirlo.
  const [copiado, setCopiado] = useState(false)
  const copiarCodigo = async () => {
    if (!clase.codigoInvitacion) return
    try {
      await navigator.clipboard.writeText(clase.codigoInvitacion)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onVolver}><ArrowLeft size={16} /> Mis clases</button>
          <h1 className="page-title" style={{ marginTop: 8 }}>{clase.nombre || "Clase sin nombre"}</h1>
          <p className="page-subtitle">{clase.grupo || "Sin grupo"} · Ciclo {clase.ciclo} · {clase.docenteNombre ? `Docente: ${clase.docenteNombre}` : ''} {clase.aula ? `· ${clase.aula}` : ''}</p>
          {esDocente && clase.codigoInvitacion && (
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Código para que tus alumnos se unan: <strong>{clase.codigoInvitacion}</strong>{' '}
              <button type="button" className="btn btn--ghost btn--sm" onClick={copiarCodigo}>
                {copiado ? 'Copiado ✓' : 'Copiar'}
              </button>
            </p>
          )}
          {esDocente && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={abrirEditar}>
                <Pencil size={14} /> Editar clase
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEliminarError(''); setConfirmEliminar(true) }}>
                <Trash2 size={14} /> Eliminar clase
              </button>
            </div>
          )}
          {eliminarError && <p className="pg-error" role="alert" style={{ marginTop: 8 }}>{eliminarError}</p>}
        </div>
      </div>

      {showEditar && esDocente && editForm && (
        <section className="pg-form-panel" aria-label="Editar clase" style={{ marginBottom: 16 }}>
          <h3>Editar clase: {clase.nombre}</h3>
          {editError && <p className="pg-error" role="alert">{editError}</p>}
          <form className="pg-form" onSubmit={guardarEdicion}>
            <div className="pg-grid">
              <label className="pg-field">
                <span className="pg-label">Nombre *</span>
                <input className="pg-input" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Grupo *</span>
                <input className="pg-input" value={editForm.grupo} onChange={(e) => setEditForm({ ...editForm, grupo: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Ciclo</span>
                <input className="pg-input" type="number" value={editForm.ciclo} onChange={(e) => setEditForm({ ...editForm, ciclo: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Aula</span>
                <input className="pg-input" value={editForm.aula} onChange={(e) => setEditForm({ ...editForm, aula: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Hora de inicio</span>
                <input className="pg-input" type="time" value={editForm.horaInicio} onChange={(e) => setEditForm({ ...editForm, horaInicio: e.target.value })} />
              </label>
              <label className="pg-field">
                <span className="pg-label">Hora de fin</span>
                <input className="pg-input" type="time" value={editForm.horaFin} onChange={(e) => setEditForm({ ...editForm, horaFin: e.target.value })} />
              </label>
              <div className="pg-field" style={{ gridColumn: '1 / -1' }}>
                <ThemePicker value={{ tema: editForm.tema, icono: editForm.icono }} nombre={editForm.nombre} grupo={editForm.grupo} onChange={(v) => setEditForm({ ...editForm, tema: v.tema, icono: v.icono })} />
              </div>
            </div>
            <label className="pg-field">
              <span className="pg-label">Descripción</span>
              <textarea className="pg-textarea" value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
            </label>
            <div className="pg-field">
              <span className="pg-label">Días de clase</span>
              <div className="pg-checks">
                {DIAS.map((d) => (
                  <label key={d} className="pg-check">
                    <input type="checkbox" checked={editForm.dias.includes(d)} onChange={() => toggleDiaEdit(d)} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="pg-actions">
              <button type="submit" className="btn btn--primary" disabled={editSaving}>{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setShowEditar(false)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <ConfirmModal
        open={confirmEliminar}
        title="Eliminar clase"
        message={`¿Seguro que quieres eliminar "${clase.nombre} (${clase.grupo})"? Solo se puede eliminar si no tiene alumnos, tareas, materiales, anuncios ni conversación.`}
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmEliminar(false)}
      />

      {status === 'loading' && <p className="pg-loading">Cargando detalle…</p>}
      {status === 'error' && detalle?.error && (
        <div className="pg-alert" role="alert">
          <TriangleAlert size={18} />
          <span>No pudimos cargar el detalle. {detalle.error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRecargar}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}

      {status === 'ready' && detalle && (
        <div className="pg-layout-2col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {esDocente && detalle.alumnos && (
              <section>
                <div className="section-head"><h2>Alumnos ({detalle.alumnos.totalElements ?? 0})</h2></div>
                {detalle.alumnos.content?.length === 0 ? (
                  <p className="pg-empty">Aún no hay alumnos inscritos en esta clase.</p>
                ) : (
                  <div className="pg-table-wrap">
                    <table className="pg-table">
                      <thead><tr><th>ALUMNO</th><th>ENTREGAS</th><th>POR CALIFICAR</th><th>PROMEDIO</th></tr></thead>
                      <tbody>
                        {(detalle.alumnos.content ?? []).map((a) => (
                          <tr key={a.id}>
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
              </section>
            )}
            {!esDocente && detalle.misTareas && (
              <section>
                <div className="section-head"><h2>Mis tareas de {clase.nombre}</h2></div>
                {detalle.misTareas.length === 0 ? (
                  <p className="pg-empty">Sin tareas en esta materia.</p>
                ) : (
                  <div className="pg-table-wrap">
                    <table className="pg-table">
                      <thead><tr><th>TAREA</th><th>VENCIMIENTO</th><th>MI ESTADO</th><th>ACCIÓN</th></tr></thead>
                      <tbody>
                        {[...(detalle.misTareas ?? [])].sort((a, b) => String(a.fechaVencimiento || '').localeCompare(String(b.fechaVencimiento || ''))).map((t) => {
                          const b = miEstadoBadge(t.miEstado)
                          const entregada = b.clase !== 'pendiente'
                          return (
                            <tr key={t.id}>
                              <td><span className="pg-strong">{t.titulo}</span><br /><span className="pg-sub">{t.claseNombre || ''}</span></td>
                              <td>{t.fechaVencimiento ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(t.fechaVencimiento)) : '—'}</td>
                              <td><span className={`pg-badge pg-badge--${b.clase}`}>{b.label}</span>{t.miNota != null ? ` · ${t.miNota}/10` : ''}</td>
                              <td><Link className="btn btn--ghost btn--sm" to={`/tareas/${t.id}`}>{entregada ? 'Ver entrega' : 'Entregar'}</Link></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
      {status === 'ready' && detalle && (
        <>
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
          {tab === 'avisos' && <AvisosClase claseId={clase.id} claseNombre={clase.nombre} esDocente={esDocente} />}
          {tab === 'mensajes' && <ChatClase claseId={clase.id} claseNombre={clase.nombre} grupo={clase.grupo} />}
          {tab === 'materiales' && <MaterialesSection claseId={clase.id} esDocente={esDocente} claseNombre={clase.nombre} />}
        </>
      )}
    </>
  )
}
