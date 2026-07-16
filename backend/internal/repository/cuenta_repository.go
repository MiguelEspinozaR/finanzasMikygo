package repository

import (
	"context"
	"fmt"

	"finanzasMikygo/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CuentaRepository struct {
	db *pgxpool.Pool
}

func NewCuentaRepository(db *pgxpool.Pool) *CuentaRepository {
	return &CuentaRepository{db: db}
}

func (r *CuentaRepository) Create(ctx context.Context, cuenta *model.Cuenta) error {
	query := `
		INSERT INTO cuentas (alias, banco, numero_cuenta, tipo)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		cuenta.Alias,
		cuenta.Banco,
		cuenta.NumeroCuenta,
		cuenta.Tipo,
	).Scan(&cuenta.ID, &cuenta.CreatedAt, &cuenta.UpdatedAt)
}

func (r *CuentaRepository) GetAll(ctx context.Context) ([]model.Cuenta, error) {
	query := `
		SELECT id, alias, banco, numero_cuenta, tipo, qr_ruta, deleted_at, created_at, updated_at
		FROM cuentas
		WHERE deleted_at IS NULL
		ORDER BY alias`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query cuentas: %w", err)
	}
	defer rows.Close()

	var cuentas []model.Cuenta
	for rows.Next() {
		var c model.Cuenta
		if err := rows.Scan(
			&c.ID, &c.Alias, &c.Banco, &c.NumeroCuenta, &c.Tipo,
			&c.QrRuta, &c.DeletedAt, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan cuenta: %w", err)
		}
		cuentas = append(cuentas, c)
	}

	return cuentas, nil
}

func (r *CuentaRepository) GetByID(ctx context.Context, id int64) (*model.Cuenta, error) {
	query := `
		SELECT id, alias, banco, numero_cuenta, tipo, qr_ruta, deleted_at, created_at, updated_at
		FROM cuentas
		WHERE id = $1 AND deleted_at IS NULL`

	var c model.Cuenta
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Alias, &c.Banco, &c.NumeroCuenta, &c.Tipo,
		&c.QrRuta, &c.DeletedAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get cuenta: %w", err)
	}

	return &c, nil
}

func (r *CuentaRepository) Update(ctx context.Context, id int64, cuenta *model.Cuenta) error {
	query := `
		UPDATE cuentas
		SET alias = COALESCE($2, alias),
			banco = COALESCE($3, banco),
			numero_cuenta = COALESCE($4, numero_cuenta),
			tipo = COALESCE($5, tipo),
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING updated_at`

	return r.db.QueryRow(ctx, query, id,
		cuenta.Alias,
		cuenta.Banco,
		cuenta.NumeroCuenta,
		cuenta.Tipo,
	).Scan(&cuenta.UpdatedAt)
}

func (r *CuentaRepository) Delete(ctx context.Context, id int64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		"DELETE FROM splits WHERE split_configuracion_id IN (SELECT id FROM split_configuraciones WHERE cuenta_id = $1) AND realizado = false",
		id)
	if err != nil {
		return fmt.Errorf("delete pending splits: %w", err)
	}

	_, err = tx.Exec(ctx,
		"DELETE FROM split_configuraciones WHERE cuenta_id = $1",
		id)
	if err != nil {
		return fmt.Errorf("delete split config: %w", err)
	}

	_, err = tx.Exec(ctx,
		"UPDATE cuentas SET deleted_at = NOW() WHERE id = $1",
		id)
	if err != nil {
		return fmt.Errorf("soft delete cuenta: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *CuentaRepository) UpdateQr(ctx context.Context, id int64, qrRuta *string) error {
	query := `
		UPDATE cuentas
		SET qr_ruta = $2, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`

	_, err := r.db.Exec(ctx, query, id, qrRuta)
	return err
}
