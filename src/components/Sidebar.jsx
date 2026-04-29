import { NavLink } from 'react-router-dom'
const nav = [
  { s: 'Principal', items: [{ to: '/', icon: '🏠', label: 'Dashboard', bg: 'rgba(59,130,246,.1)' }] },
  {
    s: 'Gestión', items: [
      { to: '/usuarios', icon: '👥', label: 'Usuarios', bg: 'rgba(139,92,246,.1)' },
      { to: '/clientes', icon: '👤', label: 'Clientes', bg: 'rgba(6,182,212,.1)' },
      { to: '/proveedores', icon: '🏭', label: 'Proveedores', bg: 'rgba(249,115,22,.1)' },
    ]
  },
  {
    s: 'Inventario', items: [
      { to: '/productos', icon: '📦', label: 'Productos', bg: 'rgba(16,185,129,.1)' },
      { to: '/bodegas', icon: '🏪', label: 'Bodegas', bg: 'rgba(99,102,241,.1)' },
      { to: '/movimientos', icon: '↔️', label: 'Movimientos', bg: 'rgba(99,102,241,.1)' },
      { to: '/kardex', icon: '📋', label: 'Kardex', bg: 'rgba(20,184,166,.1)' },
    ]
  },
  {
    s: 'Comercial', items: [
      { to: '/ventas', icon: '💰', label: 'Ventas', bg: 'rgba(16,185,129,.1)' },
      { to: '/compras', icon: '🛒', label: 'Compras', bg: 'rgba(99,102,241,.1)' },
      { to: '/entregas', icon: '🚚', label: 'Entregas', bg: 'rgba(245,158,11,.1)' },
      { to: '/cxc', icon: '📥', label: 'CXC', bg: 'rgba(16,185,129,.1)' },
      { to: '/cxp', icon: '📤', label: 'CXP', bg: 'rgba(239,68,68,.1)' },
      { to: '/nomina', icon: '👔', label: 'Nómina', bg: 'rgba(139,92,246,.1)' },
    ]
  },
  {
    s: 'Sistema', items: [
      { to: '/reportes', icon: '📊', label: 'Reportes', bg: 'rgba(236,72,153,.1)' },
      { to: '/configuracion', icon: '⚙️', label: 'Configuración', bg: 'rgba(100,116,139,.1)' },
    ]
  },
]
export default function Sidebar() {
  return (
    <aside className="sidebar">
      {nav.map(({ s, items }) => (
        <div className="sidebar-section" key={s}>
          <div className="sidebar-label">{s}</div>
          {items.map(({ to, icon, label, bg }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <div className="nav-icon" style={{ background: bg }}>{icon}</div>{label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  )
}
