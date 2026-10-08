import { useEffect, useMemo, useState } from 'react'
import JobCard from '../../components/JobCard.jsx'
import Loading from '../../components/Loading.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { applyToJob, getCandidateApplications, getCandidateProfile, getJobs } from '../../services/api.js'
import { skillMatch } from '../../utils/match.js'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ searchTerm: '', location: '', sort: 'match' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [applyingJobId, setApplyingJobId] = useState('')
  const [mySkills, setMySkills] = useState([])
  const [appliedIds, setAppliedIds] = useState([])

  useEffect(() => {
    Promise.all([getJobs(), getCandidateProfile().catch(() => null), getCandidateApplications().catch(() => [])])
      .then(([jobList, profile, apps]) => {
        setJobs(jobList)
        setMySkills(profile?.skills || [])
        setAppliedIds(apps.map((a) => a.job_id))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({ ...previous, [name]: value }))
    setMessage('')
    setError('')
  }

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId)
    setMessage('')
    setError('')

    try {
      await applyToJob(jobId)
      setAppliedIds((ids) => [...ids, jobId])
      setMessage('Internal application submitted successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setApplyingJobId('')
    }
  }

  const filteredJobs = useMemo(() => {
    const q = filters.searchTerm.toLowerCase()
    const rows = jobs
      .map((job) => ({ job, match: mySkills.length ? skillMatch(job.skills, mySkills) : null }))
      .filter(({ job }) => {
        const text = `${job.title} ${(job.skills || []).join(' ')}`.toLowerCase()
        return text.includes(q) && job.location.toLowerCase().includes(filters.location.toLowerCase())
      })
    if (filters.sort === 'match') rows.sort((a, b) => (b.match?.pct ?? -1) - (a.match?.pct ?? -1))
    if (filters.sort === 'newest') rows.sort((a, b) => (b.job.created_at || '').localeCompare(a.job.created_at || ''))
    return rows
  }, [filters, jobs, mySkills])

  if (loading) {
    return <Loading message="Loading internal opportunities..." />
  }

  return (
    <section className="page-stack">
      <SearchBar filters={filters} onChange={handleChange} />
      <div className="page-intro">
        <div>
          <h2>Open roles at CirrusLabs</h2>
          <p className="helper-text">Apply internally or refer a colleague directly from each role card.</p>
        </div>
        <span className="status-chip">{filteredJobs.length} matches found</span>
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="card-grid single-column">
        {filteredJobs.map(({ job, match }) => (
          <JobCard
            key={job.id}
            job={job}
            match={match}
            applied={appliedIds.includes(job.id)}
            showApply
            showRefer
            onApply={handleApply}
            applying={applyingJobId === job.id}
          />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="content-card empty-state">
          <p>No opportunities match your current filters.</p>
        </div>
      )}
    </section>
  )
}

export default Jobs
