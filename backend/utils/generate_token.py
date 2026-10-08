from backend.utils.security import create_access_token


def generate_token(user_id: str, role: str) -> str:
    return create_access_token(user_id, role)
