package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepository struct {
	db *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	return &DashboardRepository{db: db}
}

func (r *DashboardRepository) GetWeeklyData(ctx context.Context, weekStart time.Time) ([]map[string]interface{}, error) {
	weekEnd := weekStart.AddDate(0, 0, 7)

	rows, err := r.db.Query(ctx,
		`SELECT fecha_pago, SUM(monto_enteros) as total
		 FROM ingresos
		 WHERE fecha_pago >= $1 AND fecha_pago < $2
		 GROUP BY fecha_pago
		 ORDER BY fecha_pago`, weekStart, weekEnd)
	if err != nil {
		return nil, fmt.Errorf("query weekly: %w", err)
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var fecha time.Time
		var total int64
		if err := rows.Scan(&fecha, &total); err != nil {
			return nil, fmt.Errorf("scan weekly: %w", err)
		}
		result = append(result, map[string]interface{}{
			"fecha": fecha.Format("2006-01-02"),
			"monto": total,
		})
	}
	return result, nil
}

func (r *DashboardRepository) GetMonthlyData(ctx context.Context, year, month int) ([]map[string]interface{}, error) {
	rows, err := r.db.Query(ctx,
		`SELECT EXTRACT(WEEK FROM fecha_pago) as semana, SUM(monto_enteros) as total
		 FROM ingresos
		 WHERE EXTRACT(YEAR FROM fecha_pago) = $1 AND EXTRACT(MONTH FROM fecha_pago) = $2
		 GROUP BY semana
		 ORDER BY semana`, year, month)
	if err != nil {
		return nil, fmt.Errorf("query monthly: %w", err)
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var semana int
		var total int64
		if err := rows.Scan(&semana, &total); err != nil {
			return nil, fmt.Errorf("scan monthly: %w", err)
		}
		result = append(result, map[string]interface{}{
			"semana": fmt.Sprintf("Sem %d", semana),
			"monto":  total,
		})
	}
	return result, nil
}

func (r *DashboardRepository) GetYearlyData(ctx context.Context, year int) ([]map[string]interface{}, error) {
	rows, err := r.db.Query(ctx,
		`SELECT EXTRACT(MONTH FROM fecha_pago) as mes, SUM(monto_enteros) as total
		 FROM ingresos
		 WHERE EXTRACT(YEAR FROM fecha_pago) = $1
		 GROUP BY mes
		 ORDER BY mes`, year)
	if err != nil {
		return nil, fmt.Errorf("query yearly: %w", err)
	}
	defer rows.Close()

	monthNames := []string{"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"}
	var result []map[string]interface{}
	for rows.Next() {
		var mes int
		var total int64
		if err := rows.Scan(&mes, &total); err != nil {
			return nil, fmt.Errorf("scan yearly: %w", err)
		}
		result = append(result, map[string]interface{}{
			"mes":   monthNames[mes-1],
			"monto": total,
		})
	}
	return result, nil
}

func (r *DashboardRepository) GetHistoryData(ctx context.Context) ([]map[string]interface{}, error) {
	// First get global average
	var globalAvg int64
	err := r.db.QueryRow(ctx,
		`SELECT COALESCE(CAST(SUM(monto_enteros) / NULLIF(COUNT(*), 0) AS BIGINT), 0)
		 FROM ingresos`).Scan(&globalAvg)
	if err != nil {
		return nil, fmt.Errorf("query global avg: %w", err)
	}

	rows, err := r.db.Query(ctx,
		`SELECT fecha_pago, SUM(monto_enteros) as total
		 FROM ingresos
		 GROUP BY fecha_pago
		 ORDER BY fecha_pago`)
	if err != nil {
		return nil, fmt.Errorf("query history: %w", err)
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var fecha time.Time
		var total int64
		if err := rows.Scan(&fecha, &total); err != nil {
			return nil, fmt.Errorf("scan history: %w", err)
		}
		result = append(result, map[string]interface{}{
			"fecha":    fecha.Format("2006-01-02"),
			"monto":    total,
			"promedio": globalAvg,
		})
	}
	return result, nil
}

func (r *DashboardRepository) GetDiasTrabajados(ctx context.Context, year, month int) ([]string, error) {
	rows, err := r.db.Query(ctx,
		`SELECT DISTINCT fecha_trabajo
		 FROM ingreso_fechas_trabajo ift
		 JOIN ingresos i ON ift.ingreso_id = i.id
		 WHERE EXTRACT(YEAR FROM ift.fecha_trabajo) = $1
		   AND EXTRACT(MONTH FROM ift.fecha_trabajo) = $2`, year, month)
	if err != nil {
		return nil, fmt.Errorf("query dias trabajados: %w", err)
	}
	defer rows.Close()

	var dias []string
	for rows.Next() {
		var fecha time.Time
		if err := rows.Scan(&fecha); err != nil {
			return nil, fmt.Errorf("scan dias: %w", err)
		}
		dias = append(dias, fecha.Format("2006-01-02"))
	}
	return dias, nil
}

func (r *DashboardRepository) GetDiasPago(ctx context.Context, year, month int) ([]string, error) {
	rows, err := r.db.Query(ctx,
		`SELECT DISTINCT fecha_pago
		 FROM ingresos
		 WHERE EXTRACT(YEAR FROM fecha_pago) = $1
		   AND EXTRACT(MONTH FROM fecha_pago) = $2`, year, month)
	if err != nil {
		return nil, fmt.Errorf("query dias pago: %w", err)
	}
	defer rows.Close()

	var dias []string
	for rows.Next() {
		var fecha time.Time
		if err := rows.Scan(&fecha); err != nil {
			return nil, fmt.Errorf("scan dias: %w", err)
		}
		dias = append(dias, fecha.Format("2006-01-02"))
	}
	return dias, nil
}
