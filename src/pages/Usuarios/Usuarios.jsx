import { useState, useEffect } from 'react'
import { usuariosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { rolBadge, estadoBadge } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { nombre:'', email:'', password:'', rol:'Empleado', estado:'Activo' }
const roles = ['Administrador','Vendedor','Almacenista','Contador','Empleado']

export default function Usuarios() {
  const [data, setData]   = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try { const r = await usuariosAPI.list(); setData(r.data.results || r.data) } catch { toast.error('Error cargando usuarios') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(u => `${u.nombre} ${u.email} ${u.rol}`.toLowerCase().includes(search.toLowerCase()))

  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (u) => { setForm({ nombre:u.nombre, email:u.email, password:'', rol:u.rol, estado:u.estado }); setEditing(u.id); setModal(true) }

  const save = async () => {
    if (!form.nombre || !form.email) { toast.error('Nombre y email son requeridos'); return }
    if (!editing && !form.password)  { toast.error('La contraseña es requerida'); return }
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) await usuariosAPI.patch(editing, payload)
      else await usuariosAPI.create(payload)
      toast.success(editing ? 'Usuario actualizado' : 'Usuario creado')
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.email?.[0] || 'Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try { await usuariosAPI.delete(id); toast.success('Usuario eliminado'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>👥 Usuarios</h2><p>Gestión de empleados y roles del sistema</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Usuario</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="👥" label="Total" value={data.length} iconBg="rgba(139,92,246,.1)" />
        <StatCard icon="✅" label="Activos" value={data.filter(u=>u.estado==='Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🛡️" label="Admins" value={data.filter(u=>u.rol==='Administrador').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="👔" label="Empleados" value={data.filter(u=>u.rol!=='Administrador').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar usuario..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">👥</div><p>No hay usuarios</p></div></td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.nombre}</strong></td>
                <td>{u.email}</td>
                <td>{rolBadge(u.rol)}</td>
                <td>{estadoBadge(u.estado)}</td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={()=>openEdit(u)} title="Editar">✏️</button>
                  <button className="btn-icon" onClick={()=>del(u.id)} title="Eliminar">🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </>}>
        <div className="form-row">
          <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Nombre completo" /></div>
          <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@ejemplo.com" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Contraseña {editing && '(dejar vacío para no cambiar)'}</label><input className="form-control" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" /></div>
          <div className="form-group"><label>Rol</label>
            <select className="form-control" value={form.rol} onChange={e=>setForm({...form,rol:e.target.value})}>
              {roles.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Estado</label>
          <select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
            <option>Activo</option><option>Inactivo</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}
