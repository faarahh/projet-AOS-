from database import db
from datetime import datetime


class Recipe(db.Model):
    __tablename__ = 'recipes'

    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(200), nullable=False)
    instructions = db.Column(db.Text)
    owner_id     = db.Column(db.Integer, nullable=False)
    group_id     = db.Column(db.Integer, nullable=True)   # shared with group
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    ingredients = db.relationship(
        'RecipeIngredient', backref='recipe', lazy=True, cascade='all, delete-orphan'
    )


class RecipeIngredient(db.Model):
    __tablename__ = 'recipe_ingredients'

    id        = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    name      = db.Column(db.String(100), nullable=False)
    quantity  = db.Column(db.Float, default=1)
    unit      = db.Column(db.String(20), default='unit')


class MealPlan(db.Model):
    __tablename__ = 'meal_plans'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, nullable=False)
    group_id   = db.Column(db.Integer, nullable=True)   # shared with group
    date       = db.Column(db.Date, nullable=False)
    meal_type  = db.Column(db.String(20), nullable=False)
    recipe_id  = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recipe = db.relationship('Recipe')
