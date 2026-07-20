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
		`SELECT EXTRACT(WEEK FROM ift.fecha_trabajo) as semana,
		        ift.fecha_trabajo::text as fecha, ift.monto_enteros
		 FROM ingreso_fechas_trabajo ift
		 WHERE EXTRACT(YEAR FROM ift.fecha_trabajo) = $1
		   AND EXTRACT(MONTH FROM ift.fecha_trabajo) = $2
		 ORDER BY semana, ift.fecha_trabajo`, year, month)
	if err != nil {
		return nil, fmt.Errorf("query monthly: %w", err)
	}
	defer rows.Close()

	type weekData struct {
		semana string
		monto  int64
		dias   []map[string]interface{}
	}

	weeks := make(map[int]*weekData)
	var weekOrder []int

	for rows.Next() {
		var semana int
		var fecha string
		var monto int64
		if err := rows.Scan(&semana, &fecha, &monto); err != nil {
			return nil, fmt.Errorf("scan monthly: %w", err)
		}
		if _, exists := weeks[semana]; !exists {
			weeks[semana] = &weekData{semana: fmt.Sprintf("Sem %d", semana)}
			weekOrder = append(weekOrder, semana)
		}
		weeks[semana].monto += monto
		weeks[semana].dias = append(weeks[semana].dias, map[string]interface{}{
			"fecha": fecha,
			"monto": monto,
		})
	}

	var result []map[string]interface{}
	for _, semana := range weekOrder {
		w := weeks[semana]
		result = append(result, map[string]interface{}{
			"semana": w.semana,
			"monto":  w.monto,
			"dias":   w.dias,
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
	rows, err := r.db.Query(ctx,
		`SELECT to_char(ift.fecha_trabajo, 'YYYY-MM') as mes,
		        SUM(ift.monto_enteros) as total,
		        COUNT(*) as dias_trabajados
		 FROM ingreso_fechas_trabajo ift
		 GROUP BY mes
		 ORDER BY mes`)
	if err != nil {
		return nil, fmt.Errorf("query history: %w", err)
	}
	defer rows.Close()

	type monthData struct {
		mes   string
		total int64
	}

	var months []monthData
	var result []map[string]interface{}

	for rows.Next() {
		var mes string
		var total int64
		var diasTrabajados int64
		if err := rows.Scan(&mes, &total, &diasTrabajados); err != nil {
			return nil, fmt.Errorf("scan history: %w", err)
		}
		promedio := int64(0)
		if diasTrabajados > 0 {
			promedio = total / diasTrabajados
		}
		months = append(months, monthData{mes: mes, total: total})
		result = append(result, map[string]interface{}{
			"mes":      mes,
			"monto":    total,
			"promedio": promedio,
		})
	}

	// Calcular tendencia global (regresión lineal) sobre totales mensuales
	n := float64(len(months))
	var tendenciaGlobal int64
	if n >= 2 {
		var sumX, sumY, sumXY, sumX2 float64
		for i, m := range months {
			x := float64(i)
			y := float64(m.total)
			sumX += x
			sumY += y
			sumXY += x * y
			sumX2 += x * x
		}
		// Pendiente de regresión lineal: m = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
		denominator := n*sumX2 - sumX*sumX
		if denominator != 0 {
			pendiente := (n*sumXY - sumX*sumY) / denominator
			// Valor de tendencia en el último mes (proyección)
			ultimoIndice := n - 1
			intercept := (sumY - pendiente*sumX) / n
			tendenciaVal := pendiente*ultimoIndice + intercept
			tendenciaGlobal = int64(tendenciaVal)
		}
	}

	// Agregar tendencia_global a cada resultado
	for i := range result {
		result[i]["tendencia_global"] = tendenciaGlobal
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
