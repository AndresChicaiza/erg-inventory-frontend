import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAlertas } from '../../context/AlertasContext'
import { reportesAPI } from '../../api/endpoints'
import { fmt } from '../helpers.jsx'

const ALL_MODULES = [
  { to: '/facturas',           icon: '🧾', name: 'Facturas',      desc: 'Facturación y emisión',         color: 'var(--success)',  bg: 'rgba(16,185,129,.1)',  roles: ['Administrador','Contador','Vendedor'] },
  { to: '/clientes',           icon: '👥', name: 'Clientes',      desc: 'Gestión de clientes',           color: 'var(--cyan)',     bg: 'rgba(6,182,212,.1)',   roles: ['Administrador','Contador','Vendedor'] },
  { to: '/entregas',           icon: '🚚', name: 'Entregas',      desc: 'Seguimiento de despachos',      color: 'var(--warning)',  bg: 'rgba(245,158,11,.1)',  roles: ['Administrador','Contador','Vendedor','Logistica'] },
  { to: '/productos',          icon: '📦', name: 'Productos',     desc: 'Control de inventario y stock', color: 'var(--success)',  bg: 'rgba(16,185,129,.1)',  roles: ['Administrador','Contador','Vendedor','Logistica','JefeFabrica','Bodeguero'] },
  { to: '/bodegas',            icon: '🏪', name: 'Bodegas',       desc: 'Stock por ubicación',           color: 'var(--indigo)',   bg: 'rgba(99,102,241,.1)',  roles: ['Administrador','Contador','Logistica','Bodeguero'] },
  { to: '/movimientos',        icon: '↔️', name: 'Movimientos',   desc: 'Entradas y salidas de stock',   color: 'var(--indigo)',   bg: 'rgba(99,102,241,.1)',  roles: ['Administrador','Contador','Logistica','Bodeguero'] },
  { to: '/kardex',             icon: '📋', name: 'Kardex',        desc: 'Movimientos por producto',      color: 'var(--teal)',     bg: 'rgba(20,184,166,.1)',  roles: ['Administrador','Contador','Bodeguero'] },
  { to: '/compras',            icon: '🛒', name: 'Órd. Compra',   desc: 'Facturación de compras',        color: 'var(--indigo)',   bg: 'rgba(99,102,241,.1)',  roles: ['Administrador','Contador','JefeFabrica','Bodeguero'] },
  { to: '/proveedores',        icon: '🏭', name: 'Proveedores',   desc: 'Empresas y contactos',          color: 'var(--orange)',   bg: 'rgba(249,115,22,.1)',  roles: ['Administrador','Contador'] },
  { to: '/produccion/ordenes', icon: '🔥', name: 'Producción',    desc: 'Órdenes de fabricación',        color: 'var(--purple)',   bg: 'rgba(139,92,246,.1)',  roles: ['Administrador','JefeFabrica'] },
  { to: '/cxc',                icon: '📥', name: 'CXC',           desc: 'Cuentas por Cobrar',            color: 'var(--success)',  bg: 'rgba(16,185,129,.1)',  roles: ['Administrador','Contador'] },
  { to: '/cxp',                icon: '📤', name: 'CXP',           desc: 'Cuentas por Pagar',             color: 'var(--danger)',   bg: 'rgba(239,68,68,.1)',   roles: ['Administrador','Contador'] },
  { to: '/reportes',           icon: '📊', name: 'Reportes',      desc: 'Estadísticas y flujo de caja', color: 'var(--pink)',     bg: 'rgba(236,72,153,.1)',  roles: ['Administrador','Contador'] },
  { to: '/empleados',          icon: '👨‍💼', name: 'Empleados',    desc: 'Gestión del personal',          color: 'var(--purple)',   bg: 'rgba(139,92,246,.1)',  roles: ['Administrador','RRHH'] },
  { to: '/nomina',             icon: '💵', name: 'Nómina',        desc: 'Pago y liquidación de nómina', color: 'var(--purple)',   bg: 'rgba(139,92,246,.1)',  roles: ['Administrador','Contador','RRHH'] },
  { to: '/usuarios',           icon: '👤', name: 'Usuarios',      desc: 'Gestión de usuarios y roles',  color: 'var(--text2)',    bg: 'rgba(100,116,139,.1)', roles: ['Administrador'] },
  { to: '/configuracion',      icon: '⚙️', name: 'Configuración', desc: 'Ajustes del sistema',           color: 'var(--text2)',    bg: 'rgba(100,116,139,.1)', roles: ['Administrador','Contador'] },
]

const KpiCard = ({ icon, label, value, sub, color = 'var(--text1)', bg = 'rgba(99,102,241,.08)', to, urgent }) => {
  const inner = (
    <div style={{
      background: bg, border: `1px solid ${urgent ? 'rgba(239,68,68,.3)' : 'rgba(255,255,255,.06)'}`,
      borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden',
      transition: 'transform .15s, box-shadow .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.2)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {urgent && <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />}
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner
}

const AlertPanel = ({ icon, title, items, color, to }) => (
  <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}30`, borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px', background: `${color}12`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${color}20` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{icon} {title}</div>
      {to && <Link to={to} style={{ fontSize: 11, color, textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>}
    </div>
    {items.length === 0
      ? <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>✅ Sin alertas</div>
      : <div>{items.map((item, i) => (
        <div key={i} style={{ padding: '10px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{item.nombre || item.producto}</div>
            {item.sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.sub}</div>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{item.badge}</div>
        </div>
      ))}</div>
    }
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const { alertas, refresh } = useAlertas()
  const [resumen, setResumen] = useState(null)
  const modules = ALL_MODULES.filter(m => m.roles.includes(user?.rol))
  const esFinanciero = ['Administrador', 'Contador'].includes(user?.rol)

  useEffect(() => {
    if (esFinanciero) {
      reportesAPI.resumen().then(r => setResumen(r.data)).catch(() => {})
    }
  }, [])

  const a = alertas

  return (
    <div>
      {/* Bienvenida */}
      <div className="welcome-banner" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>ERG-INVENTORY · ERP</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>¡Bienvenido, {user?.nombre?.split(' ')[0]}! 👋</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.email}</span>
            <span className="admin-badge">{user?.rol?.toUpperCase()}</span>
            {user?.sede_nombre && <span style={{ fontSize: 12, color: 'var(--text3)' }}>📍 {user.sede_nombre}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={refresh} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>🔄 Actualizar</button>
          <div className="welcome-avatar">{user?.nombre?.[0]?.toUpperCase()}</div>
        </div>
      </div>

      {/* ── KPIs Ejecutivos (solo roles financieros + admin) ── */}
      {esFinanciero && a && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>📈 Resumen del Día</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
            <KpiCard icon="💵" label="Ventas Hoy"    value={fmt(a.ventas?.hoy || 0)}    sub={`${a.ventas?.num_hoy || 0} facturas`}    color="var(--success)" bg="rgba(16,185,129,.08)"  to="/facturas" />
            <KpiCard icon="📅" label="Ventas del Mes" value={fmt(a.ventas?.mes || 0)}   sub={`${a.ventas?.num_mes || 0} facturas`}    color="var(--indigo)"  bg="rgba(99,102,241,.08)"  to="/facturas" />
            <KpiCard icon="📤" label="CXP Vencidas"  value={a.financiero?.cxp_vencidas || 0} sub={fmt(a.financiero?.cxp_monto || 0)} color="var(--danger)"  bg="rgba(239,68,68,.08)"   to="/cxp"      urgent={a.financiero?.cxp_vencidas > 0} />
            <KpiCard icon="📥" label="CXC Vencidas"  value={a.financiero?.cxc_vencidas || 0} sub={fmt(a.financiero?.cxc_monto || 0)} color="var(--warning)" bg="rgba(245,158,11,.08)"  to="/cxc"      urgent={a.financiero?.cxc_vencidas > 0} />
            <KpiCard icon="🛒" label="OC Pendientes" value={a.operaciones?.oc_pendientes || 0} sub="por recibir"                    color="var(--accent)"  bg="rgba(59,130,246,.08)"  to="/compras"  />
            <KpiCard icon="🚚" label="Entregas Pend." value={a.operaciones?.entregas_pend || 0} sub="sin despachar"                  color="var(--orange)"  bg="rgba(249,115,22,.08)"  to="/entregas" />
            <KpiCard icon="⚠️" label="Stock Bajo"    value={a.stock?.stock_bajo || 0}   sub="por reabastecer"                        color="var(--warning)" bg="rgba(245,158,11,.08)"  to="/productos" urgent={a.stock?.stock_bajo > 0} />
            <KpiCard icon="🚫" label="Sin Stock"     value={a.stock?.sin_stock || 0}    sub="agotados"                               color="var(--danger)"  bg="rgba(239,68,68,.08)"   to="/productos" urgent={a.stock?.sin_stock > 0} />
          </div>

          {/* ── Paneles de alertas ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
            <AlertPanel
              icon="🚫" title="Sin Stock" color="#ef4444" to="/productos"
              items={(a.stock?.top_sin_stock || []).map(p => ({ nombre: p.nombre, sub: p.categoria, badge: `Mín: ${p.stock_minimo}` }))}
            />
            <AlertPanel
              icon="⚠️" title="Stock Bajo" color="#f59e0b" to="/productos"
              items={(a.stock?.top_stock_bajo || []).map(p => ({ nombre: p.nombre, sub: p.categoria, badge: `${p.stock} / ${p.stock_minimo}` }))}
            />
            <AlertPanel
              icon="🕒" title="Lotes por Vencer (≤30 días)" color="#8b5cf6" to="/productos"
              items={(a.lotes?.proximos || []).map(l => ({ nombre: l.producto, sub: `Lote: ${l.lote}`, badge: `${l.dias}d · ${l.stock} uds` }))}
            />
          </div>
        </>
      )}

      {/* ── Módulos disponibles ── */}
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
