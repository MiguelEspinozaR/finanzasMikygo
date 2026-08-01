-- Eliminar índices
DROP INDEX IF EXISTS idx_split_config_fuente;
DROP INDEX IF EXISTS idx_ingresos_fuente;

-- Eliminar columnas
ALTER TABLE split_configuraciones DROP COLUMN IF EXISTS fuente_id;
ALTER TABLE ingresos DROP COLUMN IF EXISTS fuente_id;

-- Eliminar tabla
DROP TABLE IF EXISTS fuentes;
