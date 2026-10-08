import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { createReferral, getJobById } from '../../services/api.js'

function ReferColleague() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    referred_employee_name: '',
    referred_employee_email: '',
    relationship_note: '',
    resume: '',
  })

  useEffect(() => {
    getJobById(id)
      .then(setJob)
      .finally(() => setLoading(false))
  }, [id])

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
      const referral = await createReferral(id, formData)
      setMessage('Referral submitted successfully.')
      setTimeout(() => navigate(`/employee/referrals/${referral.id}`), 500)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading message="Loading referral form..." />
  }

  if (!job) {
    return <div className="content-card empty-state">Job not found.</div>
  }

  return (
    <section className="page-stack">
      <form className="content-card form-layout" onSubmit={handleSubmit}>
        <div className="page-intro">
          <div>
            <p className="section-kicker">Refer a Colleague</p>
            <h2>Refer for {job.title}</h2>
            <p className="helper-text">Only CirrusLabs employee accounts are allowed for referrals.</p>
          </div>
          <Link className="ghost-button text-button" to={`/employee/jobs/${job.id}`}>Back to role</Link>
        </div>

        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="referred_employee_name">Name</label>
            <input id="referred_employee_name" name="referred_employee_name" value={formData.referred_employee_name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="referred_employee_email">Employee email</label>
            <input id="referred_employee_email" name="referred_employee_email" type="email" placeholder="name@cirruslabs.io" value={formData.referred_employee_email} onChange={handleChange} required />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="relationship_note">Relationship / note</label>
          <textarea id="relationship_note" name="relationship_note" rows="4" value={formData.relationship_note} onChange={handleChange} placeholder="Worked together on..." />
        </div>

        <div className="input-group">
          <label htmlFor="resume">Resume reference</label>
          <input id="resume" name="resume" value={formData.resume} onChange={handleChange} placeholder="Resume link or uploaded file name" />
        </div>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="card-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit Referral'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ReferColleague
