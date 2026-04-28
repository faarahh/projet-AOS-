#!/bin/bash
# =============================================================================
#  WAMS – start all services in separate terminals (Linux/Mac)
#  For Windows: run each "python app.py" command in a separate CMD window
# =============================================================================

set -e

export JWT_SECRET="wams-jwt-secret-2025-change-in-prod"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║           WAMS – Starting all services       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Helper: install requirements if needed
install() {
  local dir="$1"
  cd "$ROOT/$dir"
  if [ ! -f ".installed" ]; then
    echo "📦 Installing $dir dependencies..."
    pip install -r requirements.txt -q
    touch .installed
  fi
}

# Install all
install auth-service
install lists-service
install meals-service
install users-service
install group-service

# Start each service in background
echo "🚀 Starting services..."
echo ""

cd "$ROOT/auth-service"   && python app.py &
sleep 1
cd "$ROOT/lists-service"  && python app.py &
sleep 1
cd "$ROOT/meals-service"  && python app.py &
sleep 1
cd "$ROOT/users-service"  && python app.py &
sleep 1
cd "$ROOT/group-service"  && python app.py &
sleep 1

# Start frontend
echo ""
echo "🌐 Starting frontend (http://localhost:5173)..."
cd "$ROOT/frontend"
npm install --silent 2>/dev/null
npm run dev &

echo ""
echo "✅ All services started!"
echo ""
echo "  Frontend    →  http://localhost:5173"
echo "  Auth        →  http://localhost:5001"
echo "  Lists       →  http://localhost:5002"
echo "  Meals       →  http://localhost:5003"
echo "  Users       →  http://localhost:5004"
echo "  Groups      →  http://localhost:5005"
echo ""
echo "  Default login: admin@wams.com / Admin@1234"
echo ""
echo "Press Ctrl+C to stop all services"

wait
