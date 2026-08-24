-- 012: Asignar fuentes a ingresos históricos para el filtro del Dashboard
-- Ingresos 1-90   → Malnova (fuente nueva)
-- Ingresos 91-189 → Athena (existente)
-- El ingreso 190 (Essencia) no se modifica.

BEGIN;

INSERT INTO fuentes (nombre, color)
SELECT 'Malnova', '#7c3aed'
WHERE NOT EXISTS (SELECT 1 FROM fuentes WHERE nombre = 'Malnova');

UPDATE ingresos
SET fuente_id = (SELECT id FROM fuentes WHERE nombre = 'Malnova'),
    updated_at = NOW()
WHERE id BETWEEN 1 AND 90;

UPDATE ingresos
SET fuente_id = (SELECT id FROM fuentes WHERE nombre = 'Athena'),
    updated_at = NOW()
WHERE id BETWEEN 91 AND 189;

COMMIT;
