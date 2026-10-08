import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { getCandidateApplications } from '../../services/api.js'

function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCandidateApplications()
      .then(setApplications)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Loading message="Loading your internal interest history..." />
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">My Applications</p>
          <h2>Track every internal application and next step</h2>
        </div>
      </div>

      <div className="content-card table-card">
        <div className="table-head">
          <div>
            <p className="section-kicker">Application pipeline</p>
            <h3>Active internal opportunity responses</h3>
          </div>
          <span className="status-chip">{applications.length} records</span>
        </div>
        <div className="table-body">
          {applications.length === 0 && <div className="content-card empty-state">No internal applications submitted yet.</div>}
        {applications.map((application) => (
          <article className="table-row" key={application.id}>
            <div className="row-main">
              <div>
                <h3>{application.job_title}</h3>
                <p>{application.company}</p>
              </div>
            </div>
            <div className="row-actions">
              <span className="status-badge">{application.status}</span>
              <Link className="primary-button text-button" to={`/employee/planner/${application.job_id}`}>
                AI Talent Intelligence
              </Link>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}

export default MyApplications
