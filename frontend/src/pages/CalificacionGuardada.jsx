import { Link, useLocation } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import '../styles/pages.css'

// Pantalla "Calificación guardada" de Figma (18:1254). Se llega aquí
// después de calificar una entrega en VistaPreviaEntrega.jsx.
export default function CalificacionGuardada() {
  const state = useLocation().state ?? {}
  return (
    <div className="center-card">
      <CircleCheck size={64} className="center-card__check" aria-hidden="true" />
      <h1 className="page-title">Calificación guardada</h1>
      <p className="page-text">
        {state.estudianteNombre ? `${state.estudianteNombre} recibió ${state.nota}/10 en ${state.tareaTitulo ?? 'su trabajo'}.` : 'La calificación se guardó correctamente.'}
      </p>
      {state.comentario && <p className="page-text">“{state.comentario}”</p>}
      <div className="center-card__actions">
        <Link className="btn btn--primary" to="/calificaciones">Ver calificaciones</Link>
        <Link className="btn btn--ghost" to="/tareas">Volver a Tareas</Link>
      </div>
    </div>
  )
}
