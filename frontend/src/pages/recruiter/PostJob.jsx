import { useState } from 'react'
import { createRecruiterJob } from '../../services/api.js'

function PostJob() {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    salary: 'Not specified',
    experience: 'Not specified',
    skills: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { id, value } = event.target
    setFormData((previous) => ({ ...previous, [id]: value }))
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        ...formData,
        skills: formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      }

      await createRecruiterJob(payload)
      setMessage('Hiring request submitted successfully.')
      setFormData({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        description: '',
        salary: 'Not specified',
        experience: 'Not specified',
        skills: '',
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">Hiring Request</p>
          <h2>Create a new internal hiring request</h2>
        </div>
      </div>

      <div className="panel-grid">
        <form className="content-card form-layout" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="title">Position title</label>
              <input id="title" type="text" placeholder="Frontend Developer" value={formData.title} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="company">Business unit or team</label>
              <input id="company" type="text" placeholder="Digital Engineering" value={formData.company} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="location">Location</label>
              <input id="location" type="text" placeholder="Remote" value={formData.location} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="type">Type</label>
              <select id="type" value={formData.type} onChange={handleChange}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="salary">Compensation band or budget</label>
              <input id="salary" type="text" placeholder="$4k - $6k / month" value={formData.salary} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="experience">Experience</label>
              <input id="experience" type="text" placeholder="2-4 years" value={formData.experience} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="skills">Skills</label>
            <input id="skills" type="text" placeholder="React, JavaScript, CSS" value={formData.skills} onChange={handleChange} />
          </div>

          <div className="input-group">
              <label htmlFor="description">Hiring request details</label>
              <textarea id="description" rows="6" placeholder="Describe the team need, expected outcomes, and the ideal internal employee profile..." value={formData.description} onChange={handleChange} />
          </div>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <button className="primary-button fit-button" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <aside className="content-card panel-card">
          <p className="section-kicker">Tips</p>
          <h3>What makes a strong internal hiring request</h3>
          <div className="table-body">
            <div className="table-row">
              <div className="row-main">
                <div>
                  <h3>Be specific about outcomes</h3>
                  <p>Describe the project, expected delivery, and what success looks like.</p>
                </div>
              </div>
            </div>
            <div className="table-row">
              <div className="row-main">
                <div>
                  <h3>List the real skills</h3>
                  <p>Use the exact stack or domain expertise you want staffing to search for.</p>
                </div>
              </div>
            </div>
            <div className="table-row">
              <div className="row-main">
                <div>
                  <h3>Include the availability context</h3>
                  <p>Budget, location, and experience filters help HR and managers review faster.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default PostJob
