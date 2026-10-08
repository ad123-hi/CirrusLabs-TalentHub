from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


ReferralStatus = Literal[
    "Referred",
    "Application Submitted",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Selected",
    "Joined",
    "Rejected",
    "Withdrawn",
]

BonusStatus = Literal[
    "Not Eligible",
    "Pending Eligibility",
    "Eligible",
    "Approved",
    "Paid",
    "Rejected",
]


class Referral(BaseModel):
    id: str
    job_id: str
    job_title: str
    job_location: str = ""
    recruiter_id: str
    recruiter_name: str
    referrer_id: str
    referrer_name: str
    referrer_email: EmailStr
    referred_employee_id: str | None = None
    referred_employee_name: str
    referred_employee_email: EmailStr
    relationship_note: str = ""
    resume: str = ""
    application_id: str | None = None
    referral_status: ReferralStatus = "Referred"
    joining_date: str | None = None
    eligibility_date: str | None = None
    bonus_status: BonusStatus = "Not Eligible"
    bonus_amount: str | None = None
    bonus_approved_by: str | None = None
    bonus_approved_at: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ReferralCreateRequest(BaseModel):
    referred_employee_name: str = Field(min_length=2)
    referred_employee_email: EmailStr
    relationship_note: str = Field(default="", max_length=500)
    resume: str = Field(default="", max_length=500)


class ReferralStatusUpdateRequest(BaseModel):
    referral_status: ReferralStatus


class ReferralJoiningUpdateRequest(BaseModel):
    joining_date: str = Field(description="ISO date in YYYY-MM-DD format")


class ReferralBonusDecisionRequest(BaseModel):
    bonus_amount: str | None = None


class AuditLog(BaseModel):
    id: str
    actor_id: str
    action: str
    entity_type: str
    entity_id: str
    old_value: dict | None = None
    new_value: dict | None = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
