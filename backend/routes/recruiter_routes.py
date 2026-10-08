from fastapi import APIRouter, Depends

from backend.controllers.recruiter_controller import (
    approve_referral_bonus,
    change_application_status,
    change_referral_status,
    create_recruiter_job,
    edit_recruiter_job,
    get_recruiter_referral,
    get_recruiter_profile_data,
    list_recruiter_referrals,
    list_job_applicants,
    mark_bonus_paid,
    mark_referral_joining,
    list_recruiter_jobs,
    reject_referral_bonus,
    remove_recruiter_job,
    save_recruiter_profile,
)
from backend.middleware.auth_middleware import get_current_user, require_role
from backend.models.job import (
    ApplicantView,
    Application,
    ApplicationStatusUpdateRequest,
    JobCreateRequest,
    JobUpdateRequest,
    RecruiterJobView,
)
from backend.models.referral import Referral, ReferralBonusDecisionRequest, ReferralJoiningUpdateRequest, ReferralStatusUpdateRequest
from backend.models.user import RecruiterProfile, RecruiterProfileUpdate


router = APIRouter(
    prefix="/recruiter",
    tags=["recruiter"],
    dependencies=[Depends(require_role("hiring_manager"))],
)


@router.get("/jobs", response_model=list[RecruiterJobView])
def get_jobs(current_user: dict = Depends(get_current_user)):
    return list_recruiter_jobs(current_user)


@router.post("/jobs", response_model=RecruiterJobView, status_code=201)
def create_job(payload: JobCreateRequest, current_user: dict = Depends(get_current_user)):
    return create_recruiter_job(payload, current_user)


@router.put("/jobs/{job_id}", response_model=RecruiterJobView)
def update_job(job_id: str, payload: JobUpdateRequest, current_user: dict = Depends(get_current_user)):
    return edit_recruiter_job(job_id, payload, current_user)


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    return remove_recruiter_job(job_id, current_user)


@router.get("/jobs/{job_id}/applicants", response_model=list[ApplicantView])
def get_applicants(job_id: str, current_user: dict = Depends(get_current_user)):
    return list_job_applicants(job_id, current_user)


@router.patch("/applications/{application_id}/status", response_model=Application)
def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    return change_application_status(application_id, payload, current_user)


@router.get("/referrals", response_model=list[Referral])
def get_referrals(current_user: dict = Depends(get_current_user)):
    return list_recruiter_referrals(current_user)


@router.get("/referrals/{referral_id}", response_model=Referral)
def get_referral_by_id(referral_id: str, current_user: dict = Depends(get_current_user)):
    return get_recruiter_referral(referral_id, current_user)


@router.patch("/referrals/{referral_id}/status", response_model=Referral)
def update_referral_status(
    referral_id: str,
    payload: ReferralStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    return change_referral_status(referral_id, payload, current_user)


@router.patch("/referrals/{referral_id}/joining", response_model=Referral)
def update_referral_joining(
    referral_id: str,
    payload: ReferralJoiningUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    return mark_referral_joining(referral_id, payload, current_user)


@router.patch("/referrals/{referral_id}/bonus/approve", response_model=Referral)
def approve_bonus(
    referral_id: str,
    payload: ReferralBonusDecisionRequest,
    current_user: dict = Depends(get_current_user),
):
    return approve_referral_bonus(referral_id, payload, current_user)


@router.patch("/referrals/{referral_id}/bonus/reject", response_model=Referral)
def reject_bonus(
    referral_id: str,
    payload: ReferralBonusDecisionRequest,
    current_user: dict = Depends(get_current_user),
):
    return reject_referral_bonus(referral_id, payload, current_user)


@router.patch("/referrals/{referral_id}/bonus/paid", response_model=Referral)
def pay_bonus(referral_id: str, current_user: dict = Depends(get_current_user)):
    return mark_bonus_paid(referral_id, current_user)


@router.get("/profile", response_model=RecruiterProfile)
def get_profile(current_user: dict = Depends(get_current_user)):
    return get_recruiter_profile_data(current_user)


@router.put("/profile", response_model=RecruiterProfile)
def update_profile(payload: RecruiterProfileUpdate, current_user: dict = Depends(get_current_user)):
    return save_recruiter_profile(current_user, payload)
