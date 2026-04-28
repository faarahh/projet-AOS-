from flask import Blueprint, request, jsonify, g
from models import db, Recipe, RecipeIngredient, MealPlan
from auth_middleware import token_required
from datetime import datetime
from collections import defaultdict

meals_bp = Blueprint('meals', __name__)


# ── GET /api/recipes?group_id=X ───────────────────────────────────────────────
@meals_bp.route('/recipes', methods=['GET'])
@token_required
def get_recipes():
    group_id = request.args.get('group_id', type=int)
    if group_id:
        recipes = Recipe.query.filter(
            (Recipe.group_id == group_id) | (Recipe.owner_id == g.user_id)
        ).all()
    else:
        recipes = Recipe.query.all()

    return jsonify([{
        'id':           r.id,
        'title':        r.title,
        'instructions': r.instructions,
        'group_id':     r.group_id,
        'ingredients':  [{'name': i.name, 'quantity': i.quantity, 'unit': i.unit}
                         for i in r.ingredients],
        'owner_id':     r.owner_id,
        'created_at':   r.created_at.isoformat() if r.created_at else None,
    } for r in recipes]), 200


# ── POST /api/recipes ─────────────────────────────────────────────────────────
@meals_bp.route('/recipes', methods=['POST'])
@token_required
def create_recipe():
    data = request.get_json() or {}
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    recipe = Recipe(
        title=data['title'],
        instructions=data.get('instructions', ''),
        owner_id=g.user_id,
        group_id=data.get('group_id'),
    )
    db.session.add(recipe)
    db.session.flush()

    for ingredient in data.get('ingredients', []):
        db.session.add(RecipeIngredient(
            recipe_id=recipe.id,
            name=ingredient['name'],
            quantity=float(ingredient.get('quantity', 1)),
            unit=ingredient.get('unit', 'unit'),
        ))

    db.session.commit()
    return jsonify({
        'id':          recipe.id,
        'title':       recipe.title,
        'group_id':    recipe.group_id,
        'ingredients': data.get('ingredients', []),
    }), 201


# ── GET /api/meal-plans?group_id=X ────────────────────────────────────────────
@meals_bp.route('/meal-plans', methods=['GET'])
@token_required
def get_meal_plans():
    group_id = request.args.get('group_id', type=int)
    if group_id:
        plans = MealPlan.query.filter_by(group_id=group_id).all()
    else:
        plans = MealPlan.query.filter_by(user_id=g.user_id).all()

    return jsonify([{
        'id':           p.id,
        'date':         p.date.isoformat() if hasattr(p.date, 'isoformat') else p.date,
        'meal_type':    p.meal_type,
        'recipe_id':    p.recipe_id,
        'recipe_title': p.recipe.title if p.recipe else None,
        'group_id':     p.group_id,
        'user_id':      p.user_id,
    } for p in plans]), 200


# ── POST /api/meal-plans ──────────────────────────────────────────────────────
@meals_bp.route('/meal-plans', methods=['POST'])
@meals_bp.route('/plan', methods=['POST'])
@token_required
def plan_meal():
    data = request.get_json() or {}
    if not all(k in data for k in ['date', 'meal_type', 'recipe_id']):
        return jsonify({'error': 'Missing required fields'}), 400

    recipe = Recipe.query.get_or_404(data['recipe_id'])
    group_id = data.get('group_id')

    meal_plan = MealPlan(
        user_id=g.user_id,
        group_id=group_id,
        date=datetime.fromisoformat(data['date']).date(),
        meal_type=data['meal_type'],
        recipe_id=data['recipe_id'],
    )
    db.session.add(meal_plan)
    db.session.commit()

    # Publish notification via lists-service notifications table
    # by calling a shared helper approach: store in lists-service DB
    # (meals-service publishes to RabbitMQ; notifications are read from lists-service)
    try:
        from rabbitmq_publisher import publish_event
        publish_event('meals.events', 'meals.notifications', {
            'event':      'meal.planned',
            'group_id':   group_id,
            'user_id':    g.user_id,
            'user_name':  g.user_name,
            'recipe':     recipe.title,
            'date':       meal_plan.date.isoformat(),
            'meal_type':  meal_plan.meal_type,
        })
    except Exception:
        pass   # RabbitMQ optional

    return jsonify({
        'id':           meal_plan.id,
        'date':         meal_plan.date.isoformat(),
        'meal_type':    meal_plan.meal_type,
        'recipe_id':    recipe.id,
        'recipe_title': recipe.title,
        'group_id':     group_id,
        'recipe':       {'id': recipe.id, 'title': recipe.title},
    }), 201


# ── DELETE /api/meal-plans/:id ────────────────────────────────────────────────
@meals_bp.route('/meal-plans/<int:plan_id>', methods=['DELETE'])
@token_required
def delete_meal_plan(plan_id):
    plan = MealPlan.query.get_or_404(plan_id)
    group_id = plan.group_id
    # group members can delete plans in their group
    if plan.user_id != g.user_id and not group_id:
        return jsonify({'error': 'Access denied'}), 403
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'message': 'Meal plan deleted'}), 200


# ── POST /api/generate-shopping-list ─────────────────────────────────────────
@meals_bp.route('/generate-shopping-list', methods=['POST'])
@token_required
def generate_shopping_list():
    data = request.get_json() or {}
    recipe_ids = data.get('recipe_ids', [])

    agg = defaultdict(lambda: {'quantity': 0, 'unit': 'unit'})
    for rid in recipe_ids:
        recipe = Recipe.query.get(rid)
        if recipe:
            for ing in recipe.ingredients:
                agg[ing.name]['quantity'] += ing.quantity
                agg[ing.name]['unit'] = ing.unit

    return jsonify({'ingredients': [
        {'name': n, 'quantity': v['quantity'], 'unit': v['unit']}
        for n, v in agg.items()
    ]}), 200
