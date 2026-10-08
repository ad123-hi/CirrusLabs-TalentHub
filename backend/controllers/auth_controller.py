import os
from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status

from backend.config.db import (
    create_user,
    ensure_candidate_profile,
    ensure_recruiter_profile,
    find_user_by_email,
    get_candidate_profile,
    get_recruiter_profile,
    normalize_role,
    update_user,
)
from backend.models.user import AuthResponse, LoginRequest, RegisterRequest, SSOLoginRequest, UserPublic
from backend.utils import oidc
from backend.utils.security import create_access_token, hash_password, verify_password

ALLOWED_SSO_DOMAIN = os.getenv("INTERNAL_SSO_ALLOWED_DOMAIN", "cirruslabs.io").strip().lower()


def _to_public_user(user_document: dict) -> UserPublic:
    return UserPublic(
        id=user_document["id"],
        name=user_document["name"],
        email=user_document["email"],
        role=user_document["role"],
    )


def _issue_auth_response(user_document: dict) -> AuthResponse:
    public_user = _to_public_user(user_document)
    token = create_access_token(public_user.id, public_user.role)
    return AuthResponse(user=public_user, token=token)


def _ensure_internal_email(email: str):
    domain = email.split("@")[-1].lower()
    if domain != ALLOWED_SSO_DOMAIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only @{ALLOWED_SSO_DOMAIN} accounts can use CirrusLabs SSO.",
        )


def _derive_name_from_email(email: str) -> str:
    local_part = email.split("@")[0]
    return " ".join(piece.capitalize() for piece in local_part.replace(".", " ").replace("_", " ").split()) or "Team Member"


def _ensure_role_profile(user_document: dict, phone: str = "", company: str = "CirrusLabs"):
    if user_document["role"] == "employee":
        existing_profile = get_candidate_profile(user_document["id"]) or {}
        ensure_candidate_profile(
            {
                "user_id": user_document["id"],
                "name": user_document["name"],
                "email": user_document["email"],
                "role": "employee",
                "phone": existing_profile.get("phone", phone),
                "skills": existing_profile.get("skills", []),
                "resume": existing_profile.get("resume", ""),
            }
        )
        return

    existing_profile = get_recruiter_profile(user_document["id"]) or {}
    ensure_recruiter_profile(
        {
            "user_id": user_document["id"],
            "name": user_document["name"],
            "email": user_document["email"],
            "role": "hiring_manager",
            "company": existing_profile.get("company", company),
            "phone": existing_profile.get("phone", phone),
        }
    )


def _next_user_id(role: str) -> str:
    prefix = "hm" if role == "hiring_manager" else "emp"
    return f"{prefix}-{uuid4().hex[:8]}"


def _upsert_internal_user(email: str, name: str, role: str, auth_provider: str) -> dict:
    normalized_email = str(email).lower()
    resolved_role = normalize_role(role)
    user = find_user_by_email(normalized_email)

    if user is None:
        user = create_user(
            {
                "id": _next_user_id(resolved_role),
                "name": name.strip() or _derive_name_from_email(normalized_email),
                "email": normalized_email,
                "role": resolved_role,
                "password_hash": "",
                "auth_provider": auth_provider,
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
                "last_login_at": datetime.utcnow().isoformat(),
            }
        )
        _ensure_role_profile(user)
        return user

    updates: dict = {
        "name": name.strip() or user["name"],
        "role": resolved_role,
        "auth_provider": auth_provider,
        "last_login_at": datetime.utcnow().isoformat(),
    }
    updated_user = update_user(user["id"], updates) or {**user, **updates}
    _ensure_role_profile(updated_user)
    return updated_user


def login_user(payload: LoginRequest) -> AuthResponse:
    if not oidc.DEV_MODE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use CirrusLabs SSO to sign in.")

    existing_user = find_user_by_email(str(payload.email).lower())
    if existing_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    password_hash = existing_user.get("password_hash")
    if not password_hash or not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    existing_user = update_user(existing_user["id"], {"last_login_at": datetime.utcnow().isoformat()}) or existing_user
    return _issue_auth_response(existing_user)


def register_user(payload: RegisterRequest) -> AuthResponse:
    if not oidc.DEV_MODE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is disabled. Use CirrusLabs SSO.")
    if find_user_by_email(str(payload.email).lower()) is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists with this email.")

    _ensure_internal_email(str(payload.email).lower())
    user_document = create_user(
        {
            "id": _next_user_id("employee"),
            "name": payload.name,
            "email": str(payload.email).lower(),
            "role": "employee",
            "password_hash": hash_password(payload.password),
            "auth_provider": "local",
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "last_login_at": datetime.utcnow().isoformat(),
        }
    )
    _ensure_role_profile(user_document, phone=payload.phone, company=payload.company or "CirrusLabs")
    return _issue_auth_response(user_document)


def sso_login_user(payload: SSOLoginRequest) -> AuthResponse:
    if not oidc.DEV_MODE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use CirrusLabs SSO to sign in.")
    email = str(payload.email).lower()
    _ensure_internal_email(email)
    user = _upsert_internal_user(email, payload.name, "employee", payload.provider)
    return _issue_auth_response(user)


def get_authenticated_user(current_user: dict) -> UserPublic:
    return _to_public_user(current_user)


def sso_login_verified(email: str, name: str, groups: set[str]) -> AuthResponse:
    _ensure_internal_email(email)
    if not oidc.is_allowed_group_member(groups):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not assigned to a CirrusLabs employee access group.",
        )
    role = oidc.role_for(groups)
    user = _upsert_internal_user(email, name, role, "entra")
    return _issue_auth_response(user)
