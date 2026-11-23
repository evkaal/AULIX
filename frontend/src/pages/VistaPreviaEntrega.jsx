import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Download, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch, apiFetchBlob } from '../services/authService'
import { fmtFechaHora } from '../utils/format'
import '../styles/pages.css'

/**
 * Vista previa · Calificar documento (pantalla 18:993 del Figma).
 * El docente ve el archivo entregado (PDF o imagen en línea, resto solo
 * descarga), los datos de la entrega y el formulario de calificación.
 * Al guardar, muestra la confirmación "Calificación guardada" (18:1254).
 * El estudiante solo ve su entrega y su revisión, sin calificar.
 */
export default function VistaPreviaEntrega() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const esDocente = user?.rol === 'DOCENTE'
  const [entrega, setEntrega] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewKind, setPreviewKind] = useState(null) // 'pdf' | 'image' | null
  const [previewError, setPreviewError] = useState('')
  const [nota, setNota] = useState('')
  const [comentario, setComentario] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [guardada, setGuardada] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = await apiFetch(`/entregas/${id}`)
      setEntrega(data)
      setNota(data.nota ?? '')
      setComentario(data.comentarioCalificacion ?? '')
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Vista previa del archivo: se pide como Blob con Bearer (un <iframe> o
  // <img> directo daría 401) y se muestra según su tipo real.
  useEffect(() => {
    if (!entrega?.archivoNombre) return
    let url = null
    let cancelado = false
    apiFetchBlob(`/entregas/${entrega.id}/archivo`)
      .then((blob) => {
        if (cancelado) return
        url = URL.createObjectURL(blob)
        const tipo = blob.type || entrega.archivoTipo || ''
        const nombre = (entrega.archivoNombre || '').toLowerCase()
        if (tipo.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(nombre)) setPreviewKind('image')
        else if (tipo === 'application/pdf' || /\.pdf$/.test(nombre)) setPreviewKind('pdf')
        else setPreviewKind(null)
        setPreviewUrl(url)
      })
      .catch(() => { if (!cancelado) setPreviewError('No se pudo cargar la vista previa. Puedes descargar el archivo.') })
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [entrega])

  const guardar = async (e) => {
    e.preventDefault()
    setFormError('')
    setGuardada(false)
    const n = Number(nota)
    if (Number.isNaN(n) || n < 0 || n > 10) {
      setFormError('La nota debe estar entre 0 y 10.')
      return
    }
    setSaving(true)
    try {
      await apiFetch(`/entregas/${entrega.id}/calificacion`, {
        method: entrega.estado === 'CALIFICADA' ? 'PUT' : 'POST',
        body: JSON.stringify({ nota: n, comentario: comentario.trim() || null }),
      })
      setGuardada(true)
      load()
    } catch (err) {
      setFormError(err.detalles ? Object.values(err.detalles).join(' ') : err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/calificaciones')}>
            <ArrowLeft size={16} /> Calificaciones
          </button>
          <h1 className="page-title" style={{ marginTop: 8 }}>Vista previa · Calificar documento</h1>
          <p className="page-subtitle">{entrega ? `${entrega.tareaTitulo} · ${entrega.estudianteNombre}` : 'Revisa el trabajo entregado y califícalo.'}</p>
        </div>
      </div>

      {status === 'loading' && <p className="pg-loading">Cargando entrega…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar la entrega. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}

      {status === 'ready' && entrega && (
        <div className="pg-layout-2col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <section className="pg-card">
              <h3 style={{ fontSize: 15 }}>{entrega.tareaTitulo}</h3>
              <p>
                {entrega.estudianteNombre} · Entregado {fmtFechaHora(entrega.fechaEntrega)} · {entrega.aTiempo ? 'A tiempo' : 'Tarde'}
                {entrega.paginas ? ` · ${entrega.paginas} páginas` : ''}
              </p>
              {entrega.comentario && <p>Comentario del alumno: “{entrega.comentario}”</p>}
              <p>
                {entrega.estado === 'CALIFICADA'
                  ? <span className="pg-badge pg-badge--calificada">Calificado · {entrega.nota}/10</span>
                  : <span className="pg-badge pg-badge--pendiente">Por calificar</span>}
              </p>
            </section>

            <section>
              <div className="section-head"><h2>Documento entregado</h2></div>
              {!entrega.archivoNombre ? (
                <p className="pg-empty">Esta entrega no trae archivo.</p>
              ) : (
                <>
                  <p className="pg-hint">
                    {entrega.archivoNombre}
                    {entrega.archivoTamanoBytes ? ` · ${Math.round(entrega.archivoTamanoBytes / 1024)} KB` : ''}
                  </p>
                  {previewError && (
                    <div className="pg-alert" role="alert">
                      <TriangleAlert size={18} />
                      <span>{previewError}</span>
                    </div>
                  )}
                  {previewKind === 'image' && previewUrl && (
                    <img src={previewUrl} alt={`Documento entregado: ${entrega.archivoNombre}`} style={{ maxWidth: '100%', border: '1px solid var(--border)', borderRadius: 8 }} />
                  )}
                  {previewKind === 'pdf' && previewUrl && (
                    <iframe src={previewUrl} title={`Vista previa de ${entrega.archivoNombre}`} style={{ width: '100%', height: 560, border: '1px solid var(--border)', borderRadius: 8 }} />
                  )}
                  {previewKind === null && !previewError && (
                    <p className="pg-empty">Este tipo de archivo no tiene vista previa en línea.</p>
                  )}
                  <div className="pg-actions" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => apiDownload(`/entregas/${entrega.id}/archivo`, entrega.archivoNombre).catch(() => {})}
                    >
                      <Download size={14} /> Descargar {entrega.archivoNombre}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {esDocente ? (
              <section className="pg-form-panel" aria-label="Calificar documento" style={{ marginTop: 0 }}>
                <h3>Calificar documento</h3>
                {guardada ? (
                  <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1b6b57', fontWeight: 700 }}>
                      <CheckCircle2 size={20} /> Calificación guardada.
                    </p>
                    <p className="pg-hint">{entrega.estudianteNombre} recibió {entrega.nota}/10 en {entrega.tareaTitulo}.</p>
                    <div className="pg-actions">
                      <Link className="btn btn--primary" to="/calificaciones">Volver a calificaciones</Link>
                    </div>
                  </div>
                ) : (
                  <form className="pg-form" onSubmit={guardar}>
                    <label className="pg-field">
                      <span className="pg-label">Calificación (0–10) *</span>
                      <input className="pg-input" type="number" min="0" max="10" step="0.1" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="9.0" />
                    </label>
                    <label className="pg-field">
                      <span className="pg-label">Comentario para el alumno</span>
                      <textarea className="pg-textarea" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Buen trabajo, revisa la comprobación." />
                    </label>
                    {formError && <p className="pg-error" role="alert">{formError}</p>}
                    <div className="pg-actions">
                      <button type="submit" className="btn btn--primary" disabled={saving}>
                        {saving ? 'Guardando...' : entrega.estado === 'CALIFICADA' ? 'Actualizar calificación' : 'Guardar calificación'}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            ) : (
              <section className="pg-form-panel" style={{ marginTop: 0 }}>
                <h3>Tu revisión</h3>
                {entrega.estado === 'CALIFICADA' ? (
                  <>
                    <p><strong>Nota: {entrega.nota}/10</strong></p>
                    <p>{entrega.comentarioCalificacion ?? 'Sin comentario del docente.'}</p>
                  </>
                ) : (
                  <p className="pg-empty">Tu trabajo aún no ha sido calificado.</p>
                )}
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
