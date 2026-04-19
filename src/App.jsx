import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Usuarios from './pages/Usuarios/Usuarios'
import Productos from './pages/Productos/Productos'
import Clientes from './pages/Clientes/Clientes'
import Proveedores from './pages/Proveedores/Proveedores'
import Ventas from './pages/Ventas/Ventas'
import Compras from './pages/Compras/Compras'
import Entregas from './pages/Entregas/Entregas'
import Movimientos from './pages/Movimientos/Movimientos'
import Kardex from './pages/Kardex/Kardex'
import Reportes from './pages/Reportes/Reportes'
import Configuracion from './pages/Configuracion/Configuracion'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'var(--text2)' }}>
      Cargando...
    </div>
  )
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/usuarios"     element={<PrivateRoute><Usuarios /></PrivateRoute>} />
      <Route path="/productos"    element={<PrivateRoute><Productos /></PrivateRoute>} />
      <Route path="/clientes"     element={<PrivateRoute><Clientes /></PrivateRoute>} />
      <Route path="/proveedores"  element={<PrivateRoute><Proveedores /></PrivateRoute>} />
      <Route path="/ventas"       element={<PrivateRoute><Ventas /></PrivateRoute>} />
      <Route path="/compras"      element={<PrivateRoute><Compras /></PrivateRoute>} />
      <Route path="/entregas"     element={<PrivateRoute><Entregas /></PrivateRoute>} />
      <Route path="/movimientos"  element={<PrivateRoute><Movimientos /></PrivateRoute>} />
      <Route path="/kardex"       element={<PrivateRoute><Kardex /></PrivateRoute>} />
      <Route path="/reportes"     element={<PrivateRoute><Reportes /></PrivateRoute>} />
      <Route path="/configuracion" element={<PrivateRoute><Configuracion /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
