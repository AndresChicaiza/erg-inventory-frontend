import React from 'react'

export default function Pagination({ count, next, previous, currentPage, onPageChange }) {
  const pageSize = 20
  const totalPages = Math.ceil(count / pageSize) || 1

  if (count === 0) return null

  return (
    <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
        Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, count)} de {count} registros
      </div>
      
      <div className="pagination-btns" style={{ display: 'flex', gap: 6 }}>
        <button 
          className="btn btn-ghost btn-sm" 
          disabled={!previous}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &laquo; Anterior
        </button>
        
        <span style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>
          Página {currentPage} de {totalPages}
        </span>
        
        <button 
          className="btn btn-ghost btn-sm" 
          disabled={!next}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente &raquo;
        </button>
      </div>
    </div>
  )
}
