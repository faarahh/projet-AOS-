import requests
import socket
import os

def register_to_consul(service_name, port):
    """Enregistrer le service dans Consul"""
    try:
        service_id = f"{service_name}-{socket.gethostname()}"
        host_ip = socket.gethostbyname(socket.gethostname())
        
        registration_data = {
            "ID": service_id,
            "Name": service_name,
            "Address": host_ip,
            "Port": port,
            "Check": {
                "HTTP": f"http://{host_ip}:{port}/health",
                "Interval": "10s",
                "Timeout": "5s",
                "DeregisterCriticalServiceAfter": "30s"
            }
        }
        
        consul_host = os.getenv('CONSUL_HOST', 'localhost')
        consul_port = os.getenv('CONSUL_PORT', 8500)
        
        response = requests.put(
            f"http://{consul_host}:{consul_port}/v1/agent/service/register",
            json=registration_data
        )
        
        if response.status_code == 200:
            print(f"✅ Service {service_name} enregistré dans Consul")
            print(f"   ID: {service_id}")
            print(f"   Adresse: {host_ip}:{port}")
            return True
        else:
            print(f"⚠️ Erreur Consul: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"⚠️ Impossible de se connecter à Consul (service continue sans enregistrement)")
        return False
    except Exception as e:
        print(f"❌ Erreur Consul: {e}")
        return False

def deregister_from_consul(service_name):
    """Désenregistrer le service de Consul"""
    try:
        service_id = f"{service_name}-{socket.gethostname()}"
        consul_host = os.getenv('CONSUL_HOST', 'localhost')
        consul_port = os.getenv('CONSUL_PORT', 8500)
        
        response = requests.put(
            f"http://{consul_host}:{consul_port}/v1/agent/service/deregister/{service_id}"
        )
        
        if response.status_code == 200:
            print(f"✅ Service {service_name} désenregistré de Consul")
            return True
    except Exception as e:
        print(f"❌ Erreur désenregistrement: {e}")
        return False