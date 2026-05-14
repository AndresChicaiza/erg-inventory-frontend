import { useState, useEffect } from 'react'
import { empleadosRRHHAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = {
  nombre: '', tipo_documento: 'CC', numero_documento: '', email: '', telefono: '', direccion: '',
  fecha_nacimiento: '', cargo: '', departamento: '', sede: '', tipo_contrato: 'Indefinido',
  fecha_ingreso: '', salario_base: '', estado: 'Activo',
  banco: '', tipo_cuenta: 'Ahorros', numero_cuenta: '',
}

const ESTADO_STYLE = {
  Activo:     { bg: 'rgba(16,185,129,.15)', color: '#10b981' },
  Retirado:   { bg: 'rgba(239,68,68,.15)',  color: '#ef4444' },
  Vacaciones: { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
  Licencia:   { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' },
}

const Badge = ({ estado }) => {
  const s = ESTADO_STYLE[estado] || ESTADO_STYLE.Activo
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{estado}</span>
}

const Avatar = ({ nombre }) => {
  const initials = nombre ? nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']
  const color = colors[nombre?.charCodeAt(0) % colors.length] || colors[0]
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0
    }}>{initials}</div>
  )
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      {title}
    </div>
    {children}
  </div>
)

export default function Empleados() {
  const [data, setData]     = useState([])
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Activo')
  const [modal, setModal]   = useState(false)
  const [detalle, setDetalle] = useState(false)
  const [form, setForm]     = useState(empty)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const params = {}
      if (filtroEstado) params.estado = filtroEstado
      const r = await empleadosRRHHAPI.list(params)
      setData(r.data.results || r.data)
    } catch { toast.error('Error cargando empleados') }
  }
  useEffect(() => { load() }, [filtroEstado])

  const filtered = data.filter(e =>
    `${e.nombre} ${e.numero_documento} ${e.cargo}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalNomina = data.filter(e => e.estado === 'Activo').reduce((s, e) => s + parseFloat(e.salario_base || 0), 0)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (e) => {
    setForm({
      nombre: e.nombre, tipo_documento: e.tipo_documento, numero_documento: e.numero_documento,
      email: e.email || '', telefono: e.telefono || '', direccion: e.direccion || '',
      fecha_nacimiento: e.fecha_nacimiento || '', cargo: e.cargo, departamento: e.departamento || '',
      sede: e.sede || '', tipo_contrato: e.tipo_contrato, fecha_ingreso: e.fecha_ingreso,
      salario_base: e.salario_base, estado: e.estado,
      banco: e.banco || '', tipo_cuenta: e.tipo_cuenta || 'Ahorros', numero_cuenta: e.numero_cuenta || '',
    })
    setEditing(e.id); setModal(true)
  }
  const abrirDetalle = (e) => { setSelected(e); setDetalle(true) }

  const save = async () => {
    if (!form.nombre || !form.numero_documento || !form.cargo || !form.fecha_ingreso || !form.salario_base) {
      toast.error('Nombre, documento, cargo, fecha de ingreso y salario son requeridos'); return
    }
    setLoading(true)
    try {
      if (editing) await empleadosRRHHAPI.patch(editing, form)
      else await empleadosRRHHAPI.create(form)
      toast.success(editing ? 'Empleado actualizado' : 'Empleado registrado')
      setModal(false); load()
    } catch (e) {
      toast.error(e.response?.data?.numero_documento?.[0] || e.response?.data?.error || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Retirar este empleado del sistema?')) return
    try { await empleadosRRHHAPI.delete(id); toast.success('Eliminado'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>👥 Empleados</h2><p>Gestión del personal de la empresa</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Empleado</button>
      </div>

      <div className="stats-grid">
        <StatCard icon="👥" label="Empleados Activos" value={data.filter(e => e.estado === 'Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="💸" label="Masa Salarial" value={fmt(totalNomina)} color="var(--indigo)" iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="🏖️" label="Vacaciones/Licencia" value={data.filter(e => e.estado === 'Vacaciones' || e.estado === 'Licencia').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="🚪" label="Retirados" value={data.filter(e => e.estado === 'Retirado').length} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-box"><span>🔍</span><input placeholder="Buscar por nombre, documento, cargo..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-control" style={{ width: 160 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Retirado">Retirados</option>
            <option value="Vacaciones">Vacaciones</option>
            <option value="Licencia">Licencia</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Documento</th>
              <th>Cargo</th>
              <th>Contrato</th>
              <th>F. Ingreso</th>
              <th>Salario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">👥</div><p>No hay empleados</p></div></td></tr>
              : filtered.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar nombre={e.nombre} />
                      <div>
                        <strong>{e.nombre}</strong>
                        {e.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{e.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="tag">{e.tipo_documento}: {e.numero_documento}</span></td>
                  <td>{e.cargo}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{e.tipo_contrato?.replace('_', ' ')}</td>
                  <td>{fmtDate(e.fecha_ingreso)}</td>
                  <td><strong>{fmt(e.salario_base)}</strong></td>
                  <td><Badge estado={e.estado} /></td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" title="Ver ficha" onClick={() => abrirDetalle(e)}>📋</button>
                      <button className="btn-icon" onClick={() => openEdit(e)}>✏️</button>
                      <button className="btn-icon" onClick={() => del(e.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal Crear/Editar ── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Empleado' : 'Nuevo Empleado'} width="780px"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button></>}>

        <Section title="📋 Datos Personales">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nombre Completo</label>
              <input className="form-control" value={form.nombre} onChange={e => f('nombre', e.target.value)} placeholder="Nombres y Apellidos" />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select className="form-control" value={form.estado} onChange={e => f('estado', e.target.value)}>
                <option value="Activo">Activo</option>
                <option value="Vacaciones">En Vacaciones</option>
                <option value="Licencia">En Licencia</option>
                <option value="Retirado">Retirado</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo Documento</label>
              <select className="form-control" value={form.tipo_documento} onChange={e => f('tipo_documento', e.target.value)}>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="PAS">Pasaporte</option>
                <option value="TI">Tarjeta de Identidad</option>
              </select>
            </div>
            <div className="form-group">
              <label>Número de Documento</label>
              <input className="form-control" value={form.numero_documento} onChange={e => f('numero_documento', e.target.value)} placeholder="12345678" />
            </div>
            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <input className="form-control" type="date" value={form.fecha_nacimiento} onChange={e => f('fecha_nacimiento', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="correo@empresa.com" /></div>
            <div className="form-group"><label>Teléfono</label><input className="form-control" value={form.telefono} onChange={e => f('telefono', e.target.value)} placeholder="300 000 0000" /></div>
          </div>
          <div className="form-group"><label>Dirección</label><input className="form-control" value={form.direccion} onChange={e => f('direccion', e.target.value)} placeholder="Dirección de residencia" /></div>
        </Section>

        <Section title="🏢 Datos Laborales">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Cargo</label>
              <input className="form-control" value={form.cargo} onChange={e => f('cargo', e.target.value)} placeholder="Operario, Vendedor, Contador..." />
            </div>
            <div className="form-group">
              <label>Departamento</label>
              <input className="form-control" value={form.departamento} onChange={e => f('departamento', e.target.value)} placeholder="Producción, Ventas..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Contrato</label>
              <select className="form-control" value={form.tipo_contrato} onChange={e => f('tipo_contrato', e.target.value)}>
                <option value="Indefinido">Indefinido</option>
                <option value="Fijo">Término Fijo</option>
                <option value="Obra_labor">Obra y Labor</option>
                <option value="Prestacion">Prestación de Servicios</option>
                <option value="Aprendizaje">Aprendizaje</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha de Ingreso</label>
              <input className="form-control" type="date" value={form.fecha_ingreso} onChange={e => f('fecha_ingreso', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Salario Base Pactado</label>
              <input className="form-control" type="number" value={form.salario_base} onChange={e => f('salario_base', e.target.value)} placeholder="1.300.000" />
            </div>
          </div>
        </Section>

        <Section title="🏦 Datos Bancarios (para pago de nómina)">
          <div className="form-row">
            <div className="form-group"><label>Banco</label><input className="form-control" value={form.banco} onChange={e => f('banco', e.target.value)} placeholder="Bancolombia, Davivienda..." /></div>
            <div className="form-group">
              <label>Tipo de Cuenta</label>
              <select className="form-control" value={form.tipo_cuenta} onChange={e => f('tipo_cuenta', e.target.value)}>
                <option value="Ahorros">Cuenta de Ahorros</option>
                <option value="Corriente">Cuenta Corriente</option>
              </select>
            </div>
            <div className="form-group"><label>Número de Cuenta</label><input className="form-control" value={form.numero_cuenta} onChange={e => f('numero_cuenta', e.target.value)} placeholder="123-456789-00" /></div>
          </div>
        </Section>
      </Modal>

      {/* ── Modal Ficha del Empleado ── */}
      <Modal open={detalle} onClose={() => setDetalle(false)} title={`📋 Ficha: ${selected?.nombre || ''}`} width="640px"
        footer={<button className="btn btn-ghost" onClick={() => setDetalle(false)}>Cerrar</button>}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Encabezado */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
              <Avatar nombre={selected.nombre} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.cargo}</div>
                <div style={{ marginTop: 4 }}><Badge estado={selected.estado} /></div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Salario Base</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--indigo)' }}>{fmt(selected.salario_base)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Antigüedad: {selected.antiguedad} años</div>
              </div>
            </div>

            {/* Grid de detalles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Documento', `${selected.tipo_documento}: ${selected.numero_documento}`],
                ['Email', selected.email || '—'],
                ['Teléfono', selected.telefono || '—'],
                ['Dirección', selected.dirección || selected.direccion || '—'],
                ['Tipo Contrato', selected.tipo_contrato?.replace('_', ' ')],
                ['F. Ingreso', fmtDate(selected.fecha_ingreso)],
                ['Departamento', selected.departamento || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Datos bancarios */}
            {selected.banco && (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>🏦 Datos para Pago</div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Banco: </span><strong>{selected.banco}</strong></div>
                  <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Tipo: </span><strong>{selected.tipo_cuenta}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Cuenta: </span>
                    <strong>{selected.numero_cuenta}</strong>
                    <button onClick={() => { navigator.clipboard.writeText(selected.numero_cuenta); toast.success('Copiado') }}
                      style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--accent)' }}>
                      📋
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cálculo nómina estimado */}
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>💼 Estimación Nómina Mensual</div>
              {(() => {
                const base = parseFloat(selected.salario_base || 0)
                const salud = base * 0.04
                const pension = base * 0.04
                const neto = base - salud - pension
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                    {[['Salario Base', base, 'var(--text1)'], ['Salud (4%)', salud, 'var(--warning)'], ['Pensión (4%)', pension, 'var(--warning)'], ['Neto Est.', neto, 'var(--success)']].map(([l, v, c]) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{fmt(v)}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
