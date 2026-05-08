import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

// Páginas existentes
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

// ✅ Nuevas páginas de facturación
import Facturas from './pages/Facturacion/Facturas'
import NuevaFactura from './pages/Facturacion/NuevaFactura'
import VistaFactura from './pages/Facturacion/VistaFactura'

// ── Layout ────────────────────────────────────────────────────────────────────
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

function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

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
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>

            <Route path="/dashboard" element={<Dashboard />} />

            {/* Ventas */}
            <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor']} />}>
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/clientes" element={<Clientes />} />
            </Route>

            {/* ✅ Facturación — Admin y Contador */}
            <Route element={<RoleRoute roles={['Administrador', 'Contador']} />}>
              <Route path="/facturas" element={<Facturas />} />
              <Route path="/facturas/nueva" element={<NuevaFactura />} />
              <Route path="/facturas/:id" element={<VistaFactura />} />
              <Route path="/facturas/:id/editar" element={<NuevaFactura />} />
              <Route path="/cxc" element={<CXC />} />
              <Route path="/cxp" element={<CXP />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>

            {/* Entregas */}
            <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor', 'Logistica']} />}>
              <Route path="/entregas" element={<Entregas />} />
            </Route>

            {/* Inventario */}
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

            {/* Compras */}
            <Route element={<RoleRoute roles={['Administrador', 'Contador', 'Vendedor', 'JefeFabrica', 'Bodeguero']} />}>
              <Route path="/compras" element={<Compras />} />
              <Route path="/proveedores" element={<Proveedores />} />
            </Route>

            {/* RRHH */}
            <Route element={<RoleRoute roles={['Administrador', 'Contador', 'RRHH']} />}>
              <Route path="/empleados" element={<Dashboard />} />
              <Route path="/nomina" element={<Nomina />} />
            </Route>

            {/* Sistema */}
            <Route element={<RoleRoute roles={['Administrador']} />}>
              <Route path="/usuarios" element={<Usuarios />} />
            </Route>

            {/* Configuración */}
            <Route element={<RoleRoute roles={['Administrador', 'Contador']} />}>
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Route>
        </Route>

      </Routes>
    </AuthProvider>
  )
}