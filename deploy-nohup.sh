#!/bin/bash
# Finanzas Mikygo - Despliegue persistente con nohup
# Los procesos siguen corriendo después de cerrar la terminal SSH

set -o pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="/tmp/finanzas_pids.txt"
TUNNEL_URL_FILE="/tmp/finanzas_tunnel_url.txt"
BACKEND_LOG="/tmp/finanzas_backend.log"
FRONTEND_LOG="/tmp/finanzas_frontend.log"
TUNNEL_LOG="/tmp/finanzas_tunnel.log"

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

# ==========================================
# Verificaciones previas
# ==========================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Finanzas Mikygo - Despliegue NoHup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

for cmd in git psql cloudflared go curl; do
    if ! command -v $cmd &>/dev/null; then
        err "$cmd no está instalado"
        exit 1
    fi
done

if ! command -v node &>/dev/null; then
    err "node no está instalado"
    exit 1
fi

if ! command -v npm &>/dev/null; then
    err "npm no está instalado"
    exit 1
fi

# ==========================================
# [1/6] Matar procesos anteriores
# ==========================================
echo -e "${CYAN}[1/6]${NC} Deteniendo procesos anteriores..."

if [ -f "$PID_FILE" ]; then
    while read -r pid; do
        kill "$pid" 2>/dev/null
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

pkill -9 -f "go run cmd/server/main.go" 2>/dev/null
pkill -9 -f "node.*vite" 2>/dev/null
pkill -9 -f "cloudflared tunnel" 2>/dev/null

if command -v fuser &>/dev/null; then
    fuser -k 8080/tcp 2>/dev/null
    fuser -k 5173/tcp 2>/dev/null
fi

sleep 2
ok "Procesos anteriores detenidos"

# ==========================================
# [2/6] Cloudflare tunnel
# ==========================================
echo ""
echo -e "${CYAN}[2/6]${NC} Iniciando tunnel Cloudflare..."

rm -f "$TUNNEL_LOG" "$TUNNEL_URL_FILE"

nohup cloudflared tunnel --url http://localhost:5173 > "$TUNNEL_LOG" 2>&1 &
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

echo "$TUNNEL_URL" > "$TUNNEL_URL_FILE"
ok "Tunnel activo: $TUNNEL_URL"

info "Configurando allowedHosts para $TUNNEL_URL..."
TUNNEL_HOST=$(echo "$TUNNEL_URL" | sed 's|https://||')
sed -i "s|allowedHosts: 'all'|allowedHosts: ['$TUNNEL_HOST']|g" "$DIR/web/vite.config.ts"
if grep -q "$TUNNEL_HOST" "$DIR/web/vite.config.ts"; then
    ok "allowedHosts configurado"
else
    warn "sed falló - allowedHosts no se actualizó"
fi

# ==========================================
# [3/6] Backend
# ==========================================
echo ""
echo -e "${CYAN}[3/6]${NC} Iniciando Backend..."

cd "$DIR/backend"
CORS_ORIGIN="$TUNNEL_URL" nohup go run cmd/server/main.go > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$DIR"

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
# [4/6] Frontend
# ==========================================
echo ""
echo -e "${CYAN}[4/6]${NC} Iniciando Frontend..."

cd "$DIR/web"
nohup node_modules/.bin/vite --host 0.0.0.0 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd "$DIR"

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
# [5/6] Guardar PIDs
# ==========================================
echo -e "${CYAN}[5/6]${NC} Guardando PIDs..."

cat > "$PID_FILE" << EOF
$TUNNEL_PID
$BACKEND_PID
$FRONTEND_PID
EOF

ok "PIDs guardados en $PID_FILE"

# NOTA: No restauramos allowedHosts aquí para que Vite siga funcionando
# Se restaura en stop.sh cuando el usuario detiene los servicios

# ==========================================
# [6/6] Status final
# ==========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Finanzas Mikygo - Desplegado ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Backend  : http://localhost:8080      [PID $BACKEND_PID]"
echo "  Frontend : http://localhost:5173      [PID $FRONTEND_PID]"
echo "  Tunnel   : $TUNNEL_URL               [PID $TUNNEL_PID]"
echo ""
echo -e "  ${GREEN}URL pública: $TUNNEL_URL${NC}"
echo ""
echo "  Para detener:  ./stop.sh"
echo "  Para estado:   ./status.sh"
echo "  Logs:          tail -f /tmp/finanzas_*.log"
echo -e "${GREEN}========================================${NC}"
echo ""
