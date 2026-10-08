"""OpenID Connect (authorization code + PKCE) for CirrusLabs SSO."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import time
from functools import lru_cache
from urllib import parse, request

from jose import jwt

from backend.utils.security import JWT_ALGORITHM, JWT_SECRET_KEY

ISSUER = os.getenv("OIDC_ISSUER", "").rstrip("/")
CLIENT_ID = os.getenv("OIDC_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("OIDC_REDIRECT_URI", "http://localhost:8000/auth/sso/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174").rstrip("/")
EMPLOYEE_GROUP_IDS = {value.strip() for value in os.getenv("SSO_EMPLOYEE_GROUP_IDS", "").split(",") if value.strip()}
HIRING_MANAGER_GROUP_IDS = {
    value.strip() for value in os.getenv("SSO_HIRING_MANAGER_GROUP_IDS", "").split(",") if value.strip()
}
DEV_MODE = os.getenv("SSO_DEV_MODE", "false").lower() == "true"


def is_configured() -> bool:
    return bool(ISSUER and CLIENT_ID and CLIENT_SECRET)


def _get_json(url: str, data: dict | None = None) -> dict:
    body = parse.urlencode(data).encode() if data else None
    with request.urlopen(request.Request(url, data=body), timeout=10) as response:
        return json.loads(response.read())


@lru_cache(maxsize=1)
def _discovery() -> dict:
    return _get_json(f"{ISSUER}/.well-known/openid-configuration")


def _jwks() -> dict:
    return _get_json(_discovery()["jwks_uri"])


def build_login_url() -> str:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    nonce = secrets.token_urlsafe(16)
    state = jwt.encode(
        {"v": verifier, "n": nonce, "exp": int(time.time()) + 600},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    query = parse.urlencode(
        {
            "client_id": CLIENT_ID,
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "scope": "openid email profile",
            "state": state,
            "nonce": nonce,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    return f"{_discovery()['authorization_endpoint']}?{query}"


def complete_login(code: str, state: str) -> dict:
    saved = jwt.decode(state, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    tokens = _get_json(
        _discovery()["token_endpoint"],
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code_verifier": saved["v"],
        },
    )
    claims = jwt.decode(
        tokens["id_token"],
        _jwks(),
        algorithms=["RS256"],
        audience=CLIENT_ID,
        issuer=_discovery()["issuer"],
        access_token=tokens.get("access_token"),
    )
    if claims.get("nonce") != saved["n"]:
        raise ValueError("Nonce mismatch")
    email = (claims.get("email") or claims.get("preferred_username") or "").lower()
    if not email:
        raise ValueError("IdP did not return an email")
    groups = {str(item) for item in claims.get("groups", [])}
    return {"email": email, "name": claims.get("name", ""), "groups": groups}


def is_allowed_group_member(groups: set[str]) -> bool:
    if not EMPLOYEE_GROUP_IDS and not HIRING_MANAGER_GROUP_IDS:
        return True
    return bool(groups & (EMPLOYEE_GROUP_IDS | HIRING_MANAGER_GROUP_IDS))


def role_for(groups: set[str]) -> str:
    if groups & HIRING_MANAGER_GROUP_IDS:
        return "hiring_manager"
    return "employee"
