import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function SSOCallback() {
  const navigate = useNavigate()
  const { finishSSO } = useAuth()
  const [error, setError] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const params = new URLSearchParams(window.location.search)
    window.history.replaceState(null, '', window.location.pathname)

    if (params.get('error')) {
      setError(params.get('error') || 'SSO sign-in did not complete.')
      return
    }

    finishSSO()
      .then((user) => navigate(user.role === 'hiring_manager' ? '/recruiter/dashboard' : '/employee/dashboard', { replace: true }))
      .catch(() => setError('We could not verify your session. Please try again.'))
  }, [finishSSO, navigate])

  return (
    <div className="auth-page">
      <div className="auth-card sso-status">
        {error ? (
          <>
            <h1>Sign-in failed</h1>
            <p className="form-error">{error}</p>
            <Link className="primary-button text-button" to="/login">Back to sign in</Link>
          </>
        ) : (
          <>
            <div className="loading-spinner" />
            <p>Signing you in…</p>
          </>
        )}
      </div>
    </div>
  )
}

export default SSOCallback
