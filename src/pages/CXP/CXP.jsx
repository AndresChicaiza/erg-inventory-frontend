import { useState, useEffect } from 'react'
import { cxpAPI, proveedoresAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'
const empty = { proveedor:'', concepto:'', monto_total:'', fecha_vencimiento:'', notas:'' }
const emptyPago = { cxp:'', monto:'', metodo:'Transferencia', referencia:'', notas:'' }
const estadoColor = { Pendiente:'badge-yellow', Parcial:'badge-blue', Pagada:'badge-green', Vencida:'badge-red', Anulada:'badge-gray' }
export default function CXP() {
  const [data,setData]=useState([]); const [proveedores,setProveedores]=useState([])
  const [search,setSearch]=useState(''); const [modal,setModal]=useState(false); const [modalPago,setModalPago]=useState(false)
  const [form,setForm]=useState(empty); const [formPago,setFormPago]=useState(emptyPago)
  const [editing,setEditing]=useState(null); const [loading,setLoading]=useState(false); const [cxpSel,setCxpSel]=useState(null)
  const load=async()=>{try{const [c,p]=await Promise.all([cxpAPI.list(),proveedoresAPI.list()]);setData(c.data.results||c.data);setProveedores(p.data.results||p.data)}catch{toast.error('Error')}}
  useEffect(()=>{load()},[])
  const totalPend=data.filter(c=>c.estado!=='Pagada'&&c.estado!=='Anulada').reduce((s,c)=>s+parseFloat(c.saldo||0),0)
  const filtered=data.filter(c=>`${c.proveedor_nombre} ${c.concepto} ${c.estado}`.toLowerCase().includes(search.toLowerCase()))
  const openNew=()=>{setForm(empty);setEditing(null);setModal(true)}
  const openEdit=(c)=>{setForm({proveedor:c.proveedor,concepto:c.concepto,monto_total:c.monto_total,fecha_vencimiento:c.fecha_vencimiento,notas:c.notas||''});setEditing(c.id);setModal(true)}
  const abrirPago=(c)=>{setCxpSel(c);setFormPago({cxp:c.id,monto:'',metodo:'Transferencia',referencia:'',notas:''});setModalPago(true)}
  const save=async()=>{
    if(!form.proveedor||!form.concepto||!form.monto_total||!form.fecha_vencimiento){toast.error('Todos los campos requeridos');return}
    setLoading(true)
    try{if(editing)await cxpAPI.patch(editing,form);else await cxpAPI.create(form);toast.success(editing?'Actualizado':'CXP creada');setModal(false);load()}
    catch{toast.error('Error')}finally{setLoading(false)}
  }
  const registrarPago=async()=>{
    if(!formPago.monto||+formPago.monto<=0){toast.error('Monto inválido');return}
    setLoading(true)
    try{await cxpAPI.registrarPago(formPago);toast.success('Pago registrado');setModalPago(false);load()}
    catch{toast.error('Error')}finally{setLoading(false)}
  }
  const del=async(id)=>{if(!confirm('¿Eliminar?'))return;try{await cxpAPI.delete(id);toast.success('Eliminado');load()}catch{toast.error('Error')}}
  return (
    <div>
      <div className="page-header"><div><h2>📤 Cuentas por Pagar</h2><p>Obligaciones con proveedores</p></div><button className="btn btn-primary" onClick={openNew}>+ Nueva CXP</button></div>
      <div className="stats-grid">
        <StatCard icon="💸" label="Total por Pagar" value={fmt(totalPend)} color="var(--danger)" iconBg="rgba(239,68,68,.1)"/>
        <StatCard icon="📄" label="Total Cuentas" value={data.length} iconBg="rgba(99,102,241,.1)"/>
        <StatCard icon="⏳" label="Pendientes" value={data.filter(c=>c.estado==='Pendiente').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)"/>
        <StatCard icon="✅" label="Pagadas" value={data.filter(c=>c.estado==='Pagada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)"/>
        <StatCard icon="🔴" label="Vencidas" value={data.filter(c=>c.estado==='Vencida').length} color="var(--danger)" iconBg="rgba(239,68,68,.1)"/>
        <StatCard icon="🔵" label="Parciales" value={data.filter(c=>c.estado==='Parcial').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)"/>
      </div>
      <div className="table-wrapper">
        <div className="table-toolbar"><div className="search-box"><span>🔍</span><input placeholder="Buscar CXP..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
        <table><thead><tr><th>ID</th><th>Proveedor</th><th>Concepto</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{filtered.length===0?<tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📤</div><p>No hay cuentas por pagar</p></div></td></tr>
          :filtered.map(c=><tr key={c.id}>
            <td><span className="tag">CXP-{String(c.id).padStart(4,'0')}</span></td>
            <td><strong>{c.proveedor_nombre}</strong></td>
            <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</td>
            <td>{fmt(c.monto_total)}</td>
            <td style={{color:'var(--success)'}}>{fmt(c.monto_pagado)}</td>
            <td><strong style={{color:parseFloat(c.saldo)>0?'var(--danger)':'var(--success)'}}>{fmt(c.saldo)}</strong></td>
            <td>{fmtDate(c.fecha_vencimiento)}</td>
            <td><span className={`badge ${estadoColor[c.estado]||'badge-gray'}`}>{c.estado}</span></td>
            <td><div className="actions">
              {c.estado!=='Pagada'&&c.estado!=='Anulada'&&<button className="btn-icon" onClick={()=>abrirPago(c)} title="Pago">💵</button>}
              <button className="btn-icon" onClick={()=>openEdit(c)}>✏️</button>
              <button className="btn-icon" onClick={()=>del(c.id)}>🗑️</button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar CXP':'Nueva Cuenta por Pagar'}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Guardando...':'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Proveedor</label><select className="form-control" value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})}><option value="">Seleccionar...</option>{proveedores.map(p=><option key={p.id} value={p.id}>{p.empresa}</option>)}</select></div>
          <div className="form-group"><label>Monto Total</label><input className="form-control" type="number" value={form.monto_total} onChange={e=>setForm({...form,monto_total:e.target.value})} placeholder="0"/></div>
        </div>
        <div className="form-group"><label>Concepto</label><input className="form-control" value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Descripción de la obligación"/></div>
        <div className="form-row">
          <div className="form-group"><label>Fecha Vencimiento</label><input className="form-control" type="date" value={form.fecha_vencimiento} onChange={e=>setForm({...form,fecha_vencimiento:e.target.value})}/></div>
          <div className="form-group"><label>Notas</label><input className="form-control" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Opcional"/></div>
        </div>
      </Modal>
      <Modal open={modalPago} onClose={()=>setModalPago(false)} title="💵 Registrar Pago a Proveedor"
        footer={<><button className="btn btn-ghost" onClick={()=>setModalPago(false)}>Cancelar</button><button className="btn btn-primary" onClick={registrarPago} disabled={loading}>{loading?'Guardando...':'Registrar Pago'}</button></>}>
        <div className="alert alert-warning">Proveedor: <strong>{cxpSel?.proveedor_nombre}</strong> — Saldo: <strong>{fmt(cxpSel?.saldo)}</strong></div>
        <div className="form-row">
          <div className="form-group"><label>Monto</label><input className="form-control" type="number" value={formPago.monto} onChange={e=>setFormPago({...formPago,monto:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Método</label><select className="form-control" value={formPago.metodo} onChange={e=>setFormPago({...formPago,metodo:e.target.value})}><option>Transferencia</option><option>Efectivo</option><option>Cheque</option><option>Tarjeta</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Referencia</label><input className="form-control" value={formPago.referencia} onChange={e=>setFormPago({...formPago,referencia:e.target.value})} placeholder="Nro. transferencia"/></div>
          <div className="form-group"><label>Notas</label><input className="form-control" value={formPago.notas} onChange={e=>setFormPago({...formPago,notas:e.target.value})} placeholder="Opcional"/></div>
        </div>
      </Modal>
    </div>
  )
}
