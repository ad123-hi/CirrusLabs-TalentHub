import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getRoleLabel } from '../utils/branding.js'

function Navbar({ subtitle }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('talenthub-theme') === 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('talenthub-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="dashboard-navbar">
      <h1 className="navbar-title">{subtitle}</h1>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Toggle dark mode" onClick={() => setDark((v) => !v)}>
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>
        <div className="navbar-user">
          <div className="avatar-badge">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{getRoleLabel(user?.role)}</span>
          </div>
        </div>
        <button className="icon-button" type="button" aria-label="Sign out" onClick={async () => { await logout(); navigate('/login') }}>
          <Icon name="logout" />
        </button>
      </div>
    </header>
  )
}

export default Navbar
