#!/bin/bash
# Finanzas Mikygo - Detener servicios

DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="/tmp/finanzas_pids.txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "Deteniendo servicios..."

KILLED=0

# Matar por PID guardado
if [ -f "$PID_FILE" ]; then
    while read -r pid; do
        if kill "$pid" 2>/dev/null; then
            KILLED=$((KILLED + 1))
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# Matar procesos residuales
pkill -f "go run cmd/server/main.go" 2>/dev/null && KILLED=$((KILLED + 1))
pkill -f "node.*vite" 2>/dev/null && KILLED=$((KILLED + 1))
pkill -f "cloudflared tunnel" 2>/dev/null && KILLED=$((KILLED + 1))

# Liberar puertos
if command -v fuser &>/dev/null; then
    fuser -k 8080/tcp 2>/dev/null
    fuser -k 5173/tcp 2>/dev/null
fi

# Restaurar allowedHosts a 'all' para desarrollo local
sed -i "s|allowedHosts: \['.*'\]|allowedHosts: 'all'|g" "$DIR/web/vite.config.ts"

if [ "$KILLED" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Servicios detenidos ($KILLED proceso(s))"
else
    echo -e "${GREEN}✓${NC} No había procesos ejecutándose"
fi
echo ""
