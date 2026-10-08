import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import { APP_NAME, APP_SHORT_NAME } from '../utils/branding.js'

function Sidebar({ heading, items }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">{APP_SHORT_NAME}</div>
        <div>
          <p className="brand-title">{APP_NAME}</p>
          <p className="brand-subtitle">{heading}</p>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label={heading}>
        {items.map((item) => (
          <NavLink key={item.to + item.label} to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
