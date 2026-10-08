import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { getRecruiterReferrals } from '../../services/api.js'

function Referrals() {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecruiterReferrals()
      .then(setReferrals)
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => ({
    total: referrals.length,
    eligible: referrals.filter((item) => item.bonus_status === 'Eligible').length,
    approved: referrals.filter((item) => item.bonus_status === 'Approved').length,
    pendingReview: referrals.filter((item) => ['Referred', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Joined'].includes(item.referral_status)).length,
  }), [referrals])

  if (loading) {
    return <Loading message="Loading referrals..." />
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">Referrals</p>
          <h2>Review referred employees, status changes, and bonus approvals</h2>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card"><strong>{stats.total}</strong><span>Total referrals</span></article>
        <article className="metric-card"><strong>{stats.pendingReview}</strong><span>Active pipeline</span></article>
        <article className="metric-card"><strong>{stats.eligible}</strong><span>Bonus eligible</span></article>
        <article className="metric-card"><strong>{stats.approved}</strong><span>Approved bonus</span></article>
      </div>

      <div className="content-card table-card">
        <div className="table-head">
          <div>
            <h3>Referral pipeline</h3>
          </div>
          <span className="status-chip">{referrals.length} records</span>
        </div>
        <div className="table-body">
          {referrals.length === 0 && <div className="content-card empty-state">No referrals submitted yet.</div>}
          {referrals.map((referral) => (
            <Link className="table-row" key={referral.id} to={`/recruiter/referrals/${referral.id}`}>
              <div className="row-main">
                <div>
                  <h3>{referral.referred_employee_name}</h3>
                  <p>{referral.job_title}</p>
                </div>
                <div className="row-meta">
                  <span>Referred by {referral.referrer_name}</span>
                  <span>Bonus: {referral.bonus_status}</span>
                </div>
              </div>
              <span className="status-chip">{referral.referral_status}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Referrals
