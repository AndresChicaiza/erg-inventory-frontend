import { useState, useEffect } from 'react'
import { reportesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import { fmt } from '../helpers.jsx'
import toast from 'react-hot-toast'

export default function Reportes() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const r = await reportesAPI.resumen(); setData(r.data) }
    catch { toast.error('Error cargando reportes') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const BarChart = ({ items, colors }) => {
    const max = Math.max(...items.map(i => i.val), 1)
    return (
      <div className="bar-chart">
        {items.map((item, i) => (
          <div className="bar-row" key={i}>
            <div className="bar-label">{item.label}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.val/max)*100}%`, background: colors[i % colors.length] }} /></div>
            <div className="bar-val" style={{ color: colors[i % colors.length] }}>{item.val}</div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--text2)' }}>Cargando reportes...</div>
  if (!data)   return null

  const ventasEstado  = (data.ventas_por_estado || []).map(v => ({ label: v.estado, val: v.cantidad }))
  const comprasEstado = (data.compras_por_estado || []).map(c => ({ label: c.estado, val: c.cantidad }))
  const movsTipo      = (data.movimientos_por_tipo || []).map(m => ({ label: m.tipo, val: m.cantidad }))
  const entregasEst   = (data.entregas_por_estado || []).map(e => ({ label: e.estado, val: e.cantidad }))

  return (
    <div>
      <div className="page-header">
        <div><h2>📊 Reportes</h2><p>Estadísticas y resumen del sistema</p></div>
        <button className="btn btn-ghost" onClick={load}>🔄 Actualizar</button>
      </div>
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
        <div className="card"><div className="card-title">Ventas por Estado</div><BarChart items={ventasEstado} colors={['#10b981','#f59e0b','#ef4444']} /></div>
        <div className="card"><div className="card-title">Compras por Estado</div><BarChart items={comprasEstado} colors={['#f59e0b','#10b981','#ef4444']} /></div>
        <div className="card"><div className="card-title">Movimientos por Tipo</div><BarChart items={movsTipo} colors={['#10b981','#ef4444','#f59e0b']} /></div>
        <div className="card"><div className="card-title">Entregas por Estado</div><BarChart items={entregasEst} colors={['#f59e0b','#3b82f6','#10b981','#ef4444']} /></div>
      </div>
      {data.top_stock?.length > 0 && (
        <div className="card" style={{ marginTop:16 }}>
          <div className="card-title">Top 5 Productos con Mayor Stock</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={{ textAlign:'left', padding:'8px 12px', fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Producto</th><th style={{ textAlign:'left', padding:'8px 12px', fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Categoría</th><th style={{ textAlign:'right', padding:'8px 12px', fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Stock</th></tr></thead>
            <tbody>{data.top_stock.map((p,i)=>(
              <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                <td style={{ padding:'10px 12px', fontSize:13 }}><strong>{p.nombre}</strong></td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'var(--text2)' }}>{p.categoria}</td>
                <td style={{ padding:'10px 12px', fontSize:13, textAlign:'right', fontWeight:700, color:'var(--success)' }}>{p.stock}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
