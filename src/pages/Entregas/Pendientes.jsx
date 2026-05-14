import { useState, useEffect } from 'react'
import { entregasAPI } from '../../api/endpoints'
import { estadoBadge, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function Pendientes({ loadData }) {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ metodo_envio: 'Propio', transportadora_nombre: '', numero_guia: '', fecha_estimada: '' })
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const res = await entregasAPI.list({ estado: 'Pendiente' })
      setData(res.data.results || res.data)
      loadData() // refresh parent stats
    } catch { toast.error('Error cargando pendientes') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(e => e.tipo_entrega === 'Venta' && `${e.cliente_nombre}`.toLowerCase().includes(search.toLowerCase()))

  const openDespachar = (e) => {
    setSelected(e)
    setForm({ metodo_envio: 'Propio', transportadora_nombre: '', numero_guia: '', fecha_estimada: '' })
    setModal(true)
  }

  const despachar = async () => {
    setLoading(true)
    try {
      await entregasAPI.patch(selected.id, {
        ...form,
        estado: 'En Tránsito'
      })
      toast.success('Despacho registrado')
      setModal(false)
      load()
    } catch {
      toast.error('Error al despachar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="search-box"><span>🔍</span><input placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Cliente / Factura</th><th>Dirección</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {filtered.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><p>No hay facturas pendientes de despacho</p></div></td></tr>
          : filtered.map(e => (
            <tr key={e.id}>
              <td><span className="tag">ENT-{String(e.id).padStart(4,'0')}</span></td>
              <td><strong>{e.cliente_nombre}</strong><br/><small>Bodega: {e.bodega_origen_nombre}</small></td>
              <td>{e.direccion}</td>
              <td>{estadoBadge(e.estado)}</td>
              <td>
                <button className="btn btn-sm btn-primary" onClick={()=>openDespachar(e)}>📦 Despachar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal} onClose={()=>setModal(false)} title="Confirmar Despacho"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={despachar} disabled={loading}>{loading?'Guardando...':'Confirmar'}</button></>}>
        <div className="form-group">
          <label>Método de Envío</label>
          <select className="form-control" value={form.metodo_envio} onChange={e=>setForm({...form,metodo_envio:e.target.value})}>
            <option value="Propio">Vehículo Propio</option>
            <option value="Transportadora">Transportadora Externa</option>
          </select>
        </div>
        {form.metodo_envio === 'Transportadora' && (
          <>
            <div className="form-group">
              <label>Transportadora (Nombre)</label>
              <input className="form-control" value={form.transportadora_nombre} onChange={e=>setForm({...form,transportadora_nombre:e.target.value})} placeholder="Ej: Envia, Inter Rapidisimo" />
            </div>
            <div className="form-group">
              <label>Número de Guía</label>
              <input className="form-control" value={form.numero_guia} onChange={e=>setForm({...form,numero_guia:e.target.value})} placeholder="Ej: 123456789" />
            </div>
          </>
        )}
        <div className="form-group">
          <label>Fecha Estimada de Entrega</label>
          <input className="form-control" type="date" value={form.fecha_estimada} onChange={e=>setForm({...form,fecha_estimada:e.target.value})} />
        </div>
      </Modal>
    </div>
  )
}
