-- Migrar todos los registros 'semanal' a 'qr'
UPDATE ingresos SET tipo = 'qr' WHERE tipo = 'semanal';

-- Cambiar CHECK constraint
ALTER TABLE ingresos DROP CONSTRAINT IF EXISTS ingresos_tipo_check;
ALTER TABLE ingresos ADD CONSTRAINT ingresos_tipo_check CHECK (tipo IN ('qr', 'efectivo'));
