import { useEffect, useState } from 'react'
import Loading from '../../components/Loading.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getRecruiterProfile, updateRecruiterProfile } from '../../services/api.js'

function RecruiterProfile() {
  const { syncUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    role: 'hiring_manager',
  })

  useEffect(() => {
    getRecruiterProfile()
      .then((profile) => {
        setFormData({
          name: profile.name,
          company: profile.company || '',
          email: profile.email,
          phone: profile.phone || '',
          role: profile.role,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const profile = await updateRecruiterProfile({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
      })
      syncUser({
        id: profile.user_id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      })
      setMessage('Hiring manager profile updated successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading message="Loading hiring profile..." />
  }

  return (
    <section className="page-stack">
      <div className="panel-grid">
        <aside className="content-card profile-summary">
          <div className="profile-summary-card">
            <div className="profile-avatar">{formData.name?.slice(0, 1)?.toUpperCase() || 'M'}</div>
            <div>
              <p className="section-kicker">Manager Profile</p>
              <h3>{formData.name}</h3>
              <p className="helper-text">{formData.email}</p>
            </div>
          </div>
          <div className="profile-grid">
            <div>
              <span className="helper-text">Business unit</span>
              <strong>{formData.company || 'Not added'}</strong>
            </div>
            <div>
              <span className="helper-text">Phone</span>
              <strong>{formData.phone || 'Not added'}</strong>
            </div>
            <div>
              <span className="helper-text">Role</span>
              <strong>Hiring Manager</strong>
            </div>
          </div>
        </aside>

        <form className="content-card form-layout" onSubmit={handleSubmit}>
          <div className="page-intro">
            <div>
              <p className="section-kicker">Hiring Profile</p>
              <h2>Manage your internal hiring details</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="company">Company</label>
              <input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Engineering, Platform, Design Systems" />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" value={formData.email} disabled readOnly />
            </div>
            <div className="input-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <button className="primary-button fit-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default RecruiterProfile
