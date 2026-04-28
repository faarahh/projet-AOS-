from flask import Flask, jsonify , request 
from flask_cors import CORS
import os
import signal
import sys

from metrics import metrics_bp, record_request
from database import db, init_db
from models import User, Role
from routes import auth_bp
from consul_registration import register_to_consul, deregister_from_consul

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})

# 2. Enregistrer le blueprint (après app = Flask(__name__))
app.register_blueprint(metrics_bp)


# 3. Ajouter ce hook after_request
@app.after_request
def after_request(response):
    record_request(request.method, request.path, response.status_code)
    return response 


# Init DB
init_db(app)

# Register blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# ── Health check ──────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'auth'}), 200

@app.route('/')
def index():
    return jsonify({'message': 'Auth Service is running!'}), 200

# ── Seed default roles + admin on first startup ───────────────────────────────
def seed_data():
    with app.app_context():
        # Roles
        for role_name in ['user', 'admin']:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))
        db.session.commit()

        # Default admin user
        if not User.query.filter_by(email='admin@wams.com').first():
            from werkzeug.security import generate_password_hash
            admin_role = Role.query.filter_by(name='admin').first()
            admin = User(
                name='Admin WAMS',
                email='admin@wams.com',
                password_hash=generate_password_hash('Admin@1234'),
                role_id=admin_role.id,
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Default admin seeded: admin@wams.com / Admin@1234")

# ── Graceful shutdown ─────────────────────────────────────────────────────────
def cleanup(signum, frame):
    print("\n🛑 Arrêt du service auth...")
    deregister_from_consul('auth')
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))

    print(" Démarrage du Auth Service...")
    seed_data()
    register_to_consul('auth', port)

    print(f" Service sur http://localhost:{port}")
    print(" Base de données: auth.db")
    print(" Appuyez sur Ctrl+C pour arrêter")

    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    except KeyboardInterrupt:
        cleanup(None, None)
