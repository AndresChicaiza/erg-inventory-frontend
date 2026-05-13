import React, { useState, useEffect } from 'react';
import { produccionAPI, productosAPI } from '../../api/endpoints';

export default function Recetas() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [materias, setMaterias] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedReceta, setSelectedReceta] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resRecetas, resProd] = await Promise.all([
        produccionAPI.recetas.list(),
        productosAPI.list({ limit: 1000 })
      ]);
      setRecetas(resRecetas.data.results || resRecetas.data);
      
      const allProds = resProd.data.results || resProd.data;
      setProductos(allProds.filter(p => p.tipo_inventario === 'TERMINADO'));
      setMaterias(allProds.filter(p => p.tipo_inventario === 'MATERIA_PRIMA'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de creación de receta y agregar ingredientes...
  // Por simplicidad en este paso, se deja la estructura principal.
  
  return (
    <div className="page-container">
      <div className="page-header" style={{
        background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🧪</span> Recetas y Fórmulas (BOM)
        </h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          Diseña las fórmulas exactas para tus asadores y estufas. Controla el costo estimado de producción.
        </p>
      </div>

      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Lista de Recetas */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Listado de Recetas</h2>
            <button className="btn btn-primary" onClick={() => setSelectedReceta('NEW')}>+ Nueva Receta</button>
          </div>
          
          {loading ? <p>Cargando...</p> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto Terminado</th>
                    <th>Costo Estimado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recetas.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.producto_terminado_nombre}</strong></td>
                      <td style={{ color: 'var(--success)' }}>${Number(r.costo_estimado).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => setSelectedReceta(r)}>Ver Detalles</button>
                      </td>
                    </tr>
                  ))}
                  {recetas.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No hay recetas creadas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detalle de Receta */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface1)' }}>
          {selectedReceta === 'NEW' ? (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Crear Nueva Receta</h2>
              {/* Formulario simplificado */}
              <p>Selecciona el producto terminado al que le vas a asignar una receta.</p>
              {/* Aquí iría el form */}
              <button className="btn btn-outline" onClick={() => setSelectedReceta(null)}>Cancelar</button>
            </div>
          ) : selectedReceta ? (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--primary)' }}>
                Fórmula de: {selectedReceta.producto_terminado_nombre}
              </h2>
              <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Costo Total Estimado</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
                  ${Number(selectedReceta.costo_estimado).toLocaleString()}
                </div>
              </div>
              
              <h3>Ingredientes:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedReceta.ingredientes?.map(ing => (
                  <li key={ing.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', 
                    padding: '12px', borderBottom: '1px solid var(--border)',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>{ing.producto_materia_nombre}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Costo base: ${Number(ing.precio_costo).toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                      {Number(ing.cantidad_esperada)} {ing.producto_materia_unidad}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🧪</span>
              <p>Selecciona una receta para ver sus ingredientes o crea una nueva.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
