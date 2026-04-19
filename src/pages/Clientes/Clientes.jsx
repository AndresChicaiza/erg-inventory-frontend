import { useState, useEffect } from 'react'
import { clientesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { nombre:'', email:'', telefono:'', tipo:'Persona Natural', ciudad:'', direccion:'', estado:'Activo' }

export default function Clientes() {
  const [data, setData]     = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try { const r = await clientesAPI.list(); setData(r.data.results || r.data) } catch { toast.error('Error cargando clientes') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(c => `${c.nombre} ${c.email} ${c.ciudad}`.toLowerCase().includes(search.toLowerCase()))

  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (c) => { setForm({ nombre:c.nombre, email:c.email||'', telefono:c.telefono||'', tipo:c.tipo, ciudad:c.ciudad||'', direccion:c.direccion||'', estado:c.estado }); setEditing(c.id); setModal(true) }

  const save = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      if (editing) await clientesAPI.patch(editing, form)
      else await clientesAPI.create(form)
      toast.success(editing ? 'Cliente actualizado' : 'Cliente creado')
      setModal(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    try { await clientesAPI.delete(id); toast.success('Cliente eliminado'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>👤 Clientes</h2><p>Gestión de clientes</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Cliente</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="👥" label="Total Clientes" value={data.length} iconBg="rgba(6,182,212,.1)" />
        <StatCard icon="✅" label="Activos" value={data.filter(c=>c.estado==='Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🏢" label="Corporativos" value={data.filter(c=>c.tipo==='Corporativo').length} color="var(--indigo)" iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="🙋" label="Personas Nat." value={data.filter(c=>c.tipo==='Persona Natural').length} color="var(--pink)" iconBg="rgba(236,72,153,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Ciudad</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">👤</div><p>No hay clientes</p></div></td></tr>
            : filtered.map(c => (
              <tr key={c.id}>
                <td><strong>{c.nombre}</strong></td>
                <td>{c.email || '—'}</td>
                <td>{c.telefono || '—'}</td>
                <td><span className={`badge ${c.tipo==='Corporativo'?'badge-blue':'badge-purple'}`}>{c.tipo}</span></td>
                <td>{c.ciudad || '—'}</td>
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
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Nombre completo o empresa" /></div>
          <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@ejemplo.com" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="+57 300 000 0000" /></div>
          <div className="form-group"><label>Tipo</label><select className="form-control" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Persona Natural</option><option>Corporativo</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Ciudad</label><input className="form-control" value={form.ciudad} onChange={e=>setForm({...form,ciudad:e.target.value})} placeholder="Ciudad" /></div>
          <div className="form-group"><label>Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>Activo</option><option>Inactivo</option></select></div>
        </div>
        <div className="form-group"><label>Dirección</label><input className="form-control" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Dirección completa" /></div>
      </Modal>
    </div>
  )
}
