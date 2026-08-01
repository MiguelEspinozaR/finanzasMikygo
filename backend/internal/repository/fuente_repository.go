package repository

import (
	"context"
	"fmt"

	"finanzasMikygo/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type FuenteRepository struct {
	db *pgxpool.Pool
}

func NewFuenteRepository(db *pgxpool.Pool) *FuenteRepository {
	return &FuenteRepository{db: db}
}

func (r *FuenteRepository) GetAll(ctx context.Context) ([]model.Fuente, error) {
	query := `
		SELECT id, nombre, color, created_at, updated_at
		FROM fuentes
		ORDER BY nombre`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query fuentes: %w", err)
	}
	defer rows.Close()

	var fuentes []model.Fuente
	for rows.Next() {
		var f model.Fuente
		if err := rows.Scan(&f.ID, &f.Nombre, &f.Color, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan fuente: %w", err)
		}
		fuentes = append(fuentes, f)
	}

	return fuentes, nil
}

func (r *FuenteRepository) GetByID(ctx context.Context, id int64) (*model.Fuente, error) {
	query := `
		SELECT id, nombre, color, created_at, updated_at
		FROM fuentes
		WHERE id = $1`

	var f model.Fuente
	if err := r.db.QueryRow(ctx, query, id).Scan(&f.ID, &f.Nombre, &f.Color, &f.CreatedAt, &f.UpdatedAt); err != nil {
		return nil, fmt.Errorf("get fuente: %w", err)
	}

	return &f, nil
}

func (r *FuenteRepository) Create(ctx context.Context, nombre, color string) (*model.Fuente, error) {
	query := `
		INSERT INTO fuentes (nombre, color)
		VALUES ($1, $2)
		RETURNING id, nombre, color, created_at, updated_at`

	var f model.Fuente
	if err := r.db.QueryRow(ctx, query, nombre, color).Scan(&f.ID, &f.Nombre, &f.Color, &f.CreatedAt, &f.UpdatedAt); err != nil {
		return nil, fmt.Errorf("create fuente: %w", err)
	}

	return &f, nil
}

func (r *FuenteRepository) Update(ctx context.Context, id int64, nombre, color *string) (*model.Fuente, error) {
	query := `
		UPDATE fuentes
		SET nombre = COALESCE($2, nombre),
		    color = COALESCE($3, color),
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, nombre, color, created_at, updated_at`

	var f model.Fuente
	if err := r.db.QueryRow(ctx, query, id, nombre, color).Scan(&f.ID, &f.Nombre, &f.Color, &f.CreatedAt, &f.UpdatedAt); err != nil {
		return nil, fmt.Errorf("update fuente: %w", err)
	}

	return &f, nil
}

func (r *FuenteRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM fuentes WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete fuente: %w", err)
	}
	return nil
}
