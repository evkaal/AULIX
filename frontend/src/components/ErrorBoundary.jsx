import { Component } from 'react'

// BUG CORREGIDO (v3): antes, si una página lanzaba una excepción al
// renderizar (p. ej. .map sobre un dato undefined), React desmontaba toda
// la app y quedaba una página totalmente en blanco, sin navbar ni mensaje.
// Este boundary atrapa el error y muestra algo útil en vez de blanco.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // No se registra nada sensible; solo se muestra el fallback.
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="pg-alert" role="alert" style={{ margin: 24 }}>
        <span>Algo falló al cargar esta vista. Tus datos están a salvo; inténtalo de nuevo.</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { this.setState({ hasError: false }); window.location.reload() }}>
          Reintentar
        </button>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => { window.location.href = '/inicio' }}>
          Volver a Inicio
        </button>
      </div>
    )
  }
}
