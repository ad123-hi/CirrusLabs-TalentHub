from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


JobStatus = Literal["Open", "Closed"]
ApplicationStatus = Literal[
    "Applied",
    "Application Submitted",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Selected",
    "Joined",
    "Rejected",
    "Withdrawn",
]


class Job(BaseModel):
    id: str
    title: str
    company: str
    location: str
    type: str
    salary: str
    experience: str
    description: str
    skills: list[str] = Field(default_factory=list)
    recruiter_id: str
    recruiter_name: str
    status: JobStatus = "Open"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class JobCreateRequest(BaseModel):
    title: str = Field(min_length=2)
    company: str = Field(min_length=2)
    location: str = Field(min_length=2)
    type: str = Field(min_length=2)
    salary: str = "Not specified"
    experience: str = "Not specified"
    description: str = Field(min_length=10)
    skills: list[str] = Field(default_factory=list)


class JobUpdateRequest(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    type: str | None = None
    salary: str | None = None
    experience: str | None = None
    description: str | None = None
    skills: list[str] | None = None
    status: JobStatus | None = None


class RecruiterJobView(Job):
    applicants_count: int = 0


class Application(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    candidate_phone: str = ""
    job_title: str
    company: str
    status: ApplicationStatus = "Applied"
    applied_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ApplicantView(BaseModel):
    id: str
    application_id: str
    candidate_id: str
    name: str
    email: str
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    resume: str = ""
    status: ApplicationStatus


class ApplicationStatusUpdateRequest(BaseModel):
    status: ApplicationStatus
