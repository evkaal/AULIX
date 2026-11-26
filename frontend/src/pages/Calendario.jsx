import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/authService'
import { derivarEstadoTarea, fmtFecha, fmtHora, toDatetimeLocal } from '../utils/format'
import '../styles/pages.css'

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function mesParam(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function inicioSemana(d) {
  const x = new Date(d)
  const dia = (x.getDay() + 6) % 7 // lunes = 0
  x.setDate(x.getDate() - dia)
  x.setHours(0, 0, 0, 0)
  return x
}

export default function Calendario() {
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const hoy = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const [mesActual, setMesActual] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [vista, setVista] = useState('mes')
  const [materiaId, setMateriaId] = useState('')
  const [clases, setClases] = useState([])
  const [eventos, setEventos] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(hoy)
  const [tareas, setTareas] = useState([])
  // Lote 4B: se elige primero la materia, luego nueva tarea o programar una
  // existente. Sin campo Estado: se deriva con derivarEstadoTarea.
  const [prog, setProg] = useState({ materiaId: '', modo: 'nueva', titulo: '', descripcion: '', tareaId: '', fechaActivacion: '', fechaVencimiento: '', activacionAutomatica: true })
  const [progSaving, setProgSaving] = useState(false)
  const [progError, setProgError] = useState('')
  const [progOk, setProgOk] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const params = new URLSearchParams({ mes: mesParam(mesActual) })
      if (materiaId) params.set('materiaId', materiaId)
      const data = await apiFetch(esDocente ? `/calendario?${params}` : `/estudiante/calendario?mes=${mesParam(mesActual)}`)
      setEventos(Array.isArray(data.eventos) ? data.eventos : [])
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [mesActual, materiaId, esDocente])

  useEffect(() => {
    apiFetch('/clases').then(setClases).catch(() => setClases([]))
    if (esDocente) apiFetch('/tareas').then(setTareas).catch(() => setTareas([]))
  }, [esDocente])

  useEffect(() => { load() }, [load])

  const celdas = useMemo(() => {
    if (vista === 'semana') {
      const inicio = inicioSemana(seleccionado)
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d })
    }
    const inicio = inicioSemana(mesActual)
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d })
  }, [vista, mesActual, seleccionado])

  const eventosDelDia = useCallback((dia) => eventos.filter((e) => {
    const f = new Date(e.fecha)
    return mismoDia(f, dia)
  }), [eventos])

  const eventosSeleccionados = eventosDelDia(seleccionado)

  const guardarProgramacion = async (e) => {
    e.preventDefault()
    setProgError('')
    setProgOk(false)
    if (!prog.materiaId) {
      setProgError('Elige una materia.')
      return
    }
    if (prog.modo === 'nueva' && !prog.titulo.trim()) { setProgError('Escribe el título de la tarea nueva.'); return }
    if (prog.modo === 'programar' && !prog.tareaId) { setProgError('Elige una tarea.'); return }
    setProgSaving(true)
    try {
      if (prog.modo === 'nueva') {
        // POST /api/tareas (mismo body que Tareas.jsx crearTarea).
        await apiFetch('/tareas', {
          method: 'POST',
          body: JSON.stringify({
            claseId: Number(prog.materiaId),
            titulo: prog.titulo.trim(),
            descripcion: prog.descripcion.trim() || null,
            fechaActivacion: prog.fechaActivacion || null,
            fechaVencimiento: prog.fechaVencimiento || null,
            activacionAutomatica: prog.activacionAutomatica,
            estado: derivarEstadoTarea(prog),
          }),
        })
      } else {
      await apiFetch(`/tareas/${prog.tareaId}/programacion`, {
        method: 'PUT',
        body: JSON.stringify({
          fechaActivacion: prog.fechaActivacion || null,
          fechaVencimiento: prog.fechaVencimiento || null,
          activacionAutomatica: prog.activacionAutomatica,
          // BUG CORREGIDO (v7): una activación futura con estado ACTIVA se
          // guardaba como activa; ahora se deriva a PROGRAMADA.
          estado: derivarEstadoTarea(prog),
        }),
      })
      }
      apiFetch('/tareas').then(setTareas).catch(() => {})
      setProgOk(true)
      load()
    } catch (err) {
      setProgError(err.message)
    } finally {
      setProgSaving(false)
    }
  }

  const cambiarMes = (delta) => {
    const d = new Date(mesActual)
    d.setMonth(d.getMonth() + delta)
    setMesActual(d)
  }
  const irHoy = () => {
    const d = new Date()
    setMesActual(new Date(d.getFullYear(), d.getMonth(), 1))
    setSeleccionado(hoy)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Calendario</h1>
          <p className="page-subtitle">{esDocente ? 'Programa tareas y consulta activaciones y vencimientos.' : 'Consulta tus horarios de clase y tus próximas entregas.'}</p>
        </div>
        <div className="pg-tabs" role="tablist" aria-label="Vista del calendario">
          {[
            { value: 'mes', label: 'Mes' },
            { value: 'semana', label: 'Semana' },
          ].map((v) => (
            <button key={v.value} type="button" role="tab" aria-selected={vista === v.value} className={`pg-tab${vista === v.value ? ' is-active' : ''}`} onClick={() => setVista(v.value)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pg-toolbar">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => cambiarMes(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></button>
        <strong style={{ fontSize: 17, minWidth: 170, textAlign: 'center', textTransform: 'capitalize' }}>
          {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
        </strong>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => cambiarMes(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={irHoy}>Hoy</button>
        <span className="pg-spacer" />
        <select className="pg-select" style={{ width: 220 }} value={materiaId} onChange={(e) => setMateriaId(e.target.value)} aria-label="Filtrar por materia">
          <option value="">Todas las materias</option>
          {clases.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.grupo}</option>)}
        </select>
      </div>

      {status === 'loading' && <p className="pg-loading">Cargando calendario…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar el calendario. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}

      {status === 'ready' && eventos.length === 0 && (
        <p className="pg-empty">Aún no tienes eventos en el calendario. Cuando se publique una tarea con fecha de entrega, aparecerá aquí.</p>
      )}

      {status === 'ready' && (
        <div className="pg-layout-2col">
          <div className="pg-cal">
            <div className="pg-cal__head">{DIAS_SEMANA.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="pg-cal__grid">
              {celdas.map((dia) => {
                const evs = eventosDelDia(dia)
                const fuera = dia.getMonth() !== mesActual.getMonth()
                return (
                  <button
                    key={dia.toISOString()}
                    type="button"
                    className={`pg-cal__day${mismoDia(dia, hoy) ? ' is-today' : ''}${mismoDia(dia, seleccionado) ? ' is-selected' : ''}${fuera ? ' is-other' : ''}`}
                    onClick={() => setSeleccionado(dia)}
                    aria-label={`${dia.getDate()} de ${MESES[dia.getMonth()]}, ${evs.length} eventos`}
                  >
                    <span className="pg-cal__daynum">{dia.getDate()}</span>
                    {evs.slice(0, 3).map((ev, i) => (
                      <span key={`${ev.tareaId ?? ev.claseId}-${ev.tipo}-${i}`} className={`pg-cal__event pg-cal__event--${ev.tipo}`}>
                        {ev.tipo === 'clase' ? `${fmtHora(ev.fecha)} ${ev.titulo}` : ev.titulo}
                      </span>
                    ))}
                    {evs.length > 3 && <span className="pg-cal__event">+{evs.length - 3} más</span>}
                  </button>
                )
              })}
            </div>
            <div className="pg-cal__legend">
              <span><span className="pg-badge pg-badge--blue">Activación</span></span>
              <span><span className="pg-badge pg-badge--pendiente">Vencimiento</span></span>
              <span><span className="pg-badge pg-badge--green">Clase</span></span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="pg-day-panel">
              <h3 style={{ textTransform: 'capitalize' }}>{fmtFecha(seleccionado)}</h3>
              {eventosSeleccionados.length === 0 ? (
                <p className="pg-empty">Sin eventos este día.</p>
              ) : (
                <ul>
                  {eventosSeleccionados.map((ev, i) => (
                    <li key={`${ev.tareaId ?? ev.claseId}-${ev.tipo}-${i}`}>
                      <strong>{ev.tipo === 'clase' ? 'Clase' : ev.tipo === 'activacion' ? 'Activación' : 'Vencimiento'}:</strong> {ev.titulo}
                      {ev.claseNombre ? ` · ${ev.claseNombre}` : ''} · {fmtHora(ev.fecha)}
                      {ev.aula ? ` · ${ev.aula}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {esDocente && (
              <section className="pg-day-panel">
                <h3>Programar tarea</h3>

                {progError && <p className="pg-error" role="alert">{progError}</p>}
                {progOk && <p className="pg-hint" style={{ color: '#1b6b57', fontWeight: 700 }}>Programación guardada.</p>}
                <form className="pg-form" onSubmit={guardarProgramacion}>
                  <label className="pg-field">
                    <span className="pg-label">Materia *</span>
                    <select className="pg-select" value={prog.materiaId} onChange={(e) => setProg((p) => ({ ...p, materiaId: e.target.value, tareaId: '' }))}>
                      <option value="">Elige una materia…</option>
                      {clases.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.grupo}</option>)}
                    </select>
                  </label>
                  <label className="pg-field">
                    <span className="pg-label">¿Qué quieres hacer?</span>
                    <select className="pg-select" value={prog.modo} onChange={(e) => setProg({ ...prog, modo: e.target.value })}>
                      <option value="nueva">Asignar una tarea nueva</option>
                      <option value="programar">Programar una tarea para más tarde</option>
                    </select>
                  </label>
                  <label className="pg-field" style={prog.modo === 'nueva' ? undefined : { display: 'none' }}>
                    <span className="pg-label">Título de la tarea nueva *</span>
                    <input className="pg-input" value={prog.titulo} onChange={(e) => setProg({ ...prog, titulo: e.target.value })} placeholder="Ecuaciones de primer grado" />
                  </label>
                  <label className="pg-field" style={prog.modo === 'nueva' ? undefined : { display: 'none' }}>
                    <span className="pg-label">Descripción</span>
                    <textarea className="pg-textarea" value={prog.descripcion} onChange={(e) => setProg({ ...prog, descripcion: e.target.value })} placeholder="Resumen corto de la tarea." />
                  </label>
                  <label className="pg-field" style={prog.modo === 'programar' ? undefined : { display: 'none' }}>
                    <span className="pg-label">Tarea</span>
                    <select className="pg-select" value={prog.tareaId} onChange={(e) => {
                      const t = tareas.find((x) => String(x.id) === e.target.value)
                      setProg((p) => ({
                        ...p,
                        tareaId: e.target.value,
                        fechaActivacion: t ? toDatetimeLocal(t.fechaActivacion) : p.fechaActivacion,
                        fechaVencimiento: t ? toDatetimeLocal(t.fechaVencimiento) : p.fechaVencimiento,
                        activacionAutomatica: t?.activacionAutomatica ?? p.activacionAutomatica,

                      }))
                    }}>
                      <option value="">Elige una tarea…</option>
                      {tareas.filter((t) => !prog.materiaId || String(t.claseId) === prog.materiaId).map((t) => <option key={t.id} value={t.id}>{t.titulo} · {t.claseNombre}</option>)}
                    </select>
                  </label>
                  <label className="pg-field">
                    <span className="pg-label">Fecha y hora de activación</span>
                    <input className="pg-input" type="datetime-local" value={prog.fechaActivacion} onChange={(e) => setProg({ ...prog, fechaActivacion: e.target.value })} />
                  </label>
                  <label className="pg-field">
                    <span className="pg-label">Fecha y hora de vencimiento</span>
                    <input className="pg-input" type="datetime-local" value={prog.fechaVencimiento} onChange={(e) => setProg({ ...prog, fechaVencimiento: e.target.value })} />
                  </label>
                  <label className="pg-field">
                    {/* Lote 4B: campo Estado eliminado de la vista; se deriva con derivarEstadoTarea. */}
                    <span className="pg-label" style={{ display: 'none' }}>Estado</span>
                    <select className="pg-select" value={prog.estado} onChange={(e) => setProg({ ...prog, estado: e.target.value })} style={{ display: 'none' }} aria-hidden="true">
                      <option value="PROGRAMADA">Programada</option>
                      <option value="ACTIVA">Activa</option>
                      <option value="CERRADA">Cerrada</option>
                    </select>
                  </label>
                  <label className="pg-check">
                    <input type="checkbox" checked={prog.activacionAutomatica} onChange={(e) => setProg({ ...prog, activacionAutomatica: e.target.checked })} />
                    Activación automática (se publicará en la fecha indicada)
                  </label>
                  <button type="submit" className="btn btn--primary" disabled={progSaving}>{progSaving ? 'Guardando...' : 'Guardar programación'}</button>
                </form>
              </section>
            )}
          </div>
        </div>
      )}
    </>
  )
}
