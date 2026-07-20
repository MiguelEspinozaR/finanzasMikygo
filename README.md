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
- **Splits**: reparto de ingresos en cuentas bancarias por porcentaje
- **CRUD cuentas**: alias, banco, tipo, número, QR upload
- **QR modal**: visualización de QR + monto a transferir
- **OCR comprobantes**: extracción automática de fecha, monto y referencia
- Moneda BOB (Bolivianos), montos en centavos
- Dark/Light mode (web), system theme (mobile)
- Timezone: America/La_Paz (UTC-4)
- SQL Console (solo web, modo desarrollo)
- API REST con Swagger
- **Acceso externo**: frontend accesible desde red local o internet (Cloudflared)

## Ejecución Local

```bash
# Backend
cd backend && go run cmd/server/main.go    # :8080

# Frontend
cd web && npm run dev                       # :5173

# Mobile
cd mobile && flutter run                    # Emulador Android
```

## Despliegue con Cloudflared (persistente)

Los procesos sobreviven al cierre de la terminal SSH.

```bash
# Desplegar (backend + frontend + tunnel)
./deploy-nohup.sh

# Ver estado
./status.sh

# Detener servicios
./stop.sh
```

El despliegue genera una URL pública tipo `https://xxx.trycloudflare.com`.

## Estructura

```
finanzasMikygo/
├── backend/              # Go + Gin API
├── web/                  # React SPA
├── mobile/               # Flutter app
├── deploy-nohup.sh       # Despliegue persistente con Cloudflared
├── stop.sh               # Detener servicios
├── status.sh             # Ver estado de servicios
├── CONTEXT.md            # Documentación técnica completa
├── RELEASE_NOTES.md      # Notas de versión
├── AGENTS.md             # Configuración para agentes IA
└── .gitignore
```
