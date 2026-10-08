from typing import Literal

from pydantic import BaseModel, EmailStr, Field


Role = Literal["employee", "hiring_manager"]


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = "employee"
    phone: str = ""
    company: str = ""


class SSOLoginRequest(BaseModel):
    email: EmailStr
    name: str = ""
    provider: str = "cirrus-sso"


class AuthResponse(BaseModel):
    user: UserPublic
    token: str


class CandidateProfile(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    role: Role = "employee"
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    resume: str = ""


class CandidateProfileUpdate(BaseModel):
    name: str = Field(min_length=2)
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    resume: str = ""


class RecruiterProfile(BaseModel):
    user_id: str
    name: str
    company: str = ""
    email: EmailStr
    role: Role = "hiring_manager"
    phone: str = ""


class RecruiterProfileUpdate(BaseModel):
    name: str = Field(min_length=2)
    company: str = ""
    phone: str = ""


class TokenPayload(BaseModel):
    sub: str
    role: Role
    exp: int
