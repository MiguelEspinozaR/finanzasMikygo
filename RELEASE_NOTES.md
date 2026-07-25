# Release Notes — v0.10.0

**Fecha:** 25 de julio de 2026

## Adopción de Semantic Versioning (Semver)

A partir de esta versión se adopta formalmente el estándar [Semantic Versioning 2.0.0](https://semver.org/).

### Reglas
- **MAJOR** (`X.0.0`): Cambios que rompen compatibilidad hacia atrás
- **MINOR** (`0.X.0`): Features nuevos, compatibles hacia atrás
- **PATCH** (`0.0.X`): Bug fixes

### Justificación de v0.10.0
- El proyecto está en fase de desarrollo activo (pre-1.0)
- Desde v0.9.0 se agregaron features significativos (Splits, OCR, Deploy)
- No hay breaking changes en la API
- Por tanto, corresponde un bump de **MINOR**: `v0.9.0` → `v0.10.0`

### Historial de versiones
| Versión | Descripción |
|---------|-------------|
| v0.9.0 | Primera versión WEB estable (MVP funcional) |
| v0.10.0 | Splits, OCR, Deploy persistente, Dashboard tendencia, Semver |

---

## Features Nuevos

### Sistema de Splits (Reparto de Ingresos en Cuentas)
- Reparto automático de ingresos en múltiples cuentas bancarias por porcentaje
- Configuración de splits: porcentaje por cuenta, orden de visualización
- Generación de splits por ingreso desde la lista
- Marcar splits como realizados con fecha de realización
- Edición de montos individuales de splits
- Eliminación de splits individuales
- Validación: total de porcentajes no puede superar 100%

### CRUD de Cuentas Bancarias
- Crear, editar y eliminar cuentas
- Campos: alias, banco, número de cuenta, tipo (ahorro/corriente/virtual/física)
- Upload de imagen QR para transferencias
- Drag & drop para subir QR
- Soft delete con `deleted_at`

### QR Modal para Transferencias
- Al marcar un split como realizado, se muestra modal con:
  - Imagen QR de la cuenta destino
  - Monto a transferir formateado
  - Botón para cerrar

### OCR Comprobantes Bancarios (Tesseract.js)
- Extracción automática de fecha de pago, monto y referencia desde imágenes
- Normalización de texto OCR (espacios, newlines)
- Patrón `flexRangePattern`: detecta rangos como "25 al 27" aunque OCR separe los números
- Referencia bounded: regex que termina antes de "Fecha", "Hora", "Monto", "Se ", "Su "
- Búsqueda de referencia en texto completo cuando OCR separa líneas
- Fallback a label cuando no se encuentra referencia

### Despliegue Persistente con Cloudflared
- Scripts `deploy-nohup.sh`, `stop.sh`, `status.sh` para despliegue via SSH
- Los procesos sobreviven al cierre de la terminal
- Configuración dinámica de `allowedHosts` para Vite
- Proxy corregido de IP hardcodeada a `localhost`

### Dashboard - Tendencia Global
- Nuevo cálculo de tendencia global usando regresión lineal
- Muestra la tendencia del histórico de ingresos mensuales
- Label actualizado de "Prom. global" a "Tendencia global"

### Dashboard - Promedio Semanal
- Línea de promedio cambiada de diaria a semanal en el gráfico de histórico
- Cálculo: `total_mes / semanas_distintas` usando `EXTRACT(WEEK FROM fecha_trabajo)`
- Tooltip actualizado de "Prom. mensual" a "Prom. semanal"

### Registrar - Días de Pago Pasados
- Permitido registrar días de trabajo sobre días que ya tienen pago registrado
- Ejemplo: trabajo 9/7 con pago 15/7, aunque 9/7 ya es pago de otro ingreso

## Bug Fixes

### Backend
- **MarcarRealizado scan bug**: `split_repository.go` reemplazado `.Scan(&updatedAt, &updatedAt)` con calls a `Exec`
- **RecalculatePendingSplits overwrite**: `split_service.go` cambiado a per-split `UpdateMonto` en lugar de query masiva
- **Duplicación generarSplits**: `ingreso_service.go` eliminado función duplicada, llama a `SplitService.GenerarSplits`
- **CuentaModal submit**: botón de submit movido dentro del `<form>` en `CuentaModal.tsx`
- **Validación porcentajes**: rechaza total > 100% en `split_service.go`
- **Validación monto negativo**: rechaza valores negativos en `split_handler.go`
- **ON DELETE CASCADE → RESTRICT**: migración `009_fix_cascade_to_restrict` para `split_configuraciones`
- **Router**: endpoint de QR corregido de PUT a POST

### Frontend
- **Dark mode**: `gray-750` → `gray-700` en ConfiguracionSplits, Splits.tsx, EditarSplitModal.tsx
- **cuentasData crash**: extracción `cuentasData?.data` para evitar undefined
- **Splits**: lista ordenada por #ingreso descendente
- **Ingresos**: ícono de "agregar a splits" cambiado de `Diamond` a `PieChart` (consistente con pestaña Splits)
- **Vite proxy**: target corregido de `192.168.2.107:8080` a `localhost:8080`

### OCR
- **Referencia regex**: bounded con terminadores explícitos (`Fecha`, `Hora`, `Se `, `Monto`, `Su `, `$`)
- **flexRangePattern**: encuentra rangos "25 al 27" aunque OCR los separe en líneas distintas
- **Normalización**: `\n` reemplazado por espacios en texto OCR completo
- **Fallback Referencia**: búsqueda en texto completo → texto antes de "Referencia:" → label

## Migraciones

| Archivo | Descripción |
|---------|-------------|
| `008_create_splits.up.sql` | Tablas `cuentas`, `split_configuraciones`, `splits` con índices |
| `008_create_splits.down.sql` | Rollback: elimina las 3 tablas |
| `009_fix_cascade_to_restrict.up.sql` | Cambia `ON DELETE CASCADE` a `ON DELETE RESTRICT` en `split_configuraciones` |
| `009_fix_cascade_to_restrict.down.sql` | Rollback: restaura `ON DELETE CASCADE` |

## Archivos Modificados

### Backend
- `internal/handler/split_handler.go` — CRUD splits, cuentas, QR, MarcarRealizado, GenerarPorIngreso, GetIngresosConSplits
- `internal/service/split_service.go` — GenerarSplits, GenerarPorIngreso, GetIngresosConSplits, validación porcentajes
- `internal/repository/split_repository.go` — HasAnySplits, GetIngresosConSplits, MarcarRealizado fix
- `internal/repository/dashboard_repository.go` — Tendencia global con regresión lineal
- `internal/dto/ingreso_dto.go` — TendenciaGlobal en DashboardHistoryResponse
- `internal/dto/split_dto.go` — SplitResponse con cuenta_id, qr_ruta; FormatSplitResponse
- `internal/model/split.go` — Modelos de Split, SplitConfiguracion, Cuenta
- `internal/router/router.go` — Rutas de splits y cuentas, endpoint QR corregido
- `internal/service/ingreso_service.go` — Eliminado generarSplits duplicado

### Frontend (Web)
- `features/dashboard/Dashboard.tsx` — Tendencia global con regresión lineal
- `features/registrar/RegistrarIngreso.tsx` — Permitido trabajo sobre día de pago
- `features/ingresos/Ingresos.tsx` — Ícono PieChart para splits
- `features/splits/Splits.tsx` — Lista de splits, QR modal, botón realizado con tooltip, hover dark mode
- `features/splits/ConfiguracionSplits.tsx` — Dark mode fix, botón editar
- `features/splits/CuentaModal.tsx` — Drag & drop QR, submit en form
- `features/splits/EditarSplitModal.tsx` — Dark mode fix
- `services/api.ts` — Endpoints de splits, cuentas, ingresos-con-splits
- `services/ocrService.ts` — Normalización, Referencia bounded, flexRangePattern
- `vite.config.ts` — Proxy corregido a localhost

### Configuración
- `deploy-nohup.sh` — Despliegue persistente con nohup
- `stop.sh` — Detener servicios y restaurar config
- `status.sh` — Ver estado de servicios
- `README.md` — Instrucciones de despliegue actualizadas
- `AGENTS.md` — Info real del proyecto

## Estado

- **Backend**: Compila sin errores
- **Frontend**: Funcional con acceso externo
- **DB**: Migraciones 008 y 009 ejecutadas
- **OCR**: Funcional con normalización y patrones avanzados
- **Splits**: CRUD completo, generación por porcentaje, marcar realizado
- **QR**: Upload, visualización en modal, eliminación
- **Dark mode**: Corregido en todos los componentes
- **Despliegue**: Persistente con Cloudflared + nohup
- **Dashboard**: Tendencia global con regresión lineal + promedio semanal
- **Semver**: Adopción formal de Semantic Versioning 2.0.0
