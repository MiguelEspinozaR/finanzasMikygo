-- Backfill monto_enteros in ingreso_fechas_trabajo
-- Distributes each ingreso's monto_enteros across its work days using splitMonto logic:
--   First n-1 days get: FLOOR(total / n)
--   Last day gets:      total - FLOOR(total / n) * (n - 1)

WITH RankedFechas AS (
  SELECT
    ift.id,
    ift.ingreso_id,
    i.monto_enteros AS ingreso_monto,
    COUNT(*) OVER (PARTITION BY ift.ingreso_id) AS total_days,
    ROW_NUMBER() OVER (PARTITION BY ift.ingreso_id ORDER BY ift.fecha_trabajo) AS rn
  FROM ingreso_fechas_trabajo ift
  JOIN ingresos i ON i.id = ift.ingreso_id
)
UPDATE ingreso_fechas_trabajo
SET monto_enteros = CASE
  WHEN rf.rn < rf.total_days THEN FLOOR(rf.ingreso_monto / rf.total_days)
  ELSE rf.ingreso_monto - (FLOOR(rf.ingreso_monto / rf.total_days) * (rf.total_days - 1))
END
FROM RankedFechas rf
WHERE ingreso_fechas_trabajo.id = rf.id;
