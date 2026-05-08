import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { facturasAPI, clientesAPI, productosAPI } from '../../api/endpoints'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const IVA_TIPOS = [
    { value: '19', label: 'IVA 19%' },
    { value: '5', label: 'IVA 5%' },
    { value: '0', label: 'Exento (0%)' },
    { value: 'EXCLUIDO', label: 'Excluido' },
]

const CONDICIONES = [
    { value: 'Contado', label: 'Contado' },
    { value: '15_dias', label: 'Crédito 15 días' },
    { value: '30_dias', label: 'Crédito 30 días' },
    { value: '60_dias', label: 'Crédito 60 días' },
    { value: '90_dias', label: 'Crédito 90 días' },
]

const MEDIOS_PAGO = [
    'Efectivo', 'Debito', 'Credito', 'Transferencia', 'ADDI', 'Distecredito', 'Cheque', 'Otro'
]

const CONCEPTOS_RET = [
    { value: 'COMPRAS', label: 'Compras (2.5%)' },
    { value: 'SERVICIOS', label: 'Servicios (4%)' },
    { value: 'HONORARIOS', label: 'Honorarios (11%)' },
    { value: 'ARRENDAMIENTO', label: 'Arrendamiento (3.5%)' },
    { value: 'TRANSPORTE', label: 'Transporte (1%)' },
]

const itemVacio = () => ({
    _id: Math.random(),
    producto: '',
    descripcion: '',
    cantidad: 1,
    precio_unitario: '',
    descuento_pct: 0,
    es_obsequio: false,
    iva_tipo: '19',
})

export default function NuevaFactura() {
    const navigate = useNavigate()
    const { id } = useParams()  // si hay id → editar borrador
    const esEdicion = !!id

    const [clientes, setClientes] = useState([])
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(false)
    const [calculando, setCalculando] = useState(false)

    // Datos de la factura
    const [clienteId, setClienteId] = useState('')
    const [condicion, setCondicion] = useState('Contado')
    const [medioPago, setMedioPago] = useState('Efectivo')
    const [conceptoRet, setConceptoRet] = useState('COMPRAS')
    const [notas, setNotas] = useState('')
    const [items, setItems] = useState([itemVacio()])

    // Totales calculados
    const [totales, setTotales] = useState(null)

    // Factura existente (edición)
    const [factura, setFactura] = useState(null)

    useEffect(() => {
        const loadData = async () => {
            const [cl, pr] = await Promise.all([clientesAPI.list(), productosAPI.list()])
            setClientes(cl.data.results || cl.data)
            setProductos(pr.data.results || pr.data)
        }
        loadData()

        if (esEdicion) {
            facturasAPI.get(id).then(r => {
                const f = r.data
                setFactura(f)
                setClienteId(f.cliente)
                setCondicion(f.condicion_pago)
                setMedioPago(f.medio_pago)
                setConceptoRet(f.concepto_retefuente || 'COMPRAS')
                setNotas(f.notas || '')
                if (f.detalles?.length) {
                    setItems(f.detalles.map(d => ({
                        _id: d.id,
                        producto: d.producto || '',
                        descripcion: d.descripcion,
                        cantidad: d.cantidad,
                        precio_unitario: d.precio_unitario,
                        descuento_pct: d.descuento_pct,
                        es_obsequio: d.es_obsequio,
                        iva_tipo: d.iva_tipo,
                    })))
                }
            }).catch(() => toast.error('Error cargando factura'))
        }
    }, [id])

    // Calcular impuestos en tiempo real
    const calcular = useCallback(async () => {
        if (!clienteId || !items.some(i => i.precio_unitario > 0)) {
            setTotales(null); return
        }
        setCalculando(true)
        try {
            const r = await facturasAPI.calcularImpuestos({
                cliente_id: clienteId,
                concepto_retefuente: conceptoRet,
                items: items.filter(i => i.descripcion && i.precio_unitario > 0).map(i => ({
                    cantidad: parseFloat(i.cantidad) || 0,
                    precio_unitario: parseFloat(i.precio_unitario) || 0,
                    descuento_pct: i.es_obsequio ? 100 : parseFloat(i.descuento_pct) || 0,
                    es_obsequio: i.es_obsequio,
                    iva_tipo: i.iva_tipo,
                })),
            })
            setTotales(r.data)
        } catch { setTotales(null) }
        finally { setCalculando(false) }
    }, [clienteId, conceptoRet, items])

    useEffect(() => {
        const timer = setTimeout(calcular, 600)
        return () => clearTimeout(timer)
    }, [calcular])

    // Manejo de ítems
    const addItem = () => setItems(p => [...p, itemVacio()])
    const delItem = (id) => setItems(p => p.filter(i => i._id !== id))
    const updItem = (id, key, val) => setItems(p =>
        p.map(i => {
            if (i._id !== id) return i
            const next = { ...i, [key]: val }
            // Si selecciona un producto, autocompletar descripción y precio
            if (key === 'producto' && val) {
                const prod = productos.find(p => p.id == val)
                if (prod) {
                    next.descripcion = prod.nombre
                    next.precio_unitario = prod.precio_venta
                }
            }
            // Si marca obsequio, descuento = 100
            if (key === 'es_obsequio') next.descuento_pct = val ? 100 : 0
            return next
        })
    )

    const guardar = async (emitir = false) => {
        if (!clienteId) { toast.error('Selecciona un cliente'); return }
        const itemsValidos = items.filter(i => i.descripcion && parseFloat(i.precio_unitario) > 0)
        if (!itemsValidos.length) { toast.error('Agrega al menos un ítem válido'); return }

        setLoading(true)
        try {
            let facturaId = id

            // 1. Crear o actualizar la cabecera
            const payload = {
                cliente: clienteId,
                condicion_pago: condicion,
                medio_pago: medioPago,
                concepto_retefuente: conceptoRet,
                notas,
            }

            if (esEdicion) {
                await facturasAPI.patch(id, payload)
            } else {
                const r = await facturasAPI.create(payload)
                facturaId = r.data.id
            }

            // 2. Guardar ítems (borrar los existentes y crear nuevos)
            await facturasAPI.deleteDetalles(facturaId)
            for (let ord = 0; ord < itemsValidos.length; ord++) {
                const it = itemsValidos[ord]
                await facturasAPI.createDetalle(facturaId, {
                    factura: facturaId,
                    producto: it.producto || null,
                    descripcion: it.descripcion,
                    cantidad: it.cantidad,
                    precio_unitario: it.precio_unitario,
                    descuento_pct: it.es_obsequio ? 100 : it.descuento_pct,
                    es_obsequio: it.es_obsequio,
                    iva_tipo: it.iva_tipo,
                    orden: ord,
                })
            }

            // 3. Emitir si se pidió
            if (emitir) {
                await facturasAPI.emitir(facturaId)
                toast.success('✅ Factura emitida exitosamente')
            } else {
                toast.success('Borrador guardado')
            }

            navigate(`/facturas/${facturaId}`)
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al guardar')
        } finally { setLoading(false) }
    }

    const clienteSel = clientes.find(c => c.id == clienteId)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>🧾 {esEdicion ? `Editando ${factura?.numero_completo || '...'}` : 'Nueva Factura'}</h2>
                    <p>Suministros Dacar S.A.S. — NIT 901.334.172-0</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/facturas')}>← Volver</button>
                    <button className="btn btn-ghost" onClick={() => guardar(false)} disabled={loading}>
                        💾 Guardar borrador
                    </button>
                    <button className="btn btn-primary" onClick={() => guardar(true)} disabled={loading}>
                        {loading ? 'Procesando...' : '📤 Emitir factura'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

                {/* ── Columna izquierda: formulario ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Datos generales */}
                    <div className="table-wrapper" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text1)' }}>📋 Datos de la Factura</div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Cliente *</label>
                                <select className="form-control" value={clienteId}
                                    onChange={e => setClienteId(e.target.value)}>
                                    <option value="">Seleccionar cliente...</option>
                                    {clientes.filter(c => c.estado === 'Activo').map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.razon_social} — {c.tipo_documento}: {c.numero_documento}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Condición de pago</label>
                                <select className="form-control" value={condicion}
                                    onChange={e => setCondicion(e.target.value)}>
                                    {CONDICIONES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Medio de pago</label>
                                <select className="form-control" value={medioPago}
                                    onChange={e => setMedioPago(e.target.value)}>
                                    {MEDIOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Concepto Retefuente</label>
                                <select className="form-control" value={conceptoRet}
                                    onChange={e => setConceptoRet(e.target.value)}>
                                    {CONCEPTOS_RET.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {clienteSel && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 8,
                                background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)',
                                fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 20, flexWrap: 'wrap'
                            }}>
                                <span>📍 {clienteSel.ciudad || '—'}</span>
                                <span>📋 Régimen: {clienteSel.regimen_tributario?.replace('_', ' ')}</span>
                                <span>{clienteSel.agente_retenedor ? '⚠️ Retiene' : '✅ No retiene'}</span>
                                <span>{clienteSel.gran_contribuyente ? '🏢 Gran Contribuyente' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Ítems */}
                    <div className="table-wrapper" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text1)' }}>📦 Productos / Servicios</span>
                            <button className="btn btn-ghost" onClick={addItem} style={{ fontSize: 12 }}>+ Agregar ítem</button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                                        {['Producto', 'Descripción', 'Cant.', 'Precio Unit.', 'Desc.%', 'IVA', 'Obsequio', ''].map(h => (
                                            <th key={h} style={{
                                                padding: '8px 6px', textAlign: 'left', color: 'var(--text3)',
                                                fontSize: 11, textTransform: 'uppercase', fontWeight: 600
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '6px 4px', minWidth: 140 }}>
                                                <select className="form-control" style={{ fontSize: 11 }}
                                                    value={item.producto}
                                                    onChange={e => updItem(item._id, 'producto', e.target.value)}>
                                                    <option value="">Manual</option>
                                                    {productos.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '6px 4px', minWidth: 160 }}>
                                                <input className="form-control" style={{ fontSize: 11 }}
                                                    value={item.descripcion}
                                                    onChange={e => updItem(item._id, 'descripcion', e.target.value)}
                                                    placeholder="Descripción del ítem" />
                                            </td>
                                            <td style={{ padding: '6px 4px', width: 70 }}>
                                                <input className="form-control" type="number" min="0.001" step="0.001"
                                                    style={{ fontSize: 11 }} value={item.cantidad}
                                                    onChange={e => updItem(item._id, 'cantidad', e.target.value)} />
                                            </td>
                                            <td style={{ padding: '6px 4px', width: 110 }}>
                                                <input className="form-control" type="number" min="0"
                                                    style={{ fontSize: 11 }} value={item.precio_unitario}
                                                    onChange={e => updItem(item._id, 'precio_unitario', e.target.value)}
                                                    placeholder="0" />
                                            </td>
                                            <td style={{ padding: '6px 4px', width: 70 }}>
                                                <input className="form-control" type="number" min="0" max="100"
                                                    style={{ fontSize: 11 }} value={item.descuento_pct}
                                                    disabled={item.es_obsequio}
                                                    onChange={e => updItem(item._id, 'descuento_pct', e.target.value)} />
                                            </td>
                                            <td style={{ padding: '6px 4px', width: 100 }}>
                                                <select className="form-control" style={{ fontSize: 11 }}
                                                    value={item.iva_tipo}
                                                    onChange={e => updItem(item._id, 'iva_tipo', e.target.value)}>
                                                    {IVA_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: '6px 4px', width: 70, textAlign: 'center' }}>
                                                <input type="checkbox" checked={item.es_obsequio}
                                                    onChange={e => updItem(item._id, 'es_obsequio', e.target.checked)}
                                                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                                            </td>
                                            <td style={{ padding: '6px 4px', width: 30 }}>
                                                {items.length > 1 && (
                                                    <button onClick={() => delItem(item._id)}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: 'var(--danger)', fontSize: 16
                                                        }}>×</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="table-wrapper" style={{ padding: 20 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Notas / Observaciones</label>
                            <textarea className="form-control" rows={2} value={notas}
                                onChange={e => setNotas(e.target.value)}
                                placeholder="Condiciones especiales, instrucciones de entrega..." />
                        </div>
                    </div>
                </div>

                {/* ── Columna derecha: resumen tributario ── */}
                <div style={{ position: 'sticky', top: 20 }}>
                    <div className="table-wrapper" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text1)', fontSize: 14 }}>
                            🧮 Resumen Tributario
                        </div>

                        {calculando && (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text3)', fontSize: 12 }}>
                                Calculando...
                            </div>
                        )}

                        {!calculando && totales && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    ['Subtotal', fmt(totales.subtotal)],
                                    totales.descuento_total > 0
                                        ? ['(-) Descuentos', `- ${fmt(totales.descuento_total)}`]
                                        : null,
                                    totales.base_iva_19 > 0
                                        ? ['Base IVA 19%', fmt(totales.base_iva_19)]
                                        : null,
                                    totales.valor_iva_19 > 0
                                        ? ['IVA 19%', fmt(totales.valor_iva_19)]
                                        : null,
                                    totales.base_iva_5 > 0
                                        ? ['Base IVA 5%', fmt(totales.base_iva_5)]
                                        : null,
                                    totales.valor_iva_5 > 0
                                        ? ['IVA 5%', fmt(totales.valor_iva_5)]
                                        : null,
                                    ['Total Bruto', fmt(totales.bruto_factura)],
                                ].filter(Boolean).map(([k, v]) => (
                                    <div key={k} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)'
                                    }}>
                                        <span style={{ color: 'var(--text2)' }}>{k}</span>
                                        <span>{v}</span>
                                    </div>
                                ))}

                                {/* Retenciones */}
                                {totales.total_retenciones > 0 && (
                                    <div style={{
                                        marginTop: 4, padding: '8px 10px', borderRadius: 6,
                                        background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)'
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 6, textTransform: 'uppercase' }}>
                                            Retenciones
                                        </div>
                                        {totales.valor_retefuente > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                                <span>Retefuente {totales.retefuente_pct}%</span>
                                                <span style={{ color: 'var(--danger)' }}>- {fmt(totales.valor_retefuente)}</span>
                                            </div>
                                        )}
                                        {totales.valor_reteiva > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                                <span>ReteIVA {totales.reteiva_pct}%</span>
                                                <span style={{ color: 'var(--danger)' }}>- {fmt(totales.valor_reteiva)}</span>
                                            </div>
                                        )}
                                        {totales.valor_reteica > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span>ReteICA {totales.reteica_pct}‰</span>
                                                <span style={{ color: 'var(--danger)' }}>- {fmt(totales.valor_reteica)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Total final */}
                                <div style={{
                                    marginTop: 8, padding: '12px', borderRadius: 8,
                                    background: 'rgba(16,185,129,.08)', border: '2px solid rgba(16,185,129,.3)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>TOTAL A PAGAR</span>
                                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--success)' }}>
                                        {fmt(totales.total_a_pagar)}
                                    </span>
                                </div>

                                {/* Info retenciones del cliente */}
                                {!totales.cliente_agente_retenedor && (
                                    <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 4 }}>
                                        ✅ Cliente no aplica retenciones
                                    </div>
                                )}
                            </div>
                        )}

                        {!calculando && !totales && (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 12 }}>
                                Selecciona un cliente y agrega productos para ver el cálculo
                            </div>
                        )}

                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn btn-primary" onClick={() => guardar(true)} disabled={loading}
                                style={{ width: '100%' }}>
                                {loading ? 'Procesando...' : '📤 Emitir Factura'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => guardar(false)} disabled={loading}
                                style={{ width: '100%' }}>
                                💾 Guardar como borrador
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}