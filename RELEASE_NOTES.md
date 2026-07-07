# Release Notes — v0.9.0

**Fecha:** 07 de julio de 2026

## Features Nuevos

### Tipo de pago: QR / Efectivo
- El tipo de ingreso cambió de `diario|semanal` a `qr|efectivo`
- Badge visual: QR → cyan, Efectivo → naranja
- Migración automática de registros existentes (173 registros: semanal → qr)

### Pagos duplicados en la misma fecha
- Se permiten múltiples ingresos con la misma fecha de pago
- Herramienta `trabajo`: bloqueada si la fecha ya tiene un pago registrado
- Herramienta `pago`: siempre permite registrar en fechas existentes
- En la tabla de ingresos, los registros del mismo día se agrupan visualmente con fondo sutil y fila de subtotal

### Drag & Drop para comprobantes
- Zona de arrastrar y soltar para adjuntar imágenes en el formulario de registro
- Preview de imagen seleccionada con botón de eliminar
- Validación de tipo de archivo (solo imágenes)
- Feedback visual durante el arrastre (borde y fondo cambian)

### Detalles de ingreso mejorados
- Día de la semana en español: "15/06/2026 (lunes)"
- Sección Comentario siempre visible: "Ingreso sin comentarios" si está vacío
- Sección Comprobante siempre visible: "Ingreso sin comprobante" si no hay imagen
- Calendario eliminado del modal de detalles

### Upload de imagen con persistencia automática
- El backend ahora actualiza `imagen_ruta` en la DB automáticamente al subir una imagen con `ingreso_id`
- Corregido bug donde las imágenes se guardaban en disco pero no se persistían en la base de datos

## Bug Fixes

- **Imagen eliminada al editar**: El endpoint `PUT /ingresos/:id` sobreescribía `imagen_ruta` con `null` cuando no se enviaba en el payload. Ahora solo actualiza si el valor no es nulo
- **Comentario no visible**: El modal de detalles no mostraba el campo comentario. Ahora siempre se muestra con fallback
- **Ingreso 173**: Restaurada `imagen_ruta` en la base de datos

## Breaking Changes

- **Cambio de esquema**: La columna `tipo` ahora acepta `'qr'` o `'efectivo'` en lugar de `'diario'` o `'semanal'`
- **Migración requerida**: Ejecutar `007_change_tipo_to_qr_efectivo.up.sql` para actualizar el constraint y migrar datos existentes

## Archivos Modificados

### Backend
- `internal/handler/ingreso_handler.go` — Upload auto-actualiza `imagen_ruta`
- `internal/service/ingreso_service.go` — `UpdateImagenRuta()`, asignación condicional en `Update()`
- `internal/repository/ingreso_repository.go` — `UpdateImagenRuta()`
- `internal/dto/ingreso_dto.go` — Tipos `qr|efectivo`

### Frontend (Web)
- `features/ingresos/Ingresos.tsx` — DetallesModal simplificado, subtotales agrupados, fallbacks
- `features/registrar/RegistrarIngreso.tsx` — Drag & drop, pagos duplicados permitidos
- `services/api.ts` — Tipos actualizados

### Migraciones
- `007_change_tipo_to_qr_efectivo.up.sql` — Constraint `qr|efectivo`, migración de datos
- `007_change_tipo_to_qr_efectivo.down.sql` — Rollback a `diario|semanal`

## Estado

- **Backend**: Compila sin errores
- **Frontend**: Typecheck sin errores
- **DB**: 174 registros, constraint actualizado
- **Mobile**: Pendiente de actualizar para reflejar cambio de tipo
