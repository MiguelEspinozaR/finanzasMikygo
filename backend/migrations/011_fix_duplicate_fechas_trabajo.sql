-- Fix: Eliminar filas duplicadas en ingreso_fechas_trabajo
-- Causa: Migración 003 ejecutada 3 veces extras el 16/07/2026
-- Resultado: 660 filas duplicadas con monto_enteros = 0

DELETE FROM ingreso_fechas_trabajo
WHERE id IN (
  SELECT ift.id
  FROM ingreso_fechas_trabajo ift
  WHERE ift.monto_enteros = 0
    AND EXISTS (
      SELECT 1 FROM ingreso_fechas_trabajo ift2
      WHERE ift2.ingreso_id = ift.ingreso_id
        AND ift2.fecha_trabajo = ift.fecha_trabajo
        AND ift2.monto_enteros > 0
    )
);
