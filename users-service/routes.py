from flask import Blueprint, request, jsonify, g
from models import db, UserProfile
from auth_middleware import token_required
from sqlalchemy import or_

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@token_required
def get_users():
    """(Admin) Liste des utilisateurs"""
    if g.user_role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    users = UserProfile.query.all()
    return jsonify([{
        'user_id': u.user_id,
        'email': u.email,
        'name': u.name
    } for u in users]), 200

@users_bp.route('/search', methods=['GET'])
@token_required
def search_users():
    """Rechercher des utilisateurs par email"""
    email = request.args.get('email', '')
    if not email:
        return jsonify({'error': 'Email parameter required'}), 400
    
    users = UserProfile.query.filter(
        UserProfile.email.ilike(f'%{email}%')
    ).limit(10).all()
    
    return jsonify([{
        'user_id': u.user_id,
        'email': u.email,
        'name': u.name
    } for u in users]), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Profil public d'un utilisateur"""
    user = UserProfile.query.filter_by(user_id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user_id': user.user_id,
        'email': user.email,
        'name': user.name
    }), 200

@users_bp.route('/profile', methods=['GET'])
@token_required
def get_my_profile():
    """Mon propre profil"""
    user = UserProfile.query.filter_by(user_id=g.user_id).first()
    if not user:
        return jsonify({'error': 'Profile not found'}), 404
    
    return jsonify({
        'user_id': user.user_id,
        'email': user.email,
        'name': user.name
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Mettre à jour son profil"""
    data = request.get_json()
    
    user = UserProfile.query.filter_by(user_id=g.user_id).first()
    if not user:
        user = UserProfile(user_id=g.user_id, email=g.user_email)
        db.session.add(user)
    
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200