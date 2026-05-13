import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { facturasAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
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
            padding: '2px 10px', borderRadius: 20, fontSize: 11,
            fontWeight: 600, background: s.bg, color: s.color
        }}>
            {estado}
        </span>
    )
}

export default function Facturas() {
    const [data, setData] = useState([])
    const [resumen, setResumen] = useState(null)
    const [search, setSearch] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const load = async () => {
        try {
            const params = {}
            if (filtroEstado) params.estado = filtroEstado
            const r = await facturasAPI.list(params)
            setData(r.data.results || r.data)
        } catch { toast.error('Error cargando facturas') }

        try {
            const r = await facturasAPI.resumen()
            setResumen(r.data)
        } catch { }
    }

    useEffect(() => { load() }, [filtroEstado])

    const filtered = data.filter(f =>
        `${f.numero_completo} ${f.cliente_razon_social} ${f.cliente_documento} ${f.estado}`
            .toLowerCase().includes(search.toLowerCase())
    )

    const descargarPDF = async (id, numero) => {
        try {
            const r = await facturasAPI.pdf(id)
            const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
            const a = document.createElement('a')
            a.href = url
            a.download = `${numero}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch { toast.error('Error generando PDF') }
    }

    const anular = async (id) => {
        const motivo = prompt('Motivo de anulación:')
        if (!motivo) return
        try {
            await facturasAPI.anular(id, motivo)
            toast.success('Factura anulada')
            load()
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al anular')
        }
    }

    const pagar = async (id) => {
        if (!confirm('¿Marcar esta factura como pagada?')) return
        try {
            await facturasAPI.pagar(id)
            toast.success('Factura marcada como pagada')
            load()
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error al marcar como pagada')
        }
    }

    return (
        <div>
            <div className="page-header">
                <div><h2>🧾 Facturas</h2><p>Facturación electrónica — Suministros Dacar S.A.S.</p></div>
                <button className="btn btn-primary" onClick={() => navigate('/facturas/nueva')}>
                    + Nueva Factura
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <StatCard icon="💰" label="Emitido este mes"
                    value={fmt(resumen?.total_emitido_mes || 0)} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
                <StatCard icon="⏳" label="Por cobrar"
                    value={fmt(resumen?.total_pendiente || 0)} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
                <StatCard icon="🔴" label="Vencido"
                    value={fmt(resumen?.total_vencido || 0)} color="var(--danger)" iconBg="rgba(239,68,68,.1)" />
                <StatCard icon="📄" label="Borradores"
                    value={resumen?.por_estado?.Borrador || 0} iconBg="rgba(99,102,241,.1)" />
                <StatCard icon="✅" label="Emitidas"
                    value={resumen?.por_estado?.Emitida || 0} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
                <StatCard icon="💚" label="Pagadas"
                    value={resumen?.por_estado?.Pagada || 0} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
            </div>

            {/* Tabla */}
            <div className="table-wrapper">
                <div className="table-toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-box">
                        <span>🔍</span>
                        <input placeholder="Buscar por número, cliente, NIT..."
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
                            <th>Número</th><th>Fecha</th><th>Cliente</th>
                            <th>Subtotal</th><th>IVA</th><th>Retenciones</th>
                            <th>Total a Pagar</th><th>Condición</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0
                            ? <tr><td colSpan={10}><div className="empty-state">
                                <div className="empty-icon">🧾</div>
                                <p>No hay facturas</p>
                                <button className="btn btn-primary" onClick={() => navigate('/facturas/nueva')}>
                                    Crear primera factura
                                </button>
                            </div></td></tr>
                            : filtered.map(f => (
                                <tr key={f.id}>
                                    <td><span className="tag">{f.numero_completo}</span></td>
                                    <td>{fmtDate(f.fecha_emision)}</td>
                                    <td>
                                        <strong>{f.cliente_razon_social}</strong>
                                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.cliente_documento}</div>
                                    </td>
                                    <td>{fmt(f.subtotal)}</td>
                                    <td>{fmt(f.valor_iva_total)}</td>
                                    <td style={{ color: 'var(--danger)' }}>
                                        {parseFloat(f.total_retenciones) > 0 ? `- ${fmt(f.total_retenciones)}` : '—'}
                                    </td>
                                    <td><strong style={{ color: 'var(--success)' }}>{fmt(f.total_a_pagar)}</strong></td>
                                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{f.condicion_pago?.replace('_dias', ' días')}</td>
                                    <td><Badge estado={f.estado} /></td>
                                    <td>
                                        <div className="actions">
                                            <button className="btn-icon" title="Ver / Editar"
                                                onClick={() => navigate(`/facturas/${f.id}`)}>👁️</button>
                                            <button className="btn-icon" title="Descargar PDF"
                                                onClick={() => descargarPDF(f.id, f.numero_completo)}>📄</button>
                                            {(f.estado === 'Emitida' || f.estado === 'Vencida') && (
                                                <button className="btn-icon" title="Marcar como Pagada"
                                                    onClick={() => pagar(f.id)}>💰</button>
                                            )}
                                            {f.estado !== 'Anulada' && f.estado !== 'Pagada' && (
                                                <button className="btn-icon" title="Anular"
                                                    onClick={() => anular(f.id)}>🚫</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}