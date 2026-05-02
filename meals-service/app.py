from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import signal
import sys
import pika
import json

from database import db, init_db
from routes import meals_bp
from consul_registration import register_to_consul, deregister_from_consul
from metrics import metrics_bp, record_request


# ─────────────────────────────
# 1️⃣ CREATE APP (IMPORTANT)
# ─────────────────────────────
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})


# ─────────────────────────────
# 2️⃣ INIT DB
# ─────────────────────────────
init_db(app)


# ─────────────────────────────
# 3️⃣ BLUEPRINTS
# ─────────────────────────────
app.register_blueprint(meals_bp, url_prefix='/api/meals')
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
    return jsonify({'status': 'healthy', 'service': 'meals'}), 200


@app.route('/')
def index():
    return jsonify({'message': 'Meals Service is running!'}), 200


# ─────────────────────────────
# 6️⃣ CLEAN SHUTDOWN
# ─────────────────────────────
def cleanup(signum, frame):
    print("\n🛑 Arrêt du service meals...")
    deregister_from_consul('meals')
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def publish_meal_event(meal_data):
    """
    Publie un événement de repas sur RabbitMQ avec gestion d'erreurs et persistance.
    """
    try:
        # 1. Tentative de connexion au host défini dans docker-compose
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='rabbitmq', connection_attempts=3, retry_delay=2)
        )
        channel = connection.channel()

        # 2. Déclaration de l'exchange (robuste)
        channel.exchange_declare(exchange='wams.meals', exchange_type='topic', durable=True)

        # 3. Préparation du message
        message = json.dumps(meal_data)
        
        # 4. Publication avec persistance (delivery_mode=2)
        channel.basic_publish(
            exchange='wams.meals',
            routing_key='meal.created',
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Rend le message persistant sur le disque
                content_type='application/json'
            )
        )

        # 5. Log de succès pour vos tests
        print(f" [AMQP] ✅ Succès : Message publié sur 'wams.meals' (routing: meal.created)")
        print(f" [AMQP] Contenu : {message}")

        connection.close()

    except pika.exceptions.AMQPConnectionError:
        print(" [AMQP] ❌ Erreur : Impossible de se connecter à RabbitMQ. Le message n'a pas été envoyé.")
    except Exception as e:
        print(f" [AMQP] ❌ Erreur inattendue : {str(e)}")


# ─────────────────────────────
# 7️⃣ START SERVICE
# ─────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5003))

    print("🚀 Démarrage du Meals Service...")

    register_to_consul('meals', port)

    print(f"📌 Service sur http://localhost:{port}")

    app.run(host='0.0.0.0', port=port, debug=False)