import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Al montar, verificar si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = async () => {
    try {
      const r = await authAPI.me()
      setUser(r.data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password })
    localStorage.setItem('access_token', r.data.access)
    localStorage.setItem('refresh_token', r.data.refresh)
    await fetchMe()
    return r.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // Helpers de permisos
  const can = {
    verCostos: () => ['Administrador', 'Contador'].includes(user?.rol),
    crearProductos: () => ['Administrador', 'Contador'].includes(user?.rol),
    crearBodegas: () => ['Administrador', 'Contador'].includes(user?.rol),
    facturar: () => ['Administrador', 'Contador'].includes(user?.rol),
    aprobarOC: () => ['Administrador', 'Contador'].includes(user?.rol),
    gestionarRRHH: () => ['Administrador', 'Contador', 'RRHH'].includes(user?.rol),
    editarEnvios: () => ['Administrador', 'Logistica'].includes(user?.rol),
    subirProdFinal: () => ['Administrador', 'Contador', 'Logistica'].includes(user?.rol),
    movInventario: () => ['Administrador', 'Contador', 'Logistica', 'Vendedor'].includes(user?.rol),
    verTodo: () => user?.rol === 'Administrador',
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMe, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}