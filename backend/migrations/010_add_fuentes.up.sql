-- Tabla de fuentes de ingreso
CREATE TABLE fuentes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar fuente_id a ingresos (nullable para datos existentes)
ALTER TABLE ingresos ADD COLUMN fuente_id INTEGER REFERENCES fuentes(id);

-- Agregar fuente_id a split_configuraciones (nullable para config global)
ALTER TABLE split_configuraciones ADD COLUMN fuente_id INTEGER REFERENCES fuentes(id);

-- Índices
CREATE INDEX idx_ingresos_fuente ON ingresos(fuente_id);
CREATE INDEX idx_split_config_fuente ON split_configuraciones(fuente_id);
