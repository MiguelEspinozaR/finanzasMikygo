# finanzasMikygo

Gestor de ingresos laborales multiplataforma (Web + Android).

## Stack

- **Backend:** Go + Gin + PostgreSQL (centavos como BIGINT)
- **Web:** React + Vite + TypeScript + Tailwind CSS + Recharts
- **Mobile:** Flutter + Riverpod + Dio + fl_chart + table_calendar

## Características

- Calendario interactivo con herramientas Trabajo/Pago/Quitar
- Múltiples pagos en la misma fecha (agrupados visualmente con subtotales)
- Dashboard con 4 gráficos (semanal, mensual, anual, histórico) y navegación independiente
- Ingresos agrupados por año con edición, eliminación y filtros
- Subida de comprobantes con drag & drop y preview
- Detalles de ingreso con día de semana en español
- Tipo de pago: QR / Efectivo
- Moneda BOB (Bolivianos), montos en centavos
- Dark/Light mode (web), system theme (mobile)
- Timezone: America/La_Paz (UTC-4)
- SQL Console (solo web, modo desarrollo)
- API REST con Swagger

## Ejecución

```bash
# Todo junto (backend + web + navegador)
run.bat

# Por separado
cd backend && go run cmd/server/main.go    # :8080
cd web && npm run dev                       # :5173
cd mobile && flutter run                    # Emulador Android
```

## Estructura

```
finanzasMikygo/
├── backend/          # Go + Gin API
├── web/              # React SPA
├── mobile/           # Flutter app
├── CONTEXT.md        # Documentación técnica completa
├── run.bat           # Panel de inicio rápido
└── .gitignore
```
