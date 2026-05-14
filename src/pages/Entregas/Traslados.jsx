import { useState, useEffect } from 'react'
import { entregasAPI, bodegasAPI } from '../../api/endpoints'
import { estadoBadge, fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function Traslados() {
  const [data, setData] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [search, setSearch] = useState('')
  
  // Para recibir
  const [modalRecibir, setModalRecibir] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const [res, bRes] = await Promise.all([
        entregasAPI.list(),
        bodegasAPI.list()
      ])
      const d = res.data.results || res.data
      setData(d.filter(e => e.tipo_entrega === 'Traslado'))
      setBodegas(bRes.data.results || bRes.data)
    } catch { toast.error('Error cargando traslados') }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(e => `${e.bodega_origen_nombre} ${e.bodega_destino_nombre}`.toLowerCase().includes(search.toLowerCase()))

  const openRecibir = (e) => {
    setSelected(e)
    setModalRecibir(true)
  }

  const recibir = async () => {
    setLoading(true)
    try {
      await entregasAPI.recibirTraslado(selected.id)
      toast.success('Traslado recibido exitosamente')
      setModalRecibir(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al recibir traslado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="search-box"><span>🔍</span><input placeholder="Buscar por bodegas..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      </div>
      <table>
        <thead><tr><th>Ref</th><th>Origen ➡️ Destino</th><th>Estado</th><th>F. Creación</th><th>Acciones</th></tr></thead>
        <tbody>
          {filtered.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><p>No hay traslados registrados</p></div></td></tr>
          : filtered.map(e => (
            <tr key={e.id}>
              <td><span className="tag">ENT-{String(e.id).padStart(4,'0')}</span></td>
              <td><strong>{e.bodega_origen_nombre}</strong> ➡️ <strong>{e.bodega_destino_nombre}</strong></td>
              <td>{estadoBadge(e.estado)}</td>
              <td>{fmtDate(e.creado_en)}</td>
              <td>
                {e.estado !== 'Entregada' && (
                  <button className="btn btn-sm btn-primary" onClick={()=>openRecibir(e)}>⬇️ Recibir en Destino</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <Modal open={modalRecibir} onClose={()=>setModalRecibir(false)} title="Confirmar Recepción de Traslado"
          footer={<><button className="btn btn-ghost" onClick={()=>setModalRecibir(false)}>Cancelar</button><button className="btn btn-primary" onClick={recibir} disabled={loading}>{loading?'Procesando...':'Confirmar Recepción'}</button></>}>
          <div className="alert alert-info" style={{marginBottom: 15, padding: 15, background: 'rgba(59,130,246,.1)', borderRadius: 8}}>
            Al confirmar, el inventario se sumará a la bodega <strong>{selected.bodega_destino_nombre}</strong>.
          </div>
          <p>¿Estás seguro que deseas ingresar la mercancía de la remisión <strong>ENT-{String(selected.id).padStart(4,'0')}</strong> a la bodega?</p>
        </Modal>
      )}
    </div>
  )
}
