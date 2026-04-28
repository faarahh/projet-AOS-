from database import db
from datetime import datetime

class Role(db.Model):
    __tablename__ = 'roles'

    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)  # 'user' | 'admin'

    users = db.relationship('User', backref='role', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}


class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role_id       = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'role':       self.role.name if self.role else 'user',
            'is_active':  self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
