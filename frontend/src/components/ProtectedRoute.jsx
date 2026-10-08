import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from './Loading.jsx'

function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading message="Checking access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRole && user?.role !== allowedRole) {
    const redirectPath = user?.role === 'hiring_manager' ? '/recruiter/dashboard' : '/employee/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute
