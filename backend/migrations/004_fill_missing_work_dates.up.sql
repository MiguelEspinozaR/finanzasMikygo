-- Migración 004: Asignar fecha_pago como fecha_trabajo para ingresos sin fechas
INSERT INTO ingreso_fechas_trabajo (ingreso_id, fecha_trabajo)
SELECT i.id, i.fecha_pago
FROM ingresos i
LEFT JOIN ingreso_fechas_trabajo ift ON i.id = ift.ingreso_id
WHERE ift.id IS NULL;
