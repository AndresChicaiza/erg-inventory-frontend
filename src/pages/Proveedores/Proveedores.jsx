import { useState, useEffect } from 'react'
import { proveedoresAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { empresa:'', contacto:'', email:'', telefono:'', ciudad:'', categoria:'Nacional', tipo:'Estándar', estado:'Activo' }

export default function Proveedores() {
  const [data, setData]     = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try { const r = await proveedoresAPI.list(); setData(r.data.results || r.data) } catch { toast.error('Error') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(p => `${p.empresa} ${p.contacto} ${p.ciudad}`.toLowerCase().includes(search.toLowerCase()))
  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (p) => { setForm({ empresa:p.empresa, contacto:p.contacto||'', email:p.email||'', telefono:p.telefono||'', ciudad:p.ciudad||'', categoria:p.categoria, tipo:p.tipo, estado:p.estado }); setEditing(p.id); setModal(true) }

  const save = async () => {
    if (!form.empresa) { toast.error('El nombre de empresa es requerido'); return }
    setLoading(true)
    try {
      if (editing) await proveedoresAPI.patch(editing, form)
      else await proveedoresAPI.create(form)
      toast.success(editing ? 'Proveedor actualizado' : 'Proveedor creado')
      setModal(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    try { await proveedoresAPI.delete(id); toast.success('Proveedor eliminado'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>🏭 Proveedores</h2><p>Empresas y contactos</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Proveedor</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="🏭" label="Total" value={data.length} iconBg="rgba(249,115,22,.1)" />
        <StatCard icon="✅" label="Activos" value={data.filter(p=>p.estado==='Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="⭐" label="Preferidos" value={data.filter(p=>p.tipo==='Preferido').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="🌍" label="Internacionales" value={data.filter(p=>p.categoria==='Internacional').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar proveedor..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Email</th><th>Ciudad</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🏭</div><p>No hay proveedores</p></div></td></tr>
            : filtered.map(p => (
              <tr key={p.id}>
                <td><strong>{p.empresa}</strong></td>
                <td>{p.contacto || '—'}</td>
                <td>{p.email || '—'}</td>
                <td>{p.ciudad || '—'}</td>
                <td><span className={`badge ${p.tipo==='Preferido'?'badge-yellow':'badge-gray'}`}>{p.tipo}</span></td>
                <td>{estadoBadge(p.estado)}</td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={()=>openEdit(p)}>✏️</button>
                  <button className="btn-icon" onClick={()=>del(p.id)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Empresa</label><input className="form-control" value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})} placeholder="Nombre de la empresa" /></div>
          <div className="form-group"><label>Contacto</label><input className="form-control" value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})} placeholder="Nombre del contacto" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
          <div className="form-group"><label>Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Ciudad</label><input className="form-control" value={form.ciudad} onChange={e=>setForm({...form,ciudad:e.target.value})} /></div>
          <div className="form-group"><label>Categoría</label><select className="form-control" value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}><option>Nacional</option><option>Internacional</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Tipo</label><select className="form-control" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Estándar</option><option>Preferido</option></select></div>
          <div className="form-group"><label>Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>Activo</option><option>Inactivo</option></select></div>
        </div>
      </Modal>
    </div>
  )
}
