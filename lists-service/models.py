from database import db
from datetime import datetime


class ShoppingList(db.Model):
    __tablename__ = 'shopping_lists'

    id         = db.Column(db.Integer, primary_key=True)
    title      = db.Column(db.String(200), nullable=False)
    owner_id   = db.Column(db.Integer, nullable=False)
    group_id     = db.Column(db.Integer, nullable=True)   # shared with group
    meal_plan_id = db.Column(db.Integer, nullable=True)   # if generated from a meal plan
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    items  = db.relationship('ListItem',  backref='list', lazy=True, cascade='all, delete-orphan')
    shares = db.relationship('ListShare', backref='list', lazy=True, cascade='all, delete-orphan')


class ListItem(db.Model):
    __tablename__ = 'list_items'

    id       = db.Column(db.Integer, primary_key=True)
    list_id  = db.Column(db.Integer, db.ForeignKey('shopping_lists.id'), nullable=False)
    name     = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, default=1)
    unit     = db.Column(db.String(20), default='unit')
    checked  = db.Column(db.Boolean, default=False)


class ListShare(db.Model):
    __tablename__ = 'list_shares'

    id         = db.Column(db.Integer, primary_key=True)
    list_id    = db.Column(db.Integer, db.ForeignKey('shopping_lists.id'), nullable=False)
    user_id    = db.Column(db.Integer, nullable=False)
    permission = db.Column(db.String(10), default='write')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('list_id', 'user_id', name='uq_list_share'),
    )


class Notification(db.Model):
    __tablename__ = 'notifications'

    id         = db.Column(db.Integer, primary_key=True)
    group_id   = db.Column(db.Integer, nullable=False)
    user_id    = db.Column(db.Integer, nullable=False)   # who triggered it
    user_name  = db.Column(db.String(100), default='')
    type       = db.Column(db.String(20), default='list')  # list | meal | system
    message    = db.Column(db.String(300), nullable=False)
    is_read    = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'group_id':   self.group_id,
            'user_id':    self.user_id,
            'user_name':  self.user_name,
            'type':       self.type,
            'message':    self.message,
            'is_read':    self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
