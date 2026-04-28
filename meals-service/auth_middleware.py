"""
meals-service/auth_middleware.py  (FIXED — was completely empty / 0 bytes)
--------------------------------------------------------------------------
Identical implementation to lists-service/auth_middleware.py.
Same JWT secret and payload format produced by auth-service/jwt_utils.py:
  { "sub": <int>, "email": <str>, "role": "user"|"admin", "iat", "exp" }
"""

from functools import wraps
from flask import request, jsonify, g
import jwt
import os

JWT_SECRET = os.getenv('JWT_SECRET', 'wams-jwt-secret-2025-change-in-prod')
ALGORITHM  = 'HS256'


def token_required(f):
    """
    Validates the Bearer JWT in the Authorization header.
    On success sets:
      g.user_id    – int   (payload['sub'])
      g.user_role  – str   ('user' | 'admin')
      g.user_email – str
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            g.user_id    = int(payload['sub'])
            g.user_role  = payload.get('role', 'user')
            g.user_name  = payload.get('name', '')
            g.user_email = payload.get('email')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated
