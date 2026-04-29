import { useState, useEffect } from 'react'
import { bodegasAPI, usuariosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { codigo: '', nombre: '', direccion: '', ciudad: '', responsable: '', estado: 'Activa', descripcion: '' }
const emptyT = { bodega_origen: '', bodega_destino: '', producto: '', cantidad: 1 }

export default function Bodegas() {
  const [data, setData] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [stock, setStock] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [modalStock, setModalStock] = useState(false)
  const [modalT, setModalT] = useState(false)
  const [form, setForm] = useState(empty)
  const [formT, setFormT] = useState(emptyT)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bodegaSel, setBodegaSel] = useState(null)

  // Transferencia
  const [stockOrigen, setStockOrigen] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loadingStock, setLoadingStock] = useState(false)

  const load = async () => {
    try {
      const [b, u] = await Promise.all([bodegasAPI.list(), usuariosAPI.list()])
      setData(b.data.results || b.data)
      setUsuarios(u.data.results || u.data)
    } catch { toast.error('Error cargando bodegas') }
  }
  useEffect(() => { load() }, [])

  const verStock = async (b) => {
    setBodegaSel(b)
    try {
      const r = await bodegasAPI.stock({ bodega_id: b.id })
      setStock(r.data.results || r.data)
      setModalStock(true)
    } catch { toast.error('Error cargando stock') }
  }

  const cargarStockOrigen = async (bodegaId) => {
    if (!bodegaId) { setStockOrigen([]); return }
    setLoadingStock(true)
    try {
      const r = await bodegasAPI.stock({ bodega_id: bodegaId })
      setStockOrigen(r.data.results || r.data)
    } catch { toast.error('Error al cargar stock de bodega') }
    finally { setLoadingStock(false) }
  }

  const filtered = data.filter(b =>
    `${b.nombre} ${b.codigo} ${b.ciudad}`.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (b) => {
    setForm({
      codigo: b.codigo, nombre: b.nombre, direccion: b.direccion || '',
      ciudad: b.ciudad || '', responsable: b.responsable || '',
      estado: b.estado, descripcion: b.descripcion || ''
    })
    setEditing(b.id)
    setModal(true)
  }

  const save = async () => {
    if (!form.codigo || !form.nombre) { toast.error('Código y nombre requeridos'); return }
    setLoading(true)
    try {
      const p = { ...form }
      if (!p.responsable) delete p.responsable
      if (editing) await bodegasAPI.patch(editing, p)
      else await bodegasAPI.create(p)
      toast.success(editing ? 'Actualizado' : 'Bodega creada')
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.codigo?.[0] || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta bodega?')) return
    try { await bodegasAPI.delete(id); toast.success('Eliminado'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  const transferir = async () => {
    if (!formT.bodega_origen || !formT.bodega_destino || !formT.producto) {
      toast.error('Selecciona origen, destino y producto')
      return
    }
    if (formT.bodega_origen === formT.bodega_destino) {
      toast.error('Las bodegas deben ser diferentes')
      return
    }
    const stockDisponible = stockOrigen.find(s => s.producto === formT.producto || s.producto == formT.producto)
    if (stockDisponible && formT.cantidad > stockDisponible.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible.cantidad}`)
      return
    }
    setLoading(true)
    try {
      await bodegasAPI.transferir(formT)
      toast.success('Transferencia realizada correctamente')
      setModalT(false)
      setFormT(emptyT)
      setStockOrigen([])
      setBusqueda('')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error en la transferencia')
    } finally { setLoading(false) }
  }

  // Stock del producto seleccionado en bodega origen
  const productoSeleccionado = stockOrigen.find(
    s => s.producto === formT.producto || s.producto == formT.producto
  )
  const stockFiltrado = stockOrigen.filter(s =>
    `${s.producto_nombre} ${s.producto_codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div><h2>🏪 Bodegas</h2><p>Gestión de bodegas y stock por ubicación</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => { setFormT(emptyT); setStockOrigen([]); setBusqueda(''); setModalT(true) }}>
            🔄 Transferir
          </button>
          <button className="btn btn-primary" onClick={openNew}>+ Nueva Bodega</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="🏪" label="Total" value={data.length} iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="✅" label="Activas" value={data.filter(b => b.estado === 'Activa').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="📦" label="Con Productos" value={data.filter(b => b.total_productos > 0).length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="❌" label="Inactivas" value={data.filter(b => b.estado === 'Inactiva').length} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar bodega..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Ciudad</th>
              <th>Responsable</th><th>Productos</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🏪</div><p>No hay bodegas</p></div></td></tr>
              : filtered.map(b => (
                <tr key={b.id}>
                  <td><span className="tag">{b.codigo}</span></td>
                  <td><strong>{b.nombre}</strong></td>
                  <td>{b.ciudad || '—'}</td>
                  <td>{b.responsable_nombre || '—'}</td>
                  <td><span className="badge badge-blue">{b.total_productos} prod.</span></td>
                  <td>{estadoBadge(b.estado)}</td>
                  <td><div className="actions">
                    <button className="btn-icon" onClick={() => verStock(b)} title="Ver stock">📊</button>
                    <button className="btn-icon" onClick={() => openEdit(b)}>✏️</button>
                    <button className="btn-icon" onClick={() => del(b.id)}>🗑️</button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal crear / editar bodega ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Bodega' : 'Nueva Bodega'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>
        <div className="form-row">
          <div className="form-group">
            <label>Código</label>
            <input className="form-control" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="BOD-001" />
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Bodega Principal" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Ciudad</label>
            <input className="form-control" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Bogotá" />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="form-control" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
              <option>Activa</option><option>Inactiva</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input className="form-control" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección completa" />
        </div>
        <div className="form-group">
          <label>Responsable</label>
          <select className="form-control" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })}>
            <option value="">Sin asignar</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
      </Modal>

      {/* ── Modal ver stock de una bodega ── */}
      <Modal open={modalStock} onClose={() => setModalStock(false)}
        title={`📦 Stock — ${bodegaSel?.nombre}`}
        footer={<button className="btn btn-ghost" onClick={() => setModalStock(false)}>Cerrar</button>}>
        {stock.length === 0
          ? <div className="empty-state"><div className="empty-icon">📦</div><p>Sin stock registrado</p></div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Producto', 'Código', 'Cantidad'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 11,
                    color: 'var(--text3)', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stock.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}><strong>{s.producto_nombre}</strong></td>
                  <td style={{ padding: '10px 12px' }}><span className="tag">{s.producto_codigo}</span></td>
                  <td style={{ padding: '10px 12px', fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>
                    {s.cantidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </Modal>

      {/* ── Modal transferir stock ── */}
      <Modal open={modalT} onClose={() => setModalT(false)}
        title="🔄 Transferir Stock entre Bodegas"
        footer={
          <><button className="btn btn-ghost" onClick={() => setModalT(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={transferir}
              disabled={loading || !formT.producto || !formT.bodega_destino}>
              {loading ? 'Transfiriendo...' : 'Transferir'}
            </button></>
        }>

        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          Mueve stock de una bodega a otra sin afectar el stock total del producto.
        </div>

        {/* Paso 1: Elegir bodegas */}
        <div className="form-row">
          <div className="form-group">
            <label>Bodega Origen</label>
            <select className="form-control" value={formT.bodega_origen}
              onChange={e => {
                const v = e.target.value
                setFormT({ ...emptyT, bodega_origen: v })
                setStockOrigen([])
                setBusqueda('')
                if (v) cargarStockOrigen(v)
              }}>
              <option value="">Seleccionar...</option>
              {data.filter(b => b.estado === 'Activa').map(b => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Bodega Destino</label>
            <select className="form-control" value={formT.bodega_destino}
              onChange={e => setFormT({ ...formT, bodega_destino: e.target.value })}
              disabled={!formT.bodega_origen}>
              <option value="">Seleccionar...</option>
              {data.filter(b => b.estado === 'Activa' && b.id != formT.bodega_origen).map(b => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Paso 2: Lista de productos disponibles en bodega origen */}
        {formT.bodega_origen && (
          <>
            <div className="form-group">
              <label>🔍 Buscar producto en bodega origen</label>
              <input className="form-control" placeholder="Nombre o código del producto..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>

            <div style={{
              maxHeight: 200, overflowY: 'auto',
              border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12
            }}>
              {loadingStock ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)' }}>
                  Cargando stock...
                </div>
              ) : stockFiltrado.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)' }}>
                  {stockOrigen.length === 0
                    ? 'Esta bodega no tiene stock registrado'
                    : 'No se encontraron productos con ese nombre'}
                </div>
              ) : stockFiltrado.map(s => {
                const selected = formT.producto == s.producto || formT.producto === s.producto
                return (
                  <div key={s.producto}
                    onClick={() => setFormT({ ...formT, producto: s.producto, cantidad: 1 })}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: selected ? 'rgba(99,102,241,.15)' : 'transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background .15s'
                    }}>
                    <div>
                      <strong style={{ fontSize: 13 }}>{s.producto_nombre}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>
                        {s.producto_codigo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: s.cantidad > 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {s.cantidad} disponibles
                      </span>
                      {selected && <span style={{ fontSize: 12, color: 'var(--accent)' }}>✔</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Paso 3: Cantidad (solo cuando hay producto seleccionado) */}
        {formT.producto && productoSeleccionado && (
          <div className="form-group">
            <label>
              Cantidad a transferir
              <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                (máx: {productoSeleccionado.cantidad})
              </span>
            </label>
            <input className="form-control" type="number" min="1"
              max={productoSeleccionado.cantidad}
              value={formT.cantidad}
              onChange={e => setFormT({ ...formT, cantidad: Math.min(+e.target.value, productoSeleccionado.cantidad) })} />
            {formT.cantidad > productoSeleccionado.cantidad && (
              <small style={{ color: 'var(--danger)', display: 'block', marginTop: 4 }}>
                ⛔ Supera el stock disponible ({productoSeleccionado.cantidad})
              </small>
            )}
            {formT.cantidad > 0 && formT.cantidad <= productoSeleccionado.cantidad && (
              <small style={{ color: 'var(--success)', display: 'block', marginTop: 4 }}>
                ✅ Quedarán {productoSeleccionado.cantidad - formT.cantidad} unidades en la bodega origen
              </small>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}