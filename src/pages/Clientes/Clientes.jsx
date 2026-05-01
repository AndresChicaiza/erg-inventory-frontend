import { useState, useEffect } from 'react'
import { clientesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

const TIPOS_DOC = ['NIT', 'CC', 'CE', 'PASAPORTE', 'NIT_EXTRAN', 'RUT']
const REGIMENES = [
  { value: 'RESPONSABLE_IVA', label: 'Responsable de IVA' },
  { value: 'NO_RESPONSABLE', label: 'No Responsable de IVA' },
  { value: 'REGIMEN_SIMPLE', label: 'Régimen Simple' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
  { value: 'ESPECIAL', label: 'Entidad sin ánimo de lucro' },
  { value: 'PERSONA_NATURAL', label: 'Persona Natural no comerciante' },
]

const empty = {
  tipo_documento: 'NIT', numero_documento: '', digito_verificacion: '',
  razon_social: '', nombre_comercial: '',
  email: '', telefono: '', telefono2: '',
  direccion: '', ciudad: '', departamento: '', pais: 'Colombia',
  regimen_tributario: 'RESPONSABLE_IVA',
  responsable_iva: true, gran_contribuyente: false,
  agente_retenedor: false, autoretenedor: false,
  ciiu: '', estado: 'Activo', notas: '',
}

const badge = (estado) => (
  <span style={{
    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: estado === 'Activo' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
    color: estado === 'Activo' ? 'var(--success)' : 'var(--danger)',
  }}>{estado}</span>
)

const regLabel = (v) => REGIMENES.find(r => r.value === v)?.label || v

export default function Clientes() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('basico') // basico | tributario | contacto

  const load = async () => {
    try { const r = await clientesAPI.list(); setData(r.data.results || r.data) }
    catch { toast.error('Error cargando clientes') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(c =>
    `${c.razon_social} ${c.numero_documento} ${c.ciudad}`.toLowerCase().includes(search.toLowerCase())
  )

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(empty); setEditing(null); setTab('basico'); setModal(true) }
  const openEdit = (c) => {
    setForm({
      tipo_documento: c.tipo_documento, numero_documento: c.numero_documento,
      digito_verificacion: c.digito_verificacion || '',
      razon_social: c.razon_social, nombre_comercial: c.nombre_comercial || '',
      email: c.email || '', telefono: c.telefono || '', telefono2: c.telefono2 || '',
      direccion: c.direccion || '', ciudad: c.ciudad || '',
      departamento: c.departamento || '', pais: c.pais || 'Colombia',
      regimen_tributario: c.regimen_tributario,
      responsable_iva: c.responsable_iva, gran_contribuyente: c.gran_contribuyente,
      agente_retenedor: c.agente_retenedor, autoretenedor: c.autoretenedor,
      ciiu: c.ciiu || '', estado: c.estado, notas: c.notas || '',
    })
    setEditing(c.id); setTab('basico'); setModal(true)
  }

  const save = async () => {
    if (!form.numero_documento || !form.razon_social) {
      toast.error('Número de documento y razón social son requeridos'); return
    }
    setLoading(true)
    try {
      if (editing) await clientesAPI.patch(editing, form)
      else await clientesAPI.create(form)
      toast.success(editing ? 'Cliente actualizado' : 'Cliente creado')
      setModal(false); load()
    } catch (e) {
      const err = e.response?.data
      const msg = err?.numero_documento?.[0] || err?.detail || 'Error al guardar'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    try { await clientesAPI.delete(id); toast.success('Cliente eliminado'); load() }
    catch { toast.error('No se puede eliminar — tiene registros asociados') }
  }

  const Check = ({ k, label }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
      <input type="checkbox" checked={form[k]} onChange={e => f(k, e.target.checked)}
        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
      {label}
    </label>
  )

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
      background: tab === id ? 'var(--accent)' : 'transparent',
      color: tab === id ? '#fff' : 'var(--text2)',
      fontWeight: tab === id ? 600 : 400,
    }}>{label}</button>
  )

  return (
    <div>
      <div className="page-header">
        <div><h2>👥 Clientes</h2><p>Gestión de clientes con datos tributarios DIAN</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Cliente</button>
      </div>

      <div className="stats-grid">
        <StatCard icon="👥" label="Total" value={data.length} iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="✅" label="Activos" value={data.filter(c => c.estado === 'Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🏢" label="Con NIT" value={data.filter(c => c.tipo_documento === 'NIT').length} iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="👤" label="Personas" value={data.filter(c => c.tipo_documento === 'CC').length} iconBg="rgba(245,158,11,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar por nombre, NIT o ciudad..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Documento</th><th>Razón Social</th><th>Régimen</th>
              <th>Ciudad</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">👥</div><p>No hay clientes</p></div></td></tr>
              : filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="tag" style={{ fontSize: 11 }}>{c.tipo_documento}</span>
                    <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 600 }}>
                      {c.numero_documento}{c.digito_verificacion ? `-${c.digito_verificacion}` : ''}
                    </span>
                  </td>
                  <td>
                    <strong>{c.razon_social}</strong>
                    {c.nombre_comercial && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.nombre_comercial}</div>}
                  </td>
                  <td><span style={{ fontSize: 11, color: 'var(--text2)' }}>{regLabel(c.regimen_tributario)}</span></td>
                  <td>{c.ciudad || '—'}</td>
                  <td>{c.telefono || '—'}</td>
                  <td>{badge(c.estado)}</td>
                  <td><div className="actions">
                    <button className="btn-icon" onClick={() => openEdit(c)}>✏️</button>
                    <button className="btn-icon" onClick={() => del(c.id)}>🗑️</button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          <TabBtn id="basico" label="📋 Básico" />
          <TabBtn id="tributario" label="💰 Tributario" />
          <TabBtn id="contacto" label="📍 Contacto" />
        </div>

        {/* Tab: Básico */}
        {tab === 'basico' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Documento</label>
                <select className="form-control" value={form.tipo_documento}
                  onChange={e => f('tipo_documento', e.target.value)}>
                  {TIPOS_DOC.map(t => <option key={t} value={t}>{t === 'CC' ? 'CC — Cédula' : t === 'CE' ? 'CE — Cédula Extranjería' : t === 'NIT_EXTRAN' ? 'NIT Extranjero' : t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Número de Documento {form.tipo_documento === 'NIT' && <span style={{ color: 'var(--text3)', fontSize: 11 }}>(sin dígito de verificación)</span>}</label>
                <input className="form-control" value={form.numero_documento}
                  onChange={e => f('numero_documento', e.target.value.replace(/\D/g, ''))}
                  placeholder={form.tipo_documento === 'NIT' ? '901334172' : '1234567890'} />
              </div>
              {form.tipo_documento === 'NIT' && (
                <div className="form-group" style={{ maxWidth: 80 }}>
                  <label>DV</label>
                  <input className="form-control" maxLength={1} value={form.digito_verificacion}
                    onChange={e => f('digito_verificacion', e.target.value.replace(/\D/g, ''))}
                    placeholder="0" />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Razón Social / Nombre Completo</label>
                <input className="form-control" value={form.razon_social}
                  onChange={e => f('razon_social', e.target.value.toUpperCase())}
                  placeholder="EMPRESA XYZ S.A.S." />
              </div>
              <div className="form-group">
                <label>Nombre Comercial <span style={{ color: 'var(--text3)', fontSize: 11 }}>(opcional)</span></label>
                <input className="form-control" value={form.nombre_comercial}
                  onChange={e => f('nombre_comercial', e.target.value)}
                  placeholder="Nombre con el que se conoce" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estado</label>
                <select className="form-control" value={form.estado}
                  onChange={e => f('estado', e.target.value)}>
                  <option>Activo</option><option>Inactivo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Código CIIU <span style={{ color: 'var(--text3)', fontSize: 11 }}>(actividad económica)</span></label>
                <input className="form-control" value={form.ciiu}
                  onChange={e => f('ciiu', e.target.value)} placeholder="4659" />
              </div>
            </div>

            <div className="form-group">
              <label>Notas internas</label>
              <input className="form-control" value={form.notas}
                onChange={e => f('notas', e.target.value)} placeholder="Observaciones opcionales" />
            </div>
          </>
        )}

        {/* Tab: Tributario */}
        {tab === 'tributario' && (
          <>
            <div className="form-group">
              <label>Régimen Tributario</label>
              <select className="form-control" value={form.regimen_tributario}
                onChange={e => {
                  const v = e.target.value
                  f('regimen_tributario', v)
                  f('responsable_iva', v === 'RESPONSABLE_IVA' || v === 'GRAN_CONTRIBUYENTE')
                  f('gran_contribuyente', v === 'GRAN_CONTRIBUYENTE')
                }}>
                {REGIMENES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div style={{
              padding: 16, borderRadius: 8,
              background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)',
              display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16
            }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                Responsabilidades tributarias
              </div>
              <Check k="responsable_iva" label="Responsable de IVA (cobra IVA en sus facturas)" />
              <Check k="gran_contribuyente" label="Gran Contribuyente (aplica ReteIVA al pagar)" />
              <Check k="agente_retenedor" label="Agente Retenedor (aplica Retefuente al pagar)" />
              <Check k="autoretenedor" label="Autorretenedor" />
            </div>

            {/* Resumen de retenciones que aplicará */}
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8 }}>
                🧮 Retenciones que aplicará este cliente al pagar
              </div>
              {!form.agente_retenedor && !form.gran_contribuyente && (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>✅ Sin retenciones (no es agente retenedor)</div>
              )}
              {form.agente_retenedor && (
                <div style={{ fontSize: 12, color: 'var(--warning)' }}>⚠️ Retefuente: según concepto (compras 2.5%, servicios 4%...)</div>
              )}
              {(form.gran_contribuyente || (form.responsable_iva && form.agente_retenedor)) && (
                <div style={{ fontSize: 12, color: 'var(--warning)' }}>⚠️ ReteIVA: 15% del IVA cobrado</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                ℹ️ ReteICA: según ciudad del cliente (se calcula al facturar)
              </div>
            </div>
          </>
        )}

        {/* Tab: Contacto */}
        {tab === 'contacto' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.email}
                  onChange={e => f('email', e.target.value)} placeholder="correo@empresa.com" />
              </div>
              <div className="form-group">
                <label>Teléfono principal</label>
                <input className="form-control" value={form.telefono}
                  onChange={e => f('telefono', e.target.value)} placeholder="320 123 4567" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono 2 <span style={{ color: 'var(--text3)', fontSize: 11 }}>(opcional)</span></label>
                <input className="form-control" value={form.telefono2}
                  onChange={e => f('telefono2', e.target.value)} placeholder="320 987 6543" />
              </div>
              <div className="form-group">
                <label>Ciudad</label>
                <input className="form-control" value={form.ciudad}
                  onChange={e => f('ciudad', e.target.value)} placeholder="Cali" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Departamento</label>
                <input className="form-control" value={form.departamento}
                  onChange={e => f('departamento', e.target.value)} placeholder="Valle del Cauca" />
              </div>
              <div className="form-group">
                <label>País</label>
                <input className="form-control" value={form.pais}
                  onChange={e => f('pais', e.target.value)} placeholder="Colombia" />
              </div>
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input className="form-control" value={form.direccion}
                onChange={e => f('direccion', e.target.value)} placeholder="Calle 10 # 5-20" />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}