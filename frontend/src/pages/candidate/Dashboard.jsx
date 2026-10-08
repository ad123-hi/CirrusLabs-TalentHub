import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getCandidateApplications, getCandidateProfile, getJobs, getMyReferrals } from '../../services/api.js'
import { skillMatch } from '../../utils/match.js'

function CandidateDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    Promise.all([getCandidateApplications(), getJobs(), getCandidateProfile().catch(() => null), getMyReferrals().catch(() => [])])
      .then(([applications, jobs, profile, referrals]) => setData({ applications, jobs, skills: profile?.skills || [], referrals }))
      .catch(() => setData({ applications: [], jobs: [], skills: [], referrals: [] }))
  }, [])

  if (!data) return <Loading message="Loading your dashboard..." />

  const applied = new Set(data.applications.map((a) => a.job_id))
  const picks = data.jobs
    .filter((job) => !applied.has(job.id))
    .map((job) => ({ job, match: skillMatch(job.skills, data.skills) }))
    .filter(({ match }) => match)
    .sort((a, b) => b.match.pct - a.match.pct)
    .slice(0, 3)

  return (
    <section className="page-stack">
      <div className="hero-banner">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p>{data.skills.length ? `${data.jobs.length} roles are open internally right now.` : 'Add your skills to your profile to see how well each role fits you.'}</p>
        </div>
        <Link className="primary-button text-button" to={data.skills.length ? '/employee/jobs' : '/employee/profile'}>
          {data.skills.length ? 'Browse open roles' : 'Add your skills'}
        </Link>
      </div>

      <div className="metrics-grid">
        <article className="metric-card"><strong>{data.jobs.length}</strong><span>Open roles</span></article>
        <article className="metric-card"><strong>{data.applications.length}</strong><span>Applied</span></article>
        <article className="metric-card"><strong>{data.referrals.length}</strong><span>Referrals</span></article>
        <article className="metric-card"><strong>{data.referrals.filter((item) => ['Eligible', 'Approved', 'Paid'].includes(item.bonus_status)).length}</strong><span>Bonus eligible</span></article>
      </div>

      <article className="content-card panel-card">
        <div className="page-intro">
          <h3>Best matches for your skills</h3>
          <Link className="ghost-button text-button" to="/employee/jobs">All roles</Link>
        </div>
        <div className="table-body">
          {picks.length === 0 && <p className="helper-text">No new matches yet. Add or update your skills in your profile.</p>}
          {picks.map(({ job, match }) => (
            <Link className="table-row" key={job.id} to={`/employee/jobs/${job.id}`}>
              <div className="row-main"><div><h3>{job.title}</h3><p>{job.location} · {job.type}</p></div></div>
              <span className="status-chip">{match.pct}% match</span>
            </Link>
          ))}
        </div>
      </article>

      <article className="content-card panel-card">
        <div className="page-intro">
          <h3>Referral highlights</h3>
          <Link className="ghost-button text-button" to="/employee/referrals">All referrals</Link>
        </div>
        <div className="table-body">
          {data.referrals.length === 0 && <p className="helper-text">You have not referred anyone yet.</p>}
          {data.referrals.slice(0, 3).map((referral) => (
            <Link className="table-row" key={referral.id} to={`/employee/referrals/${referral.id}`}>
              <div className="row-main"><div><h3>{referral.referred_employee_name}</h3><p>{referral.job_title}</p></div></div>
              <span className="status-chip">{referral.bonus_status}</span>
            </Link>
          ))}
        </div>
      </article>
    </section>
  )
}

export default CandidateDashboard
