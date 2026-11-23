import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { login as loginRequest, register as registerRequest } from '../services/authService'

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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())

  const saveSession = useCallback((data, remember) => {
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

  /** Registro: crea el usuario en el backend (POST /api/auth/register) y
   *  deja la sesión guardada igual que el login. El registro no usa
   *  "Recordarme": la sesión queda en sessionStorage. */
  const register = useCallback(async ({ nombre, email, password, rol, grupo }) => {
    const data = await registerRequest({ nombre, email, password, rol, grupo })
    return saveSession(data, false)
  }, [saveSession])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, isAuthenticated: !!session?.token, login, register, logout }),
    [session, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
