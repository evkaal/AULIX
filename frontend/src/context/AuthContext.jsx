import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { login as loginRequest, loginWithGoogle as loginWithGoogleRequest, register as registerRequest } from '../services/authService'

const AuthContext = createContext(null)
const STORAGE_KEY = 'aulix_session'

function readSession(remembered) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const ROLE_LABEL = { DOCENTE: 'Docente', ESTUDIANTE: 'Estudiante', ADMIN: 'Administrador', ALUMNO: 'Estudiante' }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())

  const saveSession = useCallback((data, remember) => {
    if (data?.user?.rol === 'ALUMNO') data = { ...data, user: { ...data.user, rol: 'ESTUDIANTE' } }
    const storage = remember ? localStorage : sessionStorage
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    setSession(data)
    return data
  }, [])

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await loginRequest({ email, password })
    return saveSession(data, remember)
  }, [saveSession])

  /** Inicio con Google: envía el ID token y guarda la sesión con
   *  saveSession igual que login() (localStorage si remember, si no
   *  sessionStorage). */
  const loginWithGoogle = useCallback(async ({ idToken, remember }) => {
    const data = await loginWithGoogleRequest(idToken)
    return saveSession(data, remember)
  }, [saveSession])

  /** Registro: crea el usuario en el backend (POST /api/auth/register) y
   *  deja la sesión guardada igual que el login. El registro no usa
   *  "Recordarme": la sesión queda en sessionStorage. */
  const register = useCallback(async ({ nombre, email, password, rol, grupo }) => {
    const data = await registerRequest({ nombre, email, password, rol, grupo })
    return saveSession(data, false)
  }, [saveSession])

  const updateUser = useCallback((patch) => {
    setSession((cur) => {
      if (!cur) return cur
      const next = { ...cur, user: { ...cur.user, ...patch } }
      const raw = localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage
      raw.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const user = session?.user ?? null
  const value = useMemo(
    () => ({ user, token: session?.token ?? null, isAuthenticated: !!session?.token, rol: user?.rol ?? null, rolLabel: user?.rol ? ROLE_LABEL[user.rol] ?? user.rol : '', login, loginWithGoogle, register, logout, updateUser }),
    [session, user, login, loginWithGoogle, register, logout, updateUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
