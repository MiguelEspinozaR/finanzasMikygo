# AGENTS.md

Project: finanzasMikygo
Stack: Go + Gin (backend) / React + Vite + TypeScript (web) / Flutter (mobile)
Database: PostgreSQL

## Setup

```bash
# Backend
cd backend && go run cmd/server/main.go

# Frontend
cd web && npm install && npm run dev

# Despliegue persistente (Cloudflared)
./deploy-nohup.sh
```

## Comandos

- Backend: `cd backend && go run cmd/server/main.go`
- Frontend dev: `cd web && npm run dev`
- Frontend build: `cd web && npm run build`
- Deploy: `./deploy-nohup.sh`
- Stop: `./stop.sh`
- Status: `./status.sh`

## Convenciones

- Montos en centavos (BIGINT): 150 BOB = 15000
- Timezone: America/La_Paz (UTC-4)
- Frontend features en `web/src/features/`
- Backend layered: handler → service → repository
- Migraciones SQL manuales en `backend/migrations/`
