#!/bin/bash
# Finanzas Mikygo - Verificar estado de servicios

PID_FILE="/tmp/finanzas_pids.txt"
TUNNEL_URL_FILE="/tmp/finanzas_tunnel_url.txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "========================================"
echo "  Estado de servicios"
echo "========================================"
echo ""

# Backend
if curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "  Backend  : ${GREEN}ACTIVO${NC}  (puerto 8080)"
else
    echo -e "  Backend  : ${RED}INACTIVO${NC}"
fi

# Frontend
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo -e "  Frontend : ${GREEN}ACTIVO${NC}  (puerto 5173)"
else
    echo -e "  Frontend : ${RED}INACTIVO${NC}"
fi

# Tunnel
if [ -f "$TUNNEL_URL_FILE" ]; then
    TUNNEL_URL=$(cat "$TUNNEL_URL_FILE" 2>/dev/null)
    if pgrep -f "cloudflared tunnel" >/dev/null 2>&1; then
        echo -e "  Tunnel   : ${GREEN}ACTIVO${NC}"
        echo ""
        echo -e "  URL pública: ${GREEN}$TUNNEL_URL${NC}"
    else
        echo -e "  Tunnel   : ${YELLOW}DETENIDO${NC} (URL expirada)"
        echo -e "  URL anterior: $TUNNEL_URL"
    fi
else
    echo -e "  Tunnel   : ${RED}INACTIVO${NC}"
fi

echo ""
echo "========================================"
echo ""
