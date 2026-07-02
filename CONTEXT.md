# CONTEXT.md - Gestor de Ingresos finanzasMikygo

## Visión General
Aplicación multiplataforma (Web + Android) para gestionar ingresos laborales con calendario interactivo, dashboard con gráficos y soporte para comprobantes de pago.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Go 1.26+ + Gin |
| DB Driver | pgx/v5 + pgxpool |
| DB Migrations | SQL scripts manuales |
| API Docs | swaggo/gin-swagger |
| Config | godotenv |
| Web Frontend | React 19 + Vite + TypeScript |
| Estilos | Tailwind CSS v3 |
| Gráficos | Recharts |
| Calendario | date-fns |
| State server | TanStack Query |
| Routing web | React Router v7 |
| Mobile | Flutter 3.44+ + Dart |
| State mobile | Riverpod 2.x |
| HTTP mobile | Dio |
| Calendario mobile | table_calendar |
| Gráficos mobile | fl_chart |
| Moneda | BOB (Bolivianos) |

## Estructura Monorepo

```
finanzasMikygo/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── config/config.go
│   │   ├── database/postgres.go
│   │   ├── handler/
│   │   │   ├── ingreso_handler.go
│   │   │   ├── dashboard_handler.go
│   │   │   └── sql_handler.go
│   │   ├── service/
│   │   │   ├── ingreso_service.go
│   │   │   └── dashboard_service.go
│   │   ├── repository/
│   │   │   ├── ingreso_repository.go
│   │   │   └── dashboard_repository.go
│   │   ├── model/ingreso.go
│   │   ├── dto/ingreso_dto.go
│   │   ├── router/router.go
│   │   └── middleware/cors.go
│   ├── migrations/
│   │   ├── 001_create_ingresos.up.sql
│   │   ├── 002_migrate_data_23_24.up.sql
│   │   ├── 003_migrate_data_25_26.up.sql
│   │   └── *.down.sql
│   ├── uploads/
│   ├── docs/
│   ├── go.mod
│   └── .env
├── web/
│   ├── src/
│   │   ├── features/dashboard/Dashboard.tsx
│   │   ├── features/registrar/RegistrarIngreso.tsx
│   │   ├── features/lista/ListaIngresos.tsx
│   │   ├── features/sql/SQLTab.tsx
│   │   ├── services/api.ts
│   │   ├── context/ThemeContext.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── mobile/
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/app.dart
│   │   ├── core/
│   │   │   ├── theme/app_theme.dart
│   │   │   ├── network/api_client.dart
│   │   │   ├── models/ingreso.dart
│   │   │   └── providers/providers.dart
│   │   └── features/
│   │       ├── dashboard/
│   │       │   ├── dashboard_screen.dart
│   │       │   └── widgets/summary_cards.dart
│   │       ├── registrar/registrar_screen.dart
│   │       └── lista/lista_screen.dart
│   └── pubspec.yaml
├── CONTEXT.md
├── run.bat
├── .env.example
└── .gitignore
```

## Schema PostgreSQL

```sql
CREATE TABLE ingresos (
    id SERIAL PRIMARY KEY,
    fecha_pago DATE NOT NULL,
    monto_enteros BIGINT NOT NULL,       -- centavos (150 BOB = 15000)
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('diario', 'semanal')),
    comentario TEXT,
    imagen_ruta VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ingreso_fechas_trabajo (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
    fecha_trabajo DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Datos Migrados

| Archivo | Registros | Fechas Trabajo | Período |
|---------|-----------|----------------|---------|
| 002_migrate_data_23_24.up.sql | 90 ingresos | No (sin datos) | 2023-04-17 a 2024-12-30 |
| 003_migrate_data_25_26.up.sql | 83 ingresos + 223 fechas | Sí (agrupados por pago) | 2025-01-06 a 2026-06-08 |
| **Total** | **173 ingresos** | **223 fechas** | **2023-2026** |

Scripts SQL guardados en `backend/migrations/` para re-ejecución futura.

## API Endpoints

```
POST   /api/v1/ingresos              # Crear ingreso
GET    /api/v1/ingresos              # Listar (filtros: fecha_inicio, fecha_fin, tipo, page, page_size)
GET    /api/v1/ingresos/:id          # Obtener por ID
PUT    /api/v1/ingresos/:id          # Actualizar
DELETE /api/v1/ingresos/:id          # Eliminar
POST   /api/v1/ingresos/upload       # Subir imagen
GET    /api/v1/ingresos/fechas-ocupadas?mes=&anio=  # Fechas ocupadas en calendario

GET    /api/v1/dashboard/summary?mes=&anio=          # Días trabajados/pago del mes
GET    /api/v1/dashboard/weekly?fecha=YYYY-MM-DD     # Ingresos semana (barras diarias)
GET    /api/v1/dashboard/monthly?mes=&anio=           # Ingresos mes (barras semanales)
GET    /api/v1/dashboard/yearly?anio=                 # Ingresos año (barras mensuales)
GET    /api/v1/dashboard/history                      # Histórico (líneas + promedio global)

POST   /api/v1/sql/execute           # Ejecutar query (dev only)
GET    /api/v1/sql/schema            # Info de tablas

GET    /swagger/*any                 # Swagger UI
```

## Reglas de Negocio

### Montos
- En DB: centavos (BIGINT) para evitar float
- En UI/API: siempre "XXX.XX BOB"
- Conversión: `monto_bob = monto_enteros / 100`

### Dashboard
- Navegación **independiente** por panel: semanas ← →, meses ← →, años ← →
- Panel semanal: acepta `?fecha=YYYY-MM-DD` para semana de referencia
- Panel histórico: línea de promedio **global constante** (no acumulada)
- Cards resumen: Días Trabajados, Días de Pago, Total Semanal, Total Mensual

### SQL Tab (solo dev)
- Editor de queries SQL
- Resultados en tabla
- Montos en BOB (columnas `monto_enteros` o `monto`)
- IDs y otros números **sin formatear**
- Esquema de tablas visible

### Calendario (Registrar Ingreso)
- Vista mensual con 3 herramientas: Trabajo, Pago, Quitar
- Días de registros anteriores: inmutables
- Tipo diario: 1 trabajo → 1 pago
- Tipo semanal: N trabajos → 1 pago

## Variables de Entorno

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finanzas_miky_go
DB_USER=postgres
DB_PASSWORD=1122
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10
CORS_ORIGIN=http://localhost:5173
SQL_DEV_ENABLED=true
```

## Ejecución

```bash
# Iniciar todo (backend + web + navegador)
run.bat

# O por separado:
cd backend && go run cmd/server/main.go    # :8080
cd web && npm run dev                       # :5173
cd mobile && flutter run                    # Emulador/dispositivo
```

## Estado de Implementación

| Fase | Estado |
|------|--------|
| Backend Go + Gin | ✅ Completo |
| API CRUD Ingresos | ✅ Completo |
| API Dashboard | ✅ Completo |
| Swagger docs | ✅ Generado |
| SQL Tab backend | ✅ Completo |
| DB + Migraciones | ✅ Ejecutadas (173 registros) |
| Web React + Tailwind | ✅ Completo |
| Dashboard con navegación | ✅ Completo |
| Registrar Ingreso (calendario) | ✅ Completo |
| Lista de Ingresos | ✅ Completo |
| SQL Tab frontend | ✅ Completo |
| Dark/Light mode | ✅ Completo |
| Flutter scaffold | ✅ Estructura creada |
| Flutter Dashboard | ✅ Completo |
| Flutter Registrar | ✅ Completo |
| Flutter Lista | ✅ Completo |
