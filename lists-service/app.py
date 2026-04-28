"""
lists-service/app.py  (FIXED)
------------------------------
Bug fixed: The original file defined all routes DIRECTLY on `app` without
any @token_required protection, completely bypassing the auth system.
The correct approach is to register lists_bp (which already has
@token_required on every route) and remove the duplicate unprotected routes.
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os
import signal
import sys

from database import db, init_db
from routes import lists_bp                          # ← was never registered
from consul_registration import register_to_consul, deregister_from_consul

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})

# Init DB
init_db(app)

# Register blueprint – all routes now have @token_required
app.register_blueprint(lists_bp, url_prefix='/api/lists')

# ── Health / root ─────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'lists'}), 200

@app.route('/')
def index():
    return jsonify({'message': 'Lists Service is running!'}), 200

# ── Graceful shutdown ─────────────────────────────────────────────────────────
def cleanup(signum, frame):
    print("\n🛑 Arrêt du service lists...")
    deregister_from_consul('lists')
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))

    print("🚀 Démarrage du Lists Service...")
    register_to_consul('lists', port)

    print(f"📌 Service sur http://localhost:{port}")
    print("🔄 Appuyez sur Ctrl+C pour arrêter")

    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    except KeyboardInterrupt:
        cleanup(None, None)
