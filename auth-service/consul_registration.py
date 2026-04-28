import requests
import os
import socket

CONSUL_HOST = os.getenv('CONSUL_HOST', 'localhost')
CONSUL_PORT = int(os.getenv('CONSUL_PORT', 8500))
CONSUL_URL  = f'http://{CONSUL_HOST}:{CONSUL_PORT}'


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'


def register_to_consul(service_name: str, port: int):
    service_id = f'{service_name}-{port}'
    ip         = get_local_ip()

    payload = {
        'ID':      service_id,
        'Name':    service_name,
        'Address': ip,
        'Port':    port,
        'Tags':    ['wams', service_name],
        'Check': {
            'HTTP':     f'http://{ip}:{port}/health',
            'Interval': '10s',
            'Timeout':  '3s',
        },
    }

    try:
        r = requests.put(
            f'{CONSUL_URL}/v1/agent/service/register',
            json=payload, timeout=5,
        )
        if r.status_code == 200:
            print(f'✅ Registered "{service_name}" with Consul at {ip}:{port}')
        else:
            print(f'⚠️  Consul registration failed: {r.status_code} {r.text}')
    except Exception as e:
        print(f'⚠️  Consul unavailable: {e}')


def deregister_from_consul(service_name: str, port: int = None):
    service_id = f'{service_name}-{port}' if port else service_name
    try:
        requests.put(f'{CONSUL_URL}/v1/agent/service/deregister/{service_id}', timeout=5)
        print(f'✅ Deregistered "{service_name}" from Consul')
    except Exception as e:
        print(f'⚠️  Could not deregister: {e}')
