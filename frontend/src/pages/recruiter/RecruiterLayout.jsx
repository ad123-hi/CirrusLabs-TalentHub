import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Sidebar from '../../components/Sidebar.jsx'

const navItems = [
  { label: 'Dashboard', to: '/recruiter/dashboard', icon: 'home' },
  { label: 'New hiring request', to: '/recruiter/jobs/create', icon: 'plus' },
  { label: 'Positions', to: '/recruiter/jobs', icon: 'briefcase' },
  { label: 'Referrals', to: '/recruiter/referrals', icon: 'list' },
  { label: 'My profile', to: '/recruiter/profile', icon: 'user' },
]

function RecruiterLayout() {
  return (
    <div className="dashboard-shell">
      <Sidebar heading="CirrusLabs Hiring Workspace" items={navItems} />

      <div className="dashboard-main">
        <Navbar subtitle="Review internal applicants, manage referrals, and approve eligible bonuses" />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default RecruiterLayout
