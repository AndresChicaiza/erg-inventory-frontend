import { useState, useEffect } from 'react'
import { entregasAPI, bodegasAPI } from '../../api/endpoints'
import { estadoBadge, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function Traslados() {
  const [data, setData] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  
  // Para crear
  const [modalNuevo, setModalNuevo] = useState(false)
  const [form, setForm] = useState({
    bodega_origen: '',
    bodega_destino: '',
    transportista: '',
    metodo_envio: 'Propio',
    notas: '',
    detalles: [{ producto: '', cantidad: 1 }]
  })

  // Para recibir
  const [modalRecibir, setModalRecibir] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const [res, bRes, pRes] = await Promise.all([
        entregasAPI.list(),
        bodegasAPI.list(),
        productosAPI.list()
      ])
      const d = res.data.results || res.data
      setData(d.filter(e => e.tipo_entrega === 'Traslado'))
      setBodegas(bRes.data.results || bRes.data)
      setProductos(pRes.data.results || pRes.data)
    } catch { toast.error('Error cargando traslados') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(e => `${e.bodega_origen_nombre} ${e.bodega_destino_nombre}`.toLowerCase().includes(search.toLowerCase()))

  const save = async () => {
    if (!form.bodega_origen || !form.bodega_destino) return toast.error('Bodegas son requeridas')
    if (form.bodega_origen === form.bodega_destino) return toast.error('Las bodegas deben ser diferentes')
    if (form.detalles.some(d => !d.producto || d.cantidad <= 0)) return toast.error('Completa los productos y cantidades')

    setLoading(true)
    try {
      await entregasAPI.create({ ...form, tipo_entrega: 'Traslado' })
      toast.success('Remisión de traslado creada y stock reservado')
      setModalNuevo(false)
      setForm({
        bodega_origen: '', bodega_destino: '', transportista: '', metodo_envio: 'Propio', notas: '',
        detalles: [{ producto: '', cantidad: 1 }]
      })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear traslado')
    } finally {
      setLoading(false)
    }
  }

  const addDetalle = () => setForm({ ...form, detalles: [...form.detalles, { producto: '', cantidad: 1 }] })
  const removeDetalle = (idx) => setForm({ ...form, detalles: form.detalles.filter((_, i) => i !== idx) })
  const updateDetalle = (idx, field, val) => {
    const d = [...form.detalles]
    d[idx][field] = val
    setForm({ ...form, detalles: d })
  }

  const openRecibir = (e) => {
    setSelected(e)
    setModalRecibir(true)
  }

  const recibir = async () => {
    setLoading(true)
    try {
      await entregasAPI.recibirTraslado(selected.id)
      toast.success('Traslado recibido exitosamente en destino')
      setModalRecibir(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al recibir traslado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="search-box"><span>🔍</span><input placeholder="Buscar por bodegas..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={()=>setModalNuevo(true)}>+ Nueva Remisión</button>
      </div>
      <table>
        <thead><tr><th>Ref</th><th>Origen ➡️ Destino</th><th>Estado</th><th>F. Creación</th><th>Acciones</th></tr></thead>
        <tbody>
          {filtered.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><p>No hay traslados registrados</p></div></td></tr>
          : filtered.map(e => (
            <tr key={e.id}>
              <td><span className="tag">ENT-{String(e.id).padStart(4,'0')}</span></td>
              <td><strong>{e.bodega_origen_nombre}</strong> ➡️ <strong>{e.bodega_destino_nombre}</strong></td>
              <td>{estadoBadge(e.estado)}</td>
              <td>{fmtDate(e.creado_en)}</td>
              <td>
                {e.estado !== 'Entregada' && (
                  <button className="btn btn-sm btn-primary" onClick={()=>openRecibir(e)}>⬇️ Recibir en Destino</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Nueva Remisión */}
      <Modal open={modalNuevo} onClose={()=>setModalNuevo(false)} title="Nueva Remisión de Traslado"
        footer={<><button className="btn btn-ghost" onClick={()=>setModalNuevo(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Crear Remisión'}</button></>}>
        <div className="alert alert-info">⚠️ Al crear la remisión, el inventario se descontará de la bodega de origen y quedará "En Tránsito".</div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Bodega Origen (Sale)</label>
            <select className="form-control" value={form.bodega_origen} onChange={e=>setForm({...form, bodega_origen: e.target.value})}>
              <option value="">Seleccionar...</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Bodega Destino (Llega)</label>
            <select className="form-control" value={form.bodega_destino} onChange={e=>setForm({...form, bodega_destino: e.target.value})}>
              <option value="">Seleccionar...</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Conductor / Transportista</label>
            <input className="form-control" value={form.transportista} onChange={e=>setForm({...form, transportista: e.target.value})} placeholder="Ej. Juan Perez - ABC-123" />
          </div>
          <div className="form-group">
            <label>Método de Envío</label>
            <select className="form-control" value={form.metodo_envio} onChange={e=>setForm({...form, metodo_envio: e.target.value})}>
              <option value="Propio">Vehículo Propio</option>
              <option value="Transportadora">Transportadora Externa</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ margin: 0 }}>📦 Productos a Trasladar</h4>
            <button className="btn btn-sm btn-ghost" onClick={addDetalle}>+ Agregar Producto</button>
          </div>
          {form.detalles.map((d, idx) => (
            <div key={idx} className="form-row" style={{ alignItems: 'flex-end', background: 'rgba(0,0,0,.05)', padding: 10, borderRadius: 8, marginBottom: 8 }}>
              <div className="form-group" style={{ flex: 3 }}>
                <label>Producto</label>
                <select className="form-control" value={d.producto} onChange={e => updateDetalle(idx, 'producto', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Disp: {p.stock})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cant.</label>
                <input className="form-control" type="number" value={d.cantidad} onChange={e => updateDetalle(idx, 'cantidad', +e.target.value)} />
              </div>
              {form.detalles.length > 1 && (
                <button className="btn btn-sm btn-danger" style={{ marginBottom: 15 }} onClick={() => removeDetalle(idx)}>🗑️</button>
              )}
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Notas adicionales</label>
          <textarea className="form-control" value={form.notas} onChange={e=>setForm({...form, notas: e.target.value})} />
        </div>
      </Modal>

      {selected && (
        <Modal open={modalRecibir} onClose={()=>setModalRecibir(false)} title="Confirmar Recepción de Traslado"
          footer={<><button className="btn btn-ghost" onClick={()=>setModalRecibir(false)}>Cancelar</button><button className="btn btn-primary" onClick={recibir} disabled={loading}>{loading?'Procesando...':'Confirmar Recepción'}</button></>}>
          <div className="alert alert-info" style={{marginBottom: 15, padding: 15, background: 'rgba(59,130,246,.1)', borderRadius: 8}}>
            Al confirmar, el inventario se sumará a la bodega <strong>{selected.bodega_destino_nombre}</strong>.
          </div>
          <p>¿Estás seguro que deseas ingresar la mercancía de la remisión <strong>ENT-{String(selected.id).padStart(4,'0')}</strong> a la bodega?</p>
        </Modal>
      )}
    </div>
  )
}
