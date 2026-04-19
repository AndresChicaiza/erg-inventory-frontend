import { useState, useEffect } from 'react'
import { entregasAPI, clientesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { cliente:'', direccion:'', transportista:'', estado:'Pendiente', fecha_estimada:'', notas:'' }

export default function Entregas() {
  const [data, setData]         = useState([])
  const [clientes, setClientes] = useState([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(empty)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    try {
      const [e, c] = await Promise.all([entregasAPI.list(), clientesAPI.list()])
      setData(e.data.results || e.data)
      setClientes(c.data.results || c.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(e => `${e.cliente_nombre} ${e.estado} ${e.transportista}`.toLowerCase().includes(search.toLowerCase()))
  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (e) => { setForm({ cliente:e.cliente, direccion:e.direccion, transportista:e.transportista, estado:e.estado, fecha_estimada:e.fecha_estimada||'', notas:e.notas||'' }); setEditing(e.id); setModal(true) }

  const save = async () => {
    if (!form.cliente || !form.direccion || !form.transportista) { toast.error('Cliente, dirección y transportista son requeridos'); return }
    setLoading(true)
    try {
      if (editing) await entregasAPI.patch(editing, form)
      else await entregasAPI.create(form)
      toast.success(editing ? 'Entrega actualizada' : 'Entrega registrada')
      setModal(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta entrega?')) return
    try { await entregasAPI.delete(id); toast.success('Entrega eliminada'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>🚚 Entregas</h2><p>Seguimiento de entregas</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva Entrega</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="📦" label="Total Entregas" value={data.length} iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="🚚" label="En Tránsito" value={data.filter(e=>e.estado==='En Tránsito').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="✅" label="Entregadas" value={data.filter(e=>e.estado==='Entregada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="❌" label="Fallidas" value={data.filter(e=>e.estado==='Fallida').length} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar entrega..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Cliente</th><th>Dirección</th><th>Transportista</th><th>F. Estimada</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🚚</div><p>No hay entregas</p></div></td></tr>
            : filtered.map(e => (
              <tr key={e.id}>
                <td><span className="tag">ENT-{String(e.id).padStart(4,'0')}</span></td>
                <td><strong>{e.cliente_nombre}</strong></td>
                <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.direccion}</td>
                <td>{e.transportista}</td>
                <td>{fmtDate(e.fecha_estimada)}</td>
                <td>{estadoBadge(e.estado)}</td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={()=>openEdit(e)}>✏️</button>
                  <button className="btn-icon" onClick={()=>del(e.id)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Entrega' : 'Nueva Entrega'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Cliente</label>
            <select className="form-control" value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})}>
              <option value="">Seleccionar...</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Transportista</label><input className="form-control" value={form.transportista} onChange={e=>setForm({...form,transportista:e.target.value})} placeholder="Nombre transportista" /></div>
        </div>
        <div className="form-group"><label>Dirección de Entrega</label><input className="form-control" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Dirección completa" /></div>
        <div className="form-row">
          <div className="form-group"><label>Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>Pendiente</option><option>En Tránsito</option><option>Entregada</option><option>Fallida</option></select></div>
          <div className="form-group"><label>Fecha Estimada</label><input className="form-control" type="date" value={form.fecha_estimada} onChange={e=>setForm({...form,fecha_estimada:e.target.value})} /></div>
        </div>
        <div className="form-group"><label>Notas</label><input className="form-control" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Observaciones" /></div>
      </Modal>
    </div>
  )
}
