import { useState, useEffect } from 'react'
import { movimientosAPI, productosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { producto:'', tipo:'Entrada', cantidad:1, referencia:'', observacion:'' }

export default function Movimientos() {
  const [data, setData]         = useState([])
  const [productos, setProductos] = useState([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(empty)
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    try {
      const [m, p] = await Promise.all([movimientosAPI.list(), productosAPI.list()])
      setData(m.data.results || m.data)
      setProductos(p.data.results || p.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(m => `${m.producto_nombre} ${m.tipo} ${m.referencia}`.toLowerCase().includes(search.toLowerCase()))

  const save = async () => {
    if (!form.producto || !form.cantidad) { toast.error('Producto y cantidad son requeridos'); return }
    setLoading(true)
    try {
      await movimientosAPI.create(form)
      toast.success('Movimiento registrado — stock actualizado')
      setModal(false); setForm(empty); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Error al registrar') }
    finally { setLoading(false) }
  }

  const tipoBadge = (t) => {
    const cls = { Entrada:'tipo-entrada', Salida:'tipo-salida', Ajuste:'tipo-ajuste' }
    const icon = { Entrada:'↑', Salida:'↓', Ajuste:'⇄' }
    return <span className={`badge ${cls[t]}`}>{icon[t]} {t}</span>
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>↔️ Movimientos</h2><p>Entradas y salidas de stock</p></div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}>+ Nuevo Movimiento</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="📥" label="Entradas" value={data.filter(m=>m.tipo==='Entrada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="📤" label="Salidas" value={data.filter(m=>m.tipo==='Salida').length} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
        <StatCard icon="🔄" label="Ajustes" value={data.filter(m=>m.tipo==='Ajuste').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="📊" label="Total" value={data.length} iconBg="rgba(99,102,241,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar movimiento..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Referencia</th><th>Observación</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">↔️</div><p>No hay movimientos</p></div></td></tr>
            : filtered.map(m => (
              <tr key={m.id}>
                <td>{fmtDate(m.fecha)}</td>
                <td><strong>{m.producto_nombre}</strong><br/><span className="tag">{m.producto_codigo}</span></td>
                <td>{tipoBadge(m.tipo)}</td>
                <td><strong>{m.cantidad}</strong></td>
                <td>{m.referencia ? <span className="tag">{m.referencia}</span> : '—'}</td>
                <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.observacion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Nuevo Movimiento"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Registrar'}</button></>}>
        <div className="alert alert-info">⚡ Al registrar un movimiento el stock del producto se actualiza automáticamente.</div>
        <div className="form-row">
          <div className="form-group"><label>Producto</label>
            <select className="form-control" value={form.producto} onChange={e=>setForm({...form,producto:e.target.value})}>
              <option value="">Seleccionar...</option>
              {productos.map(p=><option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Tipo</label>
            <select className="form-control" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
              <option>Entrada</option><option>Salida</option><option>Ajuste</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Cantidad</label><input className="form-control" type="number" min="1" value={form.cantidad} onChange={e=>setForm({...form,cantidad:+e.target.value})} /></div>
          <div className="form-group"><label>Referencia</label><input className="form-control" value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})} placeholder="Factura, OC, etc." /></div>
        </div>
        <div className="form-group"><label>Observación</label><input className="form-control" value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})} placeholder="Observación opcional" /></div>
      </Modal>
    </div>
  )
}
