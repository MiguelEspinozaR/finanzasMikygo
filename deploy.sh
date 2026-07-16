#!/bin/bash
# Finanzas Mikygo - Script de Despliegue Automático
# Ejecutar desde la raiz del proyecto: ./deploy.sh

set -o pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_LOG="/tmp/finanzas_backend.log"
FRONTEND_LOG="/tmp/finanzas_frontend.log"
TUNNEL_LOG="/tmp/finanzas_tunnel.log"
TUNNEL_URL=""
TUNNEL_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }

cleanup() {
    echo ""
    echo -e "${YELLOW}Deteniendo servidores...${NC}"
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null
    pkill -f "go run cmd/server/main.go" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    pkill -f "cloudflared tunnel" 2>/dev/null
    ok "Servidores detenidos."
    exit 0
}

trap cleanup SIGINT SIGTERM

# ==========================================
# Verificaciones previas
# ==========================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   Finanzas Mikygo - Despliegue${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if ! command -v git &>/dev/null; then
    err "git no está instalado"
    exit 1
fi

if ! command -v psql &>/dev/null; then
    err "psql no está instalado"
    exit 1
fi

if ! command -v cloudflared &>/dev/null; then
    err "cloudflared no está instalado"
    echo ""
    info "Instalar con:"
    echo "  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb"
    echo "  sudo dpkg -i /tmp/cloudflared.deb"
    exit 1
fi

if ! command -v go &>/dev/null; then
    warn "go no está en PATH, verificando /usr/local/go/bin..."
    if [ -f /usr/local/go/bin/go ]; then
        export PATH="/usr/local/go/bin:$PATH"
    else
        err "go no está instalado"
        exit 1
    fi
fi

# ==========================================
# [1/7] Pull y reset
# ==========================================
echo -e "${CYAN}[1/7]${NC} Actualizando código..."
cd "$DIR"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$CURRENT_BRANCH" != "main" ]; then
    info "Cambiando a branch main..."
    git checkout main 2>/dev/null
fi

git fetch origin main 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    ok "Código ya está actualizado"
else
    git reset --hard origin/main 2>/dev/null
    ok "Código actualizado ($(git log --oneline -1))"
fi

# ==========================================
# [2/7] Migraciones
# ==========================================
echo ""
echo -e "${CYAN}[2/7]${NC} Ejecutando migraciones..."

DB_HOST=$(grep DB_HOST "$DIR/backend/.env" 2>/dev/null | cut -d= -f2 || echo "localhost")
DB_PORT=$(grep DB_PORT "$DIR/backend/.env" 2>/dev/null | cut -d= -f2 || echo "5432")
DB_NAME=$(grep DB_NAME "$DIR/backend/.env" 2>/dev/null | cut -d= -f2 || echo "finanzas_miky_go")
DB_USER=$(grep DB_USER "$DIR/backend/.env" 2>/dev/null | cut -d= -f2 || echo "postgres")

MIGRATION_COUNT=0
for migration in $(ls "$DIR/backend/migrations/"*.up.sql 2>/dev/null | sort); do
    MIGRATION_NAME=$(basename "$migration")
    OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" 2>&1)
    if echo "$OUTPUT" | grep -q "ERROR"; then
        if echo "$OUTPUT" | grep -q "already exists"; then
            : # Ya existe, ignorar
        else
            warn "$MIGRATION_NAME: $(echo "$OUTPUT" | grep ERROR | head -1)"
        fi
    else
        MIGRATION_COUNT=$((MIGRATION_COUNT + 1))
    fi
done

if [ "$MIGRATION_COUNT" -gt 0 ]; then
    ok "$MIGRATION_COUNT migración(es) aplicada(s)"
else
    ok "Todas las migraciones ya están aplicadas"
fi

# ==========================================
# [3/7] Matar procesos anteriores
# ==========================================
echo ""
echo -e "${CYAN}[3/7]${NC} Deteniendo procesos anteriores..."

KILLED=0
if pgrep -f "go run cmd/server/main.go" >/dev/null 2>&1; then
    pkill -9 -f "go run cmd/server/main.go" 2>/dev/null
    KILLED=$((KILLED + 1))
fi
if pgrep -f "node.*vite" >/dev/null 2>&1; then
    pkill -9 -f "node.*vite" 2>/dev/null
    KILLED=$((KILLED + 1))
fi
if pgrep -f "cloudflared tunnel" >/dev/null 2>&1; then
    pkill -9 -f "cloudflared tunnel" 2>/dev/null
    KILLED=$((KILLED + 1))
fi

if [ "$KILLED" -gt 0 ]; then
    sleep 2
    ok "$KILLED proceso(s) detenido(s)"
else
    ok "No hay procesos anteriores"
fi

# ==========================================
# [4/7] Firewall
# ==========================================
echo ""
echo -e "${CYAN}[4/7]${NC} Configurando firewall..."

if command -v ufw &>/dev/null; then
    sudo ufw allow 8080/tcp >/dev/null 2>&1
    sudo ufw allow 5173/tcp >/dev/null 2>&1
    ok "Puertos 8080 y 5173 abiertos"
else
    warn "ufw no encontrado, verificando iptables..."
    if sudo iptables -C INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null; then
        ok "Puerto 8080 ya abierto"
    else
        sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null
        ok "Puerto 8080 abierto"
    fi
    if sudo iptables -C INPUT -p tcp --dport 5173 -j ACCEPT 2>/dev/null; then
        ok "Puerto 5173 ya abierto"
    else
        sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT 2>/dev/null
        ok "Puerto 5173 abierto"
    fi
fi

# ==========================================
# [5/7] Cloudflare tunnel
# ==========================================
echo ""
echo -e "${CYAN}[5/7]${NC} Iniciando tunnel Cloudflare..."

# Limpiar log anterior
rm -f "$TUNNEL_LOG"

cloudflared tunnel --url http://localhost:5173 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

info "Esperando URL del tunnel (PID $TUNNEL_PID)..."

for i in $(seq 1 30); do
    TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
    printf "."
done
echo ""

if [ -z "$TUNNEL_URL" ]; then
    err "No se pudo obtener URL del tunnel después de 30 segundos"
    echo ""
    info "Logs del tunnel:"
    tail -20 "$TUNNEL_LOG" 2>/dev/null
    exit 1
fi

ok "Tunnel activo: $TUNNEL_URL"

# ==========================================
# [6/7] Backend
# ==========================================
echo ""
echo -e "${CYAN}[6/7]${NC} Iniciando Backend..."

cd "$DIR/backend"
CORS_ORIGIN="$TUNNEL_URL" go run cmd/server/main.go > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$DIR"

# Esperar a que el backend esté listo
info "Esperando backend (PID $BACKEND_PID)..."
for i in $(seq 1 15); do
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        ok "Backend listo"
        break
    fi
    sleep 1
    printf "."
done
echo ""

if ! curl -s http://localhost:8080/health >/dev/null 2>&1; then
    err "Backend no respondió en 15 segundos"
    echo ""
    info "Logs del backend:"
    tail -20 "$BACKEND_LOG" 2>/dev/null
    exit 1
fi

# ==========================================
# [7/7] Frontend
# ==========================================
echo ""
echo -e "${CYAN}[7/7]${NC} Iniciando Frontend..."

cd "$DIR/web"
node_modules/.bin/vite --host 0.0.0.0 --allowed-hosts all > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd "$DIR"

# Esperar a que el frontend esté listo
info "Esperando frontend (PID $FRONTEND_PID)..."
for i in $(seq 1 10); do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        ok "Frontend listo"
        break
    fi
    sleep 1
    printf "."
done
echo ""

# ==========================================
# Status final
# ==========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Finanzas Mikygo - Desplegado ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Backend  : http://localhost:8080      [PID $BACKEND_PID]"
echo "  Frontend : http://localhost:5173      [PID $FRONTEND_PID]"
echo "  Tunnel   : $TUNNEL_URL"
echo ""
echo -e "  ${GREEN}URL pública: $TUNNEL_URL${NC}"
echo ""
echo "  Logs:"
echo "    Backend  : tail -f $BACKEND_LOG"
echo "    Frontend : tail -f $FRONTEND_LOG"
echo "    Tunnel   : tail -f $TUNNEL_LOG"
echo ""
echo "  Ctrl+C para detener todos"
echo -e "${GREEN}========================================${NC}"
echo ""

wait
