import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { getMyReferrals } from '../../services/api.js'

function MyReferrals() {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyReferrals()
      .then(setReferrals)
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => ({
    total: referrals.length,
    active: referrals.filter((item) => !['Rejected', 'Withdrawn', 'Paid'].includes(item.referral_status)).length,
    joined: referrals.filter((item) => item.referral_status === 'Joined').length,
    eligible: referrals.filter((item) => ['Eligible', 'Approved', 'Paid'].includes(item.bonus_status)).length,
  }), [referrals])

  if (loading) {
    return <Loading message="Loading your referrals..." />
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">My Referrals</p>
          <h2>Track every colleague referral and bonus milestone</h2>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card"><strong>{stats.total}</strong><span>Total referrals</span></article>
        <article className="metric-card"><strong>{stats.active}</strong><span>Active</span></article>
        <article className="metric-card"><strong>{stats.joined}</strong><span>Joined</span></article>
        <article className="metric-card"><strong>{stats.eligible}</strong><span>Bonus eligible</span></article>
      </div>

      <div className="card-grid single-column">
        {referrals.map((referral) => (
          <article className="content-card referral-card" key={referral.id}>
            <div className="page-intro">
              <div>
                <h3>{referral.referred_employee_name}</h3>
                <p className="job-card-subtitle">{referral.job_title}</p>
              </div>
              <span className="status-chip">{referral.referral_status}</span>
            </div>
            <div className="meta-row">
              <span>Referred: {new Date(referral.created_at).toLocaleDateString()}</span>
              {referral.joining_date && <span>Joined: {referral.joining_date}</span>}
              {referral.eligibility_date && <span>3-month eligibility: {referral.eligibility_date}</span>}
            </div>
            <div className="referral-status-grid">
              <div><span className="helper-text">Referral status</span><strong>{referral.referral_status}</strong></div>
              <div><span className="helper-text">Bonus status</span><strong>{referral.bonus_status}</strong></div>
              <div><span className="helper-text">Bonus amount</span><strong>{referral.bonus_amount || 'Pending'}</strong></div>
            </div>
            <div className="card-actions">
              <Link className="primary-button text-button" to={`/employee/referrals/${referral.id}`}>View Details</Link>
            </div>
          </article>
        ))}
      </div>

      {referrals.length === 0 && (
        <div className="content-card empty-state">
          <p>No referrals yet. Use the Refer Someone action on a job to start one.</p>
        </div>
      )}
    </section>
  )
}

export default MyReferrals
