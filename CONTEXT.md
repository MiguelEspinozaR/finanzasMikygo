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
│   │   │   ├── sql_handler.go
│   │   │   └── split_handler.go      # CRUD splits, cuentas, QR
│   │   ├── service/
│   │   │   ├── ingreso_service.go    # splitMonto, ParseInLocation
│   │   │   ├── dashboard_service.go
│   │   │   └── split_service.go      # GenerarSplits, validación %
│   │   ├── repository/
│   │   │   ├── ingreso_repository.go
│   │   │   ├── dashboard_repository.go
│   │   │   └── split_repository.go   # HasAnySplits, GetIngresosConSplits
│   │   ├── model/
│   │   │   ├── ingreso.go            # FechaTrabajo struct
│   │   │   └── split.go              # Split, SplitConfiguracion, Cuenta
│   │   ├── dto/
│   │   │   ├── ingreso_dto.go        # FechaTrabajoRequest/Response
│   │   │   └── split_dto.go          # SplitResponse con cuenta_id, qr_ruta
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
│   │   ├── 008_create_splits.up.sql
│   │   ├── 008_create_splits.down.sql
│   │   ├── 009_fix_cascade_to_restrict.up.sql
│   │   ├── 009_fix_cascade_to_restrict.down.sql
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
│   │   ├── features/splits/
│   │   │   ├── Splits.tsx              # Lista splits, QR modal
│   │   │   ├── ConfiguracionSplits.tsx  # Config % por cuenta
│   │   │   ├── CuentaModal.tsx          # CRUD cuentas, drag & drop QR
│   │   │   └── EditarSplitModal.tsx     # Editar monto split
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
├── deploy-nohup.sh       # Despliegue persistente con Cloudflared
├── stop.sh               # Detener servicios
├── status.sh             # Ver estado de servicios
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

-- Tabla de cuentas bancarias (migración 008)
CREATE TABLE cuentas (
    id SERIAL PRIMARY KEY,
    alias VARCHAR(100) NOT NULL,
    banco VARCHAR(100),
    numero_cuenta VARCHAR(50),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ahorro', 'corriente', 'virtual', 'fisica')),
    qr_ruta VARCHAR(500),
    deleted_at TIMESTAMP WITH TIME ZONE,  -- soft delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuración de splits: porcentaje por cuenta (migración 008)
CREATE TABLE split_configuraciones (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE RESTRICT,  -- 009: RESTRICT
    porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cuenta_id)
);

-- Splits generados por cada ingreso (migración 008)
CREATE TABLE splits (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
    split_configuracion_id INTEGER NOT NULL REFERENCES split_configuraciones(id),
    monto_enteros BIGINT NOT NULL,
    realizado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_realizado TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

GET    /api/v1/splits/config         # Obtener configuración de splits
PUT    /api/v1/splits/config         # Actualizar configuración (valida % ≤ 100)
GET    /api/v1/splits/ingresos-con-splits  # IDs de ingresos que ya tienen splits
POST   /api/v1/splits/generar/:id    # Generar splits para un ingreso
GET    /api/v1/splits                # Listar todos los splits
GET    /api/v1/splits/ingreso/:id    # Splits de un ingreso específico
PUT    /api/v1/splits/:id/realizar   # Marcar split como realizado
PUT    /api/v1/splits/:id            # Actualizar monto de un split
DELETE /api/v1/splits/:id            # Eliminar un split

POST   /api/v1/cuentas               # Crear cuenta
GET    /api/v1/cuentas               # Listar cuentas (excluye soft deleted)
GET    /api/v1/cuentas/:id           # Obtener cuenta por ID
PUT    /api/v1/cuentas/:id           # Actualizar cuenta
DELETE /api/v1/cuentas/:id           # Soft delete (deleted_at)
POST   /api/v1/cuentas/:id/qr        # Subir imagen QR (drag & drop)
DELETE /api/v1/cuentas/:id/qr        # Eliminar QR

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
- Panel histórico: línea de **tendencia global** (regresión lineal de totales mensuales)
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
- **Permitido**: registrar trabajo sobre días que ya tienen pago (ej: pago ing A + trabajo ing B)

### Upload de Imagen
- Flujo: crear ingreso → upload con `ingreso_id` → backend guarda como `pago_{id}.{ext}`
- El backend actualiza `imagen_ruta` en la DB automáticamente al subir con `ingreso_id`
- Si no se provee `ingreso_id`, guarda como `upload_{timestamp}.{ext}`
- Frontend: zona de drag & drop con preview y botón de eliminar

### Pagos Duplicados
- Se permiten múltiples ingresos con la misma `fecha_pago`
- Herramienta `trabajo`: permite registrar en fechas con pago existente
- Herramienta `pago`: siempre permite registrar en fechas existentes
- Herramienta `quitar`: siempre permite operar
- En la tabla de ingresos, los registros del mismo día se agrupan visualmente con fondo sutil y fila de subtotal

### Splits (Reparto de Ingresos en Cuentas)
- Cada ingreso puede generarse splits distribuidos en cuentas por porcentaje
- Total de porcentajes no puede superar 100% (validación en backend)
- Splits se generan automáticamente: `monto * (porcentaje / 100)`, redondeado a centavos
- Cada split tiene monto_individual, realizado (bool), fecha_realizado
- Botón "pie chart" en lista de ingresos: genera splits si el ingreso no los tiene
- Lista de splits ordenada por #ingreso descendente
- Botón "Marcar realizado": muestra QR de la cuenta + monto a transferir
- Splits realizados muestran fecha de realización con tooltip
- Soft delete para cuentas: `deleted_at` en lugar de eliminación física
- ON DELETE RESTRICT en `split_configuraciones.cuenta_id` (009) para evitar borrados accidentales

### OCR Comprobantes Bancarios
- Normalización: `\n` → espacios, búsqueda en texto completo
- Patrón `flexRangePattern`: detecta "25 al 27" aunque OCR separe los números
- Referencia bounded: regex termina antes de "Fecha", "Hora", "Se ", "Monto", "Su ", `$`
- Búsqueda cascade: texto completo → texto antes de "Referencia:" → label
- Meses en español: enero-diciembre

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
DB_PASSWORD=<tu-password>
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10
CORS_ORIGIN=http://localhost:5173
SQL_DEV_ENABLED=true
```

## Ejecución

```bash
# Local
cd backend && go run cmd/server/main.go    # :8080
cd web && npm run dev                       # :5173

# Despliegue persistente (Cloudflared + nohup)
./deploy-nohup.sh                           # Backend + Frontend + Tunnel
./status.sh                                 # Ver estado
./stop.sh                                   # Detener servicios
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
| QR modal para transferencias | ✅ Completo |
| Acceso externo frontend (host 0.0.0.0) | ✅ Completo |
| SQL Tab frontend | ✅ Completo |
| Dark/Light mode | ✅ Completo |
| Flutter Dashboard (4 cards, 4 gráficos) | ✅ Completo |
| Flutter Registrar (calendario, imagen, tools) | ✅ Completo |
| Flutter Ingresos (año agrupado, editar, eliminar, filtros) | ✅ Completo |
