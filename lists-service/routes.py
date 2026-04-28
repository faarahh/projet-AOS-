from flask import Blueprint, request, jsonify, g
from models import db, ShoppingList, ListItem, ListShare, Notification
from auth_middleware import token_required
from datetime import datetime

lists_bp = Blueprint('lists', __name__)


def _notify(group_id, user_id, user_name, message, ntype='list'):
    """Save a notification for every member of the group."""
    if not group_id:
        return
    n = Notification(
        group_id=group_id,
        user_id=user_id,
        user_name=user_name,
        type=ntype,
        message=message,
    )
    db.session.add(n)


def _can_access(list_obj):
    """True if current user owns the list OR is in its group OR has a share."""
    if list_obj.owner_id == g.user_id:
        return True
    if list_obj.group_id and list_obj.group_id == g.get('group_id'):
        return True
    if ListShare.query.filter_by(list_id=list_obj.id, user_id=g.user_id).first():
        return True
    return False


# ── POST /api/lists ───────────────────────────────────────────────────────────
@lists_bp.route('', methods=['POST'])
@token_required
def create_list():
    data = request.get_json() or {}
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    group_id = data.get('group_id')

    new_list = ShoppingList(
        title=data['title'],
        owner_id=g.user_id,
        group_id=group_id,
    )
    db.session.add(new_list)
    db.session.flush()

    _notify(group_id, g.user_id, g.user_name,
            f'{g.user_name} a créé la liste "{data["title"]}"')
    db.session.commit()

    return jsonify({
        'id':         new_list.id,
        'title':      new_list.title,
        'owner_id':   new_list.owner_id,
        'group_id':   new_list.group_id,
        'is_owner':   True,
        'created_at': new_list.created_at.isoformat(),
    }), 201


# ── GET /api/lists?group_id=X ─────────────────────────────────────────────────
@lists_bp.route('', methods=['GET'])
@token_required
def get_lists():
    group_id = request.args.get('group_id', type=int)

    if group_id:
        # All lists belonging to this group (visible to every member)
        group_lists = ShoppingList.query.filter_by(group_id=group_id).all()
        return jsonify([{
            'id':         l.id,
            'title':      l.title,
            'owner_id':   l.owner_id,
            'group_id':   l.group_id,
            'is_owner':   l.owner_id == g.user_id,
            'item_count': len(l.items),
            'created_at': l.created_at.isoformat(),
        } for l in group_lists]), 200

    # Fallback: personal lists + shared lists
    owned = ShoppingList.query.filter_by(owner_id=g.user_id).all()
    shared_ids = [s.list_id for s in ListShare.query.filter_by(user_id=g.user_id).all()]
    shared = ShoppingList.query.filter(ShoppingList.id.in_(shared_ids)).all()
    all_lists = {l.id: l for l in owned + shared}.values()

    return jsonify([{
        'id':         l.id,
        'title':      l.title,
        'owner_id':   l.owner_id,
        'group_id':   l.group_id,
        'is_owner':   l.owner_id == g.user_id,
        'item_count': len(l.items),
        'created_at': l.created_at.isoformat(),
    } for l in all_lists]), 200


# ── GET /api/lists/:id ────────────────────────────────────────────────────────
@lists_bp.route('/<int:list_id>', methods=['GET'])
@token_required
def get_list(list_id):
    lst = ShoppingList.query.get_or_404(list_id)

    # Group members can always read
    group_id = request.args.get('group_id', type=int)
    is_group_member = group_id and lst.group_id == group_id
    is_owner  = lst.owner_id == g.user_id
    has_share = ListShare.query.filter_by(list_id=list_id, user_id=g.user_id).first()

    if not (is_owner or is_group_member or has_share):
        return jsonify({'error': 'Access denied'}), 403

    return jsonify({
        'id':         lst.id,
        'title':      lst.title,
        'owner_id':   lst.owner_id,
        'group_id':   lst.group_id,
        'is_owner':   is_owner,
        'items': [{
            'id':       item.id,
            'name':     item.name,
            'quantity': item.quantity,
            'unit':     item.unit,
            'checked':  item.checked,
        } for item in lst.items],
        'created_at': lst.created_at.isoformat(),
    }), 200


# ── PUT /api/lists/:id ────────────────────────────────────────────────────────
@lists_bp.route('/<int:list_id>', methods=['PUT'])
@token_required
def update_list(list_id):
    lst = ShoppingList.query.get_or_404(list_id)
    if lst.owner_id != g.user_id:
        return jsonify({'error': 'Only owner can rename list'}), 403
    data = request.get_json() or {}
    if 'title' in data:
        lst.title = data['title']
    db.session.commit()
    return jsonify({'message': 'List updated'}), 200


# ── DELETE /api/lists/:id ─────────────────────────────────────────────────────
@lists_bp.route('/<int:list_id>', methods=['DELETE'])
@token_required
def delete_list(list_id):
    lst = ShoppingList.query.get_or_404(list_id)
    if lst.owner_id != g.user_id:
        return jsonify({'error': 'Only owner can delete list'}), 403

    _notify(lst.group_id, g.user_id, g.user_name,
            f'{g.user_name} a supprimé la liste "{lst.title}"')
    db.session.delete(lst)
    db.session.commit()
    return jsonify({'message': 'List deleted'}), 200


# ── POST /api/lists/:id/items ─────────────────────────────────────────────────
@lists_bp.route('/<int:list_id>/items', methods=['POST'])
@token_required
def add_item(list_id):
    lst = ShoppingList.query.get_or_404(list_id)

    data = request.get_json() or {}
    group_id = data.get('group_id') or lst.group_id

    is_owner  = lst.owner_id == g.user_id
    is_member = group_id and lst.group_id == group_id
    has_write = ListShare.query.filter_by(list_id=list_id, user_id=g.user_id, permission='write').first()
    if not (is_owner or is_member or has_write):
        return jsonify({'error': 'Access denied'}), 403

    if not data.get('name'):
        return jsonify({'error': 'Item name is required'}), 400

    item = ListItem(
        list_id=list_id,
        name=data['name'],
        quantity=data.get('quantity', 1),
        unit=data.get('unit', 'unit'),
    )
    db.session.add(item)

    _notify(lst.group_id, g.user_id, g.user_name,
            f'{g.user_name} a ajouté "{data["name"]}" dans "{lst.title}"')
    db.session.commit()

    return jsonify({'id': item.id, 'name': item.name,
                    'quantity': item.quantity, 'unit': item.unit, 'checked': False}), 201


# ── PUT /api/lists/:id/items/:item_id ─────────────────────────────────────────
@lists_bp.route('/<int:list_id>/items/<int:item_id>', methods=['PUT'])
@token_required
def update_item(list_id, item_id):
    item = ListItem.query.get_or_404(item_id)
    if item.list_id != list_id:
        return jsonify({'error': 'Item not found in this list'}), 404

    lst = ShoppingList.query.get(list_id)
    data = request.get_json() or {}
    group_id = data.get('group_id') or lst.group_id

    is_owner  = lst.owner_id == g.user_id
    is_member = group_id and lst.group_id == group_id
    has_write = ListShare.query.filter_by(list_id=list_id, user_id=g.user_id, permission='write').first()
    if not (is_owner or is_member or has_write):
        return jsonify({'error': 'Access denied'}), 403

    if 'name'     in data: item.name     = data['name']
    if 'quantity' in data: item.quantity = data['quantity']
    if 'unit'     in data: item.unit     = data['unit']
    if 'checked'  in data:
        item.checked = data['checked']
        action = 'a coché' if data['checked'] else 'a décoché'
        _notify(lst.group_id, g.user_id, g.user_name,
                f'{g.user_name} {action} "{item.name}" dans "{lst.title}"')

    db.session.commit()
    return jsonify({'message': 'Item updated'}), 200


# ── DELETE /api/lists/:id/items/:item_id ──────────────────────────────────────
@lists_bp.route('/<int:list_id>/items/<int:item_id>', methods=['DELETE'])
@token_required
def delete_item(list_id, item_id):
    item = ListItem.query.get_or_404(item_id)
    if item.list_id != list_id:
        return jsonify({'error': 'Item not found in this list'}), 404

    lst = ShoppingList.query.get(list_id)
    data = request.get_json(silent=True) or {}
    group_id = data.get('group_id') or lst.group_id

    is_owner  = lst.owner_id == g.user_id
    is_member = group_id and lst.group_id == group_id
    has_write = ListShare.query.filter_by(list_id=list_id, user_id=g.user_id, permission='write').first()
    if not (is_owner or is_member or has_write):
        return jsonify({'error': 'Access denied'}), 403

    item_name = item.name
    db.session.delete(item)
    _notify(lst.group_id, g.user_id, g.user_name,
            f'{g.user_name} a supprimé "{item_name}" de "{lst.title}"')
    db.session.commit()
    return jsonify({'message': 'Item deleted'}), 200


# ── GET /api/lists/notifications?group_id=X ──────────────────────────────────
@lists_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications():
    group_id = request.args.get('group_id', type=int)
    if not group_id:
        return jsonify([]), 200
    notifs = Notification.query.filter_by(group_id=group_id)\
                .order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([n.to_dict() for n in notifs]), 200


# ── PUT /api/lists/notifications/:id/read ────────────────────────────────────
@lists_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@token_required
def mark_read(notif_id):
    n = Notification.query.get_or_404(notif_id)
    n.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200


# ── PUT /api/lists/notifications/read-all ────────────────────────────────────
@lists_bp.route('/notifications/read-all', methods=['PUT'])
@token_required
def mark_all_read():
    group_id = request.args.get('group_id', type=int)
    if group_id:
        Notification.query.filter_by(group_id=group_id, is_read=False)\
            .update({'is_read': True})
        db.session.commit()
    return jsonify({'message': 'All marked as read'}), 200
