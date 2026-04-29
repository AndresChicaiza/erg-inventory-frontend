import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
const modules = [
  { to: '/usuarios', icon: '👥', name: 'Usuarios', desc: 'Gestionar empleados y roles', color: 'var(--purple)', bg: 'rgba(139,92,246,.1)' },
  { to: '/productos', icon: '📦', name: 'Productos', desc: 'Control de inventario y stock', color: 'var(--success)', bg: 'rgba(16,185,129,.1)' },
  { to: '/bodegas', icon: '🏪', name: 'Bodegas', desc: 'Stock por ubicación', color: 'var(--indigo)', bg: 'rgba(99,102,241,.1)' },
  { to: '/movimientos', icon: '↔️', name: 'Movimientos', desc: 'Entradas y salidas de stock', color: 'var(--indigo)', bg: 'rgba(99,102,241,.1)' },
  { to: '/ventas', icon: '💰', name: 'Ventas', desc: 'Registrar y consultar ventas', color: 'var(--success)', bg: 'rgba(16,185,129,.1)' },
  { to: '/compras', icon: '🛒', name: 'Compras', desc: 'Facturación de compras', color: 'var(--indigo)', bg: 'rgba(99,102,241,.1)' },
  { to: '/entregas', icon: '🚚', name: 'Entregas', desc: 'Seguimiento de entregas', color: 'var(--warning)', bg: 'rgba(245,158,11,.1)' },
  { to: '/cxc', icon: '📥', name: 'CXC', desc: 'Cuentas por Cobrar', color: 'var(--success)', bg: 'rgba(16,185,129,.1)' },
  { to: '/cxp', icon: '📤', name: 'CXP', desc: 'Cuentas por Pagar', color: 'var(--danger)', bg: 'rgba(239,68,68,.1)' },
  { to: '/nomina', icon: '👔', name: 'Nómina', desc: 'Pago de empleados', color: 'var(--purple)', bg: 'rgba(139,92,246,.1)' },
  { to: '/clientes', icon: '👤', name: 'Clientes', desc: 'Gestión de clientes', color: 'var(--cyan)', bg: 'rgba(6,182,212,.1)' },
  { to: '/proveedores', icon: '🏭', name: 'Proveedores', desc: 'Empresas y contactos', color: 'var(--orange)', bg: 'rgba(249,115,22,.1)' },
  { to: '/kardex', icon: '📋', name: 'Kardex', desc: 'Movimientos por producto', color: 'var(--teal)', bg: 'rgba(20,184,166,.1)' },
  { to: '/reportes', icon: '📊', name: 'Reportes', desc: 'Estadísticas del sistema', color: 'var(--pink)', bg: 'rgba(236,72,153,.1)' },
  { to: '/configuracion', icon: '⚙️', name: 'Configuración', desc: 'Ajustes del sistema', color: 'var(--text2)', bg: 'rgba(100,116,139,.1)' },
]
export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      <div className="welcome-banner">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>ERG-INVENTORY</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>¡Bienvenido, {user?.nombre?.split(' ')[0]}! 👋</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.email}</span>
            <span className="admin-badge">{user?.rol?.toUpperCase()}</span>
          </div>
        </div>
        <div className="welcome-avatar">{user?.nombre?.[0]?.toUpperCase()}</div>
      </div>
      <div className="section-title">MÓDULOS DISPONIBLES</div>
      <div className="modules-grid">
        {modules.map(m => (
          <Link key={m.to} to={m.to} className="module-card" style={{ '--mc': m.color }}>
            <div className="module-icon" style={{ background: m.bg }}>{m.icon}</div>
            <div className="module-name">{m.name}</div>
            <div className="module-desc">{m.desc}</div>
            <div className="module-link">Abrir módulo →</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
