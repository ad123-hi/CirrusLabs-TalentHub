import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { getApplicants, updateApplicationStatus } from '../../services/api.js'

function Applicants() {
  const { id } = useParams()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadApplicants = () => {
    getApplicants(id)
      .then(setApplications)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadApplicants()
  }, [id])

  const handleStatusChange = async (applicationId, status) => {
    setMessage('')
    setError('')

    try {
      await updateApplicationStatus(applicationId, status)
      setMessage('Internal application status updated.')
      loadApplicants()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  if (loading) {
    return <Loading message="Loading internal matches..." />
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">Talent Review</p>
          <h2>Internal applications for position {id}</h2>
        </div>
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="content-card table-card">
        <div className="table-head">
          <div>
            <p className="section-kicker">Application pipeline</p>
            <h3>Employees connected to this position</h3>
          </div>
          <span className="status-chip">{applications.length} people</span>
        </div>
        <div className="table-body">
        {applications.length === 0 && <div className="content-card empty-state">No internal applications yet.</div>}
        {applications.map((applicant) => (
          <article className="table-row" key={applicant.application_id}>
            <div className="row-main">
              <div>
                <h3>{applicant.name}</h3>
                <p>{applicant.email}</p>
                <p>{applicant.phone || 'Phone not added'}</p>
              </div>
              <div className="tag-list">
                {(applicant.skills || []).map((skill) => (
                  <span className="tag" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="row-actions">
              <span className="status-badge">{applicant.status}</span>
              <select
                className="status-select"
                defaultValue={applicant.status}
                onChange={(event) => handleStatusChange(applicant.application_id, event.target.value)}
              >
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}

export default Applicants
