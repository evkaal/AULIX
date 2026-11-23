import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Inicio from './pages/Inicio'
import MisClases from './pages/MisClases'
import Tareas from './pages/Tareas'
import Calificaciones from './pages/Calificaciones'
import VistaPreviaEntrega from './pages/VistaPreviaEntrega'
import Calendario from './pages/Calendario'
import Mensajes from './pages/Mensajes'
import Configuracion from './pages/Configuracion'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/mis-clases" element={<MisClases />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/calificaciones" element={<Calificaciones />} />
          <Route path="/calificaciones/entrega/:id" element={<VistaPreviaEntrega />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
