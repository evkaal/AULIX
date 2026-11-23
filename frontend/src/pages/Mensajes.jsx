import { useCallback, useEffect, useRef, useState } from 'react'
import { Paperclip, RefreshCw, Search, Send, TriangleAlert, WifiOff, X } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch, apiFetchForm } from '../services/authService'
import { fmtFechaHora } from '../utils/format'
import '../styles/pages.css'

const PAGE_SIZE = 50

export default function Mensajes() {
  const { user } = useAuth()
  const [convs, setConvs] = useState([])
  const [filtro, setFiltro] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [sel, setSel] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [msgStatus, setMsgStatus] = useState('idle')
  const [msgError, setMsgError] = useState('')
  const [page, setPage] = useState(0)
  const [hayMas, setHayMas] = useState(false)
  const [texto, setTexto] = useState('')
  const [adjunto, setAdjunto] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [envioError, setEnvioError] = useState('')
  const fileRef = useRef(null)
  const bodyRef = useRef(null)

  const loadConvs = useCallback(async (f = filtro, query = q) => {
    setStatus('loading')
    setError('')
    try {
      const params = new URLSearchParams()
      if (f) params.set('filtro', f)
      if (query.trim()) params.set('q', query.trim())
      const data = await apiFetch(`/mensajes/conversaciones?${params}`)
      setConvs(Array.isArray(data) ? data : [])
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [filtro, q])

  useEffect(() => { loadConvs() }, [loadConvs])

  const abrir = useCallback(async (conv) => {
    setSel(conv)
    setMensajes([])
    setPage(0)
    setMsgStatus('loading')
    setMsgError('')
    setTexto('')
    setAdjunto(null)
    try {
      const data = await apiFetch(`/mensajes/conversaciones/${conv.claseId}/mensajes?page=0&size=${PAGE_SIZE}`)
      const lista = [...(data.content ?? [])].reverse() // el backend devuelve DESC; se lee en cronológico
      setMensajes(lista)
      setHayMas((data.totalPages ?? 1) > 1)
      setMsgStatus('ready')
      // Marcar leído al abrir (no bloquea la lectura si falla).
      apiFetch(`/mensajes/conversaciones/${conv.claseId}/leido`, { method: 'POST' })
        .then(() => loadConvs())
        .catch(() => {})
    } catch (err) {
      setMsgError(err.message)
      setMsgStatus('error')
    }
  }, [loadConvs])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [mensajes])

  const cargarMas = async () => {
    const siguiente = page + 1
    try {
      const data = await apiFetch(`/mensajes/conversaciones/${sel.claseId}/mensajes?page=${siguiente}&size=${PAGE_SIZE}`)
      const viejos = [...(data.content ?? [])].reverse()
      setMensajes((m) => [...viejos, ...m])
      setPage(siguiente)
      setHayMas(siguiente + 1 < (data.totalPages ?? 1))
    } catch {
      // Sin reintento automático: el historial ya cargado sigue visible.
    }
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim() && !adjunto) return
    setEnviando(true)
    setEnvioError('')
    try {
      const fd = new FormData()
      fd.append('texto', texto.trim() || '(Archivo adjunto)')
      if (adjunto) fd.append('adjunto', adjunto)
      const nuevo = await apiFetchForm(`/mensajes/conversaciones/${sel.claseId}/mensajes`, fd)
      setMensajes((m) => [...m, nuevo])
      setTexto('')
      setAdjunto(null)
      if (fileRef.current) fileRef.current.value = ''
      loadConvs()
    } catch (err) {
      setEnvioError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const sinLeerTotal = convs.reduce((a, c) => a + (c.sinLeer ?? 0), 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mensajes</h1>
          <p className="page-subtitle">Conversa con tu docente y tus compañeros en cada una de tus materias.</p>
        </div>
        {sinLeerTotal > 0 && <span className="pg-badge pg-badge--blue">{sinLeerTotal} sin leer</span>}
      </div>

      <div className="pg-tabs" role="tablist" aria-label="Filtrar conversaciones">
        {[
          { value: '', label: 'Todas las materias' },
          { value: 'sin-leer', label: 'Sin leer' },
        ].map((t) => (
          <button key={t.value || 'todas'} type="button" role="tab" aria-selected={filtro === t.value} className={`pg-tab${filtro === t.value ? ' is-active' : ''}`} onClick={() => { setFiltro(t.value); loadConvs(t.value, q) }}>
            {t.label}{t.value === 'sin-leer' && sinLeerTotal > 0 ? ` (${sinLeerTotal})` : ''}
          </button>
        ))}
      </div>

      <div className="pg-toolbar">
        <label className="pg-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" placeholder="Buscar una materia…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadConvs(filtro, e.target.value) }} aria-label="Buscar una materia" />
        </label>
      </div>

      {status === 'loading' && <p className="pg-loading">Cargando conversaciones…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert">
          <WifiOff size={18} />
          <span>No pudimos cargar los mensajes. {error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => loadConvs()}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {status === 'ready' && convs.length === 0 && <p className="pg-empty">Sin conversaciones. Cuando estés en una materia, su conversación aparecerá aquí.</p>}

      {status === 'ready' && convs.length > 0 && (
        <div className="pg-chat-layout">
          <div className="pg-conv-list" role="list" aria-label="Conversaciones por materia">
            {convs.map((c) => (
              <button key={c.claseId} type="button" role="listitem" className={`pg-conv${sel?.claseId === c.claseId ? ' is-selected' : ''}`} onClick={() => abrir(c)}>
                <span className="pg-conv__row">
                  <span className="pg-conv__name">{c.claseNombre} · {c.grupo}</span>
                  {c.sinLeer > 0 && <span className="pg-conv__count">{c.sinLeer}</span>}
                </span>
                <span className="pg-conv__last">
                  {c.ultimoMensaje
                    ? `${c.ultimoMensaje.autorNombre}: ${c.ultimoMensaje.texto}`
                    : 'Aún no hay mensajes en esta materia.'}
                </span>
              </button>
            ))}
          </div>

          <div className="pg-chat">
            {!sel ? (
              <div className="pg-empty" style={{ margin: 16 }}>Elige una materia para ver su conversación.</div>
            ) : (
              <>
                <div className="pg-chat__head">
                  <h3>Mensajes de {sel.claseNombre}</h3>
                  <p>{sel.grupo} · Solo los integrantes de la materia pueden ver esta conversación.</p>
                </div>
                {msgStatus === 'loading' && <p className="pg-loading">Cargando mensajes…</p>}
                {msgStatus === 'error' && (
                  <div className="pg-alert" role="alert" style={{ margin: 16 }}>
                    <TriangleAlert size={18} />
                    <span>{msgError}</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => abrir(sel)}>Reintentar</button>
                  </div>
                )}
                {msgStatus === 'ready' && (
                  <>
                    <div className="pg-chat__body" ref={bodyRef}>
                      {hayMas && (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={cargarMas} style={{ alignSelf: 'center' }}>Cargar mensajes anteriores</button>
                      )}
                      {mensajes.length === 0 && <p className="pg-empty">Aún no hay mensajes. ¡Escribe el primero!</p>}
                      {mensajes.map((m) => {
                        const mio = m.autorId === user?.id
                        return (
                          <div key={m.id} className={`pg-msg${mio ? ' is-mine' : ''}`}>
                            {!mio && <Avatar name={m.autorNombre} src={m.autorAvatar} size={32} />}
                            <div className="pg-msg__bubble">
                              <div className="pg-msg__meta">{mio ? 'Tú' : m.autorNombre} · {fmtFechaHora(m.fechaEnvio)}</div>
                              <div>{m.texto}</div>
                              {m.adjuntoNombre && (
                                <div className="pg-msg__file">
                                  <button
                                    type="button"
                                    className="link"
                                    onClick={() => apiDownload(`/archivos/${m.adjuntoRuta}`, m.adjuntoNombre).catch(() => {})}
                                  >
                                    <Paperclip size={12} /> {m.adjuntoNombre} · Descargar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <form className="pg-chat__composer" onSubmit={enviar}>
                      <input type="text" placeholder={`Escribe un mensaje para ${sel.claseNombre}…`} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Escribe un mensaje" disabled={enviando} />
                      <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.webp" onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)} aria-label="Adjuntar archivo" style={{ display: 'none' }} />
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()} aria-label="Adjuntar archivo" title={adjunto ? adjunto.name : 'Adjuntar archivo (PDF, DOCX o imagen, máx. 20 MB)'}>
                        <Paperclip size={16} /> {adjunto ? '✓' : ''}
                      </button>
                      <button type="submit" className="btn btn--primary" disabled={enviando || (!texto.trim() && !adjunto)} aria-label="Enviar mensaje">
                        <Send size={16} />
                      </button>
                    </form>
                    {adjunto && (
                      <p className="pg-hint" style={{ padding: '0 16px 8px' }}>
                        Adjunto: {adjunto.name} <button type="button" className="link" onClick={() => { setAdjunto(null); if (fileRef.current) fileRef.current.value = '' }}><X size={14} /></button>
                      </p>
                    )}
                    {envioError && <p className="pg-error" role="alert" style={{ padding: '0 16px 12px' }}>{envioError}</p>}
                    <p className="pg-hint" style={{ padding: '0 16px 12px' }}>Tu mensaje será visible para toda la clase de {sel.claseNombre} · {sel.grupo}.</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
