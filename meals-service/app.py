"""
meals-service/app.py  (FIXED)
------------------------------
Same bug as lists-service: all routes were defined directly on `app`
without @token_required.  Fix: register meals_bp instead.
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os
import signal
import sys

from database import db, init_db
from routes import meals_bp                          # ← was never registered
from consul_registration import register_to_consul, deregister_from_consul

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})

# Init DB
init_db(app)

# Register blueprint – all routes now have @token_required
app.register_blueprint(meals_bp, url_prefix='/api')

# ── Health / root ─────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'meals'}), 200

@app.route('/')
def index():
    return jsonify({'message': 'Meals Service is running!'}), 200

# ── Graceful shutdown ─────────────────────────────────────────────────────────
def cleanup(signum, frame):
    print("\n🛑 Arrêt du service meals...")
    deregister_from_consul('meals')
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5003))

    print("🚀 Démarrage du Meals Service...")
    register_to_consul('meals', port)

    print(f"📌 Service sur http://localhost:{port}")
    print("🔄 Appuyez sur Ctrl+C pour arrêter")

    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    except KeyboardInterrupt:
        cleanup(None, None)
