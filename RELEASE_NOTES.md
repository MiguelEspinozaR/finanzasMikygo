# Release Notes — v1.0.0

**Fecha:** 16 de julio de 2026

## Features Nuevos

### Sistema de Splits (Reparto de Ingresos en Cuentas)
- Reparto automático de ingresos en múltiples cuentas bancarias por porcentaje
- Configuración de splits: porcentaje por cuenta, orden de visualización
- Generación de splits por ingreso desde la lista (botón diamante)
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

### Acceso Externo a Frontend
- Vite configurado con `host: '0.0.0.0'` para acceso desde red local
- `run.sh` ejecuta vite directamente con `--host`

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
- **Splits排序**: lista ordenada por #ingreso descendente

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
- `internal/dto/split_dto.go` — SplitResponse con cuenta_id, qr_ruta; FormatSplitResponse
- `internal/model/split.go` — Modelos de Split, SplitConfiguracion, Cuenta
- `internal/router/router.go` — Rutas de splits y cuentas, endpoint QR corregido
- `internal/service/ingreso_service.go` — Eliminado generarSplits duplicado

### Frontend (Web)
- `features/splits/Splits.tsx` — Lista de splits, QR modal, botón realizado con tooltip, hover dark mode
- `features/splits/ConfiguracionSplits.tsx` — Dark mode fix, botón editar
- `features/splits/CuentaModal.tsx` — Drag & drop QR, submit en form
- `features/splits/EditarSplitModal.tsx` — Dark mode fix
- `features/ingresos/Ingresos.tsx` — Botón diamante para agregar splits
- `services/api.ts` — Endpoints de splits, cuentas, ingresos-con-splits
- `services/ocrService.ts` — Normalización, Referencia bounded, flexRangePattern

### Configuración
- `vite.config.ts` — `host: '0.0.0.0'` para acceso externo
- `run.sh` — vite ejecutado directamente con `--host 0.0.0.0`

## Estado

- **Backend**: Compila sin errores
- **Frontend**: Funcional con acceso externo
- **DB**: Migraciones 008 y 009 ejecutadas
- **OCR**: Funcional con normalización y patrones avanzados
- **Splits**: CRUD completo, generación por porcentaje, marcar realizado
- **QR**: Upload, visualización en modal, eliminación
- **Dark mode**: Corregido en todos los componentes de splits
