from functools import wraps
from flask import request, jsonify, g
import jwt, os

JWT_SECRET = os.getenv('JWT_SECRET', 'wams-jwt-secret-2025-change-in-prod')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            payload      = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            g.user_id    = int(payload['sub'])
            g.user_role  = payload.get('role', 'user')
            g.user_email = payload.get('email', '')
            g.user_name  = payload.get('name', '')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated
