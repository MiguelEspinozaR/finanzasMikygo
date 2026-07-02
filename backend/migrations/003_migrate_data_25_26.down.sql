-- Rollback: Eliminar datos migrados del CSV 25-26

DELETE FROM ingreso_fechas_trabajo 
WHERE ingreso_id IN (
    SELECT id FROM ingresos 
    WHERE fecha_pago BETWEEN '2025-01-06' AND '2026-06-08'
    AND tipo = 'semanal'
    AND comentario IS NULL
);

DELETE FROM ingresos 
WHERE fecha_pago BETWEEN '2025-01-06' AND '2026-06-08'
AND tipo = 'semanal'
AND comentario IS NULL;
