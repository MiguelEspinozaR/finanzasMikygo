package repository

import (
	"context"
	"fmt"

	"finanzasMikygo/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SplitRepository struct {
	db *pgxpool.Pool
}

func NewSplitRepository(db *pgxpool.Pool) *SplitRepository {
	return &SplitRepository{db: db}
}

func (r *SplitRepository) GetConfiguraciones(ctx context.Context) ([]model.SplitConfiguracion, error) {
	query := `
		SELECT id, cuenta_id, porcentaje, orden, created_at, updated_at
		FROM split_configuraciones
		ORDER BY orden, id`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query config: %w", err)
	}
	defer rows.Close()

	var configs []model.SplitConfiguracion
	for rows.Next() {
		var c model.SplitConfiguracion
		if err := rows.Scan(&c.ID, &c.CuentaID, &c.Porcentaje, &c.Orden, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan config: %w", err)
		}
		configs = append(configs, c)
	}

	return configs, nil
}

func (r *SplitRepository) GetConfiguracionByCuentaID(ctx context.Context, cuentaID int64) (*model.SplitConfiguracion, error) {
	query := `
		SELECT id, cuenta_id, porcentaje, orden, created_at, updated_at
		FROM split_configuraciones
		WHERE cuenta_id = $1`

	var c model.SplitConfiguracion
	err := r.db.QueryRow(ctx, query, cuentaID).Scan(
		&c.ID, &c.CuentaID, &c.Porcentaje, &c.Orden, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get config: %w", err)
	}

	return &c, nil
}

func (r *SplitRepository) CreateConfiguracion(ctx context.Context, config *model.SplitConfiguracion) error {
	query := `
		INSERT INTO split_configuraciones (cuenta_id, porcentaje, orden)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		config.CuentaID, config.Porcentaje, config.Orden,
	).Scan(&config.ID, &config.CreatedAt, &config.UpdatedAt)
}

func (r *SplitRepository) UpdateConfiguracion(ctx context.Context, id int64, config *model.SplitConfiguracion) error {
	query := `
		UPDATE split_configuraciones
		SET porcentaje = $2, orden = $3, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`

	return r.db.QueryRow(ctx, query, id, config.Porcentaje, config.Orden).Scan(&config.UpdatedAt)
}

func (r *SplitRepository) DeleteConfiguracion(ctx context.Context, id int64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		"DELETE FROM splits WHERE split_configuracion_id = $1 AND realizado = false",
		id)
	if err != nil {
		return fmt.Errorf("delete pending splits: %w", err)
	}

	_, err = tx.Exec(ctx,
		"DELETE FROM split_configuraciones WHERE id = $1",
		id)
	if err != nil {
		return fmt.Errorf("delete config: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *SplitRepository) GetAll(ctx context.Context) ([]model.Split, error) {
	query := `
		SELECT id, ingreso_id, split_configuracion_id, monto_enteros, realizado, fecha_realizado, created_at, updated_at
		FROM splits
		ORDER BY id DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query splits: %w", err)
	}
	defer rows.Close()

	var splits []model.Split
	for rows.Next() {
		var s model.Split
		if err := rows.Scan(
			&s.ID, &s.IngresoID, &s.SplitConfiguracionID,
			&s.MontoEnteros, &s.Realizado, &s.FechaRealizado,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan split: %w", err)
		}
		splits = append(splits, s)
	}

	return splits, nil
}

func (r *SplitRepository) GetByIngresoID(ctx context.Context, ingresoID int64) ([]model.Split, error) {
	query := `
		SELECT id, ingreso_id, split_configuracion_id, monto_enteros, realizado, fecha_realizado, created_at, updated_at
		FROM splits
		WHERE ingreso_id = $1
		ORDER BY id`

	rows, err := r.db.Query(ctx, query, ingresoID)
	if err != nil {
		return nil, fmt.Errorf("query splits by ingreso: %w", err)
	}
	defer rows.Close()

	var splits []model.Split
	for rows.Next() {
		var s model.Split
		if err := rows.Scan(
			&s.ID, &s.IngresoID, &s.SplitConfiguracionID,
			&s.MontoEnteros, &s.Realizado, &s.FechaRealizado,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan split: %w", err)
		}
		splits = append(splits, s)
	}

	return splits, nil
}

func (r *SplitRepository) CreateSplits(ctx context.Context, splits []model.Split) error {
	if len(splits) == 0 {
		return nil
	}

	for _, s := range splits {
		query := `
			INSERT INTO splits (ingreso_id, split_configuracion_id, monto_enteros)
			VALUES ($1, $2, $3)
			RETURNING id, created_at, updated_at`

		err := r.db.QueryRow(ctx, query,
			s.IngresoID, s.SplitConfiguracionID, s.MontoEnteros,
		).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return fmt.Errorf("insert split: %w", err)
		}
	}

	return nil
}

func (r *SplitRepository) MarcarRealizado(ctx context.Context, id int64, realizado bool) error {
	if realizado {
		_, err := r.db.Exec(ctx,
			`UPDATE splits
			SET realizado = true, fecha_realizado = NOW(), updated_at = NOW()
			WHERE id = $1`, id)
		return err
	}

	_, err := r.db.Exec(ctx,
		`UPDATE splits
		SET realizado = false, fecha_realizado = NULL, updated_at = NOW()
		WHERE id = $1`, id)
	return err
}

func (r *SplitRepository) UpdateMonto(ctx context.Context, id int64, montoEnteros int64) error {
	query := `
		UPDATE splits
		SET monto_enteros = $2, updated_at = NOW()
		WHERE id = $1 AND realizado = false
		RETURNING updated_at`

	var updatedAt interface{}
	return r.db.QueryRow(ctx, query, id, montoEnteros).Scan(&updatedAt)
}

func (r *SplitRepository) DeleteSplit(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx,
		"DELETE FROM splits WHERE id = $1 AND realizado = false",
		id)
	return err
}

func (r *SplitRepository) DeletePendingByIngresoID(ctx context.Context, ingresoID int64) error {
	_, err := r.db.Exec(ctx,
		"DELETE FROM splits WHERE ingreso_id = $1 AND realizado = false",
		ingresoID)
	return err
}

func (r *SplitRepository) HasRealizedSplits(ctx context.Context, ingresoID int64) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM splits WHERE ingreso_id = $1 AND realizado = true",
		ingresoID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *SplitRepository) HasAnySplits(ctx context.Context, ingresoID int64) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM splits WHERE ingreso_id = $1",
		ingresoID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *SplitRepository) GetIngresosConSplits(ctx context.Context) ([]int64, error) {
	query := `SELECT DISTINCT ingreso_id FROM splits ORDER BY ingreso_id DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query ingresos con splits: %w", err)
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan ingreso_id: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}

