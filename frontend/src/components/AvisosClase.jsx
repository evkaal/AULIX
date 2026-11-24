// AvisosClase — zona de avisos por clase, estilo WhatsApp (Aulix v2).
// Separada del chat general: solo anuncios del docente, con fecha/hora,
// en burbujas verdes. Usa el endpoint real GET/POST /api/clases/{id}/anuncios
// (ya existía en el backend) y en demo persiste en localStorage (mockApi).
// Se muestra en el detalle de la clase y en el Panel principal.
import { useCallback, useEffect, useState } from 'react'
import { Megaphone, RefreshCw, Send, WifiOff } from 'lucide-react'
import Avatar from './Avatar'
import { apiFetch } from '../services/authService'

export function fmtAviso(fecha) {
  if (!fecha) return ''
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(fecha))
}

export default function AvisosClase({ claseId, claseNombre, esDocente, compact = false }) {
  const [avisos, setAvisos] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [publicando, setPublicando] = useState(false)
  const [publicarError, setPublicarError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      const data = await apiFetch(`/clases/${claseId}/anuncios`)
      setAvisos(Array.isArray(data) ? data : [])
      setStatus('ready')
    } catch (err) { setError(err.message); setStatus('error') }
  }, [claseId])
  useEffect(() => { load() }, [load])

  const publicar = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    setPublicando(true); setPublicarError('')
    try {
      await apiFetch(`/clases/${claseId}/anuncios`, { method: 'POST', body: JSON.stringify({ texto: texto.trim() }) })
      setTexto('')
      load()
    } catch (err) { setPublicarError(err.message) }
    finally { setPublicando(false) }
  }

  return (
    <section aria-label={`Avisos de ${claseNombre || 'la clase'}`}>
      <div className="section-head">
        <h2><Megaphone size={18} style={{ verticalAlign: '-3px', marginRight: 6 }} />Avisos{claseNombre ? ` · ${claseNombre}` : ''}</h2>
      </div>
      {esDocente && (
        <form className="avisos-form" onSubmit={publicar}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Publica un aviso para tu clase…"
            aria-label="Escribe un aviso"
            disabled={publicando}
          />
          <button type="submit" className="btn btn--primary btn--sm" disabled={publicando || !texto.trim()}>
            <Send size={14} /> Publicar
          </button>
        </form>
      )}
      {publicarError && <p className="pg-error" role="alert">{publicarError}</p>}
      {status === 'loading' && <p className="pg-loading">Cargando avisos…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={16} /><span>No pudimos cargar los avisos. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {status === 'ready' && avisos.length === 0 && (
        <p className="pg-empty">Aún no hay avisos en esta clase. {esDocente ? 'Publica el primero arriba.' : ''}</p>
      )}
      {status === 'ready' && avisos.length > 0 && (
        <div className="avisos-list">
          {avisos.slice(0, compact ? 3 : undefined).map((a) => (
            <article key={a.id} className="aviso">
              <Avatar name={a.autorNombre} size={36} />
              <div className="aviso__body">
                <div className="aviso__meta">
                  <strong>{a.autorNombre}</strong>
                  <span>{fmtAviso(a.createdAt || a.fechaCreacion)}</span>
                </div>
                <p className="aviso__texto">{a.texto}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
