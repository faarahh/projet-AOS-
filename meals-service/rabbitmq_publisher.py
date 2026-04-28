import pika
import json
import os

def publish_event(event_type, data):
    """Publier un événement dans RabbitMQ"""
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=os.getenv('RABBITMQ_HOST', 'localhost'),
                port=int(os.getenv('RABBITMQ_PORT', 5672))
            )
        )
        channel = connection.channel()
        
        # Déclarer l'exchange
        channel.exchange_declare(
            exchange='meals.events',
            exchange_type='topic',
            durable=True
        )
        
        message = {
            'event': event_type,
            'data': data
        }
        
        channel.basic_publish(
            exchange='meals.events',
            routing_key='meals.notifications',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )
        
        connection.close()
        print(f"📨 Événement publié: {event_type}")
        
    except Exception as e:
        print(f"⚠️ Erreur RabbitMQ: {e}")