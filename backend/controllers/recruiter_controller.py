from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status

from backend.config.db import (
    count_applications_for_job,
    create_job,
    delete_job,
    get_application,
    get_candidate_profile,
    get_job,
    get_recruiter_profile,
    get_referral,
    list_applications,
    list_jobs,
    list_referrals,
    update_application,
    update_job,
    update_recruiter_profile,
    update_referral,
    update_user,
)
from backend.models.job import ApplicantView, Application, ApplicationStatusUpdateRequest, Job, JobCreateRequest, JobUpdateRequest, RecruiterJobView
from backend.models.referral import Referral, ReferralBonusDecisionRequest, ReferralJoiningUpdateRequest, ReferralStatusUpdateRequest
from backend.models.user import RecruiterProfile, RecruiterProfileUpdate
from backend.services.referrals import add_months, log_referral_change, refresh_referral_bonus_statuses, refresh_single_referral


def _ensure_job_owner(job_id: str, recruiter_id: str) -> dict:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    if job["recruiter_id"] != recruiter_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own jobs.")
    return job


def _ensure_recruiter_referral(referral_id: str, recruiter_id: str) -> dict:
    referral = get_referral(referral_id)
    if referral is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found.")
    if referral["recruiter_id"] != recruiter_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own referrals.")
    return referral


def _to_recruiter_job_view(job: dict) -> RecruiterJobView:
    return RecruiterJobView(**job, applicants_count=count_applications_for_job(job["id"]))


def list_recruiter_jobs(current_user: dict):
    recruiter_jobs = list_jobs(recruiter_id=current_user["id"])
    return [_to_recruiter_job_view(job) for job in recruiter_jobs]


def create_recruiter_job(payload: JobCreateRequest, current_user: dict):
    job = Job(
        id=f"job-{uuid4().hex[:8]}",
        title=payload.title,
        company=payload.company,
        location=payload.location,
        type=payload.type,
        salary=payload.salary,
        experience=payload.experience,
        description=payload.description,
        skills=payload.skills,
        recruiter_id=current_user["id"],
        recruiter_name=current_user["name"],
        status="Open",
    ).model_dump()
    created = create_job(job)
    return _to_recruiter_job_view(created)


def edit_recruiter_job(job_id: str, payload: JobUpdateRequest, current_user: dict):
    _ensure_job_owner(job_id, current_user["id"])
    updates = {key: value for key, value in payload.model_dump().items() if value is not None}
    updated = update_job(job_id, updates)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return _to_recruiter_job_view(updated)


def remove_recruiter_job(job_id: str, current_user: dict):
    _ensure_job_owner(job_id, current_user["id"])
    deleted = delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return {"message": "Job deleted successfully."}


def list_job_applicants(job_id: str, current_user: dict):
    _ensure_job_owner(job_id, current_user["id"])
    applications = list_applications(job_id=job_id)
    applicant_views = []
    for application in applications:
        profile = get_candidate_profile(application["candidate_id"]) or {}
        applicant_views.append(
            ApplicantView(
                id=application["candidate_id"],
                application_id=application["id"],
                candidate_id=application["candidate_id"],
                name=application["candidate_name"],
                email=application["candidate_email"],
                phone=profile.get("phone", application.get("candidate_phone", "")),
                skills=profile.get("skills", []),
                resume=profile.get("resume", ""),
                status=application["status"],
            )
        )
    return applicant_views


def change_application_status(application_id: str, payload: ApplicationStatusUpdateRequest, current_user: dict):
    application = get_application(application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    _ensure_job_owner(application["job_id"], current_user["id"])
    updated = update_application(
        application_id,
        {"status": payload.status, "updated_at": datetime.utcnow().isoformat()},
    )
    return updated


def list_recruiter_referrals(current_user: dict):
    return refresh_referral_bonus_statuses(list_referrals(recruiter_id=current_user["id"]))


def get_recruiter_referral(referral_id: str, current_user: dict):
    referral = _ensure_recruiter_referral(referral_id, current_user["id"])
    return refresh_referral_bonus_statuses([referral])[0]


def change_referral_status(referral_id: str, payload: ReferralStatusUpdateRequest, current_user: dict):
    referral = _ensure_recruiter_referral(referral_id, current_user["id"])
    updates = {
        "referral_status": payload.referral_status,
        "updated_at": datetime.utcnow().isoformat(),
    }
    if payload.referral_status != "Joined":
        updates["bonus_status"] = "Not Eligible"
    updated = update_referral(referral_id, updates)
    log_referral_change(current_user["id"], "referral_status_updated", referral_id, referral, updated)
    return refresh_single_referral(referral_id)


def mark_referral_joining(referral_id: str, payload: ReferralJoiningUpdateRequest, current_user: dict):
    referral = _ensure_recruiter_referral(referral_id, current_user["id"])
    eligibility_date = add_months(payload.joining_date, 3)
    updated = update_referral(
        referral_id,
        {
            "referral_status": "Joined",
            "joining_date": payload.joining_date,
            "eligibility_date": eligibility_date,
            "bonus_status": "Pending Eligibility",
            "updated_at": datetime.utcnow().isoformat(),
        },
    )
    log_referral_change(current_user["id"], "referral_joining_marked", referral_id, referral, updated)
    return refresh_single_referral(referral_id)


def approve_referral_bonus(referral_id: str, payload: ReferralBonusDecisionRequest, current_user: dict):
    referral = _ensure_recruiter_referral(referral_id, current_user["id"])
    latest = refresh_referral_bonus_statuses([referral])[0]
    if latest["bonus_status"] not in {"Eligible", "Approved"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This referral is not yet eligible for bonus approval.",
        )
    updated = update_referral(
        referral_id,
        {
            "bonus_status": "Approved",
            "bonus_amount": payload.bonus_amount or latest.get("bonus_amount"),
            "bonus_approved_by": current_user["name"],
            "bonus_approved_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
    )
    log_referral_change(current_user["id"], "bonus_approved", referral_id, referral, updated)
    return refresh_single_referral(referral_id)


def reject_referral_bonus(referral_id: str, payload: ReferralBonusDecisionRequest, current_user: dict):
    referral = _ensure_recruiter_referral(referral_id, current_user["id"])
    updated = update_referral(
        referral_id,
        {
            "bonus_status": "Rejected",
            "bonus_amount": payload.bonus_amount or referral.get("bonus_amount"),
            "bonus_approved_by": current_user["name"],
            "bonus_approved_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
    )
    log_referral_change(current_user["id"], "bonus_rejected", referral_id, referral, updated)
    return refresh_single_referral(referral_id)


def mark_bonus_paid(referral_id: str, current_user: dict):
    referral = _ensure_recruiter_referral(referral_id, current_user["id"])
    if referral["bonus_status"] != "Approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only approved bonuses can be marked as paid.")
    updated = update_referral(
        referral_id,
        {
            "bonus_status": "Paid",
            "updated_at": datetime.utcnow().isoformat(),
        },
    )
    log_referral_change(current_user["id"], "bonus_paid", referral_id, referral, updated)
    return refresh_single_referral(referral_id)


def get_recruiter_profile_data(current_user: dict):
    profile = get_recruiter_profile(current_user["id"])
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hiring manager profile not found.")
    return RecruiterProfile(**profile)


def save_recruiter_profile(current_user: dict, payload: RecruiterProfileUpdate):
    profile = update_recruiter_profile(
        current_user["id"],
        {
            "name": payload.name,
            "company": payload.company,
            "phone": payload.phone,
        },
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hiring manager profile not found.")

    update_user(current_user["id"], {"name": payload.name, "updated_at": datetime.utcnow().isoformat()})
    return RecruiterProfile(**profile)
