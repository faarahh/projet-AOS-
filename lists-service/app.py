from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import signal
import sys
import threading # AJOUTÉ pour le multi-threading
# ... (tes imports actuels)
import pika
import json
import time

from database import db, init_db
from routes import lists_bp
from consul_registration import register_to_consul, deregister_from_consul
from metrics import metrics_bp, record_request


# ─────────────────────────────────────
# 1️⃣ CREATE APP (IMPORTANT FIRST STEP)
# ─────────────────────────────────────
app = Flask(__name__)

# ─────────────────────────────────────
# 2️⃣ CONFIG (CORS, ETC.)
# ─────────────────────────────────────
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})


# ─────────────────────────────────────
# 3️⃣ METRICS BLUEPRINT
# ─────────────────────────────────────
app.register_blueprint(metrics_bp)


@app.after_request
def after_request(response):
    record_request(request.method, request.path, response.status_code)
    return response


# ─────────────────────────────────────
# 4️⃣ INIT DATABASE
# ─────────────────────────────────────
init_db(app)


# ─────────────────────────────────────
# 5️⃣ REGISTER BUSINESS BLUEPRINT
# ─────────────────────────────────────
app.register_blueprint(lists_bp, url_prefix='/api/lists')


# ─────────────────────────────────────
# 6️⃣ HEALTH CHECK ROUTES
# ─────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'lists'}), 200


@app.route('/')
def index():
    return jsonify({'message': 'Lists Service is running!'}), 200


# ─────────────────────────────────────
# 7️⃣ GRACEFUL SHUTDOWN
# ─────────────────────────────────────
def cleanup(signum, frame):
    print("\n🛑 Arrêt du service lists...")
    deregister_from_consul('lists')
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# ─────────────────────────────────────
# 8️⃣ RABBITMQ CONSUMER LOGIC
# ─────────────────────────────────────
# ... (vos autres imports et config Flask)

def start_rabbitmq_consumer():
    """Boucle de consommation résiliente avec reconnexion automatique."""
    while True:
        try:
            print(" [AMQP] ⏳ Tentative de connexion à RabbitMQ...")
            # Paramètres robustes pour Docker
            # Dans la fonction start_rabbitmq_consumer
            # On utilise la Gateway du réseau (172.19.0.1) qui distribue le trafic
            connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='172.19.0.1', port=5672, heartbeat=600)
) 
            
            channel = connection.channel()

            # Configuration des échanges et queues
            channel.exchange_declare(exchange='wams.meals', exchange_type='topic', durable=True)
            channel.queue_declare(queue='q_lists_update', durable=True)
            channel.queue_bind(exchange='wams.meals', queue='q_lists_update', routing_key='meal.created')

            def callback(ch, method, properties, body):
                try:
                    data = json.loads(body)
                    print(f" [AMQP] 📥 MESSAGE REÇU : {data}") # C'est ce print qu'on guette !
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    print(f" [AMQP] ❌ Erreur de traitement : {e}")

            channel.basic_consume(queue='q_lists_update', on_message_callback=callback)
            print(" [AMQP] ✅ Connecté ! En attente de messages...")
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError:
            print(" [AMQP] ❌ RabbitMQ est injoignable. Nouvelle tentative dans 5s...")
            time.sleep(5)
        except Exception as e:
            print(f" [AMQP] ⚠️ Erreur inattendue : {e}")
            time.sleep(5)

# ─────────────────────────────────────
# START APP
# ─────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))

    # On lance le thread AVANT app.run()
    cons_thread = threading.Thread(target=start_rabbitmq_consumer, daemon=True)
    cons_thread.start()

    register_to_consul('lists', port)
    app.run(host='0.0.0.0', port=port, debug=False)