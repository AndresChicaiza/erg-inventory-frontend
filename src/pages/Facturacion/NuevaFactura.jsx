import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { facturasAPI, clientesAPI, productosAPI, usuariosAPI, bodegasAPI } from '../../api/endpoints'
import { fmt } from '../helpers.jsx'
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
    producto_search: '',
    descripcion: '',
    cantidad: 1,
    precio_unitario: '',
    descuento_pct: 0,
    es_obsequio: false,
    iva_tipo: '19',
    iva_incluido: false,   // ← nuevo campo
})

export default function NuevaFactura() {
    const navigate = useNavigate()
    const { id } = useParams()
    const esEdicion = !!id

    const [clientes, setClientes] = useState([])
    const [productos, setProductos] = useState([])
    const [vendedores, setVendedores] = useState([])
    const [bodegas, setBodegas] = useState([])
    const [loading, setLoading] = useState(false)
    const [calculando, setCalculando] = useState(false)

    const [clienteId, setClienteId] = useState('')
    const [vendedorId, setVendedorId] = useState('')
    const [bodegaId, setBodegaId] = useState('')
    const [condicion, setCondicion] = useState('Contado')
    const [medioPago, setMedioPago] = useState('Efectivo')
    const [conceptoRet, setConceptoRet] = useState('COMPRAS')
    const [notas, setNotas] = useState('')
    const [items, setItems] = useState([itemVacio()])
    const [totales, setTotales] = useState(null)
    const [factura, setFactura] = useState(null)

    useEffect(() => {
        const loadData = async () => {
            const [cl, pr, us, bo] = await Promise.all([
                clientesAPI.list(), productosAPI.list(), usuariosAPI.list(), bodegasAPI.list()
            ])
            setClientes(cl.data.results || cl.data)
            setProductos(pr.data.results || pr.data)
            setVendedores(us.data.results || us.data)
            setBodegas(bo.data.results || bo.data)
        }
        loadData()

        if (esEdicion) {
            facturasAPI.get(id).then(r => {
                const f = r.data
                setFactura(f)
                setClienteId(f.cliente)
                setVendedorId(f.vendedor || '')
                setBodegaId(f.bodega || '')
                setCondicion(f.condicion_pago)
                setMedioPago(f.medio_pago)
                setConceptoRet(f.concepto_retefuente || 'COMPRAS')
                setNotas(f.notas || '')
                if (f.detalles?.length) {
                    setItems(f.detalles.map(d => ({
                        _id: d.id,
                        producto: d.producto || '',
                        producto_search: d.producto_nombre ? `${d.producto_codigo} - ${d.producto_nombre}` : '',
                        descripcion: d.descripcion,
                        cantidad: d.cantidad,
                        precio_unitario: d.precio_unitario,
                        descuento_pct: d.descuento_pct,
                        es_obsequio: d.es_obsequio,
                        iva_tipo: d.iva_tipo,
                        iva_incluido: false,
                    })))
                }
            }).catch(() => toast.error('Error cargando factura'))
        }
    }, [id])

    // ── Calcular impuestos en tiempo real ────────────────────────────────────
    const calcular = useCallback(async () => {
        if (!clienteId || !items.some(i => i.precio_unitario > 0)) {
            setTotales(null); return
        }
        setCalculando(true)
        try {
            // Si el producto tiene IVA incluido, mandamos el precio SIN IVA
            const itemsParaCalculo = items
                .filter(i => i.descripcion && parseFloat(i.precio_unitario) > 0)
                .map(i => {
                    let precio = parseFloat(i.precio_unitario) || 0
                    const iva = i.iva_tipo

                    // Si tiene IVA incluido, extraer la base sin IVA
                    if (i.iva_incluido && iva === '19') precio = precio / 1.19
                    if (i.iva_incluido && iva === '5') precio = precio / 1.05

                    return {
                        cantidad: parseFloat(i.cantidad) || 0,
                        precio_unitario: Math.round(precio * 100) / 100,
                        descuento_pct: i.es_obsequio ? 100 : parseFloat(i.descuento_pct) || 0,
                        es_obsequio: i.es_obsequio,
                        iva_tipo: i.iva_tipo,
                    }
                })

            const r = await facturasAPI.calcularImpuestos({
                cliente_id: clienteId,
                concepto_retefuente: conceptoRet,
                items: itemsParaCalculo,
            })
            setTotales(r.data)
        } catch { setTotales(null) }
        finally { setCalculando(false) }
    }, [clienteId, conceptoRet, items])

    useEffect(() => {
        const timer = setTimeout(calcular, 600)
        return () => clearTimeout(timer)
    }, [calcular])

    // ── Manejo de ítems ───────────────────────────────────────────────────────
    const addItem = () => setItems(p => [...p, itemVacio()])
    const delItem = (id) => setItems(p => p.filter(i => i._id !== id))

    const updItem = (id, key, val) => setItems(p =>
        p.map(i => {
            if (i._id !== id) return i
            const next = { ...i, [key]: val }

            // Al seleccionar producto por la búsqueda
            if (key === 'producto_search') {
                const prod = productos.find(p => `${p.codigo} - ${p.nombre}` === val)
                if (prod) {
                    next.producto = prod.id
                    next.descripcion = prod.nombre
                    next.precio_unitario = prod.precio_venta
                    next.iva_tipo = prod.iva_tipo || '19'
                    next.iva_incluido = prod.iva_incluido || false
                } else {
                    next.producto = '' // Manual
                }
            }

            if (key === 'es_obsequio') next.descuento_pct = val ? 100 : 0
            return next
        })
    )

    // ── Guardar factura ───────────────────────────────────────────────────────
    const guardar = async (emitir = false) => {
        if (!clienteId) { toast.error('Selecciona un cliente'); return }
        if (emitir && !bodegaId) { toast.error('Debes seleccionar una Bodega de salida para emitir la factura'); return }
        const itemsValidos = items.filter(i => i.descripcion && parseFloat(i.precio_unitario) > 0)
        if (!itemsValidos.length) { toast.error('Agrega al menos un ítem válido'); return }

        setLoading(true)
        try {
            let facturaId = id

            const payload = {
                cliente: clienteId,
                vendedor: vendedorId || null,
                bodega: bodegaId || null,
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

            // Guardar ítems — si tiene IVA incluido, guardar precio SIN IVA
            await facturasAPI.deleteDetalles(facturaId)
            for (let ord = 0; ord < itemsValidos.length; ord++) {
                const it = itemsValidos[ord]
                let precio = parseFloat(it.precio_unitario) || 0

                if (it.iva_incluido && it.iva_tipo === '19') precio = precio / 1.19
                if (it.iva_incluido && it.iva_tipo === '5') precio = precio / 1.05
                precio = Math.round(precio * 100) / 100

                await facturasAPI.createDetalle(facturaId, {
                    factura: facturaId,
                    producto: it.producto || null,
                    descripcion: it.descripcion,
                    cantidad: it.cantidad,
                    precio_unitario: precio,
                    descuento_pct: it.es_obsequio ? 100 : it.descuento_pct,
                    es_obsequio: it.es_obsequio,
                    iva_tipo: it.iva_tipo,
                    orden: ord,
                })
            }

            if (emitir) {
                await facturasAPI.emitir(facturaId)
                toast.success('✅ Factura emitida exitosamente')
            } else {
                toast.success('Borrador guardado')
            }

            navigate(`/facturas/${facturaId}`)
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al guardar la factura')
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

                {/* ── Columna izquierda ── */}
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
                        <div className="form-row">
                            <div className="form-group">
                                <label>Vendedor</label>
                                <select className="form-control" value={vendedorId}
                                    onChange={e => setVendedorId(e.target.value)}>
                                    <option value="">Seleccionar vendedor...</option>
                                    {vendedores.filter(v => v.rol === 'Vendedor').map(v => (
                                        <option key={v.id} value={v.id}>{v.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Bodega de salida *</label>
                                <select className="form-control" value={bodegaId}
                                    onChange={e => setBodegaId(e.target.value)}
                                    style={{ borderColor: bodegaId ? undefined : 'var(--warning)' }}>
                                    <option value="">Seleccionar bodega...</option>
                                    {bodegas.map(b => (
                                        <option key={b.id} value={b.id}>{b.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {clienteSel && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 8, fontSize: 12, color: 'var(--text2)',
                                background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)',
                                display: 'flex', gap: 20, flexWrap: 'wrap'
                            }}>
                                <span>📍 {clienteSel.ciudad || '—'}</span>
                                <span>📋 {clienteSel.regimen_tributario?.replace('_', ' ')}</span>
                                <span>{clienteSel.agente_retenedor ? '⚠️ Aplica retenciones' : '✅ Sin retenciones'}</span>
                                {clienteSel.gran_contribuyente && <span>🏢 Gran Contribuyente</span>}
                            </div>
                        )}
                    </div>

                    {/* Tabla de ítems */}
                    <div className="table-wrapper" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text1)' }}>📦 Productos / Servicios</span>
                            <button className="btn btn-ghost" onClick={addItem} style={{ fontSize: 12 }}>+ Agregar ítem</button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                                        {['Producto', 'Descripción', 'Cant.', 'Precio', 'Desc.%', 'IVA', 'IVA Inc.', 'Obsequio', ''].map(h => (
                                            <th key={h} style={{
                                                padding: '8px 6px', textAlign: 'left', color: 'var(--text3)',
                                                fontSize: 11, textTransform: 'uppercase', fontWeight: 600
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        // Precio que se muestra (con o sin IVA según configuración)
                                        const precioMostrado = item.precio_unitario
                                        const tieneIvaIncluido = item.iva_incluido

                                        return (
                                            <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '6px 4px', minWidth: 160 }}>
                                                    <input className="form-control" style={{ fontSize: 11 }}
                                                        list={`prod-list-${item._id}`}
                                                        placeholder="Buscar por código o nombre..."
                                                        value={item.producto_search}
                                                        onChange={e => updItem(item._id, 'producto_search', e.target.value)} />
                                                    <datalist id={`prod-list-${item._id}`}>
                                                        {productos.map(p => (
                                                            <option key={p.id} value={`${p.codigo} - ${p.nombre}`} />
                                                        ))}
                                                    </datalist>
                                                </td>
                                                <td style={{ padding: '6px 4px', minWidth: 140 }}>
                                                    <input className="form-control" style={{ fontSize: 11 }}
                                                        value={item.descripcion}
                                                        onChange={e => updItem(item._id, 'descripcion', e.target.value)}
                                                        placeholder="Descripción" />
                                                </td>
                                                <td style={{ padding: '6px 4px', width: 65 }}>
                                                    <input className="form-control" type="number" min="0.001" step="0.001"
                                                        style={{ fontSize: 11 }} value={item.cantidad}
                                                        onChange={e => updItem(item._id, 'cantidad', e.target.value)} />
                                                </td>
                                                <td style={{ padding: '6px 4px', width: 110 }}>
                                                    <input className="form-control" type="number" min="0"
                                                        style={{
                                                            fontSize: 11,
                                                            borderColor: tieneIvaIncluido ? 'rgba(245,158,11,.5)' : undefined
                                                        }}
                                                        value={precioMostrado}
                                                        onChange={e => updItem(item._id, 'precio_unitario', e.target.value)}
                                                        placeholder="0" />
                                                    {tieneIvaIncluido && (
                                                        <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 2 }}>
                                                            IVA incluido
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '6px 4px', width: 65 }}>
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
                                                {/* Checkbox IVA incluido */}
                                                <td style={{ padding: '6px 4px', width: 60, textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                        <input type="checkbox" checked={item.iva_incluido}
                                                            onChange={e => updItem(item._id, 'iva_incluido', e.target.checked)}
                                                            style={{ width: 16, height: 16, accentColor: 'var(--warning)' }} />
                                                        <span style={{ fontSize: 9, color: 'var(--text3)' }}>inc.</span>
                                                    </div>
                                                </td>
                                                {/* Checkbox obsequio */}
                                                <td style={{ padding: '6px 4px', width: 65, textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                        <input type="checkbox" checked={item.es_obsequio}
                                                            onChange={e => updItem(item._id, 'es_obsequio', e.target.checked)}
                                                            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                                                        <span style={{ fontSize: 9, color: 'var(--text3)' }}>regalo</span>
                                                    </div>
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
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Leyenda */}
                        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 16 }}>
                            <span>🟡 IVA inc. = el precio ya incluye el IVA, se discrimina automáticamente</span>
                            <span>🎁 Regalo = obsequio con descuento 100%</span>
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

                {/* ── Columna derecha: resumen ── */}
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
                                        ? ['(-) Descuentos', `- ${fmt(totales.descuento_total)}`] : null,
                                    totales.base_iva_19 > 0
                                        ? ['Base IVA 19%', fmt(totales.base_iva_19)] : null,
                                    totales.valor_iva_19 > 0
                                        ? ['IVA 19%', fmt(totales.valor_iva_19)] : null,
                                    totales.base_iva_5 > 0
                                        ? ['Base IVA 5%', fmt(totales.base_iva_5)] : null,
                                    totales.valor_iva_5 > 0
                                        ? ['IVA 5%', fmt(totales.valor_iva_5)] : null,
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