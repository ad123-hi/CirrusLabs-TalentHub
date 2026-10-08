import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { SSO_LOGIN_URL, getSSOConfig } from '../../services/api.js'
import { APP_NAME, APP_SHORT_NAME, COMPANY_DOMAIN } from '../../utils/branding.js'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginSSO } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [sso, setSso] = useState({ enabled: false, dev_mode: false })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getSSOConfig().then(setSso).catch(() => {})
  }, [])

  const completeLogin = (user) => {
    const fallback = user.role === 'hiring_manager' ? '/recruiter/dashboard' : '/employee/dashboard'
    navigate(location.state?.from?.pathname || fallback, { replace: true })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setError('')
  }

  const run = async (action) => {
    setSubmitting(true)
    setError('')
    try {
      completeLogin(await action())
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero-panel">
          <div className="auth-brand">
            <div className="brand-mark">{APP_SHORT_NAME}</div>
            <p className="brand-title">{APP_NAME}</p>
          </div>

          <div className="auth-copy">
            <h1>Discover opportunities within CirrusLabs.</h1>
            <p>Build your career, refer great talent, and move internally through one CirrusLabs platform.</p>
          </div>

          <ul className="auth-proof">
            <li><strong>Internal mobility</strong><span>Explore open roles across delivery teams before hiring moves outside.</span></li>
            <li><strong>Employee referrals</strong><span>Refer colleagues, track recruiter review, and follow bonus eligibility.</span></li>
            <li><strong>Hiring visibility</strong><span>Managers review referrals and applications inside one secured workspace.</span></li>
          </ul>
        </section>

        <section className="auth-card">
          <div className="auth-copy">
            <h1>Welcome</h1>
            <p>Sign in with your CirrusLabs account.</p>
          </div>

          {sso.enabled && (
            <a className="primary-button wide-button sso-button" href={SSO_LOGIN_URL}>
              Continue with CirrusLabs SSO
            </a>
          )}

          <p className="helper-text auth-note">
            Only CirrusLabs employee accounts with the `@{COMPANY_DOMAIN}` domain are supported.
          </p>

          {!sso.enabled && <p className="helper-text">SSO is not configured on this server yet. Ask your admin to set the OIDC variables.</p>}

          {sso.dev_mode && (
            <>
              <div className="auth-divider"><span>development access</span></div>
              <form className="auth-form" onSubmit={(event) => { event.preventDefault(); run(() => login(formData)) }}>
                <div className="input-group">
                  <label htmlFor="email">Work email</label>
                  <input id="email" name="email" type="email" autoComplete="username" placeholder={`you@${COMPANY_DOMAIN}`} value={formData.email} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" autoComplete="current-password" value={formData.password} onChange={handleChange} />
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button className="secondary-button wide-button" type="submit" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Dev sign in with password'}
                </button>
              </form>

              <button className="ghost-button" type="button" disabled={submitting} onClick={() => run(() => loginSSO({ email: formData.email }))}>
                Dev-only: sign in with email
              </button>
            </>
          )}

          {!sso.dev_mode && error && <p className="form-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  )
}

export default Login
