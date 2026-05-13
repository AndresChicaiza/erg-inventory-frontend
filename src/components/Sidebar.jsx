import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MENU = [
  {
    section: 'PRINCIPAL',
    items: [
      { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: 'ALL' },
    ]
  },
  {
    section: 'VENTAS',
    items: [
      { path: '/facturas', icon: '🧾', label: 'Facturas', roles: ['Administrador', 'Contador', 'Vendedor'] },
      { path: '/clientes', icon: '👥', label: 'Clientes', roles: ['Administrador', 'Contador', 'Vendedor'] },
      { path: '/entregas', icon: '🚚', label: 'Entregas', roles: ['Administrador', 'Contador', 'Vendedor', 'Logistica'] },
    ]
  },
  {
    section: 'INVENTARIO',
    items: [
      { path: '/productos', icon: '📦', label: 'Productos', roles: ['Administrador', 'Contador', 'Vendedor', 'Logistica', 'JefeFabrica', 'Bodeguero'] },
      { path: '/bodegas', icon: '🏪', label: 'Bodegas', roles: ['Administrador', 'Contador', 'Vendedor', 'Logistica', 'Bodeguero'] },
      { path: '/movimientos', icon: '🔄', label: 'Movimientos', roles: ['Administrador', 'Contador', 'Vendedor', 'Logistica'] },
      { path: '/kardex', icon: '📋', label: 'Kardex', roles: ['Administrador', 'Contador', 'Bodeguero'] },
    ]
  },
  {
    section: 'PRODUCCIÓN',
    items: [
      { path: '/produccion/ordenes', icon: '🔥', label: 'Órdenes Fab.', roles: ['Administrador', 'JefeFabrica'] },
      { path: '/produccion/recetas', icon: '🧪', label: 'Recetas (BOM)', roles: ['Administrador', 'JefeFabrica'] },
    ]
  },
  {
    section: 'COMPRAS',
    items: [
      { path: '/compras', icon: '🛒', label: 'Órd. Compra', roles: ['Administrador', 'Contador', 'Vendedor', 'JefeFabrica', 'Bodeguero'] },
      { path: '/proveedores', icon: '🏭', label: 'Proveedores', roles: ['Administrador', 'Contador', 'Vendedor'] },
    ]
  },
  {
    section: 'FINANZAS',
    items: [
      { path: '/cxc', icon: '📥', label: 'CXC', roles: ['Administrador', 'Contador'] },
      { path: '/cxp', icon: '📤', label: 'CXP', roles: ['Administrador', 'Contador'] },
      { path: '/reportes', icon: '📈', label: 'Reportes', roles: ['Administrador', 'Contador'] },
    ]
  },
  {
    section: 'RRHH',
    items: [
      { path: '/empleados', icon: '👨‍💼', label: 'Empleados', roles: ['Administrador', 'Contador', 'RRHH'] },
      { path: '/nomina', icon: '💵', label: 'Nómina', roles: ['Administrador', 'Contador', 'RRHH'] },
    ]
  },
  {
    section: 'SISTEMA',
    items: [
      { path: '/usuarios', icon: '👤', label: 'Usuarios', roles: ['Administrador'] },
      { path: '/configuracion', icon: '⚙️', label: 'Configuración', roles: ['Administrador', 'Contador'] },
    ]
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const canSee = (roles) => {
    if (roles === 'ALL') return true
    return roles.includes(user?.rol)
  }

  const rolLabel = {
    Administrador: 'Administrador', Contador: 'Contador',
    Vendedor: 'Vendedor', Logistica: 'Logística',
    JefeFabrica: 'Jefe de Fábrica', Bodeguero: 'Bodeguero', RRHH: 'RRHH',
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🌋</div>
        <div>
          <div className="logo-name">ERG Inventory</div>
          <div className="logo-sub">Suministros Dacar</div>
        </div>
      </div>

      {/* Usuario actual */}
      <div style={{
        margin: '0 12px 16px', padding: '10px 12px', borderRadius: 8,
        background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{user?.nombre}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{rolLabel[user?.rol] || user?.rol}</div>
        {user?.sede_nombre && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>📍 {user.sede_nombre}</div>
        )}
      </div>

      {/* Menú */}
      <nav className="sidebar-nav">
        {MENU.map(({ section, items }) => {
          const visibles = items.filter(i => canSee(i.roles))
          if (!visibles.length) return null
          return (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {visibles.map(item => (
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => { logout(); navigate('/login') }} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
          background: 'rgba(239,68,68,.1)', color: 'var(--danger)',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}