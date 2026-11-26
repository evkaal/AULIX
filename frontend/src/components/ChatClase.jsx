// ChatClase — mensajes de UNA clase (Aulix v5).
// Reutiliza los endpoints reales de mensajes por conversación de clase:
// GET /api/mensajes/conversaciones/{claseId}/mensajes?page&size (Page),
// POST /api/mensajes/conversaciones/{claseId}/mensajes (FormData con texto
// y adjunto opcional) y POST .../leido. Incluye notas de voz de máx. 60 s
// (VoiceRecorder, ya en v2) y adjuntos con MessageContent.
// Se usa dentro de la pestaña "Mensajes" del detalle de cada clase
// (ClaseDetalle y MisClases), junto a Avisos y Materiales/Videos, para que
// en esa misma clase estén juntos avisos, mensajes y voz. La vista general
// de Mensajes (/mensajes) sigue existiendo y muestra todas las clases.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Paperclip, RefreshCw, Send, TriangleAlert, X } from 'lucide-react'
import Avatar from './Avatar'
import { useAuth } from '../context/AuthContext'
import { apiFetch, apiFetchForm } from '../services/authService'
import MessageContent from './MessageContent'
import VoiceRecorder from './VoiceRecorder'
import { fmtFechaHora } from '../utils/format'

const PAGE_SIZE = 50
// Lote 5C: emojis sin librería nueva; viajan como texto normal en `texto`.
const EMOJIS = ['😀', '😂', '👍', '❤️', '🎉', '📚', '✅', '👏']

export default function ChatClase({ claseId, claseNombre, grupo }) {
  const { user } = useAuth()
// Bug 8 corregido: archivos para todos, voz solo para el docente.
// El backend solo acepta PDF/DOCX/imagen, por eso la voz no se abre al estudiante.
  const esDocente = user?.rol === 'DOCENTE'
  const [mensajes, setMensajes] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hayMas, setHayMas] = useState(false)
  const [texto, setTexto] = useState('')
  const [adjunto, setAdjunto] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState(null)
  const [notaVoz, setNotaVoz] = useState(null)
  // v9 (bug 4): al enviar la nota con éxito se sube este contador y
  // VoiceRecorder se resetea (su reproductor desaparece). Al fallar no
  // se sube, para no perder la nota.
  const [vozReset, setVozReset] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [envioError, setEnvioError] = useState('')
  const fileRef = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!adjunto) { setVistaPrevia(null); return undefined }
    const url = URL.createObjectURL(adjunto)
    const tipo = adjunto.type.startsWith('image/') ? 'imagen' : adjunto.type.startsWith('audio/') ? 'audio' : adjunto.type.startsWith('video/') ? 'video' : 'archivo'
    setVistaPrevia({ url, tipo, nombre: adjunto.name })
    return () => URL.revokeObjectURL(url)
  }, [adjunto])

  const load = useCallback(async (p = 0) => {
    setStatus('loading'); setError('')
    try {
      const data = await apiFetch(`/mensajes/conversaciones/${claseId}/mensajes?page=${p}&size=${PAGE_SIZE}`)
      const lista = [...(data.content ?? [])].reverse()
      setMensajes(lista)
      setPage(p)
      setHayMas((data.totalPages ?? 1) > 1)
      setStatus('ready')
      apiFetch(`/mensajes/conversaciones/${claseId}/leido`, { method: 'POST' }).then(() => { try { window.dispatchEvent(new Event('aulix-leido')) } catch { /* sin evento */ } }).catch(() => {})
    } catch (err) { setError(err.message); setStatus('error') }
  }, [claseId])
  useEffect(() => { load(0) }, [load])
  useEffect(() => {
  const t = setInterval(async () => {
    try {
      const data = await apiFetch(`/mensajes/conversaciones/${claseId}/mensajes?page=0&size=${PAGE_SIZE}`)
      setMensajes([...(data.content ?? [])].reverse())
    } catch { /* si falla una vez, el chat viejo sigue visible */ }
  }, 8000)
  return () => clearInterval(t)
}, [claseId])
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight }, [mensajes])

  const cargarMas = async () => {
    const siguiente = page + 1
    try {
      const data = await apiFetch(`/mensajes/conversaciones/${claseId}/mensajes?page=${siguiente}&size=${PAGE_SIZE}`)
      setMensajes((m) => [...[...(data.content ?? [])].reverse(), ...m])
      setPage(siguiente)
      setHayMas(siguiente + 1 < (data.totalPages ?? 1))
    } catch { /* el historial ya cargado sigue visible */ }
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim() && !adjunto && !notaVoz) return
    setEnviando(true); setEnvioError('')
    try {
      const fd = new FormData()
      let archivoAEnviar = adjunto
      if (notaVoz) archivoAEnviar = new File([notaVoz.blob], `nota-de-voz-${Date.now()}.webm`, { type: notaVoz.blob.type || 'audio/webm' })
      fd.append('texto', texto.trim())
      if (archivoAEnviar) fd.append('adjunto', archivoAEnviar)
      const nuevo = await apiFetchForm(`/mensajes/conversaciones/${claseId}/mensajes`, fd)
      setMensajes((m) => [...m, nuevo])
      setTexto(''); setAdjunto(null); setNotaVoz(null)
      // v9 (bug 4): mensaje enviado -> se limpia texto, adjunto Y el
      // grabador de voz (el reproductor "Nota lista" desaparece).
      setVozReset((v) => v + 1)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      const esAudio = !!notaVoz
      const rechazo = /no permitido|Tipo de archivo|supera el tamaño/i.test(err.message || '')
      setEnvioError(esAudio && rechazo
        ? 'El backend aún no acepta notas de voz (solo PDF, DOCX o imagen). Tu nota se guardó solo en modo demo; pídele a tu compañero que amplíe los tipos de archivo aceptados.'
        : rechazo ? `${err.message} En modo demo puedes enviarlo sin problema.` : err.message)
    } finally { setEnviando(false) }
  }

  return (
    <div className="pg-chat" style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 12 }}>
      <div className="pg-chat__head">
        <h3>Mensajes de {claseNombre}</h3>
        <p>{grupo} · Solo los integrantes de la materia pueden ver esta conversación.</p>
      </div>
      {status === 'loading' && mensajes.length === 0 && <p className="pg-loading">Cargando mensajes…</p>}
      {status === 'loading' && mensajes.length > 0 && <p className="pg-hint" style={{ padding: '8px 16px 0' }}>Cargando mensajes nuevos…</p>}
      {status === 'error' && (
        <div className="pg-alert" role="alert" style={{ margin: 16 }}>
          <TriangleAlert size={18} /><span>{error}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => load(0)}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {(status === 'ready' || mensajes.length > 0) && (
        <>
          <div className="pg-chat__body" ref={bodyRef}>
            {hayMas && <button type="button" className="btn btn--ghost btn--sm" onClick={cargarMas} style={{ alignSelf: 'center' }}>Cargar mensajes anteriores</button>}
            {mensajes.length === 0 && <p className="pg-empty">Aún no hay mensajes en esta clase. ¡Escribe el primero!</p>}
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
            <input type="text" placeholder={`Escribe un mensaje para ${claseNombre || 'esta materia'}…`} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Escribe un mensaje" disabled={enviando} />
<>
  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp" onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)} aria-label="Adjuntar archivo" style={{ display: 'none' }} />
  <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()} aria-label="Adjuntar archivo" title={adjunto ? adjunto.name : 'Adjuntar PDF, DOCX o imagen, máx. 20 MB'}>
    <Paperclip size={16} /> {adjunto ? '✓' : ''}
  </button>
</>            <button type="submit" className="btn btn--primary" disabled={enviando || (!texto.trim() && !adjunto && !notaVoz)} aria-label="Enviar mensaje">
              <Send size={16} />
            </button>
          </form>
          <div className="emoji-row" role="group" aria-label="Insertar emoji" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '8px 16px 0' }}>
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setTexto((t) => t + e)} aria-label={`Insertar emoji ${e}`} style={{ border: 0, background: 'none', fontSize: 20, cursor: 'pointer', padding: 2, lineHeight: 1 }}>{e}</button>
            ))}
          </div>
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
              <VoiceRecorder disabled={enviando || !!notaVoz} resetKey={vozReset} onReady={(blob, segundos) => setNotaVoz({ blob, segundos })} onCancel={() => setNotaVoz(null)} />
              {notaVoz && <p className="pg-hint">Nota de voz lista ({notaVoz.segundos}s). Pulsa Enviar para mandarla sola, sin escribir nada.</p>}
            </div>
          )}
{!esDocente && (
  <p className="pg-hint" style={{ padding: '0 16px 8px' }}>Puedes mandar PDF, DOCX o imagen (máx. 20 MB), con o sin texto. Las notas de voz son solo del docente por ahora.</p>
)}          {envioError && <p className="pg-error" role="alert" style={{ padding: '0 16px 12px' }}>{envioError}</p>}
          <p className="pg-hint" style={{ padding: '0 16px 12px' }}>Tu mensaje será visible para toda la clase de {claseNombre} · {grupo}.</p>
        </>
      )}
    </div>
  )
}
