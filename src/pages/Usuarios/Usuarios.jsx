import { useState, useEffect } from 'react'
import { usuariosAPI, sedesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'Administrador', label: '🔑 Administrador', desc: 'Acceso total al sistema' },
  { value: 'Contador', label: '💼 Contador', desc: 'Facturas, nómina, reportes, aprueba OC' },
  { value: 'Vendedor', label: '🛒 Vendedor', desc: 'Ventas, clientes, movimientos de su sede' },
  { value: 'Logistica', label: '🚚 Logística', desc: 'Envíos, movimientos entre sedes, productos terminados' },
  { value: 'JefeFabrica', label: '🏭 Jefe de Fábrica', desc: 'MP, órdenes de compra, sube productos terminados' },
  { value: 'Bodeguero', label: '📦 Bodeguero', desc: 'Órdenes de compra, recibe mercancía' },
  { value: 'RRHH', label: '👤 RRHH', desc: 'Empleados, nómina, novedades' },
]

const empty = {
  nombre: '', email: '', password: '', rol: 'Vendedor',
  sede: '', telefono: '', estado: 'Activo',
}

const rolColor = {
  Administrador: '#6366f1', Contador: '#10b981', Vendedor: '#3b82f6',
  Logistica: '#f59e0b', JefeFabrica: '#ef4444', Bodeguero: '#8b5cf6', RRHH: '#ec4899',
}

const badge = (rol) => (
  <span style={{
    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${rolColor[rol] || '#6b7280'}22`,
    color: rolColor[rol] || '#6b7280',
  }}>{ROLES.find(r => r.value === rol)?.label?.split(' ').slice(1).join(' ') || rol}</span>
)

const estadoBadge = (e) => (
  <span style={{
    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: e === 'Activo' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
    color: e === 'Activo' ? 'var(--success)' : 'var(--danger)',
  }}>{e}</span>
)

export default function Usuarios() {
  const [data, setData] = useState([])
  const [sedes, setSedes] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const [u, s] = await Promise.all([usuariosAPI.list(), sedesAPI.list()])
      setData(u.data.results || u.data)
      setSedes(s.data.results || s.data)
    } catch { toast.error('Error cargando datos') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(u =>
    `${u.nombre} ${u.email} ${u.rol}`.toLowerCase().includes(search.toLowerCase())
  )
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (u) => {
    setForm({
      nombre: u.nombre, email: u.email, password: '',
      rol: u.rol, sede: u.sede || '', telefono: u.telefono || '', estado: u.estado,
    })
    setEditing(u.id); setModal(true)
  }

  const save = async () => {
    if (!form.nombre || !form.email) { toast.error('Nombre y email requeridos'); return }
    if (!editing && !form.password) { toast.error('La contraseña es requerida'); return }
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.sede) delete payload.sede
      if (!payload.password) delete payload.password
      if (editing) await usuariosAPI.patch(editing, payload)
      else await usuariosAPI.create(payload)
      toast.success(editing ? 'Usuario actualizado' : 'Usuario creado')
      setModal(false); load()
    } catch (e) {
      toast.error(e.response?.data?.email?.[0] || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const toggleEstado = async (u) => {
    try {
      await usuariosAPI.patch(u.id, { estado: u.estado === 'Activo' ? 'Inactivo' : 'Activo' })
      toast.success('Estado actualizado'); load()
    } catch { toast.error('Error') }
  }

  const rolSeleccionado = ROLES.find(r => r.value === form.rol)

  return (
    <div>
      <div className="page-header">
        <div><h2>👤 Usuarios</h2><p>Gestión de usuarios, roles y sedes</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Usuario</button>
      </div>

      <div className="stats-grid">
        <StatCard icon="👤" label="Total" value={data.length} iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="✅" label="Activos" value={data.filter(u => u.estado === 'Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        {ROLES.slice(1, 4).map(r => (
          <StatCard key={r.value} icon={r.label.split(' ')[0]} label={r.label.split(' ').slice(1).join(' ')}
            value={data.filter(u => u.rol === r.value).length} iconBg={`${rolColor[r.value]}22`} />
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Sede</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👤</div><p>No hay usuarios</p></div></td></tr>
              : filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong></td>
                  <td style={{ fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                  <td>{badge(u.rol)}</td>
                  <td>{u.sede_nombre || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td>{estadoBadge(u.estado)}</td>
                  <td><div className="actions">
                    <button className="btn-icon" onClick={() => openEdit(u)} title="Editar">✏️</button>
                    <button className="btn-icon" onClick={() => toggleEstado(u)}
                      title={u.estado === 'Activo' ? 'Desactivar' : 'Activar'}>
                      {u.estado === 'Activo' ? '🔒' : '🔓'}
                    </button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>

        <div className="form-row">
          <div className="form-group">
            <label>Nombre completo</label>
            <input className="form-control" value={form.nombre}
              onChange={e => f('nombre', e.target.value)} placeholder="Ana García" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={form.email}
              onChange={e => f('email', e.target.value)} placeholder="ana@empresa.com" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
            <input className="form-control" type="password" value={form.password}
              onChange={e => f('password', e.target.value)}
              placeholder={editing ? 'Dejar vacío para mantener' : 'Mínimo 8 caracteres'} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input className="form-control" value={form.telefono}
              onChange={e => f('telefono', e.target.value)} placeholder="320 123 4567" />
          </div>
        </div>

        {/* Selector de rol con descripción */}
        <div className="form-group">
          <label>Rol</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ROLES.map(r => (
              <div key={r.value} onClick={() => f('rol', r.value)} style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                border: `2px solid ${form.rol === r.value ? rolColor[r.value] : 'var(--border)'}`,
                background: form.rol === r.value ? `${rolColor[r.value]}15` : 'transparent',
                transition: 'all .15s',
              }}>
                <div style={{ fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sede</label>
            <select className="form-control" value={form.sede} onChange={e => f('sede', e.target.value)}>
              <option value="">— Sin sede asignada —</option>
              {sedes.filter(s => s.estado === 'Activa').map(s => (
                <option key={s.id} value={s.id}>{s.nombre} ({s.tipo})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="form-control" value={form.estado} onChange={e => f('estado', e.target.value)}>
              <option>Activo</option><option>Inactivo</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}