from flask import Flask, jsonify, request
from flask_cors import CORS
import os, signal, sys

from database import db, init_db
from routes import groups_bp
from consul_registration import register_to_consul, deregister_from_consul
from metrics import metrics_bp, record_request


# ─────────────────────────────
# 1️⃣ APP CREATION
# ─────────────────────────────
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})


# ─────────────────────────────
# 2️⃣ DB INIT
# ─────────────────────────────
init_db(app)


# ─────────────────────────────
# 3️⃣ BLUEPRINTS
# ─────────────────────────────
app.register_blueprint(groups_bp, url_prefix='/api/groups')
app.register_blueprint(metrics_bp)


# ─────────────────────────────
# 4️⃣ METRICS MIDDLEWARE
# ─────────────────────────────
@app.after_request
def after_request(response):
    record_request(request.method, request.path, response.status_code)
    return response


# ─────────────────────────────
# 5️⃣ ROUTES
# ─────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'groups'}), 200


@app.route('/')
def index():
    return jsonify({'message': 'Groups Service is running!'}), 200


# ─────────────────────────────
# 6️⃣ GRACEFUL SHUTDOWN
# ─────────────────────────────
def cleanup(signum, frame):
    print("\n🛑 Arrêt du service groups...")
    deregister_from_consul('groups')
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)


# ─────────────────────────────
# 7️⃣ START SERVICE
# ─────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5005))

    print("🚀 Démarrage du Groups Service...")
    register_to_consul('groups', port)

    print(f"📌 Service sur http://localhost:{port}")

    app.run(host='0.0.0.0', port=port, debug=False)