import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { configuracionAPI } from '../../api/endpoints'
import toast from 'react-hot-toast'

export default function Configuracion() {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [toggles, setToggles] = useState({ notificaciones: true, confirmacion: true, kardex: true, oscuro: true })
  
  useEffect(() => {
    configuracionAPI.get().then(r => setConfig(r.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!config) return
    try {
      await configuracionAPI.update(config)
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar configuración')
    }
  }

  const handleChange = (e) => setConfig(p => ({ ...p, [e.target.name]: e.target.value }))
  const toggle = (k) => setToggles(t => ({ ...t, [k]: !t[k] }))

  if (!config) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando configuración...</div>

  return (
    <div>
      <div className="page-header">
        <div><h2>⚙️ Configuración</h2><p>Ajustes del sistema y de la empresa</p></div>
      </div>

      <div className="config-section">
        <div className="config-title">Información de la Empresa</div>
        <div className="form-row">
          <div className="form-group">
            <label>Razón Social</label>
            <input className="form-control" name="razon_social" value={config.razon_social || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Nombre Comercial</label>
            <input className="form-control" name="nombre_comercial" value={config.nombre_comercial || ''} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>NIT</label>
            <input className="form-control" name="nit" value={config.nit || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Fecha de Cierre Contable</label>
            <input type="date" className="form-control" name="fecha_cierre_contable" value={config.fecha_cierre_contable || ''} onChange={handleChange} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>No se permitirán cambios antes o iguales a esta fecha.</span>
          </div>
        </div>
        {user?.rol === 'Administrador' && (
          <button className="btn btn-primary" onClick={handleSave}>Guardar Cambios</button>
        )}
      </div>

      <div className="config-section">
        <div className="config-title">Preferencias</div>
        {[
          { k: 'notificaciones', label: 'Notificaciones de Stock Bajo', desc: 'Alertar cuando el stock esté por debajo del mínimo' },
          { k: 'confirmacion', label: 'Confirmación de Eliminación', desc: 'Pedir confirmación antes de eliminar registros' },
          { k: 'kardex', label: 'Kardex Automático', desc: 'Registrar automáticamente movimientos en el Kardex' },
          { k: 'oscuro', label: 'Modo Oscuro', desc: 'Interfaz en modo oscuro' },
        ].map(({ k, label, desc }) => (
          <div className="config-row" key={k}>
            <div className="config-info"><label>{label}</label><p>{desc}</p></div>
            <div className={`toggle${toggles[k] ? ' on' : ''}`} onClick={() => toggle(k)} />
          </div>
        ))}
      </div>

      <div className="config-section">
        <div className="config-title">Información del Usuario</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
            {user?.nombre?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.nombre}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>{user?.email}</div>
            <span className="badge badge-blue" style={{ marginTop: 6 }}>{user?.rol}</span>
          </div>
        </div>
      </div>

      <div className="config-section">
        <div className="config-title">Backend</div>
        <div className="alert alert-info">
          🔗 API conectada a: <strong>https://erg-inventory-backend.onrender.com</strong>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>
          ⚠️ El plan gratuito de Render puede tardar hasta 50 segundos en responder si el servidor estuvo inactivo.
        </div>
      </div>
    </div>
  )
}
