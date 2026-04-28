"""
metrics.py — à copier dans chaque microservice Flask
Expose /metrics pour Prometheus (format texte simple, sans dépendance externe)
"""
import time
from flask import Blueprint, Response

metrics_bp = Blueprint('metrics', __name__)

# Compteurs en mémoire (simples, suffisants pour la démo)
_request_count = {}
_start_time = time.time()


def record_request(method: str, endpoint: str, status: int):
    """Appelé depuis un after_request hook dans app.py"""
    key = f'{method}_{endpoint}_{status}'
    _request_count[key] = _request_count.get(key, 0) + 1


@metrics_bp.route('/metrics')
def metrics():
    """Endpoint Prometheus — format texte/exposition"""
    uptime = time.time() - _start_time

    lines = [
        '# HELP wams_uptime_seconds Uptime du service en secondes',
        '# TYPE wams_uptime_seconds gauge',
        f'wams_uptime_seconds {uptime:.2f}',
        '',
        '# HELP wams_http_requests_total Nombre total de requêtes HTTP',
        '# TYPE wams_http_requests_total counter',
    ]

    for key, count in _request_count.items():
        parts = key.split('_', 2)
        if len(parts) == 3:
            method, endpoint, status = parts
            lines.append(
                f'wams_http_requests_total{{method="{method}",endpoint="{endpoint}",status="{status}"}} {count}'
            )

    output = '\n'.join(lines) + '\n'
    return Response(output, mimetype='text/plain; version=0.0.4; charset=utf-8')