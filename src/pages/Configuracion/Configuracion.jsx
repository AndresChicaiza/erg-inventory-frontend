import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Configuracion() {
  const { user } = useAuth()
  const [toggles, setToggles] = useState({ notificaciones:true, confirmacion:true, kardex:true, oscuro:true })
  const toggle = (k) => setToggles(t => ({ ...t, [k]: !t[k] }))

  return (
    <div>
      <div className="page-header">
        <div><h2>⚙️ Configuración</h2><p>Ajustes del sistema</p></div>
      </div>

      <div className="config-section">
        <div className="config-title">Información del Sistema</div>
        <div className="form-row">
          <div className="form-group"><label>Nombre del Sistema</label><input className="form-control" defaultValue="ERG-Inventory" /></div>
          <div className="form-group"><label>Empresa</label><input className="form-control" defaultValue="Mi Empresa S.A.S" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>NIT / RUT</label><input className="form-control" defaultValue="900.123.456-7" /></div>
          <div className="form-group"><label>Moneda</label>
            <select className="form-control"><option>COP (Peso Colombiano)</option><option>USD (Dólar)</option><option>EUR (Euro)</option></select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={()=>toast.success('Configuración guardada')}>Guardar Cambios</button>
      </div>

      <div className="config-section">
        <div className="config-title">Preferencias</div>
        {[
          { k:'notificaciones', label:'Notificaciones de Stock Bajo', desc:'Alertar cuando el stock esté por debajo del mínimo' },
          { k:'confirmacion',   label:'Confirmación de Eliminación',   desc:'Pedir confirmación antes de eliminar registros' },
          { k:'kardex',         label:'Kardex Automático',             desc:'Registrar automáticamente movimientos en el Kardex' },
          { k:'oscuro',         label:'Modo Oscuro',                   desc:'Interfaz en modo oscuro' },
        ].map(({ k, label, desc }) => (
          <div className="config-row" key={k}>
            <div className="config-info"><label>{label}</label><p>{desc}</p></div>
            <div className={`toggle${toggles[k] ? ' on' : ''}`} onClick={()=>toggle(k)} />
          </div>
        ))}
      </div>

      <div className="config-section">
        <div className="config-title">Información del Usuario</div>
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 0' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700 }}>
            {user?.nombre?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>{user?.nombre}</div>
            <div style={{ color:'var(--text2)', fontSize:13 }}>{user?.email}</div>
            <span className="badge badge-blue" style={{ marginTop:6 }}>{user?.rol}</span>
          </div>
        </div>
      </div>

      <div className="config-section">
        <div className="config-title">Backend</div>
        <div className="alert alert-info">
          🔗 API conectada a: <strong>https://erg-inventory-backend.onrender.com</strong>
        </div>
        <div style={{ fontSize:13, color:'var(--text2)', marginTop:8 }}>
          ⚠️ El plan gratuito de Render puede tardar hasta 50 segundos en responder si el servidor estuvo inactivo.
        </div>
      </div>
    </div>
  )
}
