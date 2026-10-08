import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import { getReferralById } from '../../services/api.js'

function ReferralDetails() {
  const { id } = useParams()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getReferralById(id)
      .then(setReferral)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <Loading message="Loading referral details..." />
  }

  if (!referral) {
    return <div className="content-card empty-state">{error || 'Referral not found.'}</div>
  }

  return (
    <section className="page-stack">
      <article className="content-card">
        <div className="page-intro">
          <div>
            <p className="section-kicker">Referral Details</p>
            <h2>{referral.referred_employee_name}</h2>
            <p className="detail-subtitle">{referral.referred_employee_email}</p>
          </div>
          <span className="status-chip">{referral.referral_status}</span>
        </div>

        <div className="detail-grid">
          <div><span className="helper-text">Position</span><strong>{referral.job_title}</strong></div>
          <div><span className="helper-text">Location</span><strong>{referral.job_location || 'Not specified'}</strong></div>
          <div><span className="helper-text">Bonus status</span><strong>{referral.bonus_status}</strong></div>
          <div><span className="helper-text">Bonus amount</span><strong>{referral.bonus_amount || 'Pending'}</strong></div>
          <div><span className="helper-text">Joining date</span><strong>{referral.joining_date || 'Not marked yet'}</strong></div>
          <div><span className="helper-text">3-month eligibility</span><strong>{referral.eligibility_date || 'Pending joining date'}</strong></div>
        </div>

        <div className="input-group">
          <span className="helper-text">Relationship / note</span>
          <p>{referral.relationship_note || 'No note shared.'}</p>
        </div>

        <div className="input-group">
          <span className="helper-text">Resume reference</span>
          <p>{referral.resume || 'No resume link uploaded.'}</p>
        </div>
      </article>
    </section>
  )
}

export default ReferralDetails
