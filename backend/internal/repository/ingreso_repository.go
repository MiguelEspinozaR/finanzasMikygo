package repository

import (
	"context"
	"fmt"
	"time"

	"finanzasMikygo/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type IngresoRepository struct {
	db *pgxpool.Pool
}

func NewIngresoRepository(db *pgxpool.Pool) *IngresoRepository {
	return &IngresoRepository{db: db}
}

func (r *IngresoRepository) Create(ctx context.Context, ingreso *model.Ingreso) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO ingresos (fecha_pago, monto_enteros, tipo, comentario, imagen_ruta)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at`

	err = tx.QueryRow(ctx, query,
		ingreso.FechaPago,
		ingreso.MontoEnteros,
		ingreso.Tipo,
		ingreso.Comentario,
		ingreso.ImagenRuta,
	).Scan(&ingreso.ID, &ingreso.CreatedAt, &ingreso.UpdatedAt)
	if err != nil {
		return fmt.Errorf("insert ingreso: %w", err)
	}

	for _, fecha := range ingreso.FechasTrabajo {
		_, err = tx.Exec(ctx,
			"INSERT INTO ingreso_fechas_trabajo (ingreso_id, fecha_trabajo, monto_enteros) VALUES ($1, $2, $3)",
			ingreso.ID, fecha.Fecha, fecha.MontoEnteros)
		if err != nil {
			return fmt.Errorf("insert fecha trabajo: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *IngresoRepository) GetAll(ctx context.Context, fechaInicio, fechaFin *time.Time, tipo *string, page, pageSize int) ([]model.Ingreso, int64, error) {
	offset := (page - 1) * pageSize
	args := []interface{}{}
	argCount := 0

	where := "WHERE 1=1"
	if fechaInicio != nil {
		argCount++
		where += fmt.Sprintf(" AND i.fecha_pago >= $%d", argCount)
		args = append(args, *fechaInicio)
	}
	if fechaFin != nil {
		argCount++
		where += fmt.Sprintf(" AND i.fecha_pago <= $%d", argCount)
		args = append(args, *fechaFin)
	}
	if tipo != nil {
		argCount++
		where += fmt.Sprintf(" AND i.tipo = $%d", argCount)
		args = append(args, *tipo)
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM ingresos i %s", where)
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count ingresos: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT i.id, i.fecha_pago, i.monto_enteros, i.tipo, i.comentario, i.imagen_ruta,
			   i.created_at, i.updated_at
		FROM ingresos i
		%s
		ORDER BY i.id DESC
		LIMIT $%d OFFSET $%d`, where, argCount+1, argCount+2)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query ingresos: %w", err)
	}
	defer rows.Close()

	var ingresos []model.Ingreso
	for rows.Next() {
		var ing model.Ingreso
		err := rows.Scan(
			&ing.ID, &ing.FechaPago, &ing.MontoEnteros, &ing.Tipo,
			&ing.Comentario, &ing.ImagenRuta, &ing.CreatedAt, &ing.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("scan ingreso: %w", err)
		}

		fechas, err := r.getFechasTrabajo(ctx, ing.ID)
		if err != nil {
			return nil, 0, err
		}
		ing.FechasTrabajo = fechas
		ingresos = append(ingresos, ing)
	}

	return ingresos, total, nil
}

func (r *IngresoRepository) GetByID(ctx context.Context, id int64) (*model.Ingreso, error) {
	var ing model.Ingreso
	err := r.db.QueryRow(ctx,
		`SELECT id, fecha_pago, monto_enteros, tipo, comentario, imagen_ruta, created_at, updated_at
		 FROM ingresos WHERE id = $1`, id).Scan(
		&ing.ID, &ing.FechaPago, &ing.MontoEnteros, &ing.Tipo,
		&ing.Comentario, &ing.ImagenRuta, &ing.CreatedAt, &ing.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get ingreso: %w", err)
	}

	fechas, err := r.getFechasTrabajo(ctx, ing.ID)
	if err != nil {
		return nil, err
	}
	ing.FechasTrabajo = fechas

	return &ing, nil
}

func (r *IngresoRepository) getFechasTrabajo(ctx context.Context, ingresoID int64) ([]model.FechaTrabajo, error) {
	rows, err := r.db.Query(ctx,
		"SELECT fecha_trabajo, monto_enteros FROM ingreso_fechas_trabajo WHERE ingreso_id = $1 ORDER BY fecha_trabajo",
		ingresoID)
	if err != nil {
		return nil, fmt.Errorf("query fechas: %w", err)
	}
	defer rows.Close()

	var fechas []model.FechaTrabajo
	for rows.Next() {
		var f model.FechaTrabajo
		if err := rows.Scan(&f.Fecha, &f.MontoEnteros); err != nil {
			return nil, fmt.Errorf("scan fecha: %w", err)
		}
		fechas = append(fechas, f)
	}
	return fechas, nil
}

func (r *IngresoRepository) Update(ctx context.Context, id int64, ingreso *model.Ingreso) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`UPDATE ingresos SET fecha_pago = $1, monto_enteros = $2, tipo = $3,
		 comentario = $4, imagen_ruta = $5, updated_at = NOW()
		 WHERE id = $6`,
		ingreso.FechaPago, ingreso.MontoEnteros, ingreso.Tipo,
		ingreso.Comentario, ingreso.ImagenRuta, id)
	if err != nil {
		return fmt.Errorf("update ingreso: %w", err)
	}

	_, err = tx.Exec(ctx,
		"DELETE FROM ingreso_fechas_trabajo WHERE ingreso_id = $1", id)
	if err != nil {
		return fmt.Errorf("delete fechas: %w", err)
	}

	for _, fecha := range ingreso.FechasTrabajo {
		_, err = tx.Exec(ctx,
			"INSERT INTO ingreso_fechas_trabajo (ingreso_id, fecha_trabajo, monto_enteros) VALUES ($1, $2, $3)",
			id, fecha.Fecha, fecha.MontoEnteros)
		if err != nil {
			return fmt.Errorf("insert fecha: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *IngresoRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx, "DELETE FROM ingresos WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete ingreso: %w", err)
	}
	return nil
}

func (r *IngresoRepository) GetFechasOcupadas(ctx context.Context, mes, anio int) (map[string][]string, error) {
	rows, err := r.db.Query(ctx,
		`SELECT 'pago' as tipo, fecha_pago as fecha
		 FROM ingresos
		 WHERE EXTRACT(MONTH FROM fecha_pago) = $1
		   AND EXTRACT(YEAR FROM fecha_pago) = $2
		 UNION
		 SELECT 'trabajo' as tipo, fecha_trabajo as fecha
		 FROM ingreso_fechas_trabajo ift
		 JOIN ingresos i ON i.id = ift.ingreso_id
		 WHERE EXTRACT(MONTH FROM fecha_trabajo) = $1
		   AND EXTRACT(YEAR FROM fecha_trabajo) = $2`, mes, anio)
	if err != nil {
		return nil, fmt.Errorf("query fechas ocupadas: %w", err)
	}
	defer rows.Close()

	fechas := make(map[string][]string)
	for rows.Next() {
		var tipo string
		var fecha time.Time
		if err := rows.Scan(&tipo, &fecha); err != nil {
			return nil, fmt.Errorf("scan fecha: %w", err)
		}
		key := fecha.Format("2006-01-02")
		fechas[key] = append(fechas[key], tipo)
	}
	return fechas, nil
}

func (r *IngresoRepository) UpdateImagenRuta(ctx context.Context, id int64, imagenRuta string) error {
	_, err := r.db.Exec(ctx,
		"UPDATE ingresos SET imagen_ruta = $1, updated_at = NOW() WHERE id = $2",
		imagenRuta, id)
	return err
}
