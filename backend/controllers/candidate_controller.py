from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status

from backend.config.db import (
    create_application,
    create_referral,
    find_application,
    find_referral,
    find_user_by_email,
    get_candidate_profile,
    get_job,
    get_referral,
    list_applications,
    list_jobs,
    list_referrals,
    update_candidate_profile,
    update_user,
)
from backend.models.ai import InterviewPlannerRequest
from backend.models.job import Application
from backend.models.referral import Referral, ReferralCreateRequest
from backend.models.user import CandidateProfile, CandidateProfileUpdate
from backend.services.ai_planner import generate_interview_plan
from backend.services.referrals import log_referral_change, refresh_referral_bonus_statuses


def _ensure_internal_referral_email(email: str):
    if not str(email).lower().endswith("@cirruslabs.io"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @cirruslabs.io employee accounts can be referred.",
        )


def list_candidate_jobs(search_term: str = "", location: str = ""):
    jobs = list_jobs(search_term=search_term, location=location)
    return [job for job in jobs if job.get("status") == "Open"]


def get_candidate_job(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job


def apply_for_job(job_id: str, current_user: dict):
    job = get_job(job_id)
    if job is None or job.get("status") != "Open":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not available.")

    existing_application = find_application(current_user["id"], job_id)
    if existing_application is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already applied to this job.")

    profile = get_candidate_profile(current_user["id"]) or {}
    application = Application(
        id=f"app-{uuid4().hex[:8]}",
        job_id=job["id"],
        candidate_id=current_user["id"],
        candidate_name=current_user["name"],
        candidate_email=current_user["email"],
        candidate_phone=profile.get("phone", ""),
        job_title=job["title"],
        company=job["company"],
        status="Applied",
    ).model_dump()

    return create_application(application)


def list_candidate_applications(current_user: dict):
    return list_applications(candidate_id=current_user["id"])


def create_candidate_referral(job_id: str, payload: ReferralCreateRequest, current_user: dict):
    job = get_job(job_id)
    if job is None or job.get("status") != "Open":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not available.")

    referred_email = str(payload.referred_employee_email).lower()
    _ensure_internal_referral_email(referred_email)

    if referred_email == current_user["email"].lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use Apply Internally for yourself. Referrals are for colleagues only.",
        )

    if find_referral(job_id, current_user["id"], referred_email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already referred this employee for the selected position.",
        )

    referred_user = find_user_by_email(referred_email)
    referral = Referral(
        id=f"ref-{uuid4().hex[:8]}",
        job_id=job["id"],
        job_title=job["title"],
        job_location=job.get("location", ""),
        recruiter_id=job["recruiter_id"],
        recruiter_name=job["recruiter_name"],
        referrer_id=current_user["id"],
        referrer_name=current_user["name"],
        referrer_email=current_user["email"],
        referred_employee_id=referred_user["id"] if referred_user else None,
        referred_employee_name=payload.referred_employee_name,
        referred_employee_email=referred_email,
        relationship_note=payload.relationship_note.strip(),
        resume=payload.resume.strip(),
        referral_status="Referred",
        bonus_status="Not Eligible",
    ).model_dump()
    created = create_referral(referral)
    log_referral_change(current_user["id"], "referral_created", created["id"], None, created)
    return created


def list_candidate_referrals(current_user: dict):
    return refresh_referral_bonus_statuses(list_referrals(referrer_id=current_user["id"]))


def get_candidate_referral(referral_id: str, current_user: dict):
    referral = get_referral(referral_id)
    if referral is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found.")
    if referral["referrer_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own referrals.")
    return refresh_referral_bonus_statuses([referral])[0]


def get_candidate_profile_data(current_user: dict):
    profile = get_candidate_profile(current_user["id"])
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")
    return CandidateProfile(**profile)


def save_candidate_profile(current_user: dict, payload: CandidateProfileUpdate):
    profile = update_candidate_profile(
        current_user["id"],
        {
            "name": payload.name,
            "phone": payload.phone,
            "skills": payload.skills,
            "resume": payload.resume,
        },
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")

    update_user(current_user["id"], {"name": payload.name, "updated_at": datetime.utcnow().isoformat()})
    return CandidateProfile(**profile)


def get_interview_planner(job_id: str, current_user: dict, payload: InterviewPlannerRequest):
    try:
        return generate_interview_plan(job_id, current_user["id"], payload)
    except ValueError as error:
        message = str(error)
        status_code = status.HTTP_400_BAD_REQUEST if "interview date" in message.lower() else status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=message) from error
