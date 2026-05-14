import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { coreAPI } from '../api/endpoints'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const timer = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 2) {
      setResults([]); setOpen(false); return
    }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await coreAPI.search(query)
        setResults(r.data)
        setOpen(true)
      } catch { }
      finally { setLoading(false) }
    }, 400)

    return () => clearTimeout(timer.current)
  }, [query])

  const onSelect = (res) => {
    navigate(res.link)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', margin: '0 12px 16px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Buscar productos, clientes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          style={{
            width: '100%', padding: '10px 12px 10px 32px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg3)',
            color: 'var(--text1)', fontSize: 13, outline: 'none',
            transition: 'border-color .2s',
          }}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        />
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: 14 }}></span>
        {loading && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner-small" />
          </div>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 8, boxShadow: 'var(--shadow)', z-index: 2000,
          maxHeight: 300, overflowY: 'auto',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
              No se encontraron resultados
            </div>
          ) : (
            results.map((res, i) => (
              <div
                key={i}
                onClick={() => onSelect(res)}
                style={{
                  padding: '10px 12px', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background .2s', display: 'flex', gap: 10, alignItems: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <span style={{ fontSize: 18 }}>{res.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.type} · {res.subtitle}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
