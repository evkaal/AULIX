import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Modal genérico para formularios (crear/editar). Nunca usa los dialogos nativos del navegador.
export default function FormModal({ open, title, onClose, onSubmit, submitLabel = 'Guardar', loading = false, children }) {
  const firstRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !loading && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, loading, onClose])
  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <form className="modal modal--form" role="dialog" aria-modal="true" aria-label={title} onSubmit={onSubmit} noValidate>
        <h2 className="modal__title">{title}</h2>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Guardando…' : submitLabel}</button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
