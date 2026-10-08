import { useEffect, useState } from 'react'
import Loading from '../../components/Loading.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getCandidateProfile, updateCandidateProfile } from '../../services/api.js'

function CandidateProfile() {
  const { syncUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: '',
    resume: '',
    email: '',
    role: 'employee',
  })

  useEffect(() => {
    getCandidateProfile()
      .then((profile) => {
        setFormData({
          name: profile.name,
          phone: profile.phone || '',
          skills: (profile.skills || []).join(', '),
          resume: profile.resume || '',
          email: profile.email,
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
      const profile = await updateCandidateProfile({
        name: formData.name,
        phone: formData.phone,
        skills: formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        resume: formData.resume,
      })
      syncUser({
        id: profile.user_id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      })
      setMessage('Employee profile updated successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading message="Loading profile..." />
  }

  return (
    <section className="page-stack">
      <div className="panel-grid">
        <aside className="content-card profile-summary">
          <div className="profile-summary-card">
            <div className="profile-avatar">{formData.name?.slice(0, 1)?.toUpperCase() || 'T'}</div>
            <div>
              <p className="section-kicker">Skill Profile</p>
              <h3>{formData.name}</h3>
              <p className="helper-text">{formData.email}</p>
            </div>
          </div>
          <div className="profile-grid">
            <div>
              <span className="helper-text">Phone</span>
              <strong>{formData.phone || 'Not added'}</strong>
            </div>
            <div>
              <span className="helper-text">Role</span>
              <strong>Employee</strong>
            </div>
            <div>
              <span className="helper-text">Skills</span>
              <strong>{formData.skills || 'Not added'}</strong>
            </div>
            <div>
              <span className="helper-text">Projects / resume link</span>
              <strong>{formData.resume || 'Not added'}</strong>
            </div>
          </div>
        </aside>

        <form className="content-card form-layout" onSubmit={handleSubmit}>
          <div className="page-intro">
            <div>
              <p className="section-kicker">Employee Profile</p>
              <h2>Maintain your internal talent profile</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" value={formData.email} disabled readOnly />
            </div>
            <div className="input-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="role">Role</label>
              <input id="role" name="role" value="Employee" disabled readOnly />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="skills">Technical skills</label>
            <input
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, JavaScript, CSS"
            />
          </div>

          <div className="input-group">
            <label htmlFor="resume">Projects / resume link</label>
            <input
              id="resume"
              name="resume"
              value={formData.resume}
              onChange={handleChange}
              placeholder="Paste project links, certifications, or a resume reference"
            />
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

export default CandidateProfile
