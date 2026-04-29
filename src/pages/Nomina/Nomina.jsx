import { useState, useEffect } from 'react'
import { nominaAPI, usuariosAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'
const emptyP = { nombre:'', fecha_inicio:'', fecha_fin:'', estado:'Borrador' }
const emptyL = { periodo:'', empleado:'', salario_base:'', dias_trabajados:30, auxilio_transporte:0, horas_extra:0, bonificaciones:0, retencion_fuente:0, otras_deducciones:0, notas:'' }
const estadoColor = { Borrador:'badge-gray', Aprobada:'badge-green', Pagada:'badge-blue' }
export default function Nomina() {
  const [periodos,setPeriodos]=useState([]); const [lineas,setLineas]=useState([]); const [empleados,setEmpleados]=useState([])
  const [search,setSearch]=useState(''); const [tab,setTab]=useState('periodos')
  const [modalP,setModalP]=useState(false); const [modalL,setModalL]=useState(false)
  const [formP,setFormP]=useState(emptyP); const [formL,setFormL]=useState(emptyL)
  const [editP,setEditP]=useState(null); const [editL,setEditL]=useState(null)
  const [periodoActivo,setPeriodoActivo]=useState(null); const [loading,setLoading]=useState(false)
  const load=async()=>{
    try{const [p,u]=await Promise.all([nominaAPI.periodos.list(),usuariosAPI.list()])
    setPeriodos(p.data.results||p.data);setEmpleados((u.data.results||u.data).filter(u=>u.estado==='Activo'))}catch{toast.error('Error')}
  }
  const loadLineas=async(id)=>{try{const r=await nominaAPI.lineas.list({periodo_id:id});setLineas(r.data.results||r.data)}catch{toast.error('Error')}}
  useEffect(()=>{load()},[])
  const verPeriodo=(p)=>{setPeriodoActivo(p);setFormL({...emptyL,periodo:p.id});loadLineas(p.id);setTab('lineas')}
  const saveP=async()=>{
    if(!formP.nombre||!formP.fecha_inicio||!formP.fecha_fin){toast.error('Nombre y fechas requeridos');return}
    setLoading(true)
    try{if(editP)await nominaAPI.periodos.patch(editP,formP);else await nominaAPI.periodos.create(formP);toast.success(editP?'Actualizado':'Período creado');setModalP(false);load()}
    catch{toast.error('Error')}finally{setLoading(false)}
  }
  const saveL=async()=>{
    if(!formL.empleado||!formL.salario_base){toast.error('Empleado y salario requeridos');return}
    setLoading(true)
    try{if(editL)await nominaAPI.lineas.patch(editL,formL);else await nominaAPI.lineas.create(formL);toast.success(editL?'Actualizado':'Empleado agregado');setModalL(false);loadLineas(periodoActivo.id)}
    catch(e){toast.error(e.response?.data?.non_field_errors?.[0]||'Error')}finally{setLoading(false)}
  }
  const cerrar=async(id)=>{
    if(!confirm('¿Aprobar este período? Se calcularán los totales.'))return
    try{await nominaAPI.cerrar(id);toast.success('Período aprobado');load();if(periodoActivo?.id===id)loadLineas(id)}
    catch{toast.error('Error')}
  }
  const delLinea=async(id)=>{if(!confirm('¿Eliminar?'))return;try{await nominaAPI.lineas.delete(id);toast.success('Eliminado');loadLineas(periodoActivo.id)}catch{toast.error('Error')}}
  const filtP=periodos.filter(p=>`${p.nombre} ${p.estado}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div className="page-header">
        <div><h2>👔 Nómina</h2><p>Gestión de períodos y pago de empleados</p></div>
        {tab==='periodos'
          ?<button className="btn btn-primary" onClick={()=>{setFormP(emptyP);setEditP(null);setModalP(true)}}>+ Nuevo Período</button>
          :<div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" onClick={()=>{setTab('periodos');setPeriodoActivo(null)}}>← Volver</button>
            {periodoActivo?.estado==='Borrador'&&<><button className="btn btn-ghost" onClick={()=>cerrar(periodoActivo.id)}>✅ Aprobar</button><button className="btn btn-primary" onClick={()=>{setFormL({...emptyL,periodo:periodoActivo.id});setEditL(null);setModalL(true)}}>+ Agregar Empleado</button></>}
          </div>}
      </div>
      {tab==='periodos'?(
        <>
          <div className="stats-grid">
            <StatCard icon="📅" label="Total Períodos" value={periodos.length} iconBg="rgba(99,102,241,.1)"/>
            <StatCard icon="📝" label="Borradores" value={periodos.filter(p=>p.estado==='Borrador').length} color="var(--text2)" iconBg="rgba(100,116,139,.1)"/>
            <StatCard icon="✅" label="Aprobados" value={periodos.filter(p=>p.estado==='Aprobada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)"/>
            <StatCard icon="💸" label="Neto Último" value={fmt(periodos[0]?.total_neto||0)} color="var(--accent)" iconBg="rgba(59,130,246,.1)"/>
          </div>
          <div className="table-wrapper">
            <div className="table-toolbar"><div className="search-box"><span>🔍</span><input placeholder="Buscar período..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
            <table><thead><tr><th>Período</th><th>Inicio</th><th>Fin</th><th>Total Dev.</th><th>Deducciones</th><th>Neto</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>{filtP.length===0?<tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">👔</div><p>No hay períodos de nómina</p></div></td></tr>
              :filtP.map(p=><tr key={p.id}>
                <td><strong>{p.nombre}</strong></td><td>{fmtDate(p.fecha_inicio)}</td><td>{fmtDate(p.fecha_fin)}</td>
                <td style={{color:'var(--success)'}}>{fmt(p.total_devengado)}</td>
                <td style={{color:'var(--danger)'}}>{fmt(p.total_deducciones)}</td>
                <td><strong style={{color:'var(--accent)',fontSize:15}}>{fmt(p.total_neto)}</strong></td>
                <td><span className={`badge ${estadoColor[p.estado]||'badge-gray'}`}>{p.estado}</span></td>
                <td><div className="actions">
                  <button className="btn-icon" onClick={()=>verPeriodo(p)} title="Ver empleados">👥</button>
                  {p.estado==='Borrador'&&<><button className="btn-icon" onClick={()=>{setFormP({nombre:p.nombre,fecha_inicio:p.fecha_inicio,fecha_fin:p.fecha_fin,estado:p.estado});setEditP(p.id);setModalP(true)}}>✏️</button><button className="btn-icon" onClick={()=>cerrar(p.id)} title="Aprobar">✅</button></>}
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>
        </>
      ):(
        <>
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div><div style={{fontSize:18,fontWeight:700}}>{periodoActivo?.nombre}</div><div style={{fontSize:13,color:'var(--text2)'}}>{fmtDate(periodoActivo?.fecha_inicio)} — {fmtDate(periodoActivo?.fecha_fin)}</div></div>
              <div style={{marginLeft:'auto',display:'flex',gap:24,textAlign:'right'}}>
                <div><div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase'}}>Devengado</div><div style={{fontSize:18,fontWeight:700,color:'var(--success)'}}>{fmt(lineas.reduce((s,l)=>s+parseFloat(l.total_devengado||0),0))}</div></div>
                <div><div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase'}}>Deducciones</div><div style={{fontSize:18,fontWeight:700,color:'var(--danger)'}}>{fmt(lineas.reduce((s,l)=>s+parseFloat(l.total_deducciones||0),0))}</div></div>
                <div><div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase'}}>Neto Total</div><div style={{fontSize:18,fontWeight:700,color:'var(--accent)'}}>{fmt(lineas.reduce((s,l)=>s+parseFloat(l.neto_pagar||0),0))}</div></div>
              </div>
            </div>
          </div>
          <div className="table-wrapper">
            <table><thead><tr><th>Empleado</th><th>Días</th><th>Salario Base</th><th>Extras</th><th>Total Dev.</th><th>S+P (8%)</th><th>Otras Ded.</th><th>Neto a Pagar</th>{periodoActivo?.estado==='Borrador'&&<th>Acc.</th>}</tr></thead>
            <tbody>{lineas.length===0?<tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">👤</div><p>Agrega empleados con el botón de arriba</p></div></td></tr>
              :lineas.map(l=><tr key={l.id}>
                <td><strong>{l.empleado_nombre}</strong><br/><span style={{fontSize:11,color:'var(--text3)'}}>{l.empleado_email}</span></td>
                <td>{l.dias_trabajados}</td><td>{fmt(l.salario_base)}</td>
                <td>{fmt(parseFloat(l.horas_extra||0)+parseFloat(l.bonificaciones||0))}</td>
                <td style={{color:'var(--success)',fontWeight:600}}>{fmt(l.total_devengado)}</td>
                <td style={{color:'var(--warning)'}}>{fmt(parseFloat(l.salud||0)+parseFloat(l.pension||0))}</td>
                <td style={{color:'var(--danger)'}}>{fmt(parseFloat(l.retencion_fuente||0)+parseFloat(l.otras_deducciones||0))}</td>
                <td><strong style={{color:'var(--accent)',fontSize:14}}>{fmt(l.neto_pagar)}</strong></td>
                {periodoActivo?.estado==='Borrador'&&<td><div className="actions">
                  <button className="btn-icon" onClick={()=>{setFormL({periodo:l.periodo,empleado:l.empleado,salario_base:l.salario_base,dias_trabajados:l.dias_trabajados,auxilio_transporte:l.auxilio_transporte||0,horas_extra:l.horas_extra||0,bonificaciones:l.bonificaciones||0,retencion_fuente:l.retencion_fuente||0,otras_deducciones:l.otras_deducciones||0,notas:l.notas||''});setEditL(l.id);setModalL(true)}}>✏️</button>
                  <button className="btn-icon" onClick={()=>delLinea(l.id)}>🗑️</button>
                </div></td>}
              </tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      <Modal open={modalP} onClose={()=>setModalP(false)} title={editP?'Editar Período':'Nuevo Período de Nómina'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModalP(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveP} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-group"><label>Nombre del Período</label><input className="form-control" value={formP.nombre} onChange={e=>setFormP({...formP,nombre:e.target.value})} placeholder="Ej: Nómina Enero 2025 - Q1"/></div>
        <div className="form-row">
          <div className="form-group"><label>Fecha Inicio</label><input className="form-control" type="date" value={formP.fecha_inicio} onChange={e=>setFormP({...formP,fecha_inicio:e.target.value})}/></div>
          <div className="form-group"><label>Fecha Fin</label><input className="form-control" type="date" value={formP.fecha_fin} onChange={e=>setFormP({...formP,fecha_fin:e.target.value})}/></div>
        </div>
      </Modal>
      <Modal open={modalL} onClose={()=>setModalL(false)} title={editL?'Editar Empleado':'Agregar Empleado a Nómina'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModalL(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveL} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Empleado</label><select className="form-control" value={formL.empleado} onChange={e=>setFormL({...formL,empleado:e.target.value})}><option value="">Seleccionar...</option>{empleados.map(u=><option key={u.id} value={u.id}>{u.nombre} — {u.rol}</option>)}</select></div>
          <div className="form-group"><label>Días Trabajados</label><input className="form-control" type="number" min="1" max="31" value={formL.dias_trabajados} onChange={e=>setFormL({...formL,dias_trabajados:+e.target.value})}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Salario Base</label><input className="form-control" type="number" value={formL.salario_base} onChange={e=>setFormL({...formL,salario_base:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Auxilio Transporte</label><input className="form-control" type="number" value={formL.auxilio_transporte} onChange={e=>setFormL({...formL,auxilio_transporte:+e.target.value})} placeholder="0"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Horas Extra</label><input className="form-control" type="number" value={formL.horas_extra} onChange={e=>setFormL({...formL,horas_extra:+e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Bonificaciones</label><input className="form-control" type="number" value={formL.bonificaciones} onChange={e=>setFormL({...formL,bonificaciones:+e.target.value})} placeholder="0"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Retención Fuente</label><input className="form-control" type="number" value={formL.retencion_fuente} onChange={e=>setFormL({...formL,retencion_fuente:+e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Otras Deducciones</label><input className="form-control" type="number" value={formL.otras_deducciones} onChange={e=>setFormL({...formL,otras_deducciones:+e.target.value})} placeholder="0"/></div>
        </div>
        <div className="alert alert-info" style={{fontSize:12}}>💡 Salud (4%) y Pensión (4%) se calculan automáticamente sobre el salario base.</div>
        <div className="form-group"><label>Notas</label><input className="form-control" value={formL.notas} onChange={e=>setFormL({...formL,notas:e.target.value})} placeholder="Observaciones opcionales"/></div>
      </Modal>
    </div>
  )
}
