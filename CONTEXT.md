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
| Timezone | America/La_Paz (UTC-4) |
| Web Frontend | React 19 + Vite + TypeScript |
| Estilos | Tailwind CSS v3 |
| Gráficos | Recharts |
| OCR | Tesseract.js (client-side, español) |
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
│   │   ├── config/config.go          # Location = America/La_Paz
│   │   ├── database/postgres.go
│   │   ├── handler/
│   │   │   ├── ingreso_handler.go
│   │   │   ├── dashboard_handler.go
│   │   │   └── sql_handler.go
│   │   ├── service/
│   │   │   ├── ingreso_service.go    # splitMonto, ParseInLocation
│   │   │   └── dashboard_service.go
│   │   ├── repository/
│   │   │   ├── ingreso_repository.go
│   │   │   └── dashboard_repository.go
│   │   ├── model/ingreso.go          # FechaTrabajo struct
│   │   ├── dto/ingreso_dto.go        # FechaTrabajoRequest/Response
│   │   ├── router/router.go
│   │   └── middleware/cors.go
│   ├── migrations/
│   │   ├── 001_create_ingresos.up.sql
│   │   ├── 002_migrate_data_23_24.up.sql
│   │   ├── 003_migrate_data_25_26.up.sql
│   │   ├── 004_fill_missing_work_dates.up.sql
│   │   ├── 005_add_monto_to_fechas_trabajo.up.sql
│   │   ├── 006_backfill_monto_fechas_trabajo.sql
│   │   ├── 007_change_tipo_to_qr_efectivo.up.sql
│   │   ├── 007_change_tipo_to_qr_efectivo.down.sql
│   │   └── *.down.sql
│   ├── uploads/
│   ├── docs/
│   ├── go.mod
│   └── .env
├── web/
│   ├── src/
│   │   ├── features/dashboard/Dashboard.tsx
│   │   ├── features/registrar/RegistrarIngreso.tsx
│   │   ├── features/ingresos/Ingresos.tsx
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
│   │   │   ├── models/ingreso.dart   # FechaTrabajo, UpdateIngresoRequest
│   │   │   └── providers/providers.dart
│   │   └── features/
│   │       ├── dashboard/
│   │       │   ├── dashboard_screen.dart
│   │       │   └── widgets/summary_cards.dart
│   │       ├── registrar/registrar_screen.dart
│   │       └── ingresos/ingresos_screen.dart
│   ├── pubspec.yaml
│   └── android/
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
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('qr', 'efectivo')),
    comentario TEXT,
    imagen_ruta VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ingreso_fechas_trabajo (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
    fecha_trabajo DATE NOT NULL,
    monto_enteros BIGINT NOT NULL DEFAULT 0,  -- monto distribuido por día
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Datos Migrados

| Archivo | Registros | Fechas Trabajo | Período |
|---------|-----------|----------------|---------|
| 002_migrate_data_23_24.up.sql | 90 ingresos | 90 (fill_missing) | 2023-04-17 a 2024-12-30 |
| 003_migrate_data_25_26.up.sql | 83 ingresos | 223 | 2025-01-06 a 2026-06-08 |
| 005 + 006 (backfill) | — | 313 (con montos) | — |
| **Total** | **173 ingresos** | **313 fechas** | **2023-2026** |

Scripts SQL guardados en `backend/migrations/` para re-ejecución futura.

## API Endpoints

```
POST   /api/v1/ingresos              # Crear ingreso (splitMonto automático)
GET    /api/v1/ingresos              # Listar (filtros: fecha_inicio, fecha_fin, tipo, page, page_size)
GET    /api/v1/ingresos/:id          # Obtener por ID
PUT    /api/v1/ingresos/:id          # Actualizar
DELETE /api/v1/ingresos/:id          # Eliminar
POST   /api/v1/ingresos/upload       # Subir imagen (acepta ingreso_id → pago_{id}.{ext})
GET    /api/v1/ingresos/fechas-ocupadas?mes=&anio=  # Fechas ocupadas (map[string][]string)

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

### Distribución de Monto (splitMonto)
- **qr**: `FLOOR(total / n)` para los primeros n-1 días, residuo en el último (antes "semanal")
- **efectivo**: el monto completo va a cada día (antes "diario")
- Aplicado al crear, actualizar, y en backfill (006)

### Fechas Ocupadas
- Retorna `map[string][]string` — cada fecha puede tener `["trabajo"]`, `["pago"]`, o `["trabajo","pago"]`
- Permite que trabajo y pago coincidan en la misma fecha

### Timezone
- Backend: `time.ParseInLocation` con `America/La_Paz` (UTC-4)
- Frontend web: `new Date(str.replace('T00:00:00Z', 'T00:00:00'))` para forzar hora local

### Dashboard
- Navegación **independiente** por panel: semanas ← →, meses ← →, años ← →
- Panel semanal: acepta `?fecha=YYYY-MM-DD` para semana de referencia
- Panel histórico: línea de promedio **global constante** (no acumulada)
- Cards resumen: Días Trabajados, Días de Pago, Total Semanal, Total Mensual

### Calendario (Registrar Ingreso)
- Vista mensual con 3 herramientas: Trabajo, Pago, Quitar
- Trabajo y pago **pueden coincidir** en la misma fecha
- Trabajo seleccionado: borde azul (`border-2 border-blue-500`)
- Pago seleccionado: fondo verde (`bg-green-500`)
- Ambos: fondo verde + borde azul
- Trabajo registrado (histórico): fondo azul claro
- Pago registrado (histórico): borde verde
- Ambos registrados: fondo azul claro + borde verde
- Días de registros anteriores: inmutables

### Upload de Imagen
- Flujo: crear ingreso → upload con `ingreso_id` → backend guarda como `pago_{id}.{ext}`
- El backend actualiza `imagen_ruta` en la DB automáticamente al subir con `ingreso_id`
- Si no se provee `ingreso_id`, guarda como `upload_{timestamp}.{ext}`
- Frontend: zona de drag & drop con preview y botón de eliminar

### Pagos Duplicados
- Se permiten múltiples ingresos con la misma `fecha_pago`
- Herramienta `trabajo`: bloqueada si la fecha ya tiene un pago registrado
- Herramienta `pago`: siempre permite registrar en fechas existentes
- Herramienta `quitar`: siempre permite operar
- En la tabla de ingresos, los registros del mismo día se agrupan visualmente con fondo sutil y fila de subtotal

### Detalles de Ingreso
- Calendario eliminado del modal de detalles
- Lista de días trabajados muestra día de la semana en español: `dd/MM/yyyy (EEEE)` → "15/06/2026 (lunes)"
- Sección Comentario siempre visible: "Ingreso sin comentarios" si está vacío
- Sección Comprobante siempre visible: "Ingreso sin comprobante" si no hay imagen

### SQL Tab (solo dev)
- Editor de queries SQL
- Resultados en tabla
- Montos en BOB (columnas `monto_enteros` o `monto`)
- IDs y otros números **sin formatear**
- Esquema de tablas visible

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
# Windows (abre Windows Terminal con 2 pestañas)
run.bat

# Ubuntu (abre GNOME Terminal con 2 pestañas)
chmod +x run.sh
./run.sh

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
| DB + Migraciones | ✅ Ejecutadas (174 registros, 313 fechas_trabajo, tablas splits) |
| Timezone (La_Paz) | ✅ Implementado |
| Web React + Tailwind | ✅ Completo |
| Dashboard con navegación | ✅ Completo |
| Registrar Ingreso (calendario + drag & drop) | ✅ Completo |
| OCR comprobantes bancarios (Tesseract.js) | ✅ Completo |
| Ingresos (agrupados por año, pagos duplicados, subtotales) | ✅ Completo |
| Detalles (día español, fallbacks) | ✅ Completo |
| Splits (reparto de ingresos en cuentas) | ✅ Completo |
| Configuración de splits y cuentas | ✅ Completo |
| CRUD cuentas (alias, banco, tipo, QR) | ✅ Completo |
| SQL Tab frontend | ✅ Completo |
| Dark/Light mode | ✅ Completo |
| Flutter Dashboard (4 cards, 4 gráficos) | ✅ Completo |
| Flutter Registrar (calendario, imagen, tools) | ✅ Completo |
| Flutter Ingresos (año agrupado, editar, eliminar, filtros) | ✅ Completo |
