from database import db
from datetime import datetime
import random, string

class Group(db.Model):
    __tablename__ = 'groups'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    code       = db.Column(db.String(10), unique=True, nullable=False)
    owner_id   = db.Column(db.Integer, nullable=False)   # auth-service user id
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship('GroupMember', backref='group',
                              lazy=True, cascade='all, delete-orphan')

    @staticmethod
    def generate_code(name):
        prefix = (name[:3]).upper()
        suffix = ''.join(random.choices(string.digits, k=3))
        return prefix + suffix

    def to_dict(self, include_members=False):
        d = {
            'id':         self.id,
            'name':       self.name,
            'code':       self.code,
            'owner_id':   self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': len(self.members),
        }
        if include_members:
            d['members'] = [m.to_dict() for m in self.members]
        return d


class GroupMember(db.Model):
    __tablename__ = 'group_members'

    id         = db.Column(db.Integer, primary_key=True)
    group_id   = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    user_id    = db.Column(db.Integer, nullable=False)
    user_name  = db.Column(db.String(100), default='')
    user_email = db.Column(db.String(120), default='')
    joined_at  = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('group_id', 'user_id', name='uq_group_member'),
    )

    def to_dict(self):
        return {
            'user_id':    self.user_id,
            'user_name':  self.user_name,
            'user_email': self.user_email,
            'joined_at':  self.joined_at.isoformat() if self.joined_at else None,
        }
