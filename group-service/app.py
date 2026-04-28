from flask import Flask, jsonify
from flask_cors import CORS
import os, signal, sys

from database import db, init_db
from routes import groups_bp
from consul_registration import register_to_consul, deregister_from_consul

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})

init_db(app)
app.register_blueprint(groups_bp, url_prefix='/api/groups')

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'groups'}), 200

@app.route('/')
def index():
    return jsonify({'message': 'Groups Service is running!'}), 200

def cleanup(signum, frame):
    print("\n🛑 Arrêt du service groups...")
    deregister_from_consul('groups')
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5005))
    print("🚀 Démarrage du Groups Service...")
    register_to_consul('groups', port)
    print(f"📌 Service sur http://localhost:{port}")
    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    except KeyboardInterrupt:
        cleanup(None, None)
