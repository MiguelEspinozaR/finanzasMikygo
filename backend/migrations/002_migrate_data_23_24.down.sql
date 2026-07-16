-- Rollback: Eliminar datos migrados del CSV 23-24
-- Nota: Los IDs pueden interferir con datos existentes
-- Se recomienda ejecutar primero el rollback del 25-26

DELETE FROM ingreso_fechas_trabajo 
WHERE ingreso_id IN (
    SELECT id FROM ingresos 
    WHERE fecha_pago BETWEEN '2023-04-17' AND '2024-12-30'
    AND tipo = 'semanal'
    AND comentario IS NULL
);

DELETE FROM ingresos 
WHERE fecha_pago BETWEEN '2023-04-17' AND '2024-12-30'
AND tipo = 'semanal'
AND comentario IS NULL;
