from fastapi import APIRouter, Depends

from backend.controllers.candidate_controller import (
    apply_for_job,
    create_candidate_referral,
    get_candidate_job,
    get_candidate_profile_data,
    get_candidate_referral,
    get_interview_planner,
    list_candidate_applications,
    list_candidate_jobs,
    list_candidate_referrals,
    save_candidate_profile,
)
from backend.middleware.auth_middleware import get_current_user, require_role
from backend.models.ai import InterviewPlannerRequest, InterviewPlannerResponse
from backend.models.job import Application, Job
from backend.models.referral import Referral, ReferralCreateRequest
from backend.models.user import CandidateProfile, CandidateProfileUpdate


router = APIRouter(
    prefix="/employee",
    tags=["employee"],
    dependencies=[Depends(require_role("employee"))],
)


@router.get("/jobs", response_model=list[Job])
def get_jobs(search_term: str = "", location: str = ""):
    return list_candidate_jobs(search_term=search_term, location=location)


@router.get("/jobs/{job_id}", response_model=Job)
def get_job(job_id: str):
    return get_candidate_job(job_id)


@router.get("/applications", response_model=list[Application])
def get_applications(current_user: dict = Depends(get_current_user)):
    return list_candidate_applications(current_user)


@router.post("/jobs/{job_id}/apply", response_model=Application, status_code=201)
def apply_to_job(job_id: str, current_user: dict = Depends(get_current_user)):
    return apply_for_job(job_id, current_user)


@router.post("/jobs/{job_id}/referrals", response_model=Referral, status_code=201)
def create_referral(
    job_id: str,
    payload: ReferralCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    return create_candidate_referral(job_id, payload, current_user)


@router.get("/referrals", response_model=list[Referral])
def get_referrals(current_user: dict = Depends(get_current_user)):
    return list_candidate_referrals(current_user)


@router.get("/referrals/{referral_id}", response_model=Referral)
def get_referral_by_id(referral_id: str, current_user: dict = Depends(get_current_user)):
    return get_candidate_referral(referral_id, current_user)


@router.post("/jobs/{job_id}/planner", response_model=InterviewPlannerResponse)
def build_interview_planner(
    job_id: str,
    payload: InterviewPlannerRequest,
    current_user: dict = Depends(get_current_user),
):
    return get_interview_planner(job_id, current_user, payload)


@router.get("/profile", response_model=CandidateProfile)
def get_profile(current_user: dict = Depends(get_current_user)):
    return get_candidate_profile_data(current_user)


@router.put("/profile", response_model=CandidateProfile)
def update_profile(payload: CandidateProfileUpdate, current_user: dict = Depends(get_current_user)):
    return save_candidate_profile(current_user, payload)
