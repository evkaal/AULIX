import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Recuperar from './pages/Recuperar'
import Inicio from './pages/Inicio'
import MisClases from './pages/MisClases'
import ClaseDetalle from './pages/ClaseDetalle'
import Tareas from './pages/Tareas'
import TareaDetalle from './pages/TareaDetalle'
import Calificaciones from './pages/Calificaciones'
import VistaPreviaEntrega from './pages/VistaPreviaEntrega'
import CalificacionGuardada from './pages/CalificacionGuardada'
import Calendario from './pages/Calendario'
import Mensajes from './pages/Mensajes'
import Conversacion from './pages/Conversacion'
import Configuracion from './pages/Configuracion'
import Perfil from './pages/Perfil'
import Usuarios from './pages/Usuarios'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/mis-clases" element={<MisClases />} />
          <Route path="/mis-clases/:id" element={<ClaseDetalle />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/tareas/:id" element={<TareaDetalle />} />
          <Route path="/calificaciones" element={<Calificaciones />} />
          <Route path="/calificaciones/guardada" element={<CalificacionGuardada />} />
          <Route path="/calificaciones/entrega/:id" element={<VistaPreviaEntrega />} />
          <Route path="/calificaciones/:id" element={<VistaPreviaEntrega />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/mensajes/:id" element={<Conversacion />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
      </Route>
      {/* Usuarios solo existe en modo demo (el backend real no tiene
          /api/usuarios ni rol ADMIN): en modo real ningún usuario tiene
          ese rol y ProtectedRoute lo redirige a /inicio. */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
