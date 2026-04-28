import jwt
import os
from datetime import datetime, timedelta, timezone

JWT_SECRET      = os.getenv('JWT_SECRET', 'wams-jwt-secret-2025-change-in-prod')
JWT_EXPIRY_HOURS = int(os.getenv('JWT_EXPIRY_HOURS', 24))
ALGORITHM       = 'HS256'


def generate_token(user_id: int, email: str, role: str, name: str = '') -> str:
    """Create a signed JWT containing user identity and role."""
    now = datetime.now(timezone.utc)
    payload = {
        'sub':   str(user_id),     # PyJWT v2+ requires str; cast back with int() in middlewares  – consumed by other services via g.user_id
        'email': email,             # consumed via g.user_email
        'role':  role,              # consumed via g.user_role
        'name':  name,              # consumed via g.user_name (used by group-service)
        'iat':   now,
        'exp':   now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str):
    """
    Returns (payload_dict, None) on success,
            (None, error_message) on failure.
    Matches the shared/jwt_utils.py contract used by lists/meals services.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, 'Token expired'
    except jwt.InvalidTokenError as e:
        return None, f'Invalid token: {e}'
