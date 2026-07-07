#!/bin/bash
# Finanzas Mikygo - Panel de Control (Linux)
# Requiere: gnome-terminal (Ubuntu/GNOME default)

DIR="$(cd "$(dirname "$0")" && pwd)"

show_menu() {
    clear
    echo "========================================"
    echo "   Finanzas Mikygo - Panel de Control"
    echo "========================================"
    echo ""
    echo "  [1] Iniciar todos"
    echo "  [2] Reiniciar todos"
    echo "  [3] Detener todos"
    echo "  [4] Abrir navegador"
    echo "  [5] Salir"
    echo "========================================"
    echo ""
}

start_servers() {
    echo "Iniciando Backend y Frontend en GNOME Terminal..."
    gnome-terminal \
        --tab --title="Backend :8080" -- bash -c "cd '$DIR/backend' && go run cmd/server/main.go; exec bash" \
        --tab --title="Frontend :5173" -- bash -c "cd '$DIR/web' && npm run dev; exec bash"
    sleep 5
    echo "Listo! Backend :8080 | Frontend :5173"
    echo ""
    xdg-open http://localhost:5173 2>/dev/null
}

stop_servers() {
    echo "Deteniendo servidores..."
    pkill -f "go run cmd/server/main.go" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    echo "Servidores detenidos."
    echo ""
}

while true; do
    show_menu
    read -p "Selecciona una opcion: " opt
    case $opt in
        1) start_servers ;;
        2)
            stop_servers
            sleep 2
            start_servers
            ;;
        3) stop_servers ;;
        4)
            xdg-open http://localhost:5173 2>/dev/null
            xdg-open http://localhost:8080/swagger/index.html 2>/dev/null
            ;;
        5) stop_servers; exit 0 ;;
        *) echo "Opcion invalida" ;;
    esac
    read -p "Presiona Enter para continuar..."
done
