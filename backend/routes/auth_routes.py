import os
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse

from backend.controllers.auth_controller import (
    get_authenticated_user,
    login_user,
    register_user,
    sso_login_user,
    sso_login_verified,
)
from backend.middleware.auth_middleware import get_current_user
from backend.utils import oidc
from backend.utils.security import AUTH_COOKIE_NAME, JWT_EXPIRE_MINUTES
from backend.models.user import AuthResponse, LoginRequest, RegisterRequest, SSOLoginRequest


router = APIRouter(prefix="/auth", tags=["auth"])
COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"


def _write_session_cookie(response: Response, token: str):
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=JWT_EXPIRE_MINUTES * 60,
        path="/",
    )


def _clear_session_cookie(response: Response):
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response):
    auth = login_user(payload)
    _write_session_cookie(response, auth.token)
    return auth


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, response: Response):
    auth = register_user(payload)
    _write_session_cookie(response, auth.token)
    return auth


@router.post("/sso-login", response_model=AuthResponse)
def sso_login(payload: SSOLoginRequest, response: Response):
    auth = sso_login_user(payload)
    _write_session_cookie(response, auth.token)
    return auth


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return get_authenticated_user(current_user)


@router.post("/logout", status_code=204)
def logout(response: Response):
    _clear_session_cookie(response)
    return response


@router.get("/sso/config")
def sso_config():
    return {"enabled": oidc.is_configured(), "dev_mode": oidc.DEV_MODE}


@router.get("/sso/login")
def sso_start():
    if not oidc.is_configured():
        raise HTTPException(status_code=503, detail="SSO is not configured. Set the OIDC_* variables.")
    return RedirectResponse(oidc.build_login_url())


@router.get("/sso/callback")
def sso_callback(code: str = "", state: str = "", error: str = ""):
    back = f"{oidc.FRONTEND_URL}/sso/callback"
    if error or not code:
        return RedirectResponse(f"{back}?error={quote(error or 'SSO sign-in was cancelled.')}")
    try:
        identity = oidc.complete_login(code, state)
        auth = sso_login_verified(identity["email"], identity["name"], identity["groups"])
    except HTTPException as exc:  # e.g. wrong email domain
        return RedirectResponse(f"{back}?error={quote(str(exc.detail))}")
    except Exception:
        return RedirectResponse(f"{back}?error={quote('SSO sign-in failed. Please try again.')}")
    response = RedirectResponse(f"{back}?status=ok")
    _write_session_cookie(response, auth.token)
    return response
