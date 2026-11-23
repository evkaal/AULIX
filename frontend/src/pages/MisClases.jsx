import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Pencil, Plus, RefreshCw, Search, Trash2, TriangleAlert, WifiOff, X } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { apiFetch, apiFetchForm } from '../services/authService'
import { fmtHora } from '../utils/format'
import '../styles/pages.css'

const DIAS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
const TEMAS = [
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'purple', label: 'Morado' },
]

const emptyForm = {
  nombre: '', grupo: '', ciclo: 2026, descripcion: '', dias: ['LUN', 'MIE', 'VIE'],
  horaInicio: '08:00', horaFin: '09:00', aula: '', tema: 'blue', simbolo: '', icono: 'book',
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
          simbolo: form.simbolo.trim() || null,
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
              <label className="pg-field">
                <span className="pg-label">Color</span>
                <select className="pg-select" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })}>
                  {TEMAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="pg-field">
                <span className="pg-label">Icono</span>
                <select className="pg-select" value={form.icono} onChange={(e) => setForm({ ...form, icono: e.target.value })}>
                  <option value="calculator">Calculadora</option>
                  <option value="flask">Matraz</option>
                  <option value="book">Libro</option>
                </select>
              </label>
              <label className="pg-field">
                <span className="pg-label">Símbolo</span>
                <input className="pg-input" value={form.simbolo} onChange={(e) => setForm({ ...form, simbolo: e.target.value })} placeholder="x² + y²" />
              </label>
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
            {clases.map((c) => (
              <article key={c.id} className={`class-card class-card--${c.tema ?? 'blue'}`}>
                <div className="class-card__cover">
                  <BookOpen size={30} strokeWidth={1.5} aria-hidden="true" />
                  <span className="class-card__formula">{c.simbolo ?? ''}</span>
                </div>
                <div className="class-card__info">
                  <div className="class-card__row">
                    <h3 className="class-card__name">{c.nombre}</h3>
                  </div>
                  <p>{c.grupo} · Ciclo {c.ciclo}</p>
                  <p>{c.estudiantes ?? 0} estudiantes · {c.horaInicio ? `${fmtHora(`2000-01-01T${c.horaInicio}`)}–${fmtHora(`2000-01-01T${c.horaFin}`)}` : 'Sin horario'} {c.aula ? `· ${c.aula}` : ''}</p>
                  <div className="class-card__footer">
                    <span>{c.tareasActivas ?? 0} tareas activas</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => abrirDetalle(c)}>Ver clase →</button>
                  </div>
                </div>
              </article>
            ))}
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
  const [anuncio, setAnuncio] = useState('')
  const [publicando, setPublicando] = useState(false)
  const [anuncioError, setAnuncioError] = useState('')
  // Editar clase: el backend ya tenía PUT /api/clases/{id}; la vista no lo usaba.
  const [showEditar, setShowEditar] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [eliminarError, setEliminarError] = useState('')

  const abrirEditar = () => {
    setEditForm({
      nombre: clase.nombre ?? '',
      grupo: clase.grupo ?? '',
      ciclo: clase.ciclo ?? 2026,
      descripcion: clase.descripcion ?? '',
      dias: clase.diasSemana ? clase.diasSemana.split(',') : ['LUN', 'MIE', 'VIE'],
      horaInicio: clase.horaInicio ?? '',
      horaFin: clase.horaFin ?? '',
      aula: clase.aula ?? '',
      tema: clase.tema ?? 'blue',
      simbolo: clase.simbolo ?? '',
      icono: clase.icono ?? 'book',
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
          horaInicio: editForm.horaInicio || null,
          horaFin: editForm.horaFin || null,
          aula: editForm.aula.trim() || null,
          tema: editForm.tema,
          simbolo: editForm.simbolo.trim() || null,
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
  const [materialNombre, setMaterialNombre] = useState('')
  const [materialTipo, setMaterialTipo] = useState('ARCHIVO')
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialArchivo, setMaterialArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [materialError, setMaterialError] = useState('')
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

  const publicarAnuncio = async (e) => {
    e.preventDefault()
    if (!anuncio.trim()) return
    setPublicando(true)
    setAnuncioError('')
    try {
      await apiFetch(`/clases/${clase.id}/anuncios`, { method: 'POST', body: JSON.stringify({ texto: anuncio.trim() }) })
      setAnuncio('')
      onRecargar()
    } catch (err) {
      setAnuncioError(err.message)
    } finally {
      setPublicando(false)
    }
  }

  const subirMaterial = async (e) => {
    e.preventDefault()
    setMaterialError('')
    if (materialTipo === 'ARCHIVO' && !materialArchivo) {
      setMaterialError('Selecciona un archivo.')
      return
    }
    if (materialTipo === 'VIDEO' && !materialUrl.trim()) {
      setMaterialError('Escribe la URL del video.')
      return
    }
    const fd = new FormData()
    if (materialArchivo) fd.append('archivo', materialArchivo)
    fd.append('tipo', materialTipo)
    fd.append('nombre', materialNombre.trim() || materialArchivo?.name || 'Material')
    if (materialUrl.trim()) fd.append('url', materialUrl.trim())
    setSubiendo(true)
    try {
      await apiFetchForm(`/clases/${clase.id}/materiales`, fd)
      setMaterialNombre('')
      setMaterialUrl('')
      setMaterialArchivo(null)
      e.target.reset()
      onRecargar()
    } catch (err) {
      setMaterialError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onVolver}><ArrowLeft size={16} /> Mis clases</button>
          <h1 className="page-title" style={{ marginTop: 8 }}>{clase.nombre}</h1>
          <p className="page-subtitle">{clase.grupo} · Ciclo {clase.ciclo} · {clase.docenteNombre ? `Docente: ${clase.docenteNombre}` : ''} {clase.aula ? `· ${clase.aula}` : ''}</p>
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
              <label className="pg-field">
                <span className="pg-label">Color</span>
                <select className="pg-select" value={editForm.tema} onChange={(e) => setEditForm({ ...editForm, tema: e.target.value })}>
                  {TEMAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="pg-field">
                <span className="pg-label">Icono</span>
                <select className="pg-select" value={editForm.icono} onChange={(e) => setEditForm({ ...editForm, icono: e.target.value })}>
                  <option value="calculator">Calculadora</option>
                  <option value="flask">Matraz</option>
                  <option value="book">Libro</option>
                </select>
              </label>
              <label className="pg-field">
                <span className="pg-label">Símbolo</span>
                <input className="pg-input" value={editForm.simbolo} onChange={(e) => setEditForm({ ...editForm, simbolo: e.target.value })} />
              </label>
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
                        {detalle.alumnos.content.map((a) => (
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
                      <thead><tr><th>TAREA</th><th>VENCIMIENTO</th><th>MI ESTADO</th></tr></thead>
                      <tbody>
                        {detalle.misTareas.map((t) => (
                          <tr key={t.id}>
                            <td className="pg-strong">{t.titulo}</td>
                            <td>{t.fechaVencimiento ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(t.fechaVencimiento)) : '—'}</td>
                            <td>{t.miEstado ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            <section>
              <div className="section-head"><h2>Anuncios</h2></div>
              {esDocente && (
                <form className="pg-form" onSubmit={publicarAnuncio} style={{ marginBottom: 12 }}>
                  <label className="pg-field">
                    <span className="pg-label">Publicar anuncio</span>
                    <textarea className="pg-textarea" value={anuncio} onChange={(e) => setAnuncio(e.target.value)} placeholder="¿Qué quieres compartir con tu clase?" />
                  </label>
                  {anuncioError && <p className="pg-error" role="alert">{anuncioError}</p>}
                  <div className="pg-actions"><button type="submit" className="btn btn--primary" disabled={publicando}>{publicando ? 'Publicando...' : 'Publicar'}</button></div>
                </form>
              )}
              {detalle.anuncios?.length === 0 ? (
                <p className="pg-empty">Aún no hay anuncios en esta clase.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {detalle.anuncios.map((a) => (
                    <div key={a.id} className="pg-card">
                      <p style={{ color: 'var(--ink)', fontSize: 14 }}>{a.texto}</p>
                      <p>{a.autorNombre} · {a.createdAt ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(a.createdAt)) : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section>
              <div className="section-head"><h2>Materiales</h2></div>
              {detalle.materiales?.length === 0 ? (
                <p className="pg-empty">Sin materiales todavía.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detalle.materiales.map((m) => (
                    <div key={m.id} className="pg-card" style={{ padding: 12 }}>
                      <span className="pg-strong" style={{ fontSize: 14 }}>{m.nombre}</span>
                      <span className="pg-sub">{m.tipo}{m.tamanoBytes ? ` · ${Math.round(m.tamanoBytes / 1024)} KB` : ''}{m.duracionMin ? ` · ${m.duracionMin} min` : ''}</span>
                      {m.url && <Link to={m.url} target="_blank" rel="noreferrer">Abrir →</Link>}
                    </div>
                  ))}
                </div>
              )}
              {esDocente && (
                <form className="pg-form" onSubmit={subirMaterial} style={{ marginTop: 12 }}>
                  <label className="pg-field">
                    <span className="pg-label">Tipo de material</span>
                    <select className="pg-select" value={materialTipo} onChange={(e) => setMaterialTipo(e.target.value)}>
                      <option value="ARCHIVO">Archivo</option>
                      <option value="VIDEO">Video (URL)</option>
                    </select>
                  </label>
                  {materialTipo === 'ARCHIVO' ? (
                    <label className="pg-field">
                      <span className="pg-label">Archivo (PDF, DOCX o imagen, máx. 20 MB)</span>
                      <input className="pg-input" type="file" onChange={(e) => setMaterialArchivo(e.target.files?.[0] ?? null)} />
                    </label>
                  ) : (
                    <label className="pg-field">
                      <span className="pg-label">URL del video</span>
                      <input className="pg-input" type="url" value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="https://…" />
                    </label>
                  )}
                  <label className="pg-field">
                    <span className="pg-label">Nombre (opcional)</span>
                    <input className="pg-input" value={materialNombre} onChange={(e) => setMaterialNombre(e.target.value)} placeholder="Guía de ecuaciones" />
                  </label>
                  {materialError && <p className="pg-error" role="alert">{materialError}</p>}
                  <button type="submit" className="btn btn--primary" disabled={subiendo}>{subiendo ? 'Subiendo...' : 'Subir material'}</button>
                </form>
              )}
            </section>
          </aside>
        </div>
      )}
    </>
  )
}
