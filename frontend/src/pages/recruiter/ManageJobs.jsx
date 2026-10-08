import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { deleteRecruiterJob, getRecruiterJobs, updateRecruiterJob } from '../../services/api.js'

const initialEditState = {
  title: '',
  company: '',
  location: '',
  type: '',
  salary: '',
  experience: '',
  description: '',
  skills: '',
  status: 'Open',
}

function ManageJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingJobId, setEditingJobId] = useState('')
  const [editForm, setEditForm] = useState(initialEditState)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadJobs = async () => {
    setLoading(true)
    try {
      const items = await getRecruiterJobs()
      setJobs(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const beginEdit = (job) => {
    setEditingJobId(job.id)
    setEditForm({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary,
      experience: job.experience,
      description: job.description,
      skills: (job.skills || []).join(', '),
      status: job.status,
    })
    setMessage('')
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setEditForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      await updateRecruiterJob(editingJobId, {
        ...editForm,
        skills: editForm.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      })
      setMessage('Hiring request updated successfully.')
      setEditingJobId('')
      setEditForm(initialEditState)
      await loadJobs()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleDelete = async (jobId) => {
    setMessage('')
    setError('')

    try {
      await deleteRecruiterJob(jobId)
      setMessage('Hiring request removed successfully.')
      if (editingJobId === jobId) {
        setEditingJobId('')
        setEditForm(initialEditState)
      }
      await loadJobs()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleClose = async (jobId) => {
    setMessage('')
    setError('')

    try {
      await updateRecruiterJob(jobId, { status: 'Closed' })
      setMessage('Position closed successfully.')
      await loadJobs()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  if (loading) {
    return <Loading message="Loading internal positions..." />
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">Open Positions</p>
          <h2>Track, edit, and close internal hiring positions</h2>
        </div>
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="content-card table-card">
        <div className="table-head">
          <div>
            <p className="section-kicker">Positions</p>
            <h3>Active internal opportunities</h3>
          </div>
          <span className="status-chip">{jobs.length} total</span>
        </div>
        <div className="table-body">
        {jobs.map((job) => (
          <article className="table-row" key={job.id}>
            <div className="row-main">
              <div>
                <h3>{job.title}</h3>
                <p>{job.company}</p>
              </div>
              <div className="row-meta">
                <span>{job.location}</span>
                <span>{job.type}</span>
                <span>{job.salary}</span>
                <span>{job.applicants_count} internal applications</span>
              </div>
            </div>
            <div className="row-actions">
              <span className="status-badge">{job.status}</span>
              <Link className="secondary-button text-button" to={`/recruiter/jobs/${job.id}/applicants`}>
                Review Applications
              </Link>
              <button className="secondary-button" type="button" onClick={() => beginEdit(job)}>
                Edit
              </button>
              <button className="ghost-button danger-text" type="button" onClick={() => handleClose(job.id)}>
                Close
              </button>
              <button className="ghost-button danger-text" type="button" onClick={() => handleDelete(job.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
        </div>
      </div>

      {editingJobId && (
        <form className="content-card form-layout" onSubmit={handleSave}>
          <div className="page-intro">
            <div>
              <p className="section-kicker">Edit Position</p>
              <h2>Update position details</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" value={editForm.title} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="company">Business unit</label>
              <input id="company" name="company" value={editForm.company} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" value={editForm.location} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="type">Type</label>
              <input id="type" name="type" value={editForm.type} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="salary">Compensation</label>
              <input id="salary" name="salary" value={editForm.salary} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="experience">Experience</label>
              <input id="experience" name="experience" value={editForm.experience} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={editForm.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="skills">Skills</label>
              <input id="skills" name="skills" value={editForm.skills} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="description">Position description</label>
            <textarea
              id="description"
              name="description"
              rows="6"
              value={editForm.description}
              onChange={handleChange}
            />
          </div>

          <div className="card-actions">
            <button className="secondary-button" type="button" onClick={() => setEditingJobId('')}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Save Changes
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default ManageJobs
