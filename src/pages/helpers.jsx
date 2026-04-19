export const fmt = n => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n || 0)
export const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO') : '—'

export const estadoBadge = (e) => {
  const map = {
    Activo:'badge-green', Inactivo:'badge-gray',
    Pendiente:'badge-yellow', Pagada:'badge-green', Cancelada:'badge-red',
    Recibida:'badge-green', Entregada:'badge-green',
    'En Tránsito':'badge-blue', Fallida:'badge-red',
  }
  return <span className={`badge ${map[e] || 'badge-gray'}`}>{e}</span>
}

export const rolBadge = (r) => {
  const map = { Administrador:'badge-blue', Vendedor:'badge-green', Almacenista:'badge-yellow', Contador:'badge-purple', Empleado:'badge-gray' }
  return <span className={`badge ${map[r] || 'badge-gray'}`}>{r}</span>
}

export const stockBadge = (s, min) => {
  if (s === 0) return <span className="badge badge-red">Sin Stock</span>
  if (s <= min) return <span className="badge badge-yellow">⚠ Bajo ({s})</span>
  return <span className="badge badge-green">{s}</span>
}
