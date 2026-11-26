import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Paperclip, RefreshCw, Search, Send, TriangleAlert, WifiOff, X } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch, apiFetchForm } from '../services/authService'
import MessageContent from '../components/MessageContent'
import VoiceRecorder from '../components/VoiceRecorder'
import { fmtFechaHora } from '../utils/format'
import '../styles/pages.css'

const PAGE_SIZE = 50

export default function Mensajes() {
  const { user } = useAuth()
  // Bug 8: voz y archivos SOLO para el docente. El alumno escribe texto y
  // descarga/escucha lo que comparten; no ve el boton de adjuntar ni el de voz.
  const esDocente = user?.rol === 'DOCENTE'
  const { id: conversacionInicial } = useParams()
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
  const [vistaPrevia, setVistaPrevia] = useState(null) // { url, tipo, nombre }
  const [notaVoz, setNotaVoz] = useState(null) // { blob, segundos }
  // v9 (bug 4): al enviar la nota con éxito se sube este contador y
  // VoiceRecorder se resetea (su reproductor desaparece). Al fallar no
  // se sube, para no perder la nota.
  const [vozReset, setVozReset] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [envioError, setEnvioError] = useState('')
  const fileRef = useRef(null)
  const bodyRef = useRef(null)

  // Vista previa del adjunto antes de enviar (tipo Discord).
  useEffect(() => {
    if (!adjunto) { setVistaPrevia(null); return undefined }
    const url = URL.createObjectURL(adjunto)
    const tipo = adjunto.type.startsWith('image/') ? 'imagen' : adjunto.type.startsWith('audio/') ? 'audio' : adjunto.type.startsWith('video/') ? 'video' : 'archivo'
    setVistaPrevia({ url, tipo, nombre: adjunto.name })
    return () => URL.revokeObjectURL(url)
  }, [adjunto])

  const loadConvs = useCallback(async (f = filtro, query = q, silencioso = false) => {
    // Bug 9: el refresco silencioso no pone la lista en "Cargando" ni la
    // vacia; la lista vieja sigue visible mientras llega la nueva.
    if (!silencioso) setStatus('loading')
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
  useEffect(() => {
  const t = setInterval(() => loadConvs(filtro, q, true), 10000)
  return () => clearInterval(t)
}, [loadConvs, filtro, q])

  const abrir = useCallback(async (conv) => {
    if (!conv?.claseId) return
    // Bug 9: NO se limpian los mensajes al cambiar de clase: los anteriores
    // se quedan visibles mientras cargan los nuevos (asi no parpadea).
    // Tampoco se vuelve a pedir la lista de conversaciones: el "leido" se
    // actualiza en el estado local, sin re-fetch.
    setSel(conv)
    setPage(0)
    setMsgStatus('loading')
    setMsgError('')
    setTexto('')
    setAdjunto(null)
    // v9: al cambiar de materia no queda una nota de voz de la anterior.
    setNotaVoz(null)
    setVozReset((v) => v + 1)
    try {
      const data = await apiFetch(`/mensajes/conversaciones/${conv.claseId}/mensajes?page=0&size=${PAGE_SIZE}`)
      const lista = [...(data.content ?? [])].reverse() // el backend devuelve DESC; se lee en cronológico
      setMensajes(lista)
      setHayMas((data.totalPages ?? 1) > 1)
      setMsgStatus('ready')
      // Marcar leído al abrir (no bloquea la lectura si falla).
      apiFetch(`/mensajes/conversaciones/${conv.claseId}/leido`, { method: 'POST' })
        .then(() => setConvs((prev) => prev.map((c) => (c.claseId === conv.claseId ? { ...c, sinLeer: 0 } : c))))
        .catch(() => {})
    } catch (err) {
      setMsgError(err.message)
      setMsgStatus('error')
    }
  }, [])

  // Ruta /mensajes/:id (Conversacion.jsx): abre directamente esa materia.
  // NOTA: este efecto va DESPUÉS de la definición de `abrir` — antes estaba
  // antes y su array de dependencias evaluaba `abrir` antes de inicializar
  // su const, lo que lanzaba "Cannot access 'abrir' before initialization"
  // (TDZ) y rompía toda la vista /mensajes.
  const inicialRef = useRef(false)
  useEffect(() => {
    if (inicialRef.current || !convs.length) return
    let claseId = conversacionInicial ? Number(conversacionInicial) : null
    if (!claseId) {
      try { claseId = Number(sessionStorage.getItem('aulix_conversacion_inicial')) || null } catch { /* sin storage */ }
      try { sessionStorage.removeItem('aulix_conversacion_inicial') } catch { /* sin storage */ }
    }
    if (claseId) {
      const conv = convs.find((c) => c.claseId === claseId)
      if (conv) { inicialRef.current = true; abrir(conv) }
    }
  }, [convs, conversacionInicial, abrir])

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
    if (!texto.trim() && !adjunto && !notaVoz) return
    setEnviando(true)
    setEnvioError('')
    try {
      const fd = new FormData()
      let archivoAEnviar = adjunto
      if (notaVoz) {
        archivoAEnviar = new File([notaVoz.blob], `nota-de-voz-${Date.now()}.webm`, { type: notaVoz.blob.type || 'audio/webm' })
      }
      fd.append('texto', texto.trim())
      if (archivoAEnviar) fd.append('adjunto', archivoAEnviar)
      const nuevo = await apiFetchForm(`/mensajes/conversaciones/${sel.claseId}/mensajes`, fd)
      setMensajes((m) => [...m, nuevo])
      setTexto('')
      setAdjunto(null)
      setNotaVoz(null)
      // v9 (bug 4): mensaje enviado -> se limpia texto, adjunto Y el
      // grabador de voz (el reproductor "Nota lista" desaparece).
      setVozReset((v) => v + 1)
      if (fileRef.current) fileRef.current.value = ''
      // Sin re-fetch: el ultimo mensaje se actualiza en el estado local.
      setConvs((prev) => prev.map((c) => (c.claseId === sel.claseId ? { ...c, ultimoMensaje: { autorNombre: user?.nombre ?? 'Tú', texto: nuevo.texto || (nuevo.adjuntoNombre ? 'Archivo adjunto' : 'Nota de voz') }, sinLeer: 0 } : c)))
    } catch (err) {
      // El backend real solo acepta PDF/DOCX/imagen como adjunto: una nota
      // de voz o un video se rechaza aquí con un mensaje claro (en demo sí
      // funciona). No se pierde el texto escrito.
      const esAudio = !!notaVoz
      const rechazo = /no permitido|Tipo de archivo|supera el tamaño/i.test(err.message || '')
      setEnvioError(esAudio && rechazo
        ? 'El backend aún no acepta notas de voz (solo PDF, DOCX o imagen). Tu nota se guardó solo en modo demo; pídele a tu compañero que amplíe los tipos de archivo aceptados.'
        : rechazo
          ? `${err.message} En modo demo puedes enviarlo sin problema.`
          : err.message)
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
                  <span className="pg-conv__name">{c.claseNombre || 'Materia'} · {c.grupo || ''}</span>
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
                  <h3>Mensajes de {sel.claseNombre || 'esta materia'}</h3>
                  <p>{sel.grupo || ''} · Solo los integrantes de la materia pueden ver esta conversación.</p>
                </div>
                {msgStatus === 'loading' && mensajes.length === 0 && <p className="pg-loading">Cargando mensajes…</p>}
                {msgStatus === 'loading' && mensajes.length > 0 && <p className="pg-hint" style={{ padding: '8px 16px 0' }}>Cargando mensajes nuevos…</p>}
                {msgStatus === 'error' && (
                  <div className="pg-alert" role="alert" style={{ margin: 16 }}>
                    <TriangleAlert size={18} />
                    <span>{msgError}</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => abrir(sel)}>Reintentar</button>
                  </div>
                )}
                {(msgStatus === 'ready' || (msgStatus === 'loading' && mensajes.length > 0)) && (
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
                              <div className="pg-msg__meta">{mio ? 'Tú' : (m.autorNombre ?? 'Usuario')} · {fmtFechaHora(m.fechaEnvio)}</div>
                              <MessageContent mensaje={m} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <form className="pg-chat__composer" onSubmit={enviar}>
                      <input type="text" placeholder={`Escribe un mensaje para ${sel.claseNombre || 'esta materia'}…`} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Escribe un mensaje" disabled={enviando} />
                      {esDocente && (
                        <>
                          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp,audio/*,video/*" onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)} aria-label="Adjuntar archivo" style={{ display: 'none' }} />
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()} aria-label="Adjuntar archivo" title={adjunto ? adjunto.name : 'Adjuntar archivo, imagen, audio o video (en modo real el backend acepta PDF, DOCX o imagen, máx. 20 MB)'}>
                            <Paperclip size={16} /> {adjunto ? '✓' : ''}
                          </button>
                        </>
                      )}
                      {/* BUG CORREGIDO (v7): el botón solo se activaba con texto o
                          adjunto, pero NO con nota de voz, así que para mandar
                          un audio había que escribir un mensaje aparte. Ahora
                          se activa con texto, adjunto O nota de voz. */}
                      <button type="submit" className="btn btn--primary" disabled={enviando || (!texto.trim() && !adjunto && !notaVoz)} aria-label="Enviar mensaje">
                        <Send size={16} />
                      </button>
                    </form>
                    {vistaPrevia && (
                      <div className="msg-preview" role="group" aria-label="Vista previa del adjunto">
                        <span className="msg-preview__label">Vista previa antes de enviar:</span>
                        {vistaPrevia.tipo === 'imagen' && <img src={vistaPrevia.url} alt={vistaPrevia.nombre} className="msg-img" />}
                        {vistaPrevia.tipo === 'video' && <video src={vistaPrevia.url} controls preload="metadata" className="msg-video" />}
                        {vistaPrevia.tipo === 'audio' && <audio src={vistaPrevia.url} controls className="msg-audio" />}
                        {vistaPrevia.tipo === 'archivo' && <span className="msg-filechip"><Paperclip size={14} /> {vistaPrevia.nombre}</span>}
                        <button type="button" className="link" onClick={() => { setAdjunto(null); if (fileRef.current) fileRef.current.value = '' }}>
                          <X size={14} /> Quitar adjunto
                        </button>
                      </div>
                    )}
                    {esDocente && (
                      <div style={{ padding: '0 16px 8px' }}>
                        <VoiceRecorder
                          disabled={enviando || !!notaVoz}
                          resetKey={vozReset}
                          onReady={(blob, segundos) => setNotaVoz({ blob, segundos })}
                          onCancel={() => setNotaVoz(null)}
                        />
                        {notaVoz && <p className="pg-hint">Nota de voz lista ({notaVoz.segundos}s). Pulsa Enviar para mandarla sola, sin escribir nada.</p>}
                      </div>
                    )}
                    {!esDocente && (
                      <p className="pg-hint" style={{ padding: '0 16px 8px' }}>Solo tu docente puede enviar notas de voz y archivos. Tú puedes escribir mensajes y descargar o escuchar lo que compartan.</p>
                    )}
                    {envioError && <p className="pg-error" role="alert" style={{ padding: '0 16px 12px' }}>{envioError}</p>}
                    <p className="pg-hint" style={{ padding: '0 16px 12px' }}>Tu mensaje será visible para toda la clase de {sel.claseNombre || 'esta materia'} · {sel.grupo || ''}.</p>
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
