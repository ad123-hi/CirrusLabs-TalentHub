from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta
from urllib import error, parse, request

from backend.config.db import find_application, get_candidate_profile, get_job
from backend.models.ai import InterviewPlannerRequest, InterviewPlannerResponse, RoadmapStep


def _normalize_skills(skills: list[str]) -> list[str]:
    return [skill.strip().lower() for skill in skills if skill and skill.strip()]


def _compute_days_left(application_status: str, target_date: str) -> tuple[str, int]:
    if target_date:
        try:
            parsed_target = date.fromisoformat(target_date)
            if parsed_target < date.today():
                raise ValueError("Target interview date must be today or a future date.")
            days_left = (parsed_target - date.today()).days
            return parsed_target.isoformat(), days_left
        except ValueError as error:
            if "future date" in str(error):
                raise
            raise ValueError("Please choose a valid interview date.") from error

    fallback_days = {
        "Applied": 14,
        "Shortlisted": 7,
        "Rejected": 0,
    }.get(application_status, 10)
    computed_date = date.today() + timedelta(days=fallback_days)
    return computed_date.isoformat(), fallback_days


def _build_local_plan(job: dict, profile: dict, application: dict | None, payload: InterviewPlannerRequest) -> InterviewPlannerResponse:
    candidate_skills = _normalize_skills(profile.get("skills", []))
    job_skills_original = job.get("skills", [])
    job_skills = _normalize_skills(job_skills_original)
    missing_skills = [skill for skill, normalized in zip(job_skills_original, job_skills) if normalized not in candidate_skills]
    strengths = [skill for skill, normalized in zip(job_skills_original, job_skills) if normalized in candidate_skills]
    if not strengths:
        strengths = profile.get("skills", [])[:2] or ["Willingness to learn", "Basic interview preparation"]

    application_status = application.get("status", "Applied") if application else "Applied"
    target_date, days_left = _compute_days_left(application_status, payload.target_date)
    hours_per_day = payload.hours_per_day or 2
    total_hours = max(int(days_left * hours_per_day), int(7 * hours_per_day))

    lagging_areas = missing_skills[:4] or ["Systematic interview storytelling", "Role-specific revision", "Mock interview practice"]
    readiness_score = max(38, min(92, 70 + (len(strengths) * 8) - (len(lagging_areas) * 6) + min(days_left, 14)))

    roadmap = [
        RoadmapStep(
            phase="Foundation",
            duration=f"Day 1-{max(2, min(4, days_left // 3 or 2))}",
            focus="Understand the role, company expectations, and the must-have skills.",
            tasks=[
                f"Study the {job['title']} job description and map each requirement to your current level.",
                f"Revise core concepts around {', '.join(job.get('skills', [])[:3]) or 'the target role stack'}.",
                "Prepare 4-5 STAR stories for projects, conflict handling, ownership, and impact.",
            ],
        ),
        RoadmapStep(
            phase="Gap Closure",
            duration=f"Day {max(3, min(5, days_left // 3 + 1))}-{max(5, min(9, max(days_left - 3, 5)))}",
            focus="Close the most visible skill gaps before mock rounds.",
            tasks=[
                *(f"Practice one focused module on {skill} and build a short explanation you can say in interviews." for skill in lagging_areas[:3]),
                "Turn one past project into a role-relevant case study with problem, action, and measurable result.",
            ],
        ),
        RoadmapStep(
            phase="Interview Simulation",
            duration=f"Last {min(3, max(days_left, 1))} days",
            focus="Convert preparation into interview-ready delivery and confidence.",
            tasks=[
                "Run at least 2 mock interviews and record your answers.",
                "Practice concise introductions, project walkthroughs, and why-this-company answers.",
                "Create a final review sheet with resume highlights, job fit points, and questions to ask the interviewer.",
            ],
        ),
    ]

    practice_questions = [
        f"Why are you a strong fit for the {job['title']} role at {job['company']}?",
        f"Tell me about a project where you used {job.get('skills', ['your core skills'])[0]}.",
        "Which area are you currently improving, and how are you working on it?",
        "How do you prioritize work when deadlines are tight?",
        "What would your first 30 days in this role look like?",
    ]

    recommendations = [
        f"Allocate about {hours_per_day:.1f} hours per day for the next {max(days_left, 1)} days.",
        f"Spend extra focus on {', '.join(lagging_areas[:2])}.",
        "Use your resume and project work to create role-specific answers instead of generic theory.",
    ]
    if payload.notes:
        recommendations.append(f"Keep your custom priority in mind: {payload.notes}")

    summary = (
        f"You have about {days_left} day(s) left before the target discussion window for {job['title']}. "
        f"Your strongest match areas are {', '.join(strengths[:3])}, while the biggest gaps are "
        f"{', '.join(lagging_areas[:3])}. A focused {total_hours}-hour prep plan should improve your readiness."
    )

    return InterviewPlannerResponse(
        job_id=job["id"],
        job_title=job["title"],
        company=job["company"],
        status=application_status,
        target_date=target_date,
        days_left=days_left,
        readiness_score=readiness_score,
        strengths=strengths[:4],
        lagging_areas=lagging_areas,
        roadmap=roadmap,
        practice_questions=practice_questions,
        recommendations=recommendations,
        summary=summary,
        powered_by="local-planner",
    )


def _call_gemini(plan_seed: InterviewPlannerResponse, job: dict, profile: dict, payload: InterviewPlannerRequest) -> InterviewPlannerResponse | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
    prompt = f"""
You are an interview planner for job candidates.
Return only valid JSON matching this schema:
{{
  "summary": "string",
  "readiness_score": 0,
  "strengths": ["string"],
  "lagging_areas": ["string"],
  "roadmap": [{{"phase":"string","duration":"string","focus":"string","tasks":["string"]}}],
  "practice_questions": ["string"],
  "recommendations": ["string"]
}}

Candidate profile:
{json.dumps(profile, ensure_ascii=False)}

Job:
{json.dumps(job, ensure_ascii=False)}

Planner seed:
{plan_seed.model_dump_json(indent=2)}

Extra instructions:
- Make the roadmap realistic for {plan_seed.days_left} days left.
- Keep the advice specific to the job.
- Mention where the candidate is lagging.
- Keep 3 roadmap phases maximum.
- Do not include markdown.
- Notes from candidate: {payload.notes or "None"}
""".strip()

    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{parse.quote(model)}:generateContent?key={parse.quote(api_key)}"
    )
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")

    try:
        req = request.Request(endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with request.urlopen(req, timeout=25) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
        text = response_payload["candidates"][0]["content"]["parts"][0]["text"]
        ai_payload = json.loads(text)
        return InterviewPlannerResponse(
            **{
                **plan_seed.model_dump(),
                "summary": ai_payload.get("summary", plan_seed.summary),
                "readiness_score": ai_payload.get("readiness_score", plan_seed.readiness_score),
                "strengths": ai_payload.get("strengths", plan_seed.strengths),
                "lagging_areas": ai_payload.get("lagging_areas", plan_seed.lagging_areas),
                "roadmap": ai_payload.get("roadmap", [step.model_dump() for step in plan_seed.roadmap]),
                "practice_questions": ai_payload.get("practice_questions", plan_seed.practice_questions),
                "recommendations": ai_payload.get("recommendations", plan_seed.recommendations),
                "powered_by": "gemini",
            }
        )
    except (error.URLError, KeyError, IndexError, json.JSONDecodeError, ValueError):
        return None


def generate_interview_plan(job_id: str, user_id: str, payload: InterviewPlannerRequest) -> InterviewPlannerResponse:
    job = get_job(job_id)
    if job is None:
        raise ValueError("Job not found.")

    profile = get_candidate_profile(user_id) or {"skills": [], "resume": "", "phone": ""}
    application = find_application(user_id, job_id)
    base_plan = _build_local_plan(job, profile, application, payload)
    ai_plan = _call_gemini(base_plan, job, profile, payload)
    return ai_plan or base_plan
