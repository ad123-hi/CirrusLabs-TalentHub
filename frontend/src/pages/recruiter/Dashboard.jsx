import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecruiterJobs, getRecruiterReferrals } from '../../services/api.js'

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [referrals, setReferrals] = useState([])

  useEffect(() => {
    getRecruiterJobs().then(setJobs).catch(() => {})
    getRecruiterReferrals().then(setReferrals).catch(() => {})
  }, [])
  const open = jobs.filter((j) => j.status === 'Open')
  const applicants = jobs.reduce((n, j) => n + (j.applicants_count || 0), 0)
  const eligibleReferrals = referrals.filter((item) => item.bonus_status === 'Eligible')
  return (
    <section className="page-stack">
      <div className="hero-banner recruiter-banner">
        <div>
          <p className="section-kicker">Hiring Dashboard</p>
          <h2>Manage internal hiring before looking outside the company</h2>
          <p>
            Raise hiring requests, review internal applications, and approve referral bonuses from one shared platform.
          </p>
        </div>
        <Link className="primary-button text-button" to="/recruiter/jobs/create">
          New Hiring Request
        </Link>
      </div>

      <div className="metrics-grid">
        <article className="metric-card"><strong>{open.length}</strong><span>Open positions</span></article>
        <article className="metric-card"><strong>{applicants}</strong><span>Applications</span></article>
        <article className="metric-card"><strong>{referrals.length}</strong><span>Referrals</span></article>
        <article className="metric-card"><strong>{eligibleReferrals.length}</strong><span>Bonus pending</span></article>
      </div>

      <article className="content-card panel-card">
        <div className="page-intro"><h3>Positions by applications</h3><Link className="ghost-button text-button" to="/recruiter/jobs">Manage</Link></div>
        <div className="table-body">
          {jobs.length === 0 && <p className="helper-text">No hiring requests yet.</p>}
          {[...jobs].sort((x, y) => y.applicants_count - x.applicants_count).slice(0, 5).map((job) => (
            <Link className="table-row" key={job.id} to={`/recruiter/jobs/${job.id}/applicants`}>
              <div className="row-main"><div><h3>{job.title}</h3><p>{job.location} · {job.status}</p></div></div>
              <span className="status-chip">{job.applicants_count} applied</span>
            </Link>
          ))}
        </div>
      </article>

      <article className="content-card panel-card">
        <div className="page-intro"><h3>Referral actions required</h3><Link className="ghost-button text-button" to="/recruiter/referrals">All referrals</Link></div>
        <div className="table-body">
          {eligibleReferrals.length === 0 && <p className="helper-text">No referrals are awaiting bonus approval right now.</p>}
          {eligibleReferrals.slice(0, 3).map((referral) => (
            <Link className="table-row" key={referral.id} to={`/recruiter/referrals/${referral.id}`}>
              <div className="row-main"><div><h3>{referral.referred_employee_name}</h3><p>{referral.job_title} · referred by {referral.referrer_name}</p></div></div>
              <span className="status-chip">{referral.bonus_status}</span>
            </Link>
          ))}
        </div>
      </article>
    </section>
  )
}

export default RecruiterDashboard
