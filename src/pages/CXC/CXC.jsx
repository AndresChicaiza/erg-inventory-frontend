import { useState, useEffect } from 'react'
import { cxcAPI, clientesAPI, reportesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { cliente: '', concepto: '', monto_total: '', fecha_vencimiento: '', notas: '' }
const emptyPago = { cxc: '', monto: '', metodo: 'Efectivo', referencia: '', notas: '' }

const ESTADO_STYLE = {
  Pendiente: { bg: 'rgba(245,158,11,.15)', color: '#f59e0b', label: 'Pendiente' },
  Parcial: { bg: 'rgba(59,130,246,.15)', color: '#3b82f6', label: 'Parcial' },
  Pagada: { bg: 'rgba(16,185,129,.15)', color: '#10b981', label: 'Pagada' },
  Vencida: { bg: 'rgba(239,68,68,.15)', color: '#ef4444', label: 'Vencida' },
  Anulada: { bg: 'rgba(107,114,128,.15)', color: '#6b7280', label: 'Anulada' },
}

const Badge = ({ estado }) => {
  const s = ESTADO_STYLE[estado] || ESTADO_STYLE.Anulada
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: s.bg, color: s.color
    }}>
      {s.label}
    </span>
  )
}

const AlertaVencimiento = ({ cxc }) => {
  if (!cxc.alerta_vencimiento) return null
  if (cxc.alerta_vencimiento === 'vencida') {
    return <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 4 }}>⛔ Vencida hace {Math.abs(cxc.dias_vencimiento)} días</span>
  }
  return <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 4 }}>⚠️ Vence en {cxc.dias_vencimiento} días</span>
}

export default function CXC() {
  const [data, setData] = useState([])
  const [clientes, setClientes] = useState([])
  const [resumen, setResumen] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [form, setForm] = useState(empty)
  const [formPago, setFormPago] = useState(emptyPago)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cxcSel, setCxcSel] = useState(null)

  const load = async () => {
    try {
      const params = {}
      if (filtroEstado) params.estado = filtroEstado
      const [c, cl] = await Promise.all([
        cxcAPI.list(params),
        clientesAPI.list(),
      ])
      setData(c.data.results || c.data)
      setClientes(cl.data.results || cl.data)

      // Cargar resumen
      try {
        const r = await cxcAPI.resumen()
        setResumen(r.data)
      } catch { }
    } catch { toast.error('Error cargando datos') }
  }

  useEffect(() => { load() }, [filtroEstado])

  const filtered = data.filter(c =>
    `${c.cliente_nombre} ${c.cliente_documento} ${c.concepto} ${c.estado}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const totalPend = data.filter(c => c.estado !== 'Pagada' && c.estado !== 'Anulada').reduce((s, c) => s + parseFloat(c.saldo || 0), 0)
  const totalVencido = data.filter(c => c.estado === 'Vencida').reduce((s, c) => s + parseFloat(c.saldo || 0), 0)
  const proximas = data.filter(c => c.alerta_vencimiento === 'proxima').length

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (c) => {
    setForm({
      cliente: c.cliente, concepto: c.concepto,
      monto_total: c.monto_total, fecha_vencimiento: c.fecha_vencimiento, notas: c.notas || ''
    })
    setEditing(c.id); setModal(true)
  }
  const abrirDetalle = (c) => { setCxcSel(c); setModalDetalle(true) }
  const abrirPago = (c) => {
    setCxcSel(c)
    setFormPago({ cxc: c.id, monto: '', metodo: 'Efectivo', referencia: '', notas: '' })
    setModalPago(true)
  }

  const save = async () => {
    if (!form.cliente || !form.concepto || !form.monto_total || !form.fecha_vencimiento) {
      toast.error('Todos los campos son requeridos'); return
    }
    setLoading(true)
    try {
      if (editing) await cxcAPI.patch(editing, form)
      else await cxcAPI.create(form)
      toast.success(editing ? 'CXC actualizada' : 'CXC creada')
      setModal(false); load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const registrarPago = async () => {
    if (!formPago.monto || +formPago.monto <= 0) { toast.error('Monto inválido'); return }
    setLoading(true)
    try {
      await cxcAPI.registrarPago(formPago)
      toast.success('Pago registrado exitosamente')
      setModalPago(false); load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al registrar pago')
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta cuenta?')) return
    try { await cxcAPI.delete(id); toast.success('Eliminada'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  const exportarPDF = async () => {
    try {
      toast.loading('Generando PDF...', { id: 'pdf' })
      const r = await reportesAPI.exportarCXC()
      const url = window.URL.createObjectURL(new Blob([r.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'cxc_pendiente.pdf')
      document.body.appendChild(link)
      link.click()
      toast.success('PDF generado', { id: 'pdf' })
    } catch { toast.error('Error al generar PDF', { id: 'pdf' }) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>📥 Cuentas por Cobrar</h2><p>Cartera y cobros a clientes</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={exportarPDF}>📄 Exportar PDF</button>
          <button className="btn btn-primary" onClick={openNew}>+ Nueva CXC</button>
        </div>
      </div>

      {/* Alerta de vencimientos próximos */}
      {proximas > 0 && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
          color: '#f59e0b', fontSize: 13, fontWeight: 600
        }}>
          ⚠️ {proximas} cuenta{proximas > 1 ? 's' : ''} próxima{proximas > 1 ? 's' : ''} a vencer en los próximos 7 días
        </div>
      )}

      {totalVencido > 0 && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
          color: '#ef4444', fontSize: 13, fontWeight: 600
        }}>
          ⛔ Cartera vencida: <strong>{fmt(totalVencido)}</strong> — requiere gestión inmediata
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon="💰" label="Total Pendiente" value={fmt(totalPend)} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="🔴" label="Cartera Vencida" value={fmt(totalVencido)} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
        <StatCard icon="📄" label="Total Cuentas" value={data.length} iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="⏳" label="Pendientes" value={data.filter(c => c.estado === 'Pendiente').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="✅" label="Pagadas" value={data.filter(c => c.estado === 'Pagada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🔵" label="Parciales" value={data.filter(c => c.estado === 'Parcial').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar por cliente, NIT, concepto..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 160 }}
            value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.keys(ESTADO_STYLE).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th><th>Cliente / NIT</th><th>Concepto</th>
              <th>Total</th><th>Pagado</th><th>Saldo</th>
              <th>Vencimiento</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📥</div><p>No hay cuentas por cobrar</p></div></td></tr>
              : filtered.map(c => (
                <tr key={c.id} style={{
                  background: c.alerta_vencimiento === 'vencida' ? 'rgba(239,68,68,.05)'
                    : c.alerta_vencimiento === 'proxima' ? 'rgba(245,158,11,.05)'
                      : 'transparent'
                }}>
                  <td><span className="tag">CXC-{String(c.id).padStart(4, '0')}</span></td>
                  <td>
                    <strong>{c.cliente_nombre}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {c.cliente_tipo_doc}: {c.cliente_documento}
                    </div>
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.concepto}</td>
                  <td>{fmt(c.monto_total)}</td>
                  <td style={{ color: 'var(--success)' }}>{fmt(c.monto_pagado)}</td>
                  <td>
                    <strong style={{ color: parseFloat(c.saldo) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {fmt(c.saldo)}
                    </strong>
                  </td>
                  <td>
                    <div>{fmtDate(c.fecha_vencimiento)}</div>
                    <AlertaVencimiento cxc={c} />
                  </td>
                  <td><Badge estado={c.estado} /></td>
                  <td><div className="actions">
                    <button className="btn-icon" onClick={() => abrirDetalle(c)} title="Ver historial">📋</button>
                    {c.estado !== 'Pagada' && c.estado !== 'Anulada' && (
                      <button className="btn-icon" onClick={() => abrirPago(c)} title="Registrar pago">💵</button>
                    )}
                    <button className="btn-icon" onClick={() => openEdit(c)}>✏️</button>
                    <button className="btn-icon" onClick={() => del(c.id)}>🗑️</button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal crear / editar ── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar CXC' : 'Nueva Cuenta por Cobrar'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>
        <div className="form-row">
          <div className="form-group">
            <label>Cliente</label>
            <select className="form-control" value={form.cliente} onChange={e => f('cliente', e.target.value)}>
              <option value="">Seleccionar...</option>
              {/* ✅ Fix: muestra razon_social en lugar de nombre */}
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.razon_social} — {c.tipo_documento}: {c.numero_documento}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Monto Total</label>
            <input className="form-control" type="number" value={form.monto_total}
              onChange={e => f('monto_total', e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label>Concepto</label>
          <input className="form-control" value={form.concepto}
            onChange={e => f('concepto', e.target.value)} placeholder="Descripción de la deuda" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha Vencimiento</label>
            <input className="form-control" type="date" value={form.fecha_vencimiento}
              onChange={e => f('fecha_vencimiento', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <input className="form-control" value={form.notas}
              onChange={e => f('notas', e.target.value)} placeholder="Opcional" />
          </div>
        </div>
      </Modal>

      {/* ── Modal detalle e historial de pagos ── */}
      <Modal open={modalDetalle} onClose={() => setModalDetalle(false)}
        title={`📋 Detalle CXC-${String(cxcSel?.id || 0).padStart(4, '0')}`}
        footer={<button className="btn btn-ghost" onClick={() => setModalDetalle(false)}>Cerrar</button>}>
        {cxcSel && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Cliente', cxcSel.cliente_nombre],
                ['Documento', `${cxcSel.cliente_tipo_doc}: ${cxcSel.cliente_documento}`],
                ['Concepto', cxcSel.concepto],
                ['Estado', <Badge estado={cxcSel.estado} />],
                ['Total', fmt(cxcSel.monto_total)],
                ['Pagado', fmt(cxcSel.monto_pagado)],
                ['Saldo', <strong style={{ color: 'var(--warning)' }}>{fmt(cxcSel.saldo)}</strong>],
                ['Vencimiento', fmtDate(cxcSel.fecha_vencimiento)],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>
              Historial de pagos ({cxcSel.pagos?.length || 0})
            </div>

            {!cxcSel.pagos?.length
              ? <div style={{ textAlign: 'center', padding: 16, color: 'var(--text3)', fontSize: 13 }}>Sin pagos registrados</div>
              : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Fecha', 'Monto', 'Método', 'Referencia', 'Registrado por'].map(h => (
                      <th key={h} style={{
                        padding: '6px 10px', textAlign: 'left', fontSize: 11,
                        color: 'var(--text3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cxcSel.pagos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontSize: 12 }}>{fmtDate(p.fecha)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{fmt(p.monto)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12 }}>{p.metodo}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text3)' }}>{p.referencia || '—'}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text3)' }}>{p.creado_por_nombre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </>
        )}
      </Modal>

      {/* ── Modal registrar pago ── */}
      <Modal open={modalPago} onClose={() => setModalPago(false)} title="💵 Registrar Pago"
        footer={
          <><button className="btn btn-ghost" onClick={() => setModalPago(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={registrarPago} disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </button></>
        }>
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Cliente</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{cxcSel?.cliente_nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Saldo pendiente: <strong style={{ color: 'var(--warning)', fontSize: 15 }}>{fmt(cxcSel?.saldo)}</strong>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Monto a abonar</label>
            <input className="form-control" type="number" value={formPago.monto}
              onChange={e => setFormPago({ ...formPago, monto: e.target.value })} placeholder="0" />
            {formPago.monto && cxcSel && +formPago.monto > +cxcSel.saldo && (
              <small style={{ color: 'var(--danger)' }}>⛔ Supera el saldo ({fmt(cxcSel.saldo)})</small>
            )}
          </div>
          <div className="form-group">
            <label>Método de pago</label>
            <select className="form-control" value={formPago.metodo}
              onChange={e => setFormPago({ ...formPago, metodo: e.target.value })}>
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Tarjeta</option>
              <option>Cheque</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Referencia / Comprobante</label>
            <input className="form-control" value={formPago.referencia}
              onChange={e => setFormPago({ ...formPago, referencia: e.target.value })} placeholder="Nro. comprobante" />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <input className="form-control" value={formPago.notas}
              onChange={e => setFormPago({ ...formPago, notas: e.target.value })} placeholder="Opcional" />
          </div>
        </div>
      </Modal>
    </div>
  )
}