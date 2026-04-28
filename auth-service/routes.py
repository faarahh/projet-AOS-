from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Role
from jwt_utils import generate_token, decode_token
from auth_middleware import token_required, admin_required
import re

auth_bp = Blueprint('auth', __name__)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

EMAIL_RE    = re.compile(r'^[^@]+@[^@]+\.[^@]+$')
PASSWORD_RE = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).{6,}$')

def validate_register(data):
    errors = []
    if not data.get('name', '').strip():
        errors.append('Name is required')
    if not EMAIL_RE.match(data.get('email', '')):
        errors.append('Valid email is required')
    if not PASSWORD_RE.match(data.get('password', '')):
        errors.append('Password must be at least 6 chars and contain a letter and a digit')
    return errors


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    Body: { name, email, password, role? }
    """
    data = request.get_json() or {}

    errors = validate_register(data)
    if errors:
        return jsonify({'error': errors[0]}), 400

    email = data['email'].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already in use'}), 409

    # Resolve role (only 'admin' requests need a prior admin token — handled
    # at the client level; for self-registration always 'user')
    role_name = 'user'  # safe default
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({'error': 'Role configuration error'}), 500

    user = User(
        name=data['name'].strip(),
        email=email,
        password_hash=generate_password_hash(data['password']),
        role_id=role.id,
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, user.email, role.name, user.name)

    return jsonify({
        'message': 'User registered successfully',
        'token':   token,
        'user':    user.to_dict(),
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user and return a JWT.
    Body: { email, password }
    """
    data = request.get_json() or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403

    token = generate_token(user.id, user.email, user.role.name, user.name)

    return jsonify({
        'message': 'Login successful',
        'token':   token,
        'user':    user.to_dict(),
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/auth/validate
# Called by other microservices to verify a token without decoding themselves
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/validate', methods=['GET'])
def validate_token():
    """
    Validate a JWT.  Other services (lists, meals, users) call this endpoint
    before trusting a request.
    Header: Authorization: Bearer <token>
    Returns: { valid, user_id, email, role } or { valid: false, error }
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'valid': False, 'error': 'No token provided'}), 401

    token = auth_header.split(' ', 1)[1]
    payload, err = decode_token(token)

    if err:
        return jsonify({'valid': False, 'error': err}), 401

    # Extra check: user must still exist and be active
    user = User.query.get(int(payload.get('sub', 0)))
    if not user or not user.is_active:
        return jsonify({'valid': False, 'error': 'User not found or disabled'}), 401

    return jsonify({
        'valid':   True,
        'user_id': user.id,
        'email':   user.email,
        'role':    user.role.name,
        'name':    user.name,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/auth/me   – requires token
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    """Return the current user's profile."""
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/auth/me   – requires token
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['PUT'])
@token_required
def update_me():
    """Update name or password of the current user."""
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()

    if 'password' in data:
        if not PASSWORD_RE.match(data['password']):
            return jsonify({'error': 'Password too weak'}), 400
        if not check_password_hash(user.password_hash, data.get('current_password', '')):
            return jsonify({'error': 'Current password is incorrect'}), 403
        user.password_hash = generate_password_hash(data['password'])

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ROUTES  –  require role=admin
# ─────────────────────────────────────────────────────────────────────────────

@auth_bp.route('/admin/users', methods=['GET'])
@token_required
@admin_required
def admin_list_users():
    """List all users (admin only)."""
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


@auth_bp.route('/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def admin_update_user(user_id):
    """Toggle is_active or change role (admin only)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.id == g.user_id:
        return jsonify({'error': 'Cannot modify your own account via admin route'}), 400

    data = request.get_json() or {}

    if 'is_active' in data:
        user.is_active = bool(data['is_active'])

    if 'role' in data:
        new_role = Role.query.filter_by(name=data['role']).first()
        if not new_role:
            return jsonify({'error': f"Unknown role: {data['role']}"}), 400
        user.role_id = new_role.id

    db.session.commit()
    return jsonify({'message': 'User updated', 'user': user.to_dict()}), 200


@auth_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def admin_delete_user(user_id):
    """Soft-delete (deactivate) a user (admin only)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.id == g.user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    user.is_active = False   # Soft delete — keeps data integrity
    db.session.commit()
    return jsonify({'message': 'User deactivated'}), 200
