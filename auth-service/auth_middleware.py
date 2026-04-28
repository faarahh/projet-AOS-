from functools import wraps
from flask import request, jsonify, g
from jwt_utils import decode_token


def token_required(f):
    """
    Decorator that validates the Bearer JWT in the Authorization header.
    On success, sets:
      g.user_id    – int
      g.user_email – str
      g.user_role  – str ('user' | 'admin')
    This is 100% compatible with the lists-service and meals-service
    auth_middleware.py so the same JWT works everywhere.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        payload, err = decode_token(token)
        if err:
            status = 401
            return jsonify({'error': err}), status

        # Populate Flask g (matches convention in lists-service & meals-service)
        g.user_id    = int(payload['sub'])
        g.user_email = payload.get('email')
        g.user_role  = payload.get('role', 'user')
        g.user_name  = payload.get('name', '')

        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """
    Must be stacked AFTER @token_required.
    Returns 403 if the authenticated user is not an admin.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.user_role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated
