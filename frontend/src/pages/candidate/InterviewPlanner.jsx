import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { generateInterviewPlanner } from '../../services/api.js'

function InterviewPlanner() {
  const { jobId } = useParams()
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  const minDate = today.toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    targetDate: '',
    hoursPerDay: '2',
    notes: '',
  })
  const [planner, setPlanner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (formData.targetDate && formData.targetDate < minDate) {
      setError('Please choose today or a future interview date.')
      setPlanner(null)
      return
    }

    setLoading(true)
    setError('')
    setPlanner(null)

    try {
      const response = await generateInterviewPlanner(jobId, {
        target_date: formData.targetDate,
        hours_per_day: Number(formData.hoursPerDay || 2),
        notes: formData.notes,
      })
      setPlanner(response)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <p className="section-kicker">AI Talent Intelligence</p>
          <h2>Prepare for your target internal role with skill-gap analysis and a focused roadmap</h2>
        </div>
        <Link className="secondary-button text-button" to="/employee/applications">
          Back to My Applications
        </Link>
      </div>

      <form className="content-card form-layout" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="targetDate">Target interview date</label>
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              min={minDate}
              value={formData.targetDate}
              onChange={handleChange}
            />
            <small className="helper-text">Choose today or a future date.</small>
          </div>

          <div className="input-group">
            <label htmlFor="hoursPerDay">Prep hours per day</label>
            <input
              id="hoursPerDay"
              name="hoursPerDay"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={formData.hoursPerDay}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="notes">Extra notes</label>
          <textarea
            id="notes"
            name="notes"
            rows="4"
            placeholder="Mention weak areas, target project, manager expectations, or what you want to improve first."
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button fit-button" type="submit" disabled={loading}>
          {loading ? 'Generating analysis...' : 'Generate AI Analysis'}
        </button>
      </form>

      {planner && (
        <>
          <section className="hero-banner planner-hero">
            <div>
              <p className="section-kicker">Analysis Result</p>
              <h2>
                {planner.job_title} at {planner.company}
              </h2>
              <p>{planner.summary}</p>
            </div>
            <div className="planner-score-card">
              <strong>{planner.readiness_score}%</strong>
              <span>Skill match score</span>
              <span>{planner.days_left} day(s) left</span>
              <span>Powered by {planner.powered_by}</span>
            </div>
          </section>

          <div className="panel-grid">
            <article className="content-card detail-card">
              <p className="section-kicker">Strengths</p>
              <div className="tag-list">
                {planner.strengths.map((item) => (
                  <span className="tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className="content-card detail-card">
              <p className="section-kicker">Lagging Areas</p>
              <div className="tag-list">
                {planner.lagging_areas.map((item) => (
                  <span className="tag planner-warning-tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <section className="content-card detail-card">
            <p className="section-kicker">Roadmap</p>
            <div className="planner-roadmap">
              {planner.roadmap.map((step) => (
                <article className="planner-step" key={`${step.phase}-${step.duration}`}>
                  <div className="planner-step-head">
                    <div>
                      <h3>{step.phase}</h3>
                      <p>{step.focus}</p>
                    </div>
                    <span className="status-chip">{step.duration}</span>
                  </div>
                  <ul className="planner-list">
                    {step.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <div className="panel-grid">
            <article className="content-card detail-card">
              <p className="section-kicker">Practice Questions</p>
              <ul className="planner-list">
                {planner.practice_questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </article>

            <article className="content-card detail-card">
              <p className="section-kicker">Recommendations</p>
              <ul className="planner-list">
                {planner.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  )
}

export default InterviewPlanner
