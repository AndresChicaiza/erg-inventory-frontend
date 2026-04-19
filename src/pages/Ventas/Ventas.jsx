import { useState, useEffect } from 'react'
import { ventasAPI, clientesAPI, productosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge, fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { cliente:'', producto:'', cantidad:1, precio_unitario:'', estado:'Pendiente', notas:'' }

export default function Ventas() {
  const [data, setData]         = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(empty)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    try {
      const [v, c, p] = await Promise.all([ventasAPI.list(), clientesAPI.list(), productosAPI.list()])
      setData(v.data.results || v.data)
      setClientes(c.data.results || c.data)
      setProductos(p.data.results || p.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const totalVentas = data.reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const filtered = data.filter(v => `${v.cliente_nombre} ${v.producto_nombre} ${v.estado}`.toLowerCase().includes(search.toLowerCase()))

  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (v) => { setForm({ cliente:v.cliente, producto:v.producto, cantidad:v.cantidad, precio_unitario:v.precio_unitario, estado:v.estado, notas:v.notas||'' }); setEditing(v.id); setModal(true) }

  const handleProductoChange = (pid) => {
    const prod = productos.find(p => p.id == pid)
    setForm(f => ({ ...f, producto: pid, precio_unitario: prod?.precio_venta || '' }))
  }

  const save = async () => {
    if (!form.cliente || !form.producto || !form.cantidad) { toast.error('Cliente, producto y cantidad son requeridos'); return }
    setLoading(true)
    try {
      if (editing) await ventasAPI.patch(editing, form)
      else await ventasAPI.create(form)
      toast.success(editing ? 'Venta actualizada' : 'Venta registrada')
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta venta?')) return
    try { await ventasAPI.delete(id); toast.success('Venta eliminada'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>💰 Ventas</h2><p>Registro y consulta de ventas</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva Venta</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="💵" label="Total Ventas" value={fmt(totalVentas)} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🛍️" label="Num. Ventas" value={data.length} iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="⏳" label="Pendientes" value={data.filter(v=>v.estado==='Pendiente').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="✅" label="Pagadas" value={data.filter(v=>v.estado==='Pagada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar venta..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">💰</div><p>No hay ventas</p></div></td></tr>
            : filtered.map(v => (
              <tr key={v.id}>
                <td><span className="tag">V-{String(v.id).padStart(4,'0')}</span></td>
                <td>{fmtDate(v.fecha)}</td>
                <td><strong>{v.cliente_nombre}</strong></td>
                <td>{v.producto_nombre}</td>
                <td>{v.cantidad}</td>
                <td><strong>{fmt(v.total)}</strong></td>
                <td>{estadoBadge(v.estado)}</td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={()=>openEdit(v)}>✏️</button>
                  <button className="btn-icon" onClick={()=>del(v.id)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Venta' : 'Nueva Venta'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Cliente</label>
            <select className="form-control" value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})}>
              <option value="">Seleccionar...</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
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
          <div className="form-group"><label>Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>Pendiente</option><option>Pagada</option><option>Cancelada</option></select></div>
        </div>
        <div className="form-group"><label>Notas</label><input className="form-control" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Notas opcionales" /></div>
      </Modal>
    </div>
  )
}
