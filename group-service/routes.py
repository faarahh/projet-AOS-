from flask import Blueprint, request, jsonify, g
from models import db, Group, GroupMember
from auth_middleware import token_required

groups_bp = Blueprint('groups', __name__)


# ── POST /api/groups  — create a group ───────────────────────────────────────
@groups_bp.route('', methods=['POST'])
@token_required
def create_group():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Group name is required'}), 400

    # Generate a unique code, retry on collision
    for _ in range(5):
        code = Group.generate_code(name)
        if not Group.query.filter_by(code=code).first():
            break

    group = Group(name=name, code=code, owner_id=g.user_id)
    db.session.add(group)
    db.session.flush()

    # Owner is automatically a member
    member = GroupMember(
        group_id=group.id,
        user_id=g.user_id,
        user_name=g.user_name or g.user_email,
        user_email=g.user_email,
    )
    db.session.add(member)
    db.session.commit()

    return jsonify(group.to_dict(include_members=True)), 201


# ── GET /api/groups/mine  — all groups the current user belongs to ───────────
@groups_bp.route('/mine', methods=['GET'])
@token_required
def get_my_groups():
    memberships = GroupMember.query.filter_by(user_id=g.user_id).all()
    group_ids   = [m.group_id for m in memberships]
    groups      = Group.query.filter(Group.id.in_(group_ids)).all()
    return jsonify([grp.to_dict(include_members=True) for grp in groups]), 200


# ── GET /api/groups/by-code/<code>  — preview a group before joining ─────────
@groups_bp.route('/by-code/<string:code>', methods=['GET'])
@token_required
def get_group_by_code(code):
    group = Group.query.filter_by(code=code.upper()).first()
    if not group:
        return jsonify({'error': 'Invalid code — group not found'}), 404
    return jsonify(group.to_dict(include_members=True)), 200


# ── GET /api/groups/<id>  — detail of one group ───────────────────────────────
@groups_bp.route('/<int:group_id>', methods=['GET'])
@token_required
def get_group(group_id):
    group = Group.query.get_or_404(group_id)
    # Must be a member
    if not GroupMember.query.filter_by(group_id=group_id, user_id=g.user_id).first():
        return jsonify({'error': 'Access denied'}), 403
    return jsonify(group.to_dict(include_members=True)), 200


# ── POST /api/groups/join  — join by code ────────────────────────────────────
@groups_bp.route('/join', methods=['POST'])
@token_required
def join_group():
    data = request.get_json() or {}
    code = data.get('code', '').strip().upper()
    if not code:
        return jsonify({'error': 'Code is required'}), 400

    group = Group.query.filter_by(code=code).first()
    if not group:
        return jsonify({'error': 'Invalid code — group not found'}), 404

    # Already a member?
    if GroupMember.query.filter_by(group_id=group.id, user_id=g.user_id).first():
        return jsonify({'error': 'You are already a member of this group'}), 409

    member = GroupMember(
        group_id=group.id,
        user_id=g.user_id,
        user_name=g.user_name or g.user_email,
        user_email=g.user_email,
    )
    db.session.add(member)
    db.session.commit()

    return jsonify(group.to_dict(include_members=True)), 200


# ── DELETE /api/groups/<id>/leave  — leave a group ───────────────────────────
@groups_bp.route('/<int:group_id>/leave', methods=['DELETE'])
@token_required
def leave_group(group_id):
    group = Group.query.get_or_404(group_id)

    # Owner cannot leave — must delete
    if group.owner_id == g.user_id:
        return jsonify({'error': 'Owner cannot leave — delete the group instead'}), 400

    member = GroupMember.query.filter_by(group_id=group_id, user_id=g.user_id).first()
    if not member:
        return jsonify({'error': 'You are not a member of this group'}), 404

    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Left group successfully'}), 200


# ── DELETE /api/groups/<id>  — delete a group (owner only) ───────────────────
@groups_bp.route('/<int:group_id>', methods=['DELETE'])
@token_required
def delete_group(group_id):
    group = Group.query.get_or_404(group_id)
    if group.owner_id != g.user_id:
        return jsonify({'error': 'Only the owner can delete this group'}), 403

    db.session.delete(group)   # cascade deletes all members
    db.session.commit()
    return jsonify({'message': 'Group deleted successfully'}), 200


# ── GET /api/groups/<id>/members  — list members ─────────────────────────────
@groups_bp.route('/<int:group_id>/members', methods=['GET'])
@token_required
def get_members(group_id):
    if not GroupMember.query.filter_by(group_id=group_id, user_id=g.user_id).first():
        return jsonify({'error': 'Access denied'}), 403
    members = GroupMember.query.filter_by(group_id=group_id).all()
    return jsonify([m.to_dict() for m in members]), 200
