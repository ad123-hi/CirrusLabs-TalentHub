import { Link } from 'react-router-dom'

function MatchRing({ pct }) {
  const r = 18, c = 2 * Math.PI * r
  return (
    <div className="match-ring" title={`${pct}% skill match`}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} className="ring-track" />
        <circle cx="24" cy="24" r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 24 24)" />
      </svg>
      <span>{pct}%</span>
    </div>
  )
}

function JobCard({ job, match, showApply = false, onApply, applying = false, applied = false, showRefer = false }) {
  return (
    <article className="content-card job-card">
      <div className="job-card-head">
        <div>
          <h3><Link to={`/employee/jobs/${job.id}`}>{job.title}</Link></h3>
          <p className="job-card-subtitle">{job.company} · {job.location}</p>
        </div>
        {match ? <MatchRing pct={match.pct} /> : <span className="status-badge">{job.type}</span>}
      </div>

      <div className="meta-row">
        <span>{job.type}</span>
        <span>{job.salary}</span>
        {job.experience && <span>{job.experience}</span>}
      </div>

      {job.skills?.length > 0 && (
        <div className="tag-list">
          {job.skills.map((skill) => (
            <span className={`tag${match?.hit.includes(skill) ? ' tag-hit' : ''}`} key={skill}>{skill}</span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <Link className="secondary-button text-button" to={`/employee/jobs/${job.id}`}>View details</Link>
        {showApply && (
          <button className="primary-button" type="button" onClick={() => onApply?.(job.id)} disabled={applying || applied}>
            {applied ? 'Applied' : applying ? 'Submitting…' : 'Apply Internally'}
          </button>
        )}
        {showRefer && (
          <Link className="secondary-button text-button" to={`/employee/jobs/${job.id}/refer`}>
            Refer Someone
          </Link>
        )}
      </div>
    </article>
  )
}

export default JobCard
