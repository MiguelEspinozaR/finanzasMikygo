CREATE TABLE ingresos (
    id SERIAL PRIMARY KEY,
    fecha_pago DATE NOT NULL,
    monto_enteros BIGINT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('diario', 'semanal')),
    comentario TEXT,
    imagen_ruta VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ingreso_fechas_trabajo (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
    fecha_trabajo DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ingresos_fecha_pago ON ingresos(fecha_pago);
CREATE INDEX idx_ingresos_tipo ON ingresos(tipo);
CREATE INDEX idx_fechas_trabajo_ingreso ON ingreso_fechas_trabajo(ingreso_id);
CREATE INDEX idx_fechas_trabajo_fecha ON ingreso_fechas_trabajo(fecha_trabajo);
