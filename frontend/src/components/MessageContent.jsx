// MessageContent — render de mensajes del chat grupal (Aulix v2).
// - Texto con enlaces clicables (detecta http(s):// y www.) y tarjeta de
//   vista previa del primer enlace (dominio + abrir en pestaña nueva).
// - Adjuntos: imagen (vista previa tipo Discord, clic para ampliar en
//   modal), audio (reproductor en línea), video (reproductor en línea) y
//   otros archivos (descarga). En modo real el archivo se descarga con
//   Bearer vía apiDownload/apiFetchBlob; en demo el mensaje trae
//   adjuntoUrl (objectURL en memoria).
import { useEffect, useState } from 'react'
import { Download, ExternalLink, FileText, Paperclip, Play, X } from 'lucide-react'
import { apiDownload, apiFetchBlob } from '../services/authService'

const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

export function linkify(text) {
  if (!text) return null
  const parts = String(text).split(URL_RE)
  return parts.map((part, i) => {
    if (!URL_RE.test(part)) return <span key={i}>{part}</span>
    URL_RE.lastIndex = 0
    const href = part.startsWith('http') ? part : `https://${part}`
    return (
      <a key={i} href={href} target="_blank" rel="noreferrer" className="msg-link">
        {part}
      </a>
    )
  })
}

export function firstUrl(text) {
  const m = String(text || '').match(URL_RE)
  if (!m) return null
  const raw = m[0]
  return raw.startsWith('http') ? raw : `https://${raw}`
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function LinkPreview({ url }) {
  if (!url) return null
  return (
    <a className="msg-linkpreview" href={url} target="_blank" rel="noreferrer">
      <span className="msg-linkpreview__icon"><ExternalLink size={16} /></span>
      <span className="msg-linkpreview__body">
        <span className="msg-linkpreview__domain">{domainOf(url)}</span>
        <span className="msg-linkpreview__url">{url}</span>
      </span>
      <span className="msg-linkpreview__open">Abrir ↗</span>
    </a>
  )
}

function kindOf(m) {
  if (!m) return 'archivo'
  if (m.adjuntoTipo) return m.adjuntoTipo
  const name = (m.adjuntoNombre || '').toLowerCase()
  if (/\.(png|jpe?g|gif|webp)$/.test(name)) return 'imagen'
  if (/\.(mp3|wav|ogg|webm|m4a)$/.test(name)) return 'audio'
  if (/\.(mp4|webm|mov)$/.test(name)) return 'video'
  return 'archivo'
}

// URL para mostrar/descargar un adjunto. En demo viene adjuntoUrl
// (data URL persistida, v9) o adjuntoContenido. En real se pide el blob
// con Bearer y se crea objectURL.
function useAttachmentUrl(m) {
  const [url, setUrl] = useState(m.adjuntoUrl || m.adjuntoContenido || null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (m.adjuntoUrl) { setUrl(m.adjuntoUrl); return undefined }
    if (m.adjuntoContenido) { setUrl(m.adjuntoContenido); return undefined }
    if (!m.adjuntoRuta) return undefined
    let alive = true
    let objectUrl = null
    apiFetchBlob(`/archivos/${m.adjuntoRuta}`)
      .then((blob) => { if (!alive) return; objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) })
      .catch(() => { if (alive) setError('No se pudo cargar la vista previa.') })
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [m.adjuntoUrl, m.adjuntoContenido, m.adjuntoRuta])
  return { url, error }
}

export function AttachmentView({ mensaje, onDownload }) {
  const kind = kindOf(mensaje)
  const { url, error } = useAttachmentUrl(mensaje)
  const [zoom, setZoom] = useState(false)
  const download = () => {
    if (onDownload) onDownload(mensaje)
    else if (mensaje.adjuntoRuta) apiDownload(`/archivos/${mensaje.adjuntoRuta}`, mensaje.adjuntoNombre).catch(() => {})
    else if (url) {
      const a = document.createElement('a')
      a.href = url; a.download = mensaje.adjuntoNombre || 'archivo'
      document.body.appendChild(a); a.click(); a.remove()
    }
  }
  if (kind === 'imagen') {
    return (
      <div className="msg-attach">
        {url ? (
          <button type="button" className="msg-imgbtn" onClick={() => setZoom(true)} aria-label={`Ampliar imagen ${mensaje.adjuntoNombre}`}>
            <img src={url} alt={mensaje.adjuntoNombre || 'Imagen adjunta'} className="msg-img" />
          </button>
        ) : (
          <p className="pg-hint">{error || 'Cargando imagen…'}</p>
        )}
        <button type="button" className="btn btn--ghost btn--sm btn-download" onClick={download}>
          <Download size={14} /> Descargar
        </button>
        {zoom && url && (
          <div className="msg-lightbox" role="dialog" aria-label="Imagen ampliada" onClick={() => setZoom(false)}>
            <button type="button" className="msg-lightbox__close" aria-label="Cerrar imagen"><X size={22} /></button>
            <img src={url} alt={mensaje.adjuntoNombre || 'Imagen adjunta'} onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    )
  }
  if (kind === 'audio') {
    return (
      <div className="msg-attach">
        <span className="msg-audio-label">🎙 Nota de voz · {mensaje.adjuntoNombre || 'audio'}</span>
        {url ? <audio controls src={url} preload="metadata" className="msg-audio" /> : <p className="pg-hint">{error || 'Cargando nota de voz…'}</p>}
        <button type="button" className="btn btn--ghost btn--sm btn-download" onClick={download}><Download size={14} /> Descargar</button>
      </div>
    )
  }
  if (kind === 'video') {
    return (
      <div className="msg-attach">
        {url ? <video controls src={url} preload="metadata" className="msg-video" /> : <p className="pg-hint">{error || 'Cargando video…'}</p>}
        <button type="button" className="btn btn--ghost btn--sm btn-download" onClick={download}><Download size={14} /> Descargar</button>
      </div>
    )
  }
  return (
    <div className="msg-attach">
      <button type="button" className="btn btn--ghost btn--sm btn-download" onClick={download}>
        <Download size={14} /> Descargar {mensaje.adjuntoNombre || 'archivo'}
      </button>
    </div>
  )
}

export default function MessageContent({ mensaje }) {
  if (!mensaje) return null
  const url = firstUrl(mensaje.texto)
  return (
    <div className="msg-content">
      {mensaje.texto && <div>{linkify(mensaje.texto)}</div>}
      {url && <LinkPreview url={url} />}
      {mensaje.adjuntoNombre && <AttachmentView mensaje={mensaje} />}
    </div>
  )
}

// Icono de reproducción para la lista de archivos (sin reproducir aquí).
export function FileChip({ nombre }) {
  return (
    <span className="msg-filechip"><FileText size={14} /> {nombre}</span>
  )
}
export { Play }
