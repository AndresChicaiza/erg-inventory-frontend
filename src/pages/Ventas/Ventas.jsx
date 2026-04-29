import { useState, useEffect } from 'react'
import { ventasAPI, clientesAPI, productosAPI, bodegasAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge, fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = {
  cliente: '', producto: '', bodega: '',
  cantidad: 1, precio_unitario: '', estado: 'Pendiente', notas: ''
}

export default function Ventas() {
  const [data, setData] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  // Stock del producto seleccionado desglosado por bodega
  const [stockBodegas, setStockBodegas] = useState([])
  const [loadingStock, setLoadingStock] = useState(false)

  const load = async () => {
    try {
      const [v, c, p] = await Promise.all([
        ventasAPI.list(), clientesAPI.list(), productosAPI.list()
      ])
      setData(v.data.results || v.data)
      setClientes(c.data.results || c.data)
      setProductos(p.data.results || p.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const totalVentas = data.reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const filtered = data.filter(v =>
    `${v.cliente_nombre} ${v.producto_nombre} ${v.bodega_nombre || ''} ${v.estado}`
      .toLowerCase().includes(search.toLowerCase())
  )

  // Cuando cambia el producto, cargamos su stock por bodega
  const handleProductoChange = async (pid) => {
    const prod = productos.find(p => p.id == pid)
    setForm(f => ({ ...f, producto: pid, precio_unitario: prod?.precio_venta || '', bodega: '' }))
    setStockBodegas([])

    if (!pid) return
    setLoadingStock(true)
    try {
      const r = await productosAPI.stockBodegas(pid)
      setStockBodegas(r.data.bodegas || [])
    } catch {
      setStockBodegas([])
    } finally { setLoadingStock(false) }
  }

  const productoSeleccionado = productos.find(p => p.id == form.producto)
  const bodegaSeleccionada = stockBodegas.find(b => b.bodega_id == form.bodega)

  const openNew = () => {
    setForm(empty); setEditing(null); setStockBodegas([]); setModal(true)
  }
  const openEdit = (v) => {
    setForm({
      cliente: v.cliente, producto: v.producto, bodega: v.bodega || '',
      cantidad: v.cantidad, precio_unitario: v.precio_unitario,
      estado: v.estado, notas: v.notas || ''
    })
    setEditing(v.id)
    setStockBodegas([])
    setModal(true)
  }

  const save = async () => {
    if (!form.cliente || !form.producto || !form.cantidad) {
      toast.error('Cliente, producto y cantidad son requeridos')
      return
    }
    // Validar stock disponible en bodega antes de enviar
    if (form.bodega && bodegaSeleccionada && form.cantidad > bodegaSeleccionada.cantidad) {
      toast.error(`Stock insuficiente en bodega. Disponible: ${bodegaSeleccionada.cantidad}`)
      return
    }
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.bodega) delete payload.bodega  // null → omitir
      if (editing) await ventasAPI.patch(editing, payload)
      else await ventasAPI.create(payload)
      toast.success(editing ? 'Venta actualizada' : 'Venta registrada')
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.detail || 'Error al guardar')
    } finally { setLoading(false) }
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
        <StatCard icon="⏳" label="Pendientes" value={data.filter(v => v.estado === 'Pendiente').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="✅" label="Pagadas" value={data.filter(v => v.estado === 'Pagada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar venta..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Fecha</th><th>Cliente</th><th>Producto</th>
              <th>Bodega</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">💰</div><p>No hay ventas</p></div></td></tr>
              : filtered.map(v => (
                <tr key={v.id}>
                  <td><span className="tag">V-{String(v.id).padStart(4, '0')}</span></td>
                  <td>{fmtDate(v.fecha)}</td>
                  <td><strong>{v.cliente_nombre}</strong></td>
                  <td>{v.producto_nombre}</td>
                  <td>
                    {v.bodega_nombre
                      ? <span className="badge badge-blue">{v.bodega_nombre}</span>
                      : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td>{v.cantidad}</td>
                  <td><strong>{fmt(v.total)}</strong></td>
                  <td>{estadoBadge(v.estado)}</td>
                  <td><div className="actions">
                    <button className="btn-icon" onClick={() => openEdit(v)}>✏️</button>
                    <button className="btn-icon" onClick={() => del(v.id)}>🗑️</button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal nueva / editar venta ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Venta' : 'Nueva Venta'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>

        <div className="form-row">
          <div className="form-group">
            <label>Cliente</label>
            <select className="form-control" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })}>
              <option value="">Seleccionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Producto</label>
            <select className="form-control" value={form.producto} onChange={e => handleProductoChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de bodega — aparece solo cuando hay un producto seleccionado */}
        {form.producto && (
          <div className="form-group">
            <label>🏪 Bodega de salida</label>
            {loadingStock ? (
              <div style={{ padding: '8px 0', color: 'var(--text3)', fontSize: 13 }}>Cargando stock por bodega...</div>
            ) : (
              <>
                <select className="form-control" value={form.bodega}
                  onChange={e => setForm({ ...form, bodega: e.target.value })}>
                  <option value="">— Sin especificar bodega —</option>
                  {stockBodegas.map(b => (
                    <option key={b.bodega_id} value={b.bodega_id}
                      disabled={b.cantidad === 0}>
                      {b.bodega_nombre} — {b.cantidad} disponibles
                    </option>
                  ))}
                </select>

                {/* Info de stock del producto */}
                <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                  {productoSeleccionado && (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Stock total: <strong style={{ color: 'var(--accent)' }}>
                        {productoSeleccionado.stock}
                      </strong>
                    </span>
                  )}
                  {form.bodega && bodegaSeleccionada && (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      En bodega seleccionada: <strong style={{
                        color: bodegaSeleccionada.cantidad >= form.cantidad
                          ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {bodegaSeleccionada.cantidad}
                      </strong>
                    </span>
                  )}
                  {stockBodegas.length === 0 && !loadingStock && (
                    <span style={{ fontSize: 12, color: 'var(--warning)' }}>
                      ⚠️ Este producto no tiene stock asignado a ninguna bodega
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Cantidad</label>
            <input className="form-control" type="number" min="1"
              max={form.bodega && bodegaSeleccionada ? bodegaSeleccionada.cantidad : undefined}
              value={form.cantidad} onChange={e => setForm({ ...form, cantidad: +e.target.value })} />
            {/* Alerta de exceso de stock en bodega */}
            {form.bodega && bodegaSeleccionada && form.cantidad > bodegaSeleccionada.cantidad && (
              <small style={{ color: 'var(--danger)', display: 'block', marginTop: 4 }}>
                ⛔ Supera el stock de la bodega ({bodegaSeleccionada.cantidad} disponibles)
              </small>
            )}
          </div>
          <div className="form-group">
            <label>Precio Unitario</label>
            <input className="form-control" type="number"
              value={form.precio_unitario} onChange={e => setForm({ ...form, precio_unitario: e.target.value })} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Total (calculado)</label>
            <input className="form-control" readOnly
              value={fmt((form.cantidad || 0) * (form.precio_unitario || 0))} />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="form-control" value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value })}>
              <option>Pendiente</option>
              <option>Pagada</option>
              <option>Cancelada</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Notas</label>
          <input className="form-control" value={form.notas}
            onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas opcionales" />
        </div>
      </Modal>
    </div>
  )
}