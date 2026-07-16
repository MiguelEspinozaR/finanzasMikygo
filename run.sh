#!/bin/bash
# Finanzas Mikygo - Panel de Control (WSL / Linux sin GUI)
# Ejecutar desde la raiz del proyecto: ./run.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PID=""
FRONTEND_PID=""
BACKEND_LOG="/tmp/finanzas_backend.log"
FRONTEND_LOG="/tmp/finanzas_frontend.log"

cleanup() {
    echo ""
    echo "Deteniendo servidores..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    pkill -f "go run cmd/server/main.go" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    echo "Servidores detenidos."
    exit 0
}

trap cleanup SIGINT SIGTERM

ensure_frontend_deps() {
    cd "$DIR/web"
    if [ ! -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
        echo "  Dependencias de Rollup no encontradas para Linux."
        echo "  Reinstalando node_modules..."
        rm -rf node_modules package-lock.json
        npm install
        echo ""
    fi
    cd "$DIR"
}

start_backend() {
    echo "Iniciando Backend en :8080..."
    cd "$DIR/backend"
    go run cmd/server/main.go > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    cd "$DIR"
}

start_frontend() {
    echo "Iniciando Frontend en :5173..."
    cd "$DIR/web"
    npm run dev > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    cd "$DIR"
}

show_status() {
    echo ""
    echo "========================================"
    echo "   Finanzas Mikygo - Servidores"
    echo "========================================"
    echo ""
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "  Backend  : http://localhost:8080      [PID $BACKEND_PID] OK"
    else
        echo "  Backend  : http://localhost:8080      [DETENIDO]"
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "  Frontend : http://localhost:5173      [PID $FRONTEND_PID] OK"
    else
        echo "  Frontend : http://localhost:5173      [DETENIDO]"
    fi
    echo ""
    echo "  Logs:"
    echo "    Backend  : tail -f $BACKEND_LOG"
    echo "    Frontend : tail -f $FRONTEND_LOG"
    echo ""
    echo "  Ctrl+C para detener todos"
    echo "========================================"
    echo ""
}

clear
echo "========================================"
echo "   Finanzas Mikygo - Panel de Control"
echo "========================================"
echo ""
echo "  Iniciando Backend y Frontend..."
echo ""

ensure_frontend_deps
start_backend
sleep 2
start_frontend
sleep 3

show_status

wait
