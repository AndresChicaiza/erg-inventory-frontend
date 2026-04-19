import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">📦</div>
        <div>
          <div className="navbar-title">ERG-INVENTORY</div>
          <div className="navbar-sub">Sistema de Gestión</div>
        </div>
      </div>
      <div className="navbar-user">
        <div style={{ textAlign: 'right' }}>
          <div className="navbar-name">{user?.nombre}</div>
          <div className="navbar-role">● {user?.rol}</div>
        </div>
        <div className="navbar-avatar">{user?.nombre?.[0]?.toUpperCase()}</div>
        <button className="navbar-logout" onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  )
}
