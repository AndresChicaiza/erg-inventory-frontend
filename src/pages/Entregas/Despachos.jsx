import { useState, useEffect } from 'react'
import { entregasAPI } from '../../api/endpoints'
import { estadoBadge, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

export default function Despachos() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      // Cargamos los que ya no están pendientes (En Tránsito, Entregada, Fallida) pero son de tipo Venta
      const res = await entregasAPI.list()
      const d = res.data.results || res.data
      setData(d.filter(e => e.tipo_entrega === 'Venta' && e.estado !== 'Pendiente'))
    } catch { toast.error('Error cargando despachos') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(e => `${e.cliente_nombre} ${e.transportadora_nombre} ${e.numero_guia}`.toLowerCase().includes(search.toLowerCase()))

  const marcarEntregada = async (id) => {
    if (!confirm('¿Marcar como Entregada?')) return
    try {
      await entregasAPI.patch(id, { estado: 'Entregada', fecha_entregada: new Date().toISOString().split('T')[0] })
      toast.success('Estado actualizado')
      load()
    } catch { toast.error('Error al actualizar') }
  }

  const marcarFallida = async (id) => {
    if (!confirm('¿Marcar como Fallida?')) return
    try {
      await entregasAPI.patch(id, { estado: 'Fallida' })
      toast.success('Estado actualizado')
      load()
    } catch { toast.error('Error al actualizar') }
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="search-box"><span>🔍</span><input placeholder="Buscar cliente, guía, transportadora..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      </div>
      <table>
        <thead><tr><th>Guía / Transp.</th><th>Cliente</th><th>Estado</th><th>F. Estimada</th><th>Acciones</th></tr></thead>
        <tbody>
          {filtered.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><p>No hay despachos registrados</p></div></td></tr>
          : filtered.map(e => (
            <tr key={e.id}>
              <td>
                {e.metodo_envio === 'Propio' ? 'Vehículo Propio' : <strong>{e.transportadora_nombre}</strong>}
                {e.numero_guia && <><br/><small>Guía: {e.numero_guia}</small></>}
              </td>
              <td><strong>{e.cliente_nombre}</strong></td>
              <td>{estadoBadge(e.estado)}</td>
              <td>{fmtDate(e.fecha_estimada)}</td>
              <td>
                {e.estado === 'En Tránsito' && (
                  <div className="actions" style={{justifyContent: 'flex-start'}}>
                    <button className="btn btn-sm" style={{backgroundColor: 'var(--success)', color: 'white'}} onClick={()=>marcarEntregada(e.id)}>✅ Entregada</button>
                    <button className="btn btn-sm" style={{backgroundColor: 'var(--danger)', color: 'white'}} onClick={()=>marcarFallida(e.id)}>❌ Fallida</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
