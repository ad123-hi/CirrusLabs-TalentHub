import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { applyToJob, getJobById } from '../../services/api.js'

function JobDetails() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getJobById(id)
      .then(setJob)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <Loading message="Loading opportunity details..." />
  }

  if (!job) {
    return <div className="content-card empty-state">Opportunity not found.</div>
  }

  const handleApply = async () => {
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      await applyToJob(id)
      setMessage('Internal application submitted successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="panel-grid">
        <article className="content-card detail-card">
          <p className="section-kicker">Opportunity brief</p>
          <h2>{job.title}</h2>
          <p className="detail-subtitle">
            {job.company} · {job.location} · {job.type}
          </p>
          <p>{job.description}</p>

          <div className="meta-row">
            <span>{job.salary}</span>
            <span>{job.experience}</span>
          </div>

          <div className="tag-list">
            {job.skills.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </article>

        <article className="content-card panel-card">
          <p className="section-kicker">Action</p>
          <h3>Respond to this request</h3>
          <p className="helper-text">
            Apply for this role yourself or refer a CirrusLabs colleague into the hiring pipeline.
          </p>
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <div className="card-actions">
            <button className="primary-button wide-button" type="button" onClick={handleApply} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Apply Internally'}
            </button>
            <Link className="secondary-button wide-button text-button" to={`/employee/jobs/${job.id}/refer`}>
              Refer Someone
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}

export default JobDetails
