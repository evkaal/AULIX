import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Mensajes from './Mensajes'

// Conversación por materia (ruta /mensajes/:id, Figma "Conversación").
// :id es el claseId de la materia. Mensajes.jsx ya muestra la lista y el
// chat; esta ruta la abre directamente con esa materia seleccionada.
export default function Conversacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    // Mensajes lee la materia inicial de sessionStorage (la pone esta ruta).
    try { sessionStorage.setItem('aulix_conversacion_inicial', String(id)) } catch { /* sin storage */ }
    navigate('/mensajes', { replace: true })
  }, [id, navigate])
  return <Mensajes />
}
