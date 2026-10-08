from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from backend.config.db import find_user_by_id
from backend.utils.security import AUTH_COOKIE_NAME, decode_access_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session_cookie: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
) -> dict:
    token = None
    if credentials is not None and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif session_cookie:
        token = session_cookie

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    try:
        payload = decode_access_token(token)
    except JWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.") from error

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims.")

    user = find_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return user


def require_role(expected_role: str):
    def dependency(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") != expected_role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized role.")
        return current_user

    return dependency
