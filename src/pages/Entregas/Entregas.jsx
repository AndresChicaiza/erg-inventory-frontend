import { useState, useEffect } from 'react'
import { entregasAPI } from '../../api/endpoints'
import StatCard from '../../components/StatCard'
import toast from 'react-hot-toast'

import Pendientes from './Pendientes'
import Despachos from './Despachos'
import Traslados from './Traslados'

export default function Entregas() {
  const [data, setData] = useState([])
  const [activeTab, setActiveTab] = useState('pendientes')

  const loadData = async () => {
    try {
      const res = await entregasAPI.list()
      setData(res.data.results || res.data)
    } catch { toast.error('Error cargando estadísticas') }
  }
  useEffect(() => { loadData() }, [])

  // Stats
  const pendientes = data.filter(e => e.estado === 'Pendiente' && e.tipo_entrega === 'Venta').length
  const enTransito = data.filter(e => e.estado === 'En Tránsito').length
  const entregadas = data.filter(e => e.estado === 'Entregada').length
  const traslados  = data.filter(e => e.tipo_entrega === 'Traslado' && e.estado !== 'Entregada').length

  return (
    <div>
      <div className="page-header">
        <div><h2>🚚 Logística y Entregas</h2><p>Gestión de despachos y traslados</p></div>
      </div>
      
      <div className="stats-grid">
        <StatCard icon="📦" label="Pendientes de Despacho" value={pendientes} iconBg="rgba(99,102,241,.1)" />
        <StatCard icon="🚚" label="En Tránsito (Vehículos/Transp.)" value={enTransito} color="var(--accent)" iconBg="rgba(59,130,246,.1)" />
        <StatCard icon="✅" label="Entregadas Exitosas" value={entregadas} color="var(--success)" iconBg="rgba(16,185,129,.1)" />
        <StatCard icon="🔄" label="Traslados en Curso" value={traslados} color="var(--warning)" iconBg="rgba(245,158,11,.1)" />
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeTab === 'pendientes' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('pendientes')}
        >
          ⏱️ Pendientes de Empaque
        </button>
        <button 
          className={`btn ${activeTab === 'despachos' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('despachos')}
        >
          🚚 Despachos Realizados
        </button>
        <button 
          className={`btn ${activeTab === 'traslados' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('traslados')}
        >
          🔄 Remisiones de Traslado
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'pendientes' && <Pendientes loadData={loadData} />}
        {activeTab === 'despachos' && <Despachos />}
        {activeTab === 'traslados' && <Traslados />}
      </div>
    </div>
  )
}

