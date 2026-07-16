-- Cambiar ON DELETE CASCADE a ON DELETE RESTRICT en split_configuraciones
-- porque cuentas usa soft delete (deleted_at), no hard delete.
-- El cascade nunca se dispara y puede causar borrados inesperados.
ALTER TABLE split_configuraciones
    DROP CONSTRAINT split_configuraciones_cuenta_id_fkey,
    ADD CONSTRAINT split_configuraciones_cuenta_id_fkey
        FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE RESTRICT;
