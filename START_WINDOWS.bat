@echo off
REM ═══════════════════════════════════════════════════════════════════
REM WAMS — Déploiement complet (Windows)
REM Personne 5 : Infrastructure et Déploiement
REM ═══════════════════════════════════════════════════════════════════

echo [WAMS] Nettoyage de l'environnement precedent...
docker compose down -v --remove-orphans 2>nul

echo [WAMS] Etape 1 - Demarrage infrastructure (Consul + RabbitMQ + Traefik)...
docker compose up -d consul rabbitmq traefik

echo [WAMS] Attente 15 secondes pour RabbitMQ...
timeout /t 15 /nobreak >nul

echo [WAMS] Etape 2 - Build et demarrage des microservices...
docker compose up -d --build auth-service lists-service meals-service users-service group-service

echo [WAMS] Attente 10 secondes pour les services...
timeout /t 10 /nobreak >nul

echo [WAMS] Etape 3 - Demarrage du monitoring...
docker compose up -d prometheus grafana

echo.
echo ════════════════════════════════════════════════════
echo   WAMS - Tableau de bord des URLs
echo ════════════════════════════════════════════════════
echo   Frontend          : http://localhost:5173
echo   API via Traefik   : http://localhost:80
echo   Consul UI         : http://localhost:8500
echo   RabbitMQ UI       : http://localhost:15672
echo   Traefik Dashboard : http://localhost:8080
echo   Prometheus        : http://localhost:9090
echo   Grafana           : http://localhost:3000
echo ════════════════════════════════════════════════════
echo.
echo [WAMS] Verification des containers actifs :
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo [WAMS] Deploiement termine !
pause