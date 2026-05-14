import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { reportesAPI } from '../api/endpoints'
import { useAuth } from './AuthContext'

const AlertasCtx = createContext(null)

export function AlertasProvider({ children }) {
  const { user } = useAuth()
  const [alertas, setAlertas] = useState(null)

  const fetchAlertas = useCallback(async () => {
    if (!user) return
    try {
      const r = await reportesAPI.alertas()
      setAlertas(r.data)
    } catch { /* silencioso */ }
  }, [user])

  useEffect(() => {
    fetchAlertas()
    // Actualizar cada 3 minutos
    const id = setInterval(fetchAlertas, 3 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchAlertas])

  // Badge global = suma de todas las alertas urgentes
  const totalBadge = alertas ? (
    (alertas.stock?.sin_stock || 0) +
    (alertas.stock?.stock_bajo || 0) +
    (alertas.lotes?.vencidos || 0) +
    (alertas.financiero?.cxp_vencidas || 0) +
    (alertas.financiero?.cxc_vencidas || 0) +
    (alertas.operaciones?.oc_pendientes || 0)
  ) : 0

  return (
    <AlertasCtx.Provider value={{ alertas, totalBadge, refresh: fetchAlertas }}>
      {children}
    </AlertasCtx.Provider>
  )
}

export const useAlertas = () => useContext(AlertasCtx)
