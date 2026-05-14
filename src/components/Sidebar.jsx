import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlertas } from '../context/AlertasContext'
import GlobalSearch from './GlobalSearch'

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
      { path: '/facturas',  icon: '🧾', label: 'Facturas',  roles: ['Administrador', 'Contador', 'Vendedor'] },
      { path: '/clientes',  icon: '👥', label: 'Clientes',  roles: ['Administrador', 'Contador', 'Vendedor'] },
      { path: '/entregas',  icon: '🚚', label: 'Entregas',  roles: ['Administrador', 'Logistica', 'Vendedor'], alertKey: 'entregas' },
    ]
  },
  {
    section: 'INVENTARIO',
    items: [
      { path: '/productos',   icon: '📦', label: 'Productos',   roles: ['Administrador', 'Contador', 'Vendedor', 'Logistica', 'JefeFabrica', 'Bodeguero'], alertKey: 'stock' },
      { path: '/bodegas',     icon: '🏪', label: 'Bodegas',     roles: ['Administrador', 'Contador', 'Logistica', 'Bodeguero', 'JefeFabrica'] },
      { path: '/movimientos', icon: '🔄', label: 'Movimientos', roles: ['Administrador', 'Contador', 'Vendedor', 'Logistica', 'Bodeguero', 'JefeFabrica'] },
      { path: '/kardex',      icon: '📋', label: 'Kardex',      roles: ['Administrador', 'Contador', 'Bodeguero', 'JefeFabrica'] },
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
      { path: '/compras',     icon: '🛒', label: 'Órd. Compra', roles: ['Administrador', 'Contador', 'JefeFabrica', 'Bodeguero'], alertKey: 'compras' },
      { path: '/proveedores', icon: '🏭', label: 'Proveedores', roles: ['Administrador', 'Contador', 'JefeFabrica', 'Bodeguero'] },
    ]
  },
  {
    section: 'FINANZAS',
    items: [
      { path: '/cxc',      icon: '📥', label: 'CXC',      roles: ['Administrador', 'Contador'], alertKey: 'cxc' },
      { path: '/cxp',      icon: '📤', label: 'CXP',      roles: ['Administrador', 'Contador'], alertKey: 'cxp' },
      { path: '/reportes', icon: '📈', label: 'Reportes', roles: ['Administrador', 'Contador'] },
    ]
  },
  {
    section: 'RRHH',
    items: [
      { path: '/empleados', icon: '👨‍💼', label: 'Empleados', roles: ['Administrador', 'Contador', 'RRHH'] },
      { path: '/nomina',    icon: '💵', label: 'Nómina',    roles: ['Administrador', 'Contador', 'RRHH'] },
    ]
  },
  {
    section: 'SISTEMA',
    items: [
      { path: '/usuarios',      icon: '👤', label: 'Usuarios',      roles: ['Administrador'] },
      { path: '/logs',          icon: '📜', label: 'Auditoría',     roles: ['Administrador'] },
      { path: '/configuracion', icon: '⚙️', label: 'Configuración', roles: ['Administrador'] },
    ]
  },
]

const Badge = ({ n, color = '#ef4444' }) => n > 0 ? (
  <span style={{
    marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px',
    borderRadius: 9, background: color, color: '#fff',
    fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>{n > 99 ? '99+' : n}</span>
) : null

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const alertasCtx = useAlertas()
  const alertas = alertasCtx?.alertas

  const canSee = (roles) => {
    if (roles === 'ALL') return true
    return roles.includes(user?.rol)
  }

  // Mapa de badges por alertKey
  const badgeMap = alertas ? {
    stock:    (alertas.stock?.sin_stock || 0) + (alertas.stock?.stock_bajo || 0),
    cxc:      alertas.financiero?.cxc_vencidas || 0,
    cxp:      alertas.financiero?.cxp_vencidas || 0,
    compras:  alertas.operaciones?.oc_pendientes || 0,
    entregas: alertas.operaciones?.entregas_pend || 0,
  } : {}

  const rolLabel = {
    Administrador: 'Administrador', Contador: 'Contador',
    Vendedor: 'Vendedor', Logistica: 'Logística',
    JefeFabrica: 'Jefe de Fábrica', Bodeguero: 'Bodeguero', RRHH: 'RRHH',
  }

  const totalUrgente = alertas ? (
    (alertas.financiero?.cxp_vencidas || 0) +
    (alertas.financiero?.cxc_vencidas || 0) +
    (alertas.stock?.sin_stock || 0)
  ) : 0

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{user?.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{rolLabel[user?.rol] || user?.rol}</div>
            {user?.sede_nombre && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>📍 {user.sede_nombre}</div>
            )}
          </div>
          {totalUrgente > 0 && (
            <div title={`${totalUrgente} alertas urgentes`} style={{
              minWidth: 22, height: 22, borderRadius: 11, background: '#ef4444',
              color: '#fff', fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
              animation: 'pulse 2s infinite',
            }}>
              {totalUrgente}
            </div>
          )}
        </div>
      </div>

      <GlobalSearch />

      {/* Menú */}
      <nav className="sidebar-nav">
        {MENU.map(({ section, items }) => {
          const visibles = items.filter(i => canSee(i.roles))
          if (!visibles.length) return null
          return (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {visibles.map(item => {
                const badge = item.alertKey ? (badgeMap[item.alertKey] || 0) : 0
                return (
                  <NavLink key={item.path} to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="nav-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <Badge n={badge} color={item.alertKey === 'cxp' || item.alertKey === 'stock' ? '#ef4444' : '#f59e0b'} />
                  </NavLink>
                )
              })}
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