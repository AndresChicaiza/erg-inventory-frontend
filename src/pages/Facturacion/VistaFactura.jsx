import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { facturasAPI } from '../../api/endpoints'
import { fmt, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const ESTADO_STYLE = {
    Borrador: { bg: 'rgba(107,114,128,.15)', color: '#6b7280' },
    Emitida: { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
    Pagada: { bg: 'rgba(16,185,129,.15)', color: '#10b981' },
    Vencida: { bg: 'rgba(239,68,68,.15)', color: '#ef4444' },
    Anulada: { bg: 'rgba(107,114,128,.15)', color: '#6b7280' },
}

const Badge = ({ estado }) => {
    const s = ESTADO_STYLE[estado] || ESTADO_STYLE.Borrador
    return (
        <span style={{
            padding: '4px 14px', borderRadius: 20, fontSize: 12,
            fontWeight: 700, background: s.bg, color: s.color
        }}>
            {estado}
        </span>
    )
}

const FilaTotal = ({ label, valor, bold, color, separador }) => (
    <>
        {separador && <tr><td colSpan={2} style={{ borderTop: '1px solid var(--border)', padding: '2px 0' }} /></tr>}
        <tr>
            <td style={{
                padding: '4px 12px', fontSize: 13, color: color || 'var(--text2)',
                fontWeight: bold ? 700 : 400, textAlign: 'right'
            }}>{label}</td>
            <td style={{
                padding: '4px 12px', fontSize: 13, color: color || 'var(--text1)',
                fontWeight: bold ? 700 : 400, textAlign: 'right'
            }}>{valor}</td>
        </tr>
    </>
)

export default function VistaFactura() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [factura, setFactura] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        facturasAPI.get(id)
            .then(r => setFactura(r.data))
            .catch(() => { toast.error('Factura no encontrada'); navigate('/facturas') })
    }, [id])

    const descargarPDF = async () => {
        setLoading(true)
        try {
            const r = await facturasAPI.pdf(id)
            const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
            const a = document.createElement('a')
            a.href = url
            a.download = `${factura.numero_completo}.pdf`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('PDF descargado')
        } catch { toast.error('Error generando PDF') }
        finally { setLoading(false) }
    }

    const emitir = async () => {
        if (!confirm('¿Emitir esta factura? Una vez emitida no podrá editarse.')) return
        setLoading(true)
        try {
            const r = await facturasAPI.emitir(id)
            setFactura(r.data)
            toast.success('✅ Factura emitida')
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al emitir')
        } finally { setLoading(false) }
    }

    const anular = async () => {
        const motivo = prompt('Motivo de anulación:')
        if (!motivo) return
        setLoading(true)
        try {
            await facturasAPI.anular(id, motivo)
            const r = await facturasAPI.get(id)
            setFactura(r.data)
            toast.success('Factura anulada')
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al anular')
        } finally { setLoading(false) }
    }

    if (!factura) return (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            Cargando factura...
        </div>
    )

    const c = factura  // alias
    const regimen_labels = {
        'RESPONSABLE_IVA': 'Responsable de IVA',
        'NO_RESPONSABLE': 'No Responsable de IVA',
        'REGIMEN_SIMPLE': 'Régimen Simple',
        'GRAN_CONTRIBUYENTE': 'Gran Contribuyente',
        'ESPECIAL': 'Entidad sin ánimo de lucro',
        'PERSONA_NATURAL': 'Persona Natural',
    }
    const dv = c.cliente_dv ? `-${c.cliente_dv}` : ''

    return (
        <div>
            {/* Toolbar */}
            <div className="page-header">
                <div>
                    <h2>🧾 {c.numero_completo}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <Badge estado={c.estado} />
                        <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                            Emitida: {fmtDate(c.fecha_emision)}
                        </span>
                        {c.fecha_vencimiento && (
                            <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                                Vence: {fmtDate(c.fecha_vencimiento)}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/facturas')}>
                        ← Volver
                    </button>
                    {c.estado === 'Borrador' && (
                        <button className="btn btn-ghost"
                            onClick={() => navigate(`/facturas/${id}/editar`)}>
                            ✏️ Editar
                        </button>
                    )}
                    {c.estado === 'Borrador' && (
                        <button className="btn btn-primary" onClick={emitir} disabled={loading}>
                            📤 Emitir
                        </button>
                    )}
                    <button className="btn btn-ghost" onClick={descargarPDF} disabled={loading}>
                        {loading ? '...' : '📄 PDF'}
                    </button>
                    {c.estado !== 'Anulada' && c.estado !== 'Borrador' && (
                        <button className="btn btn-ghost" onClick={anular} disabled={loading}
                            style={{ color: 'var(--danger)' }}>
                            🚫 Anular
                        </button>
                    )}
                </div>
            </div>

            {/* Vista previa de factura */}
            <div style={{
                background: 'white', color: '#1a1a1a', borderRadius: 12,
                padding: 32, maxWidth: 900, margin: '0 auto',
                boxShadow: '0 4px 24px rgba(0,0,0,.15)',
                fontFamily: 'Arial, sans-serif',
            }}>

                {/* Encabezado */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: 24, paddingBottom: 16, borderBottom: '3px solid #8B1A1A'
                }}>

                    {/* Datos empresa */}
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#8B1A1A', marginBottom: 4 }}>
                            VOLCANO ASADORES
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>SUMINISTROS DACAR S.A.S.</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>NIT: 901.334.172-0</div>
                        <div style={{ fontSize: 11, color: '#666' }}>CR 17 G # 25 – 78, Cali, Valle del Cauca</div>
                        <div style={{ fontSize: 11, color: '#666' }}>Tel: 316 691 4910 | suministrosdacar@gmail.com</div>
                        <div style={{ fontSize: 11, color: '#666' }}>Responsable de IVA</div>
                    </div>

                    {/* Número de factura */}
                    <div style={{
                        textAlign: 'right', background: '#f9f9f9', padding: '16px 20px',
                        borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 200
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#8B1A1A', textTransform: 'uppercase' }}>
                            Factura de Venta
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '4px 0' }}>
                            {c.numero_completo}
                        </div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                            Fecha: {fmtDate(c.fecha_emision)}
                        </div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                            Vence: {c.fecha_vencimiento ? fmtDate(c.fecha_vencimiento) : '—'}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Badge estado={c.estado} />
                        </div>
                    </div>
                </div>

                {/* Datos del cliente */}
                <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        color: '#8B1A1A', marginBottom: 8, letterSpacing: '0.5px'
                    }}>
                        Cliente
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{c.cliente_razon_social}</div>
                            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                                {c.cliente_tipo_doc}: {c.cliente_documento}{dv}
                            </div>
                            <div style={{ fontSize: 11, color: '#666' }}>
                                {regimen_labels[c.cliente_regimen] || c.cliente_regimen}
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                            {c.cliente_direccion && <div>{c.cliente_direccion}</div>}
                            {c.cliente_ciudad && <div>{c.cliente_ciudad}</div>}
                            {c.cliente_telefono && <div>Tel: {c.cliente_telefono}</div>}
                            {c.cliente_email && <div>{c.cliente_email}</div>}
                        </div>
                    </div>
                </div>

                {/* Condiciones */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 12, color: '#444' }}>
                    <span>💳 <strong>Pago:</strong> {c.condicion_pago?.replace('_dias', ' días')}</span>
                    <span>💵 <strong>Medio:</strong> {c.medio_pago}</span>
                </div>

                {/* Tabla de ítems */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: '#2D2D2D', color: 'white' }}>
                            {['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Desc.', 'IVA', 'Subtotal', 'Total'].map(h => (
                                <th key={h} style={{
                                    padding: '8px 10px', textAlign:
                                        ['Cant.', 'Precio Unit.', 'Desc.', 'IVA', 'Subtotal', 'Total'].includes(h) ? 'right' : 'left',
                                    fontSize: 11, fontWeight: 600
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {c.detalles?.map((d, i) => (
                            <tr key={d.id} style={{
                                background: i % 2 === 0 ? 'white' : '#f9f9f9',
                                borderBottom: '1px solid #eee',
                            }}>
                                <td style={{ padding: '8px 10px', color: '#666' }}>{i + 1}</td>
                                <td style={{ padding: '8px 10px' }}>
                                    <span style={{ fontWeight: 500 }}>{d.descripcion}</span>
                                    {d.es_obsequio && (
                                        <span style={{ marginLeft: 8, fontSize: 10, color: '#8B1A1A', fontWeight: 700 }}>
                                            (OBSEQUIO)
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{Number(d.cantidad).toLocaleString('es-CO')}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(d.precio_unitario)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#666' }}>
                                    {d.es_obsequio ? '100%' : `${d.descuento_pct}%`}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#666' }}>
                                    {d.iva_tipo === 'EXCLUIDO' ? 'EXC' : `${d.iva_tipo}%`}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(d.subtotal_linea)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(d.total_linea)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totales */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <table style={{ minWidth: 320, fontSize: 13 }}>
                        <tbody>
                            <FilaTotal label="Subtotal:" valor={fmt(c.subtotal)} />
                            {parseFloat(c.descuento_total) > 0 && (
                                <FilaTotal label="(-) Descuentos:"
                                    valor={`- ${fmt(c.descuento_total)}`} color="#666" />
                            )}
                            {parseFloat(c.base_iva_19) > 0 && (
                                <FilaTotal label="Base IVA 19%:" valor={fmt(c.base_iva_19)} color="#666" />
                            )}
                            {parseFloat(c.valor_iva_19) > 0 && (
                                <FilaTotal label="IVA 19%:" valor={fmt(c.valor_iva_19)} />
                            )}
                            {parseFloat(c.base_iva_5) > 0 && (
                                <FilaTotal label="Base IVA 5%:" valor={fmt(c.base_iva_5)} color="#666" />
                            )}
                            {parseFloat(c.valor_iva_5) > 0 && (
                                <FilaTotal label="IVA 5%:" valor={fmt(c.valor_iva_5)} />
                            )}
                            <FilaTotal label="Total Bruto:"
                                valor={fmt(parseFloat(c.subtotal) + parseFloat(c.valor_iva_total))}
                                bold separador />
                            {parseFloat(c.valor_retefuente) > 0 && (
                                <FilaTotal label={`(-) Retefuente ${c.retefuente_pct}%:`}
                                    valor={`- ${fmt(c.valor_retefuente)}`} color="#8B1A1A" />
                            )}
                            {parseFloat(c.valor_reteiva) > 0 && (
                                <FilaTotal label={`(-) ReteIVA ${c.reteiva_pct}%:`}
                                    valor={`- ${fmt(c.valor_reteiva)}`} color="#8B1A1A" />
                            )}
                            {parseFloat(c.valor_reteica) > 0 && (
                                <FilaTotal label={`(-) ReteICA ${c.reteica_pct}‰:`}
                                    valor={`- ${fmt(c.valor_reteica)}`} color="#8B1A1A" />
                            )}
                            <tr>
                                <td colSpan={2} style={{ borderTop: '2px solid #8B1A1A', padding: '2px 0' }} />
                            </tr>
                            <tr style={{ background: '#fff5f5' }}>
                                <td style={{
                                    padding: '10px 12px', fontSize: 15, fontWeight: 800,
                                    color: '#8B1A1A', textAlign: 'right'
                                }}>TOTAL A PAGAR:</td>
                                <td style={{
                                    padding: '10px 12px', fontSize: 15, fontWeight: 800,
                                    color: '#8B1A1A', textAlign: 'right'
                                }}>{fmt(c.total_a_pagar)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Notas */}
                {c.notas && (
                    <div style={{
                        marginTop: 20, padding: '12px 16px', background: '#f9f9f9',
                        borderRadius: 8, fontSize: 12, color: '#444'
                    }}>
                        <strong>Notas:</strong> {c.notas}
                    </div>
                )}

                {/* Pie */}
                <div style={{
                    marginTop: 24, paddingTop: 16, borderTop: '1px solid #e0e0e0',
                    textAlign: 'center', fontSize: 10, color: '#999'
                }}>
                    {c.cufe
                        ? `CUFE: ${c.cufe}`
                        : 'CUFE: Pendiente — Factura no enviada a la DIAN'
                    }
                    <br />
                    Generado por ERG Inventory · SUMINISTROS DACAR S.A.S. · NIT 901.334.172-0
                </div>
            </div>
        </div>
    )
}