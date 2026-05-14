import { useState, useEffect } from 'react'
import { nominaAPI, empleadosRRHHAPI, reportesAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const emptyP = { nombre: '', fecha_inicio: '', fecha_fin: '', estado: 'Borrador' }
const emptyL = { periodo: '', empleado: '', salario_base: '', dias_trabajados: 30, auxilio_transporte: 0, horas_extra: 0, bonificaciones: 0, retencion_fuente: 0, otras_deducciones: 0, notas: '' }

const ESTADO_COLOR = { Borrador: '#6b7280', Aprobada: '#10b981', Pagada: '#3b82f6' }
const ESTADO_BG    = { Borrador: 'rgba(107,114,128,.15)', Aprobada: 'rgba(16,185,129,.15)', Pagada: 'rgba(59,130,246,.15)' }

const Badge = ({ estado }) => (
  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ESTADO_BG[estado] || ESTADO_BG.Borrador, color: ESTADO_COLOR[estado] || ESTADO_COLOR.Borrador }}>
    {estado}
  </span>
)

export default function Nomina() {
  const [periodos, setPeriodos] = useState([])
  const [lineas, setLineas]     = useState([])
  const [empleados, setEmpleados] = useState([])
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('periodos')
  const [modalP, setModalP]     = useState(false)
  const [modalL, setModalL]     = useState(false)
  const [modalRecibo, setModalRecibo] = useState(false)
  const [formP, setFormP]       = useState(emptyP)
  const [formL, setFormL]       = useState(emptyL)
  const [editP, setEditP]       = useState(null)
  const [editL, setEditL]       = useState(null)
  const [periodoActivo, setPeriodoActivo] = useState(null)
  const [lineaSel, setLineaSel] = useState(null)
  const [loading, setLoading]   = useState(false)

  // Preview calculado en tiempo real al editar línea
  const preview = (() => {
    const base = parseFloat(formL.salario_base || 0)
    const dev  = base + parseFloat(formL.auxilio_transporte || 0) + parseFloat(formL.horas_extra || 0) + parseFloat(formL.bonificaciones || 0)
    const salud   = base * 0.04
    const pension = base * 0.04
    const ded  = salud + pension + parseFloat(formL.retencion_fuente || 0) + parseFloat(formL.otras_deducciones || 0)
    return { dev, ded, neto: dev - ded, salud, pension }
  })()

  const load = async () => {
    try {
      const [p, e] = await Promise.all([nominaAPI.periodos.list(), empleadosRRHHAPI.list({ estado: 'Activo' })])
      setPeriodos(p.data.results || p.data)
      setEmpleados(e.data.results || e.data)
    } catch { toast.error('Error cargando datos') }
  }

  const loadLineas = async (id) => {
    try { const r = await nominaAPI.lineas.list({ periodo_id: id }); setLineas(r.data.results || r.data) }
    catch { toast.error('Error cargando líneas') }
  }

  useEffect(() => { load() }, [])

  const verPeriodo = (p) => { setPeriodoActivo(p); loadLineas(p.id); setTab('lineas') }

  const saveP = async () => {
    if (!formP.nombre || !formP.fecha_inicio || !formP.fecha_fin) { toast.error('Nombre y fechas son requeridos'); return }
    setLoading(true)
    try {
      if (editP) await nominaAPI.periodos.patch(editP, formP)
      else await nominaAPI.periodos.create(formP)
      toast.success(editP ? 'Período actualizado' : 'Período creado')
      setModalP(false); load()
    } catch { toast.error('Error') } finally { setLoading(false) }
  }

  const saveL = async () => {
    if (!formL.empleado || !formL.salario_base) { toast.error('Empleado y salario son requeridos'); return }
    setLoading(true)
    try {
      if (editL) await nominaAPI.lineas.patch(editL, formL)
      else await nominaAPI.lineas.create(formL)
      toast.success(editL ? 'Línea actualizada' : 'Empleado agregado')
      setModalL(false); loadLineas(periodoActivo.id)
    } catch (e) { toast.error(e.response?.data?.non_field_errors?.[0] || 'Error al guardar') }
    finally { setLoading(false) }
  }

  // Al seleccionar empleado, precargar su salario del contrato
  const handleEmpleadoChange = (empId) => {
    const emp = empleados.find(e => String(e.id) === String(empId))
    setFormL(f => ({
      ...f,
      empleado: empId,
      salario_base: emp ? emp.salario_base : ''
    }))
  }

  const cerrar = async (id) => {
    if (!confirm('¿Aprobar este período? Se calcularán los totales.')) return
    try {
      await nominaAPI.cerrar(id)
      toast.success('Período aprobado')
      load()
      if (periodoActivo?.id === id) loadLineas(id)
    } catch (e) { toast.error(e.response?.data?.error || 'Error') }
  }

  const delLinea = async (id) => {
    if (!confirm('¿Eliminar esta línea?')) return
    try { await nominaAPI.lineas.delete(id); toast.success('Eliminado'); loadLineas(periodoActivo.id) }
    catch { toast.error('No se puede eliminar') }
  }

  const exportarPDF = async () => {
    if (!periodoActivo) return
    try {
      toast.loading('Generando PDF...', { id: 'pdf' })
      const r = await reportesAPI.exportarNomina(periodoActivo.id)
      const url = window.URL.createObjectURL(new Blob([r.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `nomina_${periodoActivo.nombre}.pdf`)
      document.body.appendChild(link)
      link.click()
      toast.success('PDF generado', { id: 'pdf' })
    } catch { toast.error('Error al generar PDF', { id: 'pdf' }) }
  }

  const filtP = periodos.filter(p => `${p.nombre} ${p.estado}`.toLowerCase().includes(search.toLowerCase()))
  const totalDevengado = lineas.reduce((s, l) => s + parseFloat(l.total_devengado || 0), 0)
  const totalDeducciones = lineas.reduce((s, l) => s + parseFloat(l.total_deducciones || 0), 0)
  const totalNeto = lineas.reduce((s, l) => s + parseFloat(l.neto_pagar || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div><h2>👔 Nómina</h2><p>Gestión de períodos y liquidación de empleados</p></div>
        {tab === 'periodos'
          ? <button className="btn btn-primary" onClick={() => { setFormP(emptyP); setEditP(null); setModalP(true) }}>+ Nuevo Período</button>
          : <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { setTab('periodos'); setPeriodoActivo(null) }}>← Volver</button>
            <button className="btn btn-ghost" onClick={exportarPDF}>📄 Exportar PDF</button>
            {periodoActivo?.estado === 'Borrador' && <>
              <button className="btn btn-ghost" onClick={() => cerrar(periodoActivo.id)}>✅ Aprobar Período</button>
              <button className="btn btn-primary" onClick={() => { setFormL({ ...emptyL, periodo: periodoActivo.id }); setEditL(null); setModalL(true) }}>+ Agregar Empleado</button>
            </>}
          </div>
        }
      </div>

      {tab === 'periodos' ? (
        <>
          <div className="stats-grid">
            <StatCard icon="📅" label="Total Períodos" value={periodos.length} iconBg="rgba(99,102,241,.1)" />
            <StatCard icon="📝" label="Borradores" value={periodos.filter(p => p.estado === 'Borrador').length} color="var(--text2)" iconBg="rgba(100,116,139,.1)" />
            <StatCard icon="✅" label="Aprobados" value={periodos.filter(p => p.estado === 'Aprobada').length} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
            <StatCard icon="💸" label="Neto Último Período" value={fmt(periodos[0]?.total_neto || 0)} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
          </div>

          <div className="table-wrapper">
            <div className="table-toolbar"><div className="search-box"><span>🔍</span><input placeholder="Buscar período..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <table>
              <thead><tr><th>Período</th><th>Inicio</th><th>Fin</th><th>Empleados</th><th>Total Dev.</th><th>Deducciones</th><th>Neto</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtP.length === 0
                  ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">👔</div><p>No hay períodos de nómina</p></div></td></tr>
                  : filtP.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong></td>
                      <td>{fmtDate(p.fecha_inicio)}</td>
                      <td>{fmtDate(p.fecha_fin)}</td>
                      <td style={{ textAlign: 'center' }}>{p.lineas?.length || 0}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(p.total_devengado)}</td>
                      <td style={{ color: 'var(--danger)' }}>{fmt(p.total_deducciones)}</td>
                      <td><strong style={{ color: 'var(--accent)', fontSize: 15 }}>{fmt(p.total_neto)}</strong></td>
                      <td><Badge estado={p.estado} /></td>
                      <td><div className="actions">
                        <button className="btn-icon" onClick={() => verPeriodo(p)} title="Ver empleados">👥</button>
                        {p.estado === 'Borrador' && <>
                          <button className="btn-icon" onClick={() => { setFormP({ nombre: p.nombre, fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin, estado: p.estado }); setEditP(p.id); setModalP(true) }}>✏️</button>
                          <button className="btn-icon" onClick={() => cerrar(p.id)} title="Aprobar">✅</button>
                        </>}
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Cabecera del período activo */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{periodoActivo?.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{fmtDate(periodoActivo?.fecha_inicio)} — {fmtDate(periodoActivo?.fecha_fin)}</div>
                <div style={{ marginTop: 4 }}><Badge estado={periodoActivo?.estado} /></div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 28, textAlign: 'center' }}>
                {[['Devengado', totalDevengado, 'var(--success)'], ['Deducciones', totalDeducciones, 'var(--danger)'], ['Neto Total', totalNeto, 'var(--accent)']].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Empleado</th><th>Días</th><th>Salario Base</th>
                <th>+ Devengados</th><th>Total Dev.</th>
                <th>Salud+Pens.</th><th>Otras Ded.</th><th>Neto a Pagar</th>
                <th>Acciones</th>
              </tr></thead>
              <tbody>
                {lineas.length === 0
                  ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">👤</div><p>Agrega empleados con el botón de arriba</p></div></td></tr>
                  : lineas.map(l => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.empleado_nombre}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.empleado_cargo}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{l.dias_trabajados}</td>
                      <td>{fmt(l.salario_base)}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(parseFloat(l.horas_extra || 0) + parseFloat(l.bonificaciones || 0) + parseFloat(l.auxilio_transporte || 0))}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(l.total_devengado)}</td>
                      <td style={{ color: 'var(--warning)' }}>{fmt(parseFloat(l.salud || 0) + parseFloat(l.pension || 0))}</td>
                      <td style={{ color: 'var(--danger)' }}>{fmt(parseFloat(l.retencion_fuente || 0) + parseFloat(l.otras_deducciones || 0))}</td>
                      <td><strong style={{ color: 'var(--accent)', fontSize: 14 }}>{fmt(l.neto_pagar)}</strong></td>
                      <td><div className="actions">
                        <button className="btn-icon" title="Ver Comprobante" onClick={() => { setLineaSel(l); setModalRecibo(true) }}>🧾</button>
                        {periodoActivo?.estado === 'Borrador' && <>
                          <button className="btn-icon" onClick={() => {
                            setFormL({
                              periodo: l.periodo, empleado: l.empleado, salario_base: l.salario_base,
                              dias_trabajados: l.dias_trabajados, auxilio_transporte: l.auxilio_transporte || 0,
                              horas_extra: l.horas_extra || 0, bonificaciones: l.bonificaciones || 0,
                              retencion_fuente: l.retencion_fuente || 0, otras_deducciones: l.otras_deducciones || 0, notas: l.notas || ''
                            }); setEditL(l.id); setModalL(true)
                          }}>✏️</button>
                          <button className="btn-icon" onClick={() => delLinea(l.id)}>🗑️</button>
                        </>}
                      </div></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Modal Período ── */}
      <Modal open={modalP} onClose={() => setModalP(false)} title={editP ? 'Editar Período' : 'Nuevo Período de Nómina'}
        footer={<><button className="btn btn-ghost" onClick={() => setModalP(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveP} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="form-group"><label>Nombre del Período</label><input className="form-control" value={formP.nombre} onChange={e => setFormP({ ...formP, nombre: e.target.value })} placeholder="Ej: Nómina Mayo 2026" /></div>
        <div className="form-row">
          <div className="form-group"><label>Fecha Inicio</label><input className="form-control" type="date" value={formP.fecha_inicio} onChange={e => setFormP({ ...formP, fecha_inicio: e.target.value })} /></div>
          <div className="form-group"><label>Fecha Fin</label><input className="form-control" type="date" value={formP.fecha_fin} onChange={e => setFormP({ ...formP, fecha_fin: e.target.value })} /></div>
        </div>
      </Modal>

      {/* ── Modal Agregar Empleado a Nómina ── */}
      <Modal open={modalL} onClose={() => setModalL(false)} title={editL ? 'Editar Empleado en Nómina' : 'Agregar Empleado a Nómina'} width="680px"
        footer={<><button className="btn btn-ghost" onClick={() => setModalL(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveL} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Empleado</label>
            <select className="form-control" value={formL.empleado} onChange={e => handleEmpleadoChange(e.target.value)}>
              <option value="">Seleccionar empleado...</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} — {e.cargo}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Días Trabajados</label>
            <input className="form-control" type="number" min="1" max="31" value={formL.dias_trabajados} onChange={e => setFormL({ ...formL, dias_trabajados: +e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Salario Base</label><input className="form-control" type="number" value={formL.salario_base} onChange={e => setFormL({ ...formL, salario_base: e.target.value })} placeholder="Precargado del contrato" /></div>
          <div className="form-group"><label>Auxilio Transporte</label><input className="form-control" type="number" value={formL.auxilio_transporte} onChange={e => setFormL({ ...formL, auxilio_transporte: +e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Horas Extra</label><input className="form-control" type="number" value={formL.horas_extra} onChange={e => setFormL({ ...formL, horas_extra: +e.target.value })} /></div>
          <div className="form-group"><label>Bonificaciones</label><input className="form-control" type="number" value={formL.bonificaciones} onChange={e => setFormL({ ...formL, bonificaciones: +e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Retención en la Fuente</label><input className="form-control" type="number" value={formL.retencion_fuente} onChange={e => setFormL({ ...formL, retencion_fuente: +e.target.value })} /></div>
          <div className="form-group"><label>Otras Deducciones</label><input className="form-control" type="number" value={formL.otras_deducciones} onChange={e => setFormL({ ...formL, otras_deducciones: +e.target.value })} /></div>
        </div>

        {/* Preview en tiempo real */}
        {formL.salario_base > 0 && (
          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>📊 Vista Previa</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
              {[['Total Dev.', preview.dev, 'var(--success)'], ['Salud', preview.salud, 'var(--warning)'], ['Pensión', preview.pension, 'var(--warning)'], ['Neto', preview.neto, 'var(--accent)']].map(([l, v, c]) => (
                <div key={l} style={{ padding: '8px', background: 'var(--bg)', borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{fmt(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 8 }}><div className="alert alert-info" style={{ fontSize: 12 }}>💡 Salud (4%) y Pensión (4%) se calculan automáticamente sobre el salario base.</div></div>
        <div className="form-group"><label>Notas</label><input className="form-control" value={formL.notas} onChange={e => setFormL({ ...formL, notas: e.target.value })} placeholder="Observaciones opcionales" /></div>
      </Modal>

      {/* ── Modal Comprobante de Nómina ── */}
      <Modal open={modalRecibo} onClose={() => setModalRecibo(false)} title="🧾 Comprobante de Nómina" width="560px"
        footer={<><button className="btn btn-ghost" onClick={() => setModalRecibo(false)}>Cerrar</button><button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir</button></>}>
        {lineaSel && (
          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>COMPROBANTE DE NÓMINA</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{periodoActivo?.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtDate(periodoActivo?.fecha_inicio)} — {fmtDate(periodoActivo?.fecha_fin)}</div>
            </div>
            <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '10px 0', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{lineaSel.empleado_nombre}</div>
              <div style={{ color: 'var(--text2)', fontSize: 12 }}>{lineaSel.empleado_cargo} | CC: {lineaSel.empleado_doc}</div>
              {lineaSel.empleado_banco && <div style={{ color: 'var(--text3)', fontSize: 11 }}>🏦 {lineaSel.empleado_banco} — {lineaSel.empleado_tipo_cta}: {lineaSel.empleado_cuenta}</div>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', marginBottom: 6 }}>DEVENGADOS</div>
              {[
                ['Salario Base', lineaSel.salario_base],
                ['Auxilio de Transporte', lineaSel.auxilio_transporte],
                ['Horas Extra', lineaSel.horas_extra],
                ['Bonificaciones', lineaSel.bonificaciones],
              ].map(([k, v]) => parseFloat(v) > 0 && (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>{k}</span><span style={{ color: 'var(--success)' }}>{fmt(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                <span>TOTAL DEVENGADO</span><span style={{ color: 'var(--success)' }}>{fmt(lineaSel.total_devengado)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 6 }}>DEDUCCIONES</div>
              {[
                ['Salud (4%)', lineaSel.salud],
                ['Pensión (4%)', lineaSel.pension],
                ['Retención en la Fuente', lineaSel.retencion_fuente],
                ['Otras Deducciones', lineaSel.otras_deducciones],
              ].map(([k, v]) => parseFloat(v) > 0 && (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>{k}</span><span style={{ color: 'var(--danger)' }}>- {fmt(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                <span>TOTAL DEDUCCIONES</span><span style={{ color: 'var(--danger)' }}>- {fmt(lineaSel.total_deducciones)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.25)', fontWeight: 800, fontSize: 16 }}>
              <span>NETO A PAGAR</span>
              <span style={{ color: 'var(--indigo)' }}>{fmt(lineaSel.neto_pagar)}</span>
            </div>

            {lineaSel.notas && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Notas: {lineaSel.notas}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
