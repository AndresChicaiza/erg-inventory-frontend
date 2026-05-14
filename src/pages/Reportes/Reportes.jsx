import { useState, useEffect } from 'react'
import { reportesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import { fmt } from '../helpers.jsx'
import toast from 'react-hot-toast'

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
    {children}
  </div>
)

const BarChart = ({ items, colorFn }) => {
  const max = Math.max(...items.map(i => i.val), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => {
        const pct = (item.val / max) * 100
        const color = colorFn ? colorFn(i) : 'var(--indigo)'
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 110, fontSize: 12, color: 'var(--text2)', textAlign: 'right', flexShrink: 0 }}>{item.label}</div>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
            </div>
            <div style={{ width: 60, fontSize: 12, fontWeight: 700, color, textAlign: 'right', flexShrink: 0 }}>{item.val}</div>
          </div>
        )
      })}
    </div>
  )
}

const FlujoCajaCard = ({ label, cobrar, pagar, color }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--success)' }}>▲ Por Cobrar</span>
      <strong style={{ fontSize: 14, color: 'var(--success)' }}>{fmt(cobrar)}</strong>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--danger)' }}>▼ Por Pagar</span>
      <strong style={{ fontSize: 14, color: 'var(--danger)' }}>{fmt(pagar)}</strong>
    </div>
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Posición neta</span>
      <strong style={{ fontSize: 13, color: cobrar - pagar >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(cobrar - pagar)}</strong>
    </div>
  </div>
)

export default function Reportes() {
  const [data, setData]     = useState(null)
  const [flujo, setFlujo]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('general')

  const load = async () => {
    setLoading(true)
    try {
      const [r, f] = await Promise.all([reportesAPI.resumen(), reportesAPI.flujoCaja()])
      setData(r.data)
      setFlujo(f.data)
    } catch { toast.error('Error cargando reportes') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--text2)' }}>Cargando reportes...</div>
  if (!data)   return null

  const ventasEstado  = (data.ventas_por_estado  || []).map(v => ({ label: v.estado, val: v.cantidad }))
  const comprasEstado = (data.compras_por_estado  || []).map(c => ({ label: c.estado, val: c.cantidad }))
  const movsTipo      = (data.movimientos_por_tipo || []).map(m => ({ label: m.tipo,   val: m.cantidad }))
  const entregasEst   = (data.entregas_por_estado  || []).map(e => ({ label: e.estado, val: e.cantidad }))

  const posNeta = flujo?.posicion_neta || 0
  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: tab === t ? 'var(--indigo)' : 'transparent',
    color: tab === t ? '#fff' : 'var(--text2)',
  })

  return (
    <div>
      <div className="page-header">
        <div><h2>📊 Reportes y Finanzas</h2><p>Dashboard operativo y flujo de caja</p></div>
        <button className="btn btn-ghost" onClick={load}>🔄 Actualizar</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', borderRadius: 8, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        <button style={tabStyle('general')} onClick={() => setTab('general')}>📦 General</button>
        <button style={tabStyle('flujo')} onClick={() => setTab('flujo')}>💰 Flujo de Caja</button>
      </div>

      {tab === 'general' && (
        <>
          <div className="stats-grid">
            <StatCard icon="💵" label="Total Ventas" value={fmt(data.total_ventas)} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
            <StatCard icon="💸" label="Total Compras" value={fmt(data.total_compras)} color="var(--indigo)" iconBg="rgba(99,102,241,.1)" />
            <StatCard icon="📈" label="Utilidad Bruta" value={fmt(data.utilidad_bruta)} color={data.utilidad_bruta >= 0 ? 'var(--success)' : 'var(--danger)'} iconBg="rgba(16,185,129,.1)" />
            <StatCard icon="📦" label="Productos" value={data.num_productos} iconBg="rgba(59,130,246,.1)" />
            <StatCard icon="👤" label="Clientes" value={data.num_clientes} iconBg="rgba(6,182,212,.1)" />
            <StatCard icon="🏭" label="Proveedores" value={data.num_proveedores} iconBg="rgba(249,115,22,.1)" />
            <StatCard icon="⚠️" label="Stock Bajo" value={data.productos_stock_bajo} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
            <StatCard icon="🚫" label="Sin Stock" value={data.productos_sin_stock} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
          </div>
          <div className="report-grid">
            <div className="card"><div className="card-title">Ventas por Estado</div><BarChart items={ventasEstado} colorFn={i => ['#10b981','#f59e0b','#ef4444'][i % 3]} /></div>
            <div className="card"><div className="card-title">Compras por Estado</div><BarChart items={comprasEstado} colorFn={i => ['#f59e0b','#10b981','#ef4444'][i % 3]} /></div>
            <div className="card"><div className="card-title">Movimientos por Tipo</div><BarChart items={movsTipo} colorFn={i => ['#10b981','#ef4444','#f59e0b'][i % 3]} /></div>
            <div className="card"><div className="card-title">Entregas por Estado</div><BarChart items={entregasEst} colorFn={i => ['#f59e0b','#3b82f6','#10b981','#ef4444'][i % 4]} /></div>
          </div>
          {data.top_stock?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title">Top 5 Productos con Mayor Stock</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ textAlign:'left', padding:'8px 12px', fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Producto</th>
                  <th style={{ textAlign:'left', padding:'8px 12px', fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Categoría</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Stock</th>
                </tr></thead>
                <tbody>{data.top_stock.map((p,i) => (
                  <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 12px', fontSize:13 }}><strong>{p.nombre}</strong></td>
                    <td style={{ padding:'10px 12px', fontSize:13, color:'var(--text2)' }}>{p.categoria}</td>
                    <td style={{ padding:'10px 12px', fontSize:13, textAlign:'right', fontWeight:700, color:'var(--success)' }}>{p.stock}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'flujo' && flujo && (
        <>
          {/* Posición neta grande */}
          <div style={{
            background: posNeta >= 0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)',
            border: `1px solid ${posNeta >= 0 ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
            borderRadius: 12, padding: '24px 32px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>POSICIÓN NETA DE CARTERA</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: posNeta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {posNeta >= 0 ? '▲' : '▼'} {fmt(Math.abs(posNeta))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                {posNeta >= 0 ? 'Tienes más por cobrar que por pagar. Posición favorable.' : 'Debes más de lo que te deben. Revisa tu cartera.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>POR COBRAR</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{fmt(flujo.cxc.total_pendiente)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{flujo.cxc.num_cuentas} cuentas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>POR PAGAR</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{fmt(flujo.cxp.total_pendiente)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{flujo.cxp.num_cuentas} cuentas</div>
              </div>
            </div>
          </div>

          {/* Proyecciones por horizonte temporal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
            <FlujoCajaCard label="🔴 Vencido (urgente)" cobrar={flujo.cxc.vencida} pagar={flujo.cxp.vencida} />
            <FlujoCajaCard label="⚠️ Próximos 7 días" cobrar={flujo.cxc.proxima_semana} pagar={flujo.cxp.proxima_semana} />
            <FlujoCajaCard label="📅 Próximos 30 días" cobrar={flujo.cxc.proximo_mes} pagar={flujo.cxp.proximo_mes} />
          </div>

          {/* Tablas top clientes/proveedores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <SectionTitle>📥 Clientes con Mayor Cartera Pendiente</SectionTitle>
              {flujo.top_clientes.length === 0
                ? <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 16 }}>Sin cartera pendiente</div>
                : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>{flujo.top_clientes.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 8 }}>#{i+1}</span>
                        <strong>{c.cliente__razon_social}</strong>
                      </td>
                      <td style={{ padding: '8px 0', fontSize: 14, fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>{fmt(c.saldo_total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              }
            </div>
            <div className="card">
              <SectionTitle>📤 Proveedores con Mayor Deuda Pendiente</SectionTitle>
              {flujo.top_proveedores.length === 0
                ? <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 16 }}>Sin deudas pendientes</div>
                : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>{flujo.top_proveedores.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 8 }}>#{i+1}</span>
                        <strong>{p.proveedor__razon_social}</strong>
                      </td>
                      <td style={{ padding: '8px 0', fontSize: 14, fontWeight: 700, color: 'var(--danger)', textAlign: 'right' }}>{fmt(p.saldo_total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
