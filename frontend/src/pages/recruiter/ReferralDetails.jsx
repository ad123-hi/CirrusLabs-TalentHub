import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Loading from '../../components/Loading.jsx'
import {
  approveReferralBonus,
  getRecruiterReferralById,
  markReferralBonusPaid,
  rejectReferralBonus,
  updateReferralJoining,
  updateReferralStatus,
} from '../../services/api.js'

const STATUS_OPTIONS = ['Referred', 'Application Submitted', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Joined', 'Rejected', 'Withdrawn']

function RecruiterReferralDetails() {
  const { id } = useParams()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [joiningDate, setJoiningDate] = useState('')
  const [bonusAmount, setBonusAmount] = useState('')

  const loadReferral = async () => {
    setLoading(true)
    try {
      const data = await getRecruiterReferralById(id)
      setReferral(data)
      setJoiningDate(data.joining_date || '')
      setBonusAmount(data.bonus_amount || '')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReferral()
  }, [id])

  const run = async (action, successMessage) => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await action()
      setReferral(updated)
      setMessage(successMessage)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading message="Loading referral review..." />
  }

  if (!referral) {
    return <div className="content-card empty-state">{error || 'Referral not found.'}</div>
  }

  return (
    <section className="page-stack">
      <article className="content-card form-layout">
        <div className="page-intro">
          <div>
            <p className="section-kicker">Referral Details</p>
            <h2>{referral.referred_employee_name}</h2>
            <p className="detail-subtitle">{referral.job_title} · referred by {referral.referrer_name}</p>
          </div>
          <span className="status-chip">{referral.bonus_status}</span>
        </div>

        <div className="detail-grid">
          <div><span className="helper-text">Employee email</span><strong>{referral.referred_employee_email}</strong></div>
          <div><span className="helper-text">Referral status</span><strong>{referral.referral_status}</strong></div>
          <div><span className="helper-text">Joining date</span><strong>{referral.joining_date || 'Not marked yet'}</strong></div>
          <div><span className="helper-text">3-month eligibility</span><strong>{referral.eligibility_date || 'Pending joining date'}</strong></div>
          <div><span className="helper-text">Bonus amount</span><strong>{referral.bonus_amount || 'Not set'}</strong></div>
          <div><span className="helper-text">Approved by</span><strong>{referral.bonus_approved_by || 'Pending review'}</strong></div>
        </div>

        <div className="input-group">
          <label htmlFor="referralStatus">Referral status</label>
          <select
            id="referralStatus"
            value={referral.referral_status}
            onChange={(event) => run(() => updateReferralStatus(referral.id, event.target.value), 'Referral status updated.')}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="joiningDate">Joining date</label>
            <input id="joiningDate" type="date" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} />
          </div>
          <div className="input-group">
            <label htmlFor="bonusAmount">Bonus amount</label>
            <input id="bonusAmount" value={bonusAmount} onChange={(event) => setBonusAmount(event.target.value)} placeholder="₹25,000" />
          </div>
        </div>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="card-actions">
          <button className="secondary-button" type="button" disabled={saving || !joiningDate} onClick={() => run(() => updateReferralJoining(referral.id, joiningDate), 'Joining date recorded and 3-month clock started.')}>
            Mark as Joined
          </button>
          <button className="primary-button" type="button" disabled={saving} onClick={() => run(() => approveReferralBonus(referral.id, bonusAmount), 'Referral bonus approved.')}>
            Approve Bonus
          </button>
          <button className="secondary-button" type="button" disabled={saving} onClick={() => run(() => rejectReferralBonus(referral.id, bonusAmount), 'Referral bonus rejected.')}>
            Reject Bonus
          </button>
          <button className="ghost-button" type="button" disabled={saving} onClick={() => run(() => markReferralBonusPaid(referral.id), 'Bonus marked as paid.')}>
            Mark Paid
          </button>
        </div>
      </article>
    </section>
  )
}

export default RecruiterReferralDetails
