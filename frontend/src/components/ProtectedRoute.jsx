import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Exige sesión. Con allowedRoles también exige uno de esos roles
 *  (antes el prop se pasaba desde App.jsx pero se ignoraba). */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, rol } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (allowedRoles && !allowedRoles.includes(rol)) return <Navigate to="/inicio" replace />
  return <Outlet />
}
