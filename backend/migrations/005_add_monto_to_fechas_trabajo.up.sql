-- Migración 005: Agregar monto_enteros a ingreso_fechas_trabajo
ALTER TABLE ingreso_fechas_trabajo ADD COLUMN monto_enteros BIGINT NOT NULL DEFAULT 0;
