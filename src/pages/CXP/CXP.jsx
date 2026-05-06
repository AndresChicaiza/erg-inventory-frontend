import { useState, useEffect } from 'react'
import { cxpAPI, proveedoresAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const empty = { proveedor: '', concepto: '', monto_total: '', fecha_vencimiento: '', notas: '' }
const emptyPago = { cxp: '', monto: '', metodo: 'Transferencia', referencia: '', notas: '' }

const ESTADO_STYLE = {
  Pendiente: { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' },
  Parcial: { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
  Pagada: { bg: 'rgba(16,185,129,.15)', color: '#10b981' },
  Vencida: { bg: 'rgba(239,68,68,.15)', color: '#ef4444' },
  Anulada: { bg: 'rgba(107,114,128,.15)', color: '#6b7280' },
}

const Badge = ({ estado }) => {
  const s = ESTADO_STYLE[estado] || ESTADO_STYLE.Anulada
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: s.bg, color: s.color
    }}>
      {estado}
    </span>
  )
}

const AlertaVencimiento = ({ cxp }) => {
  if (!cxp.alerta_vencimiento) return null
  if (cxp.alerta_vencimiento === 'vencida')
    return <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 4 }}>⛔ Vencida hace {Math.abs(cxp.dias_vencimiento)} días</span>
  return <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 4 }}>⚠️ Vence en {cxp.dias_vencimiento} días</span>
}

export default function CXP() {
  const [data, setData] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [porProveedor, setPorProveedor] = useState([])
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalResumen, setModalResumen] = useState(false)
  const [form, setForm] = useState(empty)
  const [formPago, setFormPago] = useState(emptyPago)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cxpSel, setCxpSel] = useState(null)

  const load = async () => {
    try {
      const params = {}
      if (filtroEstado) params.estado = filtroEstado
      const [c, p] = await Promise.all([
        cxpAPI.list(params),
        proveedoresAPI.list(),
      ])
      setData(c.data.results || c.data)
      setProveedores(p.data.results || p.data)
    } catch { toast.error('Error cargando datos') }
  }

  const loadResumen = async () => {
    try {
      const resp = await cxpAPI.porProveedor()
      const data = resp.data
      setPorProveedor(Array.isArray(data) ? data : [])
    } catch { }
  }

  useEffect(() => { load() }, [filtroEstado])

  const filtered = data.filter(c =>
    `${c.proveedor_nombre} ${c.proveedor_documento} ${c.concepto} ${c.estado}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const totalPend = data.filter(c => c.estado !== 'Pagada' && c.estado !== 'Anulada').reduce((s, c) => s + parseFloat(c.saldo || 0), 0)
  const totalVencido = data.filter(c => c.estado === 'Vencida').reduce((s, c) => s + parseFloat(c.saldo || 0), 0)
  const proximas = data.filter(c => c.alerta_vencimiento === 'proxima').length

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm(empty); setEditing(null); setModal(true) }
  const openEdit = (c) => {
    setForm({
      proveedor: c.proveedor, concepto: c.concepto,
      monto_total: c.monto_total, fecha_vencimiento: c.fecha_vencimiento, notas: c.notas || ''
    })
    setEditing(c.id); setModal(true)
  }
  const abrirDetalle = (c) => { setCxpSel(c); setModalDetalle(true) }
  const abrirPago = (c) => {
    setCxpSel(c)
    setFormPago({ cxp: c.id, monto: '', metodo: 'Transferencia', referencia: '', notas: '' })
    setModalPago(true)
  }
  const abrirResumen = async () => {
    await loadResumen(); setModalResumen(true)
  }

  const save = async () => {
    if (!form.proveedor || !form.concepto || !form.monto_total || !form.fecha_vencimiento) {
      toast.error('Todos los campos son requeridos'); return
    }
    setLoading(true)
    try {
      if (editing) await cxpAPI.patch(editing, form)
      else await cxpAPI.create(form)
      toast.success(editing ? 'CXP actualizada' : 'CXP creada')
      setModal(false); load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const registrarPago = async () => {
    if (!formPago.monto || +formPago.monto <= 0) { toast.error('Monto inválido'); return }
    setLoading(true)
    try {
      await cxpAPI.registrarPago(formPago)
      toast.success('Pago registrado exitosamente')
      setModalPago(false); load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al registrar pago')
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar esta cuenta?')) return
    try { await cxpAPI.delete(id); toast.success('Eliminada'); load() }
    catch { toast.error('No se puede eliminar') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>📤 Cuentas por Pagar</h2><p>Obligaciones con proveedores</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={abrirResumen}>📊 Por Proveedor</button>
          <button className="btn btn-primary" onClick={openNew}>+ Nueva CXP</button>
        </div>
      </div>

      {proximas > 0 && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
          color: '#f59e0b', fontSize: 13, fontWeight: 600
        }}>
          ⚠️ {proximas} obligación{proximas > 1 ? 'es' : ''} próxima{proximas > 1 ? 's' : ''} a vencer en los próximos 7 días
        </div>
      )}

      {totalVencido > 0 && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
          color: '#ef4444', fontSize: 13, fontWeight: 600
        }}>
          ⛔ Obligaciones vencidas: <strong>{fmt(totalVencido)}</strong> — pago urgente requerido
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon="💸" label="Total por Pagar" value={fmt(totalPend)} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
        <StatCard icon="🔴" label="Obligac. Vencidas" value={fmt(totalVencido)} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
        <StatCard icon="📄" label="Total Cuentas" value={data.length} iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="⏳" label="Pendientes" value={data.filter(c => c.estado === 'Pendiente').length} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
        <StatCard icon="✅" label="Pagadas" value={data.filter(c => c.estado === 'Pagada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🔵" label="Parciales" value={data.filter(c => c.estado === 'Parcial').length} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar por proveedor, NIT, concepto..."
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
              <th>ID</th><th>Proveedor / NIT</th><th>Concepto</th>
              <th>Total</th><th>Pagado</th><th>Saldo</th>
              <th>Vencimiento</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📤</div><p>No hay cuentas por pagar</p></div></td></tr>
              : filtered.map(c => (
                <tr key={c.id} style={{
                  background: c.alerta_vencimiento === 'vencida' ? 'rgba(239,68,68,.05)'
                    : c.alerta_vencimiento === 'proxima' ? 'rgba(245,158,11,.05)'
                      : 'transparent'
                }}>
                  <td><span className="tag">CXP-{String(c.id).padStart(4, '0')}</span></td>
                  <td>
                    <strong>{c.proveedor_nombre}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {c.proveedor_tipo_doc}: {c.proveedor_documento}
                    </div>
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.concepto}</td>
                  <td>{fmt(c.monto_total)}</td>
                  <td style={{ color: 'var(--success)' }}>{fmt(c.monto_pagado)}</td>
                  <td>
                    <strong style={{ color: parseFloat(c.saldo) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {fmt(c.saldo)}
                    </strong>
                  </td>
                  <td>
                    <div>{fmtDate(c.fecha_vencimiento)}</div>
                    <AlertaVencimiento cxp={c} />
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
        title={editing ? 'Editar CXP' : 'Nueva Cuenta por Pagar'}
        footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button></>
        }>
        <div className="form-row">
          <div className="form-group">
            <label>Proveedor</label>
            <select className="form-control" value={form.proveedor} onChange={e => f('proveedor', e.target.value)}>
              <option value="">Seleccionar...</option>
              {/* ✅ Fix: muestra razon_social en lugar de empresa */}
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>
                  {p.razon_social} — {p.tipo_documento}: {p.numero_documento}
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
            onChange={e => f('concepto', e.target.value)} placeholder="Factura, servicio, etc." />
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

      {/* ── Modal detalle e historial ── */}
      <Modal open={modalDetalle} onClose={() => setModalDetalle(false)}
        title={`📋 Detalle CXP-${String(cxpSel?.id || 0).padStart(4, '0')}`}
        footer={<button className="btn btn-ghost" onClick={() => setModalDetalle(false)}>Cerrar</button>}>
        {cxpSel && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Proveedor', cxpSel.proveedor_nombre],
                ['Documento', `${cxpSel.proveedor_tipo_doc}: ${cxpSel.proveedor_documento}`],
                ['Concepto', cxpSel.concepto],
                ['Estado', <Badge estado={cxpSel.estado} />],
                ['Total', fmt(cxpSel.monto_total)],
                ['Pagado', fmt(cxpSel.monto_pagado)],
                ['Saldo', <strong style={{ color: 'var(--danger)' }}>{fmt(cxpSel.saldo)}</strong>],
                ['Vencimiento', fmtDate(cxpSel.fecha_vencimiento)],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Datos bancarios */}
            {(cxpSel.proveedor_banco || cxpSel.proveedor_cuenta) && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase' }}>
                  🏦 Datos bancarios para el pago
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {cxpSel.proveedor_banco && (
                    <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Banco: </span>
                      <strong style={{ fontSize: 13 }}>{cxpSel.proveedor_banco}</strong></div>
                  )}
                  {cxpSel.proveedor_tipo_cuenta && (
                    <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Tipo: </span>
                      <strong style={{ fontSize: 13 }}>{cxpSel.proveedor_tipo_cuenta}</strong></div>
                  )}
                  {cxpSel.proveedor_cuenta && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Cuenta: </span>
                      <strong style={{ fontSize: 13 }}>{cxpSel.proveedor_cuenta}</strong>
                      <button onClick={() => { navigator.clipboard.writeText(cxpSel.proveedor_cuenta); toast.success('Copiado') }}
                        style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)',
                          background: 'transparent', cursor: 'pointer', color: 'var(--accent)'
                        }}>
                        📋 Copiar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>
              Historial de pagos ({cxpSel.pagos?.length || 0})
            </div>

            {!cxpSel.pagos?.length
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
                  {cxpSel.pagos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontSize: 12 }}>{fmtDate(p.fecha)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{fmt(p.monto)}</td>
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
      <Modal open={modalPago} onClose={() => setModalPago(false)} title="💵 Registrar Pago a Proveedor"
        footer={
          <><button className="btn btn-ghost" onClick={() => setModalPago(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={registrarPago} disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </button></>
        }>
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Proveedor</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{cxpSel?.proveedor_nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Saldo pendiente: <strong style={{ color: 'var(--danger)', fontSize: 15 }}>{fmt(cxpSel?.saldo)}</strong>
          </div>
          {cxpSel?.proveedor_banco && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              🏦 {cxpSel.proveedor_banco} — {cxpSel.proveedor_tipo_cuenta}: <strong>{cxpSel.proveedor_cuenta}</strong>
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Monto a pagar</label>
            <input className="form-control" type="number" value={formPago.monto}
              onChange={e => setFormPago({ ...formPago, monto: e.target.value })} placeholder="0" />
            {formPago.monto && cxpSel && +formPago.monto > +cxpSel.saldo && (
              <small style={{ color: 'var(--danger)' }}>⛔ Supera el saldo ({fmt(cxpSel.saldo)})</small>
            )}
          </div>
          <div className="form-group">
            <label>Método de pago</label>
            <select className="form-control" value={formPago.metodo}
              onChange={e => setFormPago({ ...formPago, metodo: e.target.value })}>
              <option>Transferencia</option>
              <option>Efectivo</option>
              <option>Cheque</option>
              <option>Tarjeta</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Referencia / Comprobante</label>
            <input className="form-control" value={formPago.referencia}
              onChange={e => setFormPago({ ...formPago, referencia: e.target.value })} placeholder="Nro. transferencia" />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <input className="form-control" value={formPago.notas}
              onChange={e => setFormPago({ ...formPago, notas: e.target.value })} placeholder="Opcional" />
          </div>
        </div>
      </Modal>

      {/* ── Modal resumen por proveedor ── */}
      <Modal open={modalResumen} onClose={() => setModalResumen(false)}
        title="📊 Obligaciones por Proveedor"
        footer={<button className="btn btn-ghost" onClick={() => setModalResumen(false)}>Cerrar</button>}>
        {porProveedor.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>Sin obligaciones pendientes</div>
          : <>
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text3)' }}>
              Ordenado de mayor a menor saldo pendiente
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Proveedor', 'NIT', 'Facturas', 'Total Saldo'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left', fontSize: 11,
                      color: 'var(--text3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porProveedor.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{p.proveedor__razon_social}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>{p.proveedor__numero_documento}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center' }}>{p.num_facturas}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
                      {fmt(p.total_saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        }
      </Modal>
    </div>
  )
}