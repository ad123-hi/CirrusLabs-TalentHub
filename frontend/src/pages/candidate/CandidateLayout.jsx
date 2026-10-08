import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Sidebar from '../../components/Sidebar.jsx'

const navItems = [
  { label: 'Dashboard', to: '/employee/dashboard', icon: 'home' },
  { label: 'Opportunities', to: '/employee/jobs', icon: 'briefcase' },
  { label: 'My applications', to: '/employee/applications', icon: 'list' },
  { label: 'My referrals', to: '/employee/referrals', icon: 'list' },
  { label: 'My profile', to: '/employee/profile', icon: 'user' },
]

function CandidateLayout() {
  return (
    <div className="dashboard-shell">
      <Sidebar heading="Internal Talent & Mobility Platform" items={navItems} />

      <div className="dashboard-main">
        <Navbar subtitle="Explore internal mobility, refer colleagues, and keep your talent profile ready" />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default CandidateLayout
