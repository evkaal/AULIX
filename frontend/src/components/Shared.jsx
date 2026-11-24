import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { isDemo, isFallback } from '../services/api'

// Banner que deja claro que se está demostrando sin backend real.
export function DemoBanner() {
  if (!isDemo()) return null
  const fallback = isFallback()
  return (
    <div className="demo-banner" role="status" style={{ marginBottom: 12 }}>
      <strong>{fallback ? 'Sin conexión con el backend: estás viendo datos demo.' : 'Modo demo sin backend.'}</strong>
      <span>
        {fallback
          ? ' El backend no respondió, así que Aulix sigue funcionando con datos de ejemplo guardados solo en este navegador. Revisa que el backend esté encendido y recarga la página.'
          : ' Los datos son de ejemplo y se guardan solo en este navegador. Para usar el backend real pon VITE_DEMO_MODE=false y VITE_API_URL=<la URL de tu API> en el archivo .env.'}
      </span>
    </div>
  )
}
export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <Inbox size={36} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
export function Loading({ label = 'Cargando…' }) {
  return <div className="loading" aria-busy="true" aria-label={label}><span className="spinner" />{label}</div>
}
export function ErrorBox({ message, onRetry }) {
  return (
    <div className="alert alert--error" role="alert">
      <span>{message || 'No pudimos cargar la información. Revisa tu conexión e inténtalo de nuevo.'}</span>
      {onRetry && <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}
// Paginación del lado del servidor: page es 0-based, como en Spring.
export function Pagination({ page, totalPages, totalElements, onPage }) {
  if (!totalPages || totalPages <= 1) return <p className="pagination__total">{totalElements} registro(s)</p>
  return (
    <div className="pagination">
      <p className="pagination__total">{totalElements} registro(s) · Página {page + 1} de {totalPages}</p>
      <div className="pagination__actions">
        <button type="button" className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft size={15} /> Anterior</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>Siguiente <ChevronRight size={15} /></button>
      </div>
    </div>
  )
}
export function Badge({ tone = 'blue', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
