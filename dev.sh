#!/bin/bash
# Finanzas Mikygo - Desarrollo con Air (live-reloading)
# El backend se reinicia automáticamente al detectar cambios en archivos .go

set -o pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Finanzas Mikygo - Modo Desarrollo${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Verificar que Air esté instalado
if ! command -v air &>/dev/null; then
    echo -e "${RED}✗${NC} Air no está instalado"
    echo ""
    echo "Instalar con:"
    echo "  go install github.com/air-verse/air@latest"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "$DIR/web/node_modules" ]; then
    echo -e "${CYAN}→${NC} Instalando dependencias del frontend..."
    cd "$DIR/web" && npm install
fi

echo -e "${CYAN}→${NC} Iniciando Backend con Air (live-reloading)..."
echo -e "${CYAN}→${NC} Iniciando Frontend con Vite..."
echo ""

# Iniciar Frontend en background
cd "$DIR/web"
nohup node_modules/.bin/vite --host 0.0.0.0 > /tmp/finanzas_frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$DIR"

echo -e "${GREEN}✓${NC} Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""

# Iniciar Backend con Air (foreground - se puede interrumpir con Ctrl+C)
cd "$DIR/backend"
air
