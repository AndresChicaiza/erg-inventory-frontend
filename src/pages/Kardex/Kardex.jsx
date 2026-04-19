import { useState, useEffect } from 'react'
import { kardexAPI } from '../../api/endpoints'
import { fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

export default function Kardex() {
  const [data, setData]           = useState([])
  const [productos, setProductos] = useState([])
  const [filtro, setFiltro]       = useState('')
  const [productoId, setProductoId] = useState('')

  const load = async () => {
    try {
      const [k, p] = await Promise.all([
        kardexAPI.list(productoId ? { producto_id: productoId } : {}),
        kardexAPI.productos()
      ])
      setData(k.data)
      setProductos(p.data)
    } catch { toast.error('Error cargando kardex') }
  }
  useEffect(() => { load() }, [productoId])

  const filtered = data.filter(k => `${k.producto} ${k.tipo} ${k.referencia}`.toLowerCase().includes(filtro.toLowerCase()))

  const tipoBadge = (t) => {
    const cls = { Entrada:'tipo-entrada', Salida:'tipo-salida', Ajuste:'tipo-ajuste' }
    return <span className={`badge ${cls[t]}`}>{t}</span>
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>📋 Kardex</h2><p>Historial de movimientos con saldo acumulado por producto</p></div>
        <button className="btn btn-ghost" onClick={load}>🔄 Actualizar</button>
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar en kardex..." value={filtro} onChange={e=>setFiltro(e.target.value)} /></div>
          <select className="form-control" style={{ width:220 }} value={productoId} onChange={e=>setProductoId(e.target.value)}>
            <option value="">Todos los productos</option>
            {productos.map(p=><option key={p.id} value={p.id}>{p.codigo} – {p.nombre}</option>)}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Producto</th><th>Tipo</th>
              <th style={{ color:'var(--success)' }}>Entrada</th>
              <th style={{ color:'var(--danger)' }}>Salida</th>
              <th>Saldo</th><th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><p>No hay movimientos registrados</p></div></td></tr>
            ) : filtered.map((k, i) => (
              <tr key={i}>
                <td>{fmtDate(k.fecha)}</td>
                <td><strong>{k.producto}</strong><br/><span className="tag">{k.producto_codigo}</span></td>
                <td>{tipoBadge(k.tipo)}</td>
                <td style={{ color:'var(--success)', fontWeight:600 }}>{k.entrada != null ? `+${k.entrada}` : '—'}</td>
                <td style={{ color:'var(--danger)', fontWeight:600 }}>{k.salida != null ? `-${k.salida}` : '—'}</td>
                <td><strong style={{ fontSize:15 }}>{k.saldo}</strong></td>
                <td>{k.referencia ? <span className="tag">{k.referencia}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
