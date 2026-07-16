-- Revertir a ON DELETE CASCADE
ALTER TABLE split_configuraciones
    DROP CONSTRAINT split_configuraciones_cuenta_id_fkey,
    ADD CONSTRAINT split_configuraciones_cuenta_id_fkey
        FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE;
