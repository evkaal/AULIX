// VoiceRecorder — notas de voz de máx. 60 segundos (Aulix v2).
// Usa MediaRecorder del navegador. Devuelve el audio como Blob (webm) en
// onReady(blob, segundos). El backend real aún NO acepta audio: su
// ArchivoService solo permite pdf/docx/imagen (ver NUEVAS-FUNCIONES.md),
// así que en modo real el envío fallará con un mensaje claro y en demo
// funciona completo. No se graba nada sin que el usuario pulse Grabar.
import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Trash2 } from 'lucide-react'

const MAX_SECONDS = 60

export default function VoiceRecorder({ onReady, onCancel, disabled, resetKey }) {
  const [state, setState] = useState('idle') // idle | recording | preview
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const blobRef = useRef(null)
  const secondsRef = useRef(0)
  const cancelledRef = useRef(false)

  // v9 (bug 4): el padre limpia la nota al enviarla con éxito (notaVoz =
  // null), pero este componente guardaba su propio estado 'preview' y el
  // reproductor se quedaba abajo ("Nota lista: pulsa Enviar..."). Cuando
  // el padre sube resetKey, el grabador vuelve a idle y el reproductor
  // desaparece. Al fallar el envío el padre NO sube resetKey, así la
  // nota se conserva para reintentar.
  useEffect(() => {
    if (!resetKey) return undefined
    clearInterval(timerRef.current)
    // Sin esto, el onstop del recorder volvería a llamar onReady y la
    // nota reaparecería en el padre justo después de enviarla.
    cancelledRef.current = true
    try { recorderRef.current?.state === 'recording' && recorderRef.current.stop() } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    blobRef.current = null
    setAudioUrl(null)
    setSeconds(0)
    secondsRef.current = 0
    setState('idle')
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    try { recorderRef.current?.stop() } catch { /* ya parado */ }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Tu navegador no permite grabar audio desde aquí. Escribe el mensaje o adjunta un archivo.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorderRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        stopTracks()
        clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        blobRef.current = blob
        setAudioUrl(URL.createObjectURL(blob))
        setState('preview')
        // BUG CORREGIDO (v7): antes la nota solo quedaba lista si el usuario
        // pulsaba "Usar esta nota", y además el botón Enviar de Mensajes no
        // se activaba solo con voz, así que había que escribir un mensaje
        // aparte. Ahora al parar la grabación la nota ya queda lista para
        // enviar sola con el botón Enviar del chat.
        if (!cancelledRef.current) onReady?.(blob, secondsRef.current)
      }
      rec.start()
      setSeconds(0)
      secondsRef.current = 0
      cancelledRef.current = false
      setState('recording')
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            try { rec.stop() } catch { /* ya parado */ }
            secondsRef.current = MAX_SECONDS
            return MAX_SECONDS
          }
          secondsRef.current = s + 1
          return s + 1
        })
      }, 1000)
    } catch {
      setError('No pudimos usar el micrófono. Revisa el permiso del navegador e inténtalo de nuevo.')
    }
  }

  const stop = () => {
    clearInterval(timerRef.current)
    try { recorderRef.current?.stop() } catch { /* ya parado */ }
  }

  const cancel = () => {
    cancelledRef.current = true
    clearInterval(timerRef.current)
    try { recorderRef.current?.state === 'recording' && recorderRef.current.stop() } catch { /* noop */ }
    stopTracks()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    blobRef.current = null
    setAudioUrl(null)
    setSeconds(0)
    setState('idle')
    onCancel?.()
  }

  const fmt = (s) => `0:${String(s).padStart(2, '0')}`

  if (state === 'preview') {
    return (
      <div className="voice-recorder" role="group" aria-label="Nota de voz lista">
        <audio controls src={audioUrl} className="msg-audio" />
        <span className="voice-recorder__time">{fmt(seconds)} / 1:00</span>
        <span className="pg-hint" style={{ margin: 0 }}>Nota lista: pulsa Enviar para mandarla sola.</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={cancel} disabled={disabled}><Trash2 size={14} /> Borrar</button>
      </div>
    )
  }

  return (
    <div className="voice-recorder" role="group" aria-label="Grabar nota de voz">
      {state === 'recording' ? (
        <>
          <span className="voice-recorder__dot" aria-hidden="true" />
          <span className="voice-recorder__time">Grabando… {fmt(seconds)} / 1:00</span>
          <button type="button" className="btn btn--primary btn--sm" onClick={stop}><Square size={14} /> Parar</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={cancel}>Cancelar</button>
        </>
      ) : (
        <button type="button" className="btn btn--ghost btn--sm" onClick={start} disabled={disabled} title="Grabar nota de voz (máx. 1 minuto)">
          <Mic size={16} /> Nota de voz
        </button>
      )}
      {error && <p className="pg-error" role="alert">{error}</p>}
    </div>
  )
}
export { MAX_SECONDS }
