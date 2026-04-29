import { useState, useEffect } from 'react'
import { productosAPI, bodegasAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge, stockBadge, fmt } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = {
  codigo: '', nombre: '', descripcion: '', categoria: '',
  precio_venta: '', precio_costo: '', stock: 0, stock_minimo: 5,
  estado: 'Activo', bodega_id: ''
}

export default function Productos() {
  const [data, setData] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  // Panel de stock por bodega (al hacer click en un producto)
  const [stockModal, setStockModal] = useState(false)
  const [stockDetalle, setStockDetalle] = useState(null)
  const [stockLoading, setStockLoading] = useState(false)

  const load = async () => {
    try {
      const [r, b] = await Promise.all([productosAPI.list(), bodegasAPI.list()])
      setData(r.data.results || r.data)
      setBodegas(b.data.results || b.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(p =>
    `${p.nombre} ${p.codigo} ${p.categoria}`.toLowerCase().includes(search.toLowerCase())
  )
  const cats = [...new Set(data.map(p => p.categoria))]

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (p) => {
    setForm({
      codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '',
      categoria: p.categoria, precio_venta: p.precio_venta,
      precio_costo: p.precio_costo, stock: p.stock,
      stock_minimo: p.stock_minimo, estado: p.estado,
      bodega_id: ''  // edición no reasigna bodega
    })
    setEditing(p.id)
    setModal(true)
  }

  const verStockBodegas = async (producto) => {
    setStockLoading(true)
    setStockDetalle(null)
    setStockModal(true)
    try {
      const r = await productosAPI.stockBodegas(producto.id)
      setStockDetalle(r.data)
    } catch { toast.error('Error cargando stock por bodega') }
    finally { setStockLoading(false) }
  }

  const save = async () => {
    if (!form.codigo || !form.nombre || !form.categoria) {
      toast.error('Código, nombre y categoría son requeridos')
      return
    }
    setLoading(true)
    try {
      const payload = { ...form }
      if (editing) {
        // Al editar no mandamos bodega_id (no tiene sentido reasignar)
        delete payload.bodega_id
        await productosAPI.patch(editing, payload)
      } else {
        if (!payload.bodega_id) delete payload.bodega_id
        await productosAPI.create(payload)
      }
      toast.success(editing ? 'Producto actualizado' : 'Producto creado')
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.codigo?.[0] || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try { await productosAPI.delete(id); toast.success('Producto eliminado'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>📦 Productos</h2><p>Control de inventario y stock</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Producto</button>
      </div>

      <div className="stats-grid">
        <StatCard icon="📦" label="Total Productos" value={data.length} iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="⚠️" label="Stock Bajo" value={data.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="🚫" label="Sin Stock" value={data.filter(p => p.stock === 0).length} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
        <StatCard icon="🏷️" label="Categorías" value={cats.length} iconBg="rgba(99,102,241,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Categoría</th>
              <th>Precio Venta</th><th>Stock Total</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📦</div><p>No hay productos</p></div></td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td><span className="tag">{p.codigo}</span></td>
                <td><strong>{p.nombre}</strong></td>
                <td><span className="badge badge-purple">{p.categoria}</span></td>
                <td><strong>{fmt(p.precio_venta)}</strong></td>
                <td>{stockBadge(p.stock, p.stock_minimo)}</td>
                <td>{estadoBadge(p.estado)}</td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={() => verStockBodegas(p)} title="Ver stock por bodega">🏪</button>
                  <button className="btn-icon" onClick={() => openEdit(p)}>✏️</button>
                  <button className="btn-icon" onClick={() => del(p.id)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal crear / editar ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>

        <div className="form-row">
          <div className="form-group">
            <label>Código</label>
            <input className="form-control" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="PRD-001" />
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Categoría</label>
            <input className="form-control" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Electrónicos, Ropa..." />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="form-control" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
              <option>Activo</option><option>Inactivo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Precio Venta</label>
            <input className="form-control" type="number" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Precio Costo</label>
            <input className="form-control" type="number" value={form.precio_costo} onChange={e => setForm({ ...form, precio_costo: e.target.value })} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Stock Inicial</label>
            <input className="form-control" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Stock Mínimo</label>
            <input className="form-control" type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: +e.target.value })} />
          </div>
        </div>

        {/* Solo al crear: elegir bodega donde registrar el stock inicial */}
        {!editing && (
          <div className="form-group">
            <label>📍 Registrar stock inicial en bodega</label>
            <select className="form-control" value={form.bodega_id} onChange={e => setForm({ ...form, bodega_id: e.target.value })}>
              <option value="">— Sin asignar a bodega —</option>
              {bodegas.filter(b => b.estado === 'Activa').map(b => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
              ))}
            </select>
            {form.stock > 0 && form.bodega_id && (
              <small style={{ color: 'var(--success)', marginTop: 4, display: 'block' }}>
                ✅ Se registrarán {form.stock} unidades en la bodega seleccionada
              </small>
            )}
            {form.stock > 0 && !form.bodega_id && (
              <small style={{ color: 'var(--text3)', marginTop: 4, display: 'block' }}>
                ⚠️ Sin bodega: el stock se guardará solo en el total del producto
              </small>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Descripción</label>
          <input className="form-control" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción opcional" />
        </div>
      </Modal>

      {/* ── Modal stock por bodega ── */}
      <Modal open={stockModal} onClose={() => setStockModal(false)}
        title={`🏪 Stock por Bodega — ${stockDetalle?.producto_nombre || ''}`}
        footer={<button className="btn btn-ghost" onClick={() => setStockModal(false)}>Cerrar</button>}>

        {stockLoading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Cargando...</div>
        ) : stockDetalle ? (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, padding: '12px 16px', background: 'rgba(99,102,241,.08)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Stock Total</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{stockDetalle.stock_total}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>En Bodegas</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
                  {stockDetalle.bodegas.reduce((s, b) => s + b.cantidad, 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Sin asignar</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)' }}>
                  {stockDetalle.stock_total - stockDetalle.bodegas.reduce((s, b) => s + b.cantidad, 0)}
                </div>
              </div>
            </div>

            {stockDetalle.bodegas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏪</div>
                <p>Este producto no está asignado a ninguna bodega</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Bodega', 'Código', 'Disponible'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left', fontSize: 11,
                        color: 'var(--text3)', textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockDetalle.bodegas.map(b => (
                    <tr key={b.bodega_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}><strong>{b.bodega_nombre}</strong></td>
                      <td style={{ padding: '10px 12px' }}><span className="tag">{b.bodega_codigo}</span></td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 16, fontWeight: 700,
                          color: b.cantidad > 0 ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {b.cantidad} uds.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  )
}