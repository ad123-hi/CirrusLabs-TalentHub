from pydantic import BaseModel, Field


class InterviewPlannerRequest(BaseModel):
    target_date: str = ""
    hours_per_day: float = Field(default=2, ge=0.5, le=12)
    notes: str = ""


class RoadmapStep(BaseModel):
    phase: str
    duration: str
    focus: str
    tasks: list[str] = Field(default_factory=list)


class InterviewPlannerResponse(BaseModel):
    job_id: str
    job_title: str
    company: str
    status: str
    target_date: str
    days_left: int
    readiness_score: int = Field(ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    lagging_areas: list[str] = Field(default_factory=list)
    roadmap: list[RoadmapStep] = Field(default_factory=list)
    practice_questions: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    summary: str
    powered_by: str
