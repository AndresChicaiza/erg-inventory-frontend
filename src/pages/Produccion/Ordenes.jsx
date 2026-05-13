import React, { useState, useEffect } from 'react';
import { produccionAPI } from '../../api/endpoints';

export default function OrdenesProduccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await produccionAPI.ordenes.list();
      setOrdenes(res.data.results || res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'Pendiente': return { bg: '#fef3c7', color: '#d97706' };
      case 'En_Proceso': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Completada': return { bg: '#dcfce7', color: '#16a34a' };
      case 'Cancelada': return { bg: '#fee2e2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#4b5563' };
    }
  };

  return (
    <div className="page-container">
      {/* Header Visual */}
      <div className="page-header" style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        color: 'white',
        padding: '32px 24px',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoración de fondo */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '150px' }}>🔥</div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            Órdenes de Fabricación
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9, maxWidth: '600px' }}>
            Visualiza las órdenes de producción generadas automáticamente por las ventas o creadas manualmente para abastecer el taller.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {['Pendiente', 'En_Proceso', 'Completada'].map(estado => {
          const count = ordenes.filter(o => o.estado === estado).length;
          const style = getStatusColor(estado);
          return (
            <div key={estado} className="card" style={{ 
              padding: '20px', borderRadius: '12px', background: 'var(--surface1)',
              borderLeft: `4px solid ${style.color}`
            }}>
              <div style={{ color: 'var(--text2)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {estado.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text1)', marginTop: '8px' }}>
                {count}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid de Órdenes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {loading ? <p>Cargando órdenes...</p> : ordenes.map(orden => {
          const statusStyle = getStatusColor(orden.estado);
          return (
            <div key={orden.id} className="card" style={{ 
              background: 'var(--surface1)', borderRadius: '16px', overflow: 'hidden',
              transition: 'transform 0.2s', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column'
            }}>
              {/* Card Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', color: 'var(--text1)', fontSize: '15px' }}>{orden.numero}</span>
                <span style={{ 
                  background: statusStyle.bg, color: statusStyle.color, 
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
                }}>
                  {orden.estado.replace('_', ' ')}
                </span>
              </div>
              
              {/* Card Body */}
              <div style={{ padding: '20px', flexGrow: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>
                  {orden.producto_terminado_nombre}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ background: 'var(--surface2)', padding: '10px 16px', borderRadius: '8px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase' }}>A Fabricar</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{orden.cantidad_a_fabricar} und</div>
                  </div>
                </div>
                {orden.factura_vinculada && (
                  <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--warning)' }}>⚠️</span>
                    Generado automáticamente por factura sin stock
                  </div>
                )}
              </div>
              
              {/* Card Footer / Acciones */}
              <div style={{ padding: '16px 20px', background: 'var(--surface2)', display: 'flex', gap: '10px' }}>
                {orden.estado !== 'Completada' && (
                  <button className="btn btn-primary" style={{ flex: 1, fontWeight: 'bold' }}>
                    {orden.estado === 'Pendiente' ? 'Iniciar Producción' : 'Completar y Reportar Mermas'}
                  </button>
                )}
                <button className="btn btn-outline" style={{ flex: orden.estado === 'Completada' ? 1 : 0 }}>
                  Ver Detalles
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
