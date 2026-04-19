import { useState, useEffect } from 'react'
import { comprasAPI, proveedoresAPI, productosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge, fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { proveedor:'', producto:'', cantidad:1, precio_unitario:'', estado:'Pendiente', notas:'' }

export default function Compras() {
  const [data, setData]           = useState([])
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(empty)
  const [editing, setEditing]     = useState(null)
  const [loading, setLoading]     = useState(false)

  const load = async () => {
    try {
      const [c, pr, p] = await Promise.all([comprasAPI.list(), proveedoresAPI.list(), productosAPI.list()])
      setData(c.data.results || c.data)
      setProveedores(pr.data.results || pr.data)
      setProductos(p.data.results || p.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const totalCompras = data.reduce((s, c) => s + parseFloat(c.total || 0), 0)
  const filtered = data.filter(c => `${c.proveedor_nombre} ${c.producto_nombre} ${c.estado}`.toLowerCase().includes(search.toLowerCase()))

  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (c) => { setForm({ proveedor:c.proveedor, producto:c.producto, cantidad:c.cantidad, precio_unitario:c.precio_unitario, estado:c.estado, notas:c.notas||'' }); setEditing(c.id); setModal(true) }

  const handleProductoChange = (pid) => {
    const prod = productos.find(p => p.id == pid)
    setForm(f => ({ ...f, producto: pid, precio_unitario: prod?.precio_costo || '' }))
  }

  const save = async () => {
    if (!form.proveedor || !form.producto || !form.cantidad) { toast.error('Proveedor, producto y cantidad son requeridos'); return }
    setLoading(true)
    try {
      if (editing) await comprasAPI.patch(editing, form)
      else await comprasAPI.create(form)
      toast.success(editing ? 'Compra actualizada' : 'Compra registrada')
      setModal(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta compra?')) return
    try { await comprasAPI.delete(id); toast.success('Compra eliminada'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>🛒 Compras</h2><p>Facturación de compras a proveedores</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva Compra</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="💸" label="Total Compras" value={fmt(totalCompras)} color="var(--indigo)" iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="🛒" label="Num. Compras" value={data.length} iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="⏳" label="Pendientes" value={data.filter(c=>c.estado==='Pendiente').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="✅" label="Recibidas" value={data.filter(c=>c.estado==='Recibida').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar compra..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Fecha</th><th>Proveedor</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">🛒</div><p>No hay compras</p></div></td></tr>
            : filtered.map(c => (
              <tr key={c.id}>
                <td><span className="tag">OC-{String(c.id).padStart(4,'0')}</span></td>
                <td>{fmtDate(c.fecha)}</td>
                <td><strong>{c.proveedor_nombre}</strong></td>
                <td>{c.producto_nombre}</td>
                <td>{c.cantidad}</td>
                <td><strong>{fmt(c.total)}</strong></td>
                <td>{estadoBadge(c.estado)}</td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={()=>openEdit(c)}>✏️</button>
                  <button className="btn-icon" onClick={()=>del(c.id)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Compra' : 'Nueva Compra'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Proveedor</label>
            <select className="form-control" value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})}>
              <option value="">Seleccionar...</option>
              {proveedores.map(p=><option key={p.id} value={p.id}>{p.empresa}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Producto</label>
            <select className="form-control" value={form.producto} onChange={e=>handleProductoChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Cantidad</label><input className="form-control" type="number" min="1" value={form.cantidad} onChange={e=>setForm({...form,cantidad:+e.target.value})} /></div>
          <div className="form-group"><label>Precio Unitario</label><input className="form-control" type="number" value={form.precio_unitario} onChange={e=>setForm({...form,precio_unitario:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Total (calculado)</label><input className="form-control" readOnly value={fmt((form.cantidad||0)*(form.precio_unitario||0))} /></div>
          <div className="form-group"><label>Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>Pendiente</option><option>Recibida</option><option>Cancelada</option></select></div>
        </div>
        <div className="form-group"><label>Notas</label><input className="form-control" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Notas opcionales" /></div>
      </Modal>
    </div>
  )
}
