import { useState, useEffect } from 'react'
import { comprasAPI, proveedoresAPI, productosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge, fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const empty = { proveedor: '', estado: 'Borrador', condicion_pago: 'Contado', notas: '', detalles: [] }

export default function Compras() {
  const [data, setData]           = useState([])
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(empty)
  const [editing, setEditing]     = useState(null)
  const [loading, setLoading]     = useState(false)

  // Estado para el modal de recepción
  const [recibirModal, setRecibirModal] = useState(false)
  const [ordenRecibir, setOrdenRecibir] = useState(null)
  const [lotesForm, setLotesForm]       = useState({})

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
  const filtered = data.filter(c => `${c.proveedor_nombre} OC-${c.id}`.toLowerCase().includes(search.toLowerCase()))

  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  
  const openEdit = (c) => { 
    setForm({ 
      proveedor: c.proveedor, 
      estado: c.estado, 
      condicion_pago: c.condicion_pago || 'Contado',
      notas: c.notas || '',
      detalles: c.detalles || []
    }); 
    setEditing(c.id); 
    setModal(true) 
  }

  const handleAddProduct = () => {
    setForm(f => ({
      ...f,
      detalles: [...f.detalles, { producto: '', cantidad: 1, precio_unitario: 0 }]
    }))
  }

  const handleRemoveProduct = (index) => {
    setForm(f => {
      const newDetalles = [...f.detalles]
      newDetalles.splice(index, 1)
      return { ...f, detalles: newDetalles }
    })
  }

  const handleDetalleChange = (index, field, value) => {
    setForm(f => {
      const newDetalles = [...f.detalles]
      newDetalles[index] = { ...newDetalles[index], [field]: value }
      
      if (field === 'producto') {
        const prod = productos.find(p => p.id == value)
        if (prod) newDetalles[index].precio_unitario = prod.precio_costo || 0
      }
      
      return { ...f, detalles: newDetalles }
    })
  }

  const save = async () => {
    if (!form.proveedor) { toast.error('El proveedor es requerido'); return }
    if (form.detalles.length === 0) { toast.error('Debe agregar al menos un producto a la orden'); return }
    
    // Validar detalles
    for (let i = 0; i < form.detalles.length; i++) {
      const d = form.detalles[i]
      if (!d.producto || d.cantidad <= 0 || d.precio_unitario < 0) {
        toast.error(`Error en la línea ${i+1}: Producto, cantidad (>0) y precio válidos requeridos.`)
        return
      }
    }

    setLoading(true)
    try {
      if (editing) await comprasAPI.patch(editing, form)
      else await comprasAPI.create(form)
      toast.success(editing ? 'Orden actualizada' : 'Orden creada')
      setModal(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta orden de compra?')) return
    try { await comprasAPI.delete(id); toast.success('Orden eliminada'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  const calcularTotalForm = () => {
    return form.detalles.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0)
  }

  // --- Lógica de Recepción ---
  const handleOpenRecibir = (orden) => {
    const lotesNecesarios = {}
    let necesitaLotes = false

    orden.detalles.forEach(d => {
      const prod = productos.find(p => p.id === d.producto)
      if (prod?.controla_vencimiento) {
        necesitaLotes[d.id] = { numero_lote: '', fecha_vencimiento: '', producto_nombre: prod.nombre, cantidad: d.cantidad }
        necesitaLotes = true
      }
    })

    if (necesitaLotes) {
      setLotesForm(lotesNecesarios)
      setOrdenRecibir(orden)
      setRecibirModal(true)
    } else {
      // Si no necesita lotes, recibir directamente
      if(confirm(`¿Desea marcar la OC-${String(orden.id).padStart(4,'0')} como Recibida e ingresar los productos al inventario?`)) {
        ejecutarRecepcion(orden.id, {})
      }
    }
  }

  const ejecutarRecepcion = async (id, lotesPayload) => {
    setLoading(true)
    try {
      const resp = await api.post(`/compras/${id}/recibir/`, { lotes: lotesPayload })
      const { cxp_id, fecha_vencimiento_pago } = resp.data
      toast.success(`✅ Inventario actualizado. CXP-${String(cxp_id).padStart(4,'0')} creada — vence: ${fecha_vencimiento_pago}`, { duration: 6000 })
      setRecibirModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al recibir la orden')
    } finally {
      setLoading(false)
    }
  }

  const handleRecibirSubmit = () => {
    // Validar que se hayan llenado los lotes
    for (const key in lotesForm) {
      if (!lotesForm[key].numero_lote || !lotesForm[key].fecha_vencimiento) {
        toast.error('Debe completar toda la información de lotes y vencimientos.')
        return
      }
    }
    ejecutarRecepcion(ordenRecibir.id, lotesForm)
  }
  // ---------------------------

  return (
    <div>
      <div className="page-header">
        <div><h2>🛒 Órdenes de Compra</h2><p>Gestión de pedidos a proveedores</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva Orden</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="💸" label="Total Pedido" value={fmt(totalCompras)} color="var(--indigo)" iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="🛒" label="Num. Órdenes" value={data.length} iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="⏳" label="Borradores" value={data.filter(c=>c.estado==='Borrador').length} color="var(--text3)" iconBg="rgba(156,163,175,.1)" />
        <StatCard icon="🚚" label="Enviadas / Recibidas" value={data.filter(c=>c.estado==='Enviada' || c.estado==='Recibida').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
      </div>
      
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar orden..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Fecha</th><th>Proveedor</th><th>Ítems</th><th>Total</th><th>Pago</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🛒</div><p>No hay órdenes de compra</p></div></td></tr>
            : filtered.map(c => (
              <tr key={c.id}>
                <td><span className="tag">OC-{String(c.id).padStart(4,'0')}</span></td>
                <td>{fmtDate(c.fecha)}</td>
                <td><strong>{c.proveedor_nombre}</strong></td>
                <td>{c.detalles ? c.detalles.length : 0} ítems</td>
                <td><strong>{fmt(c.total)}</strong></td>
                <td><span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.condicion_pago?.replace('_dias',' días') || 'Contado'}</span></td>
                <td>{estadoBadge(c.estado)}</td>
                <td><div className="actions">
                  {c.estado !== 'Recibida' && c.estado !== 'Cancelada' && (
                    <button className="btn-icon" title="Recibir Orden" onClick={()=>handleOpenRecibir(c)}>🚚</button>
                  )}
                  <button className="btn-icon" onClick={()=>openEdit(c)}>✏️</button>
                  <button className="btn-icon" onClick={()=>del(c.id)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Principal de Órdenes */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'} width="900px"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Proveedor</label>
            <select className="form-control" value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})} disabled={form.estado === 'Recibida'}>
              <option value="">Seleccione el proveedor...</option>
              {proveedores.map(p=><option key={p.id} value={p.id}>{p.razon_social} {p.numero_documento ? `(${p.numero_documento})` : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Condición de Pago</label>
            <select className="form-control" value={form.condicion_pago} onChange={e=>setForm({...form,condicion_pago:e.target.value})} disabled={form.estado === 'Recibida'}>
              <option value="Contado">Contado</option>
              <option value="15_dias">15 días</option>
              <option value="30_dias">30 días</option>
              <option value="45_dias">45 días</option>
              <option value="60_dias">60 días</option>
              <option value="90_dias">90 días</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})} disabled>
              <option value="Borrador">Borrador</option>
              <option value="Enviada">Enviada al Proveedor</option>
              <option value="Recibida">Recibida (Ingresar Stock)</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: 'var(--text2)' }}>📦 Detalles de la Orden</h4>
            {form.estado !== 'Recibida' && (
              <button className="btn btn-primary" onClick={handleAddProduct} style={{ padding: '6px 12px', fontSize: 14 }}>+ Añadir Producto</button>
            )}
          </div>
          
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ margin: 0, boxShadow: 'none' }}>
              <thead style={{ background: 'var(--bg-card)' }}>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: 100 }}>Cantidad</th>
                  <th style={{ width: 150 }}>Precio U.</th>
                  <th style={{ width: 150 }}>Subtotal</th>
                  {form.estado !== 'Recibida' && <th style={{ width: 50 }}></th>}
                </tr>
              </thead>
              <tbody>
                {form.detalles.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)' }}>No has agregado productos a esta orden</td></tr>
                ) : (
                  form.detalles.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <select className="form-control" value={d.producto} onChange={e=>handleDetalleChange(i, 'producto', e.target.value)} disabled={form.estado === 'Recibida'}>
                          <option value="">Seleccione producto...</option>
                          {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
                        </select>
                      </td>
                      <td><input className="form-control" type="number" min="1" value={d.cantidad} onChange={e=>handleDetalleChange(i, 'cantidad', +e.target.value)} disabled={form.estado === 'Recibida'} /></td>
                      <td><input className="form-control" type="number" min="0" value={d.precio_unitario} onChange={e=>handleDetalleChange(i, 'precio_unitario', +e.target.value)} disabled={form.estado === 'Recibida'} /></td>
                      <td><strong>{fmt(d.cantidad * d.precio_unitario)}</strong></td>
                      {form.estado !== 'Recibida' && <td><button className="btn-icon" onClick={()=>handleRemoveProduct(i)} style={{ color: 'var(--danger)' }}>✖</button></td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Notas de la Orden</label>
            <textarea className="form-control" rows="3" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Instrucciones de entrega, condiciones, etc." disabled={form.estado === 'Recibida'} />
          </div>
          <div style={{ width: 300, background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--text2)' }}>Subtotal:</span>
              <strong>{fmt(calcularTotalForm())}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              <span style={{ fontSize: 18, color: 'var(--text1)', fontWeight: 600 }}>Total:</span>
              <span style={{ fontSize: 18, color: 'var(--indigo)', fontWeight: 700 }}>{fmt(calcularTotalForm())}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal para Ingresar Lotes al Recibir */}
      <Modal open={recibirModal} onClose={()=>setRecibirModal(false)} title="Ingreso de Lotes y Vencimientos" width="600px"
        footer={<><button className="btn btn-ghost" onClick={()=>setRecibirModal(false)}>Cancelar</button><button className="btn btn-success" onClick={handleRecibirSubmit} disabled={loading}>{loading?'Procesando...':'Confirmar Recepción'}</button></>}>
        
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: 'var(--warning)', fontWeight: 500 }}>
            ⚠️ Algunos productos de la OC-{ordenRecibir ? String(ordenRecibir.id).padStart(4,'0') : ''} controlan fecha de vencimiento. Por favor ingrese los lotes que está recibiendo del proveedor antes de ingresar la mercancía al inventario.
          </p>
        </div>

        {Object.entries(lotesForm).map(([id_detalle, lote]) => (
          <div key={id_detalle} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>📦 {lote.producto_nombre} <span className="tag">Cant: {lote.cantidad}</span></h4>
            <div className="form-row">
              <div className="form-group">
                <label>Número de Lote</label>
                <input className="form-control" value={lote.numero_lote} onChange={e => setLotesForm(prev => ({...prev, [id_detalle]: {...prev[id_detalle], numero_lote: e.target.value}}))} placeholder="LOTE-XXX" />
              </div>
              <div className="form-group">
                <label>Fecha Vencimiento</label>
                <input className="form-control" type="date" value={lote.fecha_vencimiento} onChange={e => setLotesForm(prev => ({...prev, [id_detalle]: {...prev[id_detalle], fecha_vencimiento: e.target.value}}))} />
              </div>
            </div>
          </div>
        ))}

      </Modal>
    </div>
  )
}
