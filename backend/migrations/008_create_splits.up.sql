-- Tabla de cuentas bancarias
CREATE TABLE cuentas (
    id SERIAL PRIMARY KEY,
    alias VARCHAR(100) NOT NULL,
    banco VARCHAR(100),
    numero_cuenta VARCHAR(50),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ahorro', 'corriente', 'virtual', 'fisica')),
    qr_ruta VARCHAR(500),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuracion de splits (porcentaje por cuenta)
CREATE TABLE split_configuraciones (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
    porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cuenta_id)
);

-- Splits generados por cada ingreso
CREATE TABLE splits (
    id SERIAL PRIMARY KEY,
    ingreso_id INTEGER NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE,
    split_configuracion_id INTEGER NOT NULL REFERENCES split_configuraciones(id),
    monto_enteros BIGINT NOT NULL,
    realizado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_realizado TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_split_config_cuenta ON split_configuraciones(cuenta_id);
CREATE INDEX idx_splits_ingreso ON splits(ingreso_id);
CREATE INDEX idx_splits_config ON splits(split_configuracion_id);
CREATE INDEX idx_splits_realizado ON splits(realizado);
CREATE INDEX idx_cuentas_deleted ON cuentas(deleted_at);
