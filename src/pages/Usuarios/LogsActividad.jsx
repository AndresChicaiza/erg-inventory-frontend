import { useState, useEffect } from 'react'
import { coreAPI } from '../../api/endpoints'
import { fmtDate } from '../helpers.jsx'
import toast from 'react-hot-toast'

const ACTION_MAP = {
  CREATE: { label: 'CREACIÓN', color: 'var(--success)', bg: 'rgba(16,185,129,.15)' },
  UPDATE: { label: 'MODIFICACIÓN', color: 'var(--indigo)', bg: 'rgba(99,102,241,.15)' },
  DELETE: { label: 'ELIMINACIÓN', color: 'var(--danger)', bg: 'rgba(239,68,68,.15)' },
  LOGIN:  { label: 'ACCESO', color: 'var(--accent)', bg: 'rgba(59,130,246,.15)' },
  EXPORT: { label: 'EXPORTACIÓN', color: 'var(--purple)', bg: 'rgba(139,92,246,.15)' },
}

export default function LogsActividad() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await coreAPI.logs()
      setLogs(r.data.results || r.data)
    } catch { toast.error('Error cargando logs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-header">
        <div><h2>📜 Logs de Actividad</h2><p>Historial de auditoría y acciones de usuarios</p></div>
        <button className="btn btn-ghost" onClick={load}>🔄 Actualizar</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Módulo / Modelo</th>
              <th>Descripción</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Cargando logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No hay registros de actividad</td></tr>
            ) : (
              logs.map(log => {
                const s = ACTION_MAP[log.accion] || { label: log.accion, color: 'var(--text3)', bg: 'var(--bg3)' }
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(log.fecha, true)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.usuario_nombre}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>ID: {log.usuario}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: s.bg, color: s.color, letterSpacing: '.05em'
                      }}>
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{log.modulo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{log.modelo} {log.objeto_id && `(ID: ${log.objeto_id})`}</div>
                    </td>
                    <td style={{ maxWidth: 300, fontSize: 12 }}>{log.descripcion}</td>
                    <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{log.ip_address || '---'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
