import { useState, useEffect } from 'react'
import { proveedoresAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { estadoBadge } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { 
  tipo_documento: 'NIT', numero_documento: '', digito_verificacion: '',
  razon_social: '', nombre_comercial: '', contacto: '', 
  email: '', telefono: '', telefono2: '', direccion: '', ciudad: '', departamento: '', pais: 'Colombia',
  regimen_tributario: 'RESPONSABLE_IVA', responsable_iva: true, gran_contribuyente: false, agente_retenedor: false, autoretenedor: false, ciiu: '',
  categoria: 'Nacional', cuenta_bancaria: '', banco: '', tipo_cuenta: 'Ahorros',
  estado: 'Activo', notas: ''
}

export default function Proveedores() {
  const [data, setData]     = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try { const r = await proveedoresAPI.list(); setData(r.data.results || r.data) } catch { toast.error('Error cargando proveedores') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(p => `${p.razon_social} ${p.numero_documento} ${p.contacto} ${p.ciudad}`.toLowerCase().includes(search.toLowerCase()))
  
  const openNew  = () => { setForm(empty); setEditing(null); setModal(true) }
  
  const openEdit = (p) => { 
    setForm({ 
      tipo_documento: p.tipo_documento || 'NIT', numero_documento: p.numero_documento || '', digito_verificacion: p.digito_verificacion || '',
      razon_social: p.razon_social || '', nombre_comercial: p.nombre_comercial || '', contacto: p.contacto || '',
      email: p.email || '', telefono: p.telefono || '', telefono2: p.telefono2 || '', direccion: p.direccion || '', ciudad: p.ciudad || '', departamento: p.departamento || '', pais: p.pais || 'Colombia',
      regimen_tributario: p.regimen_tributario || 'RESPONSABLE_IVA', responsable_iva: p.responsable_iva ?? true, gran_contribuyente: p.gran_contribuyente ?? false, agente_retenedor: p.agente_retenedor ?? false, autoretenedor: p.autoretenedor ?? false, ciiu: p.ciiu || '',
      categoria: p.categoria || 'Nacional', cuenta_bancaria: p.cuenta_bancaria || '', banco: p.banco || '', tipo_cuenta: p.tipo_cuenta || 'Ahorros',
      estado: p.estado || 'Activo', notas: p.notas || ''
    }); 
    setEditing(p.id); 
    setModal(true) 
  }

  const save = async () => {
    if (!form.numero_documento || !form.razon_social) { toast.error('Documento y Razón Social son requeridos'); return }
    setLoading(true)
    try {
      if (editing) await proveedoresAPI.patch(editing, form)
      else await proveedoresAPI.create(form)
      toast.success(editing ? 'Proveedor actualizado' : 'Proveedor creado')
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.numero_documento?.[0] || 'Error al guardar') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    try { await proveedoresAPI.delete(id); toast.success('Proveedor eliminado'); load() }
    catch { toast.error('No se puede eliminar porque tiene compras asociadas') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>🏭 Proveedores</h2><p>Gestión completa de proveedores y datos tributarios</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo Proveedor</button>
      </div>
      <div className="stats-grid">
        <StatCard icon="🏭" label="Total" value={data.length} iconBg="rgba(249,115,22,.1)" />
        <StatCard icon="✅" label="Activos" value={data.filter(p=>p.estado==='Activo').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🏢" label="Grandes Contribuyentes" value={data.filter(p=>p.gran_contribuyente).length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="🌍" label="Internacionales" value={data.filter(p=>p.categoria==='Internacional').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="search-box"><span>🔍</span><input placeholder="Buscar por nombre, NIT o ciudad..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>Identificación</th><th>Razón Social</th><th>Contacto</th><th>Ciudad</th><th>Categoría</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🏭</div><p>No hay proveedores registrados</p></div></td></tr>
            : filtered.map(p => (
              <tr key={p.id}>
                <td><span className="tag">{p.tipo_documento} {p.numero_documento}{p.digito_verificacion ? `-${p.digito_verificacion}` : ''}</span></td>
                <td><strong>{p.razon_social}</strong><br/><span style={{ fontSize:12, color:'var(--text3)' }}>{p.nombre_comercial}</span></td>
                <td>{p.contacto || '—'}<br/><span style={{ fontSize:12, color:'var(--text3)' }}>{p.telefono || p.email}</span></td>
                <td>{p.ciudad || '—'}</td>
                <td><span className={`badge ${p.categoria==='Internacional'?'badge-blue':'badge-gray'}`}>{p.categoria}</span></td>
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
      <Modal open={modal} onClose={()=>setModal(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'} width="700px"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        
        <h4 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text2)' }}>📋 Identificación y Legal</h4>
        <div className="form-row">
          <div className="form-group"><label>Tipo Doc.</label>
            <select className="form-control" value={form.tipo_documento} onChange={e=>setForm({...form,tipo_documento:e.target.value})}>
              <option value="NIT">NIT</option><option value="CC">Cédula</option><option value="CE">CE</option><option value="PASAPORTE">Pasaporte</option><option value="NIT_EXTRAN">NIT Extranjero</option>
            </select>
          </div>
          <div className="form-group"><label>Número Documento</label><input className="form-control" value={form.numero_documento} onChange={e=>setForm({...form,numero_documento:e.target.value})} placeholder="Ej. 900123456" /></div>
          <div className="form-group" style={{ maxWidth: '80px' }}><label>DV</label><input className="form-control" value={form.digito_verificacion} onChange={e=>setForm({...form,digito_verificacion:e.target.value})} placeholder="Ej. 1" maxLength="1" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Razón Social (Legal)</label><input className="form-control" value={form.razon_social} onChange={e=>setForm({...form,razon_social:e.target.value})} placeholder="Nombre registrado en RUT" /></div>
          <div className="form-group"><label>Nombre Comercial</label><input className="form-control" value={form.nombre_comercial} onChange={e=>setForm({...form,nombre_comercial:e.target.value})} placeholder="Nombre conocido (opcional)" /></div>
        </div>

        <h4 style={{ marginTop: 24, marginBottom: 12, color: 'var(--text2)' }}>📞 Contacto y Ubicación</h4>
        <div className="form-row">
          <div className="form-group"><label>Contacto Principal</label><input className="form-control" value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})} /></div>
          <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} /></div>
          <div className="form-group"><label>Ciudad</label><input className="form-control" value={form.ciudad} onChange={e=>setForm({...form,ciudad:e.target.value})} /></div>
          <div className="form-group"><label>Dirección</label><input className="form-control" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} /></div>
        </div>

        <h4 style={{ marginTop: 24, marginBottom: 12, color: 'var(--text2)' }}>⚖️ Tributario y Financiero</h4>
        <div className="form-row">
          <div className="form-group"><label>Régimen Tributario</label>
            <select className="form-control" value={form.regimen_tributario} onChange={e=>setForm({...form,regimen_tributario:e.target.value})}>
              <option value="RESPONSABLE_IVA">Responsable de IVA</option>
              <option value="NO_RESPONSABLE">No Responsable de IVA</option>
              <option value="REGIMEN_SIMPLE">Régimen Simple</option>
              <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente</option>
              <option value="ESPECIAL">Régimen Especial</option>
            </select>
          </div>
          <div className="form-group"><label>Código CIIU</label><input className="form-control" value={form.ciiu} onChange={e=>setForm({...form,ciiu:e.target.value})} placeholder="Actividad Económica" /></div>
        </div>
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={form.responsable_iva} onChange={e=>setForm({...form,responsable_iva:e.target.checked})} /> Cobra IVA</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={form.gran_contribuyente} onChange={e=>setForm({...form,gran_contribuyente:e.target.checked})} /> Gran Contribuyente</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={form.agente_retenedor} onChange={e=>setForm({...form,agente_retenedor:e.target.checked})} /> Agente Retenedor</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={form.autoretenedor} onChange={e=>setForm({...form,autoretenedor:e.target.checked})} /> Autoretenedor</label>
        </div>

        <div className="form-row">
          <div className="form-group"><label>Banco</label><input className="form-control" value={form.banco} onChange={e=>setForm({...form,banco:e.target.value})} placeholder="Bancolombia, Davivienda..." /></div>
          <div className="form-group"><label>Tipo de Cuenta</label>
            <select className="form-control" value={form.tipo_cuenta} onChange={e=>setForm({...form,tipo_cuenta:e.target.value})}>
              <option value="Ahorros">Ahorros</option><option value="Corriente">Corriente</option>
            </select>
          </div>
          <div className="form-group"><label>Número de Cuenta</label><input className="form-control" value={form.cuenta_bancaria} onChange={e=>setForm({...form,cuenta_bancaria:e.target.value})} /></div>
        </div>

        <div className="form-row">
          <div className="form-group"><label>Categoría</label><select className="form-control" value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}><option>Nacional</option><option>Internacional</option></select></div>
          <div className="form-group"><label>Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>Activo</option><option>Inactivo</option></select></div>
        </div>
      </Modal>
    </div>
  )
}
