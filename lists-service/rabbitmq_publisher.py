import pika
import json
import os


def publish_event(exchange: str, routing_key: str, data: dict):
    """
    Publish an event to RabbitMQ.

    Bug fixed: routes.py calls publish_event(exchange, routing_key, data)
    with 3 arguments, but the original function only accepted 2
    (event_type, data), causing a TypeError on every item add/update/delete.
    """
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=os.getenv('RABBITMQ_HOST', 'localhost'),
                port=int(os.getenv('RABBITMQ_PORT', 5672)),
                connection_attempts=3,
                retry_delay=2,
            )
        )
        channel = connection.channel()

        channel.exchange_declare(
            exchange=exchange,
            exchange_type='topic',
            durable=True,
        )

        channel.basic_publish(
            exchange=exchange,
            routing_key=routing_key,
            body=json.dumps(data),
            properties=pika.BasicProperties(delivery_mode=2),  # persistent
        )

        connection.close()
        print(f"Event published → {exchange}/{routing_key}")

    except Exception as e:
        # Never crash the main request because of a messaging failure
        print(f"RabbitMQ error (non-fatal): {e}")
