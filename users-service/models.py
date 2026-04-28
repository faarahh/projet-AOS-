from database import db
from datetime import datetime


class User(db.Model):
    """Legacy model kept for backward compatibility."""
    __tablename__ = 'users'

    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    name       = db.Column(db.String(100))
    role       = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'email':      self.email,
            'name':       self.name,
            'role':       self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class UserProfile(db.Model):
    """
    Profile record synced from the auth-service.
    user_id matches the 'sub' claim in the JWT (auth-service User.id).
    Created automatically on first profile update; readable by other services.
    """
    __tablename__ = 'user_profiles'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, unique=True, nullable=False)   # FK → auth-service
    email      = db.Column(db.String(120), nullable=False)
    name       = db.Column(db.String(100), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'user_id':    self.user_id,
            'email':      self.email,
            'name':       self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
