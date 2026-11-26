import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, RefreshCw, WifiOff } from 'lucide-react'
import { DemoBanner } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import { apiFetch, apiFetchForm } from '../services/authService'
import { fmtFechaHora, estadoTareaLabel } from '../utils/format'
import '../styles/pages.css'

// Detalle de una tarea (ruta /tareas/:id).
// Backend real: GET /api/tareas/{id} (TareaResponse: miEstado, miNota,
// miEntregaId, entregasRecibidas, entregasTotales). Entrega del estudiante:
// POST /api/tareas/{id}/entregas (multipart: archivo + comentario +
// comentario, 201; volver a entregar actualiza la misma). No hay endpoint
// para listar todas las entregas de una tarea: el docente las revisa en
// Calificaciones por alumno (GET /api/clases/{id}/alumnos/{alumnoId}/entregas).
export default function TareaDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const [tarea, setTarea] = useState(null)
  const [miEntrega, setMiEntrega] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [comentario, setComentario] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState('')
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      // El backend devuelve { tarea, recursos, miEntrega }, no la tarea plana.
      const data = await apiFetch(`/tareas/${id}`)
      const t = data?.tarea ?? data; setTarea(t)
      const entregaId = t.miEntregaId ?? data?.miEntrega ?? null
      if (!esDocente && entregaId) {
        try { setMiEntrega(await apiFetch(`/entregas/${entregaId}`)) } catch { setMiEntrega(null) }
      }
      setStatus('ready')
    } catch (err) { setError(err.message); setStatus('error') }
  }, [id, esDocente])
  useEffect(() => { load() }, [load])

  const entregar = async (e) => {
    e.preventDefault(); setFormError(''); setSent('')
    if (tarea.estado !== 'ACTIVA') {
  setFormError('Esta tarea no está activa. El backend solo acepta entregas de tareas ACTIVA.');
  return
  }
    if (!archivo) { setFormError('Elige un archivo para entregar (PDF, DOCX o imagen, máx. 20 MB). El backend exige un archivo para registrar la entrega; el comentario solo no basta.'); return }
    if (archivo.size > 20 * 1024 * 1024) { setFormError('El archivo supera los 20 MB que acepta el backend. Comprímelo o sube uno más ligero.'); return }
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      if (comentario.trim()) fd.append('comentario', comentario.trim())

      const entrega = await apiFetchForm(`/tareas/${id}/entregas`, fd)
      setMiEntrega(entrega); setSent('¡Entrega enviada! Tu docente la revisará y te pondrá calificación.')
      setArchivo(null); if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (err) { setFormError(err.message) } finally { setEnviando(false) }
  }

  return (
    <>
      <DemoBanner />
      <Link className="back-link" to="/tareas"><ArrowLeft size={16} /> Volver a Tareas</Link>
      {status === 'loading' && <p className="pg-loading">Cargando tarea…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert"><WifiOff size={18} /><span>No pudimos cargar la tarea. {error}</span><button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button></div>
      )}
      {status === 'ready' && tarea && (
        <>
          <div className="page-head"><div><h1 className="page-title">{tarea.titulo}</h1><p className="page-subtitle">{tarea.claseNombre} · {estadoTareaLabel(tarea.estado)} · Vence {fmtFechaHora(tarea.fechaVencimiento)}</p></div>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`pg-badge pg-badge--${tarea.estado === 'ACTIVA' ? 'activa' : tarea.estado === 'PROGRAMADA' ? 'programada' : 'cerrada'}`}>{tarea.estado}</span>
              {!esDocente && tarea.estado === 'ACTIVA' && <a className="btn btn--primary" href="#entregar">Entregar tarea</a>}
            </span>
          </div>
          {!esDocente && tarea.estado === 'PROGRAMADA' && (
            <div className="pg-alert pg-alert--info" role="status"><span>Esta tarea aún no está activa: se activa el {fmtFechaHora(tarea.fechaActivacion)}. Podrás entregarla cuando esté activa.</span></div>
          )}
          {!esDocente && tarea.estado === 'CERRADA' && (
            <div className="pg-alert" role="status"><span>Esta tarea ya está cerrada y no acepta entregas.</span></div>
          )}
          <div className="pg-layout-2col">
            <div className="pg-form-panel">
              <h3>Instrucciones</h3>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{tarea.descripcion || 'Sin descripción.'}</p>
              {tarea.instrucciones && <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{tarea.instrucciones}</p>}
              <p className="pg-hint">Publicada: {fmtFechaHora(tarea.fechaPublicacion)} · Activación: {fmtFechaHora(tarea.fechaActivacion)}</p>
              {esDocente && <p className="pg-hint">Entregas recibidas: {tarea.entregasRecibidas}/{tarea.entregasTotales} · Revisa y califica en <Link to="/calificaciones">Calificaciones</Link>.</p>}
              {!esDocente && <p className="pg-hint">Mi estado: <strong>{tarea.miEstado}</strong>{tarea.miNota != null ? ` · Nota: ${tarea.miNota}/10` : ''}</p>}
            </div>
            {!esDocente && (
              <div className="pg-form-panel" id="entregar">
                <h3>{miEntrega ? 'Mi entrega' : 'Entregar tarea'}</h3>
                {miEntrega && <p style={{ margin: 0 }}><span className="pg-badge pg-badge--entregada">Entregada</span></p>}
                {miEntrega && (
                  <p style={{ margin: 0 }}>{miEntrega.archivoNombre} · {miEntrega.estado}{miEntrega.nota != null ? ` · Nota: ${miEntrega.nota}/10` : ''} · {fmtFechaHora(miEntrega.fechaEntrega)}</p>
                )}
                {miEntrega && <Link className="btn btn--ghost btn--sm" to={`/calificaciones/entrega/${miEntrega.id}`}><Eye size={14} /> Vista previa de mi entrega</Link>}
                <form onSubmit={entregar} className="pg-form">
                  <label className="pg-field"><span className="pg-label">Subir archivo * (PDF, DOCX o imagen, máx. 20 MB)</span><input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.webp" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} className="pg-input" /></label>
                  {archivo && <p className="pg-hint" role="status">Archivo elegido: <strong>{archivo.name}</strong> ({Math.round(archivo.size / 1024)} KB)</p>}
                  {!archivo && <p className="pg-hint">El archivo es obligatorio: el backend solo registra la entrega con un archivo. El comentario es opcional.</p>}

                  <label className="pg-field"><span className="pg-label">Comentario privado (opcional, solo lo ven tú y tu docente)</span><textarea value={comentario} onChange={(e) => setComentario(e.target.value)} className="pg-textarea" placeholder="Algo que quieras decirle a tu docente…" /></label>
                  {formError && <p className="pg-error" role="alert">{formError}</p>}
                  {sent && <p className="pg-hint" role="status">{sent}</p>}
<button type="submit" className="btn btn--primary" disabled={enviando || tarea.estado !== 'ACTIVA'}>
  {tarea.estado === 'ACTIVA'
    ? (enviando ? 'Enviando…' : miEntrega ? 'Volver a entregar (actualiza la misma)' : 'Entregar tarea')
    : tarea.estado === 'PROGRAMADA' ? 'Aún no activa' : 'Cerrada'}
</button>                </form>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
