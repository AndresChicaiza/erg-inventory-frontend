import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

// Páginas
import Login from './pages/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Usuarios from './pages/Usuarios/Usuarios'
import Clientes from './pages/Clientes/Clientes'
import Proveedores from './pages/Proveedores/Proveedores'
import Productos from './pages/Productos/Productos'
import Bodegas from './pages/Bodegas/Bodegas'
import Movimientos from './pages/Movimientos/Movimientos'
import Kardex from './pages/Kardex/Kardex'
import Ventas from './pages/Ventas/Ventas'
import Compras from './pages/Compras/Compras'
import Entregas from './pages/Entregas/Entregas'
import CXC from './pages/CXC/CXC'
import CXP from './pages/CXP/CXP'
import Reportes from './pages/Reportes/Reportes'
import Configuracion from './pages/Configuracion/Configuracion'
import Nomina from './pages/Nomina/Nomina'
// import Empleados  from './pages/Empleados/Empleados'  ← pendiente Fase 4

// ── Layout principal ──────────────────────────────────────────────────────────
function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

// ── Ruta privada base ─────────────────────────────────────────────────────────
function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// ── Ruta protegida por rol ────────────────────────────────────────────────────
function RoleRoute({ roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.rol)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      {/* ✅ BrowserRouter debe envolver todo incluyendo AuthProvider que usa navigate */}
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>

          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Privadas */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>

              {/* Dashboard — todos */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Ventas — Admin, Contador, Vendedor */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor']} />}>
                <Route path="/ventas" element={<Ventas />} />
                <Route path="/clientes" element={<Clientes />} />
              </Route>

              {/* Finanzas — Admin y Contador */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador']} />}>
                <Route path="/facturas" element={<Dashboard />} />
                <Route path="/cxc" element={<CXC />} />
                <Route path="/cxp" element={<CXP />} />
                <Route path="/reportes" element={<Reportes />} />
              </Route>

              {/* Entregas — Admin, Contador, Vendedor, Logística */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor', 'Logistica']} />}>
                <Route path="/entregas" element={<Entregas />} />
              </Route>

              {/* Inventario — todos excepto RRHH */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor', 'Logistica', 'JefeFabrica', 'Bodeguero']} />}>
                <Route path="/productos" element={<Productos />} />
              </Route>

              {/* Bodegas y movimientos */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor', 'Logistica', 'Bodeguero']} />}>
                <Route path="/bodegas" element={<Bodegas />} />
                <Route path="/movimientos" element={<Movimientos />} />
              </Route>

              {/* Kardex */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Bodeguero']} />}>
                <Route path="/kardex" element={<Kardex />} />
              </Route>

              {/* Compras y proveedores */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor', 'JefeFabrica', 'Bodeguero']} />}>
                <Route path="/compras" element={<Compras />} />
                <Route path="/proveedores" element={<Proveedores />} />
              </Route>

              {/* RRHH */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador', 'RRHH']} />}>
                <Route path="/empleados" element={<Dashboard />} />
                <Route path="/nomina" element={<Nomina />} />
              </Route>

              {/* Sistema — solo Admin */}
              <Route element={<RoleRoute roles={['Administrador']} />}>
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>

              {/* Configuración — Admin y Contador */}
              <Route element={<RoleRoute roles={['Administrador', 'Contador']} />}>
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}