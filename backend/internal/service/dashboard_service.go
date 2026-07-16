package service

import (
	"context"
	"time"

	"finanzasMikygo/internal/config"
	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/repository"
)

type DashboardService struct {
	repo *repository.DashboardRepository
}

func NewDashboardService(repo *repository.DashboardRepository) *DashboardService {
	return &DashboardService{repo: repo}
}

func (s *DashboardService) GetSummary(ctx context.Context, year, month int) (*dto.DashboardSummaryResponse, error) {
	diasTrabajados, err := s.repo.GetDiasTrabajados(ctx, year, month)
	if err != nil {
		return nil, err
	}

	diasPago, err := s.repo.GetDiasPago(ctx, year, month)
	if err != nil {
		return nil, err
	}

	return &dto.DashboardSummaryResponse{
		DiasTrabajados: diasTrabajados,
		DiasPago:       diasPago,
	}, nil
}

func (s *DashboardService) GetWeekly(ctx context.Context, fecha string) ([]dto.DashboardWeeklyResponse, error) {
	var weekStart time.Time
	if fecha != "" {
		var err error
		weekStart, err = time.ParseInLocation("2006-01-02", fecha, config.Location)
		if err != nil {
			weekStart = time.Now()
		}
	} else {
		weekStart = time.Now()
	}
	// Adjust to start of week (Monday)
	weekday := int(weekStart.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	weekStart = weekStart.AddDate(0, 0, -(weekday - 1))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())

	data, err := s.repo.GetWeeklyData(ctx, weekStart)
	if err != nil {
		return nil, err
	}

	var total int64
	for _, d := range data {
		total += d["monto"].(int64)
	}
	promedio := int64(0)
	if len(data) > 0 {
		promedio = total / int64(len(data))
	}

	var result []dto.DashboardWeeklyResponse
	for _, d := range data {
		result = append(result, dto.DashboardWeeklyResponse{
			Dia:      d["fecha"].(string),
			Monto:    d["monto"].(int64),
			Promedio: promedio,
		})
	}
	return result, nil
}

func (s *DashboardService) GetMonthly(ctx context.Context, year, month int) ([]dto.DashboardMonthlyResponse, error) {
	data, err := s.repo.GetMonthlyData(ctx, year, month)
	if err != nil {
		return nil, err
	}

	var total int64
	for _, d := range data {
		total += d["monto"].(int64)
	}
	promedio := int64(0)
	if len(data) > 0 {
		promedio = total / int64(len(data))
	}

	var result []dto.DashboardMonthlyResponse
	for _, d := range data {
		var dias []dto.DashboardMonthlyDayResponse
		if rawDias, ok := d["dias"].([]map[string]interface{}); ok {
			for _, dia := range rawDias {
				dias = append(dias, dto.DashboardMonthlyDayResponse{
					Fecha: dia["fecha"].(string),
					Monto: dia["monto"].(int64),
				})
			}
		}
		result = append(result, dto.DashboardMonthlyResponse{
			Semana:   d["semana"].(string),
			Monto:    d["monto"].(int64),
			Promedio: promedio,
			Dias:     dias,
		})
	}
	return result, nil
}

func (s *DashboardService) GetYearly(ctx context.Context, year int) ([]dto.DashboardYearlyResponse, error) {
	data, err := s.repo.GetYearlyData(ctx, year)
	if err != nil {
		return nil, err
	}

	var total int64
	for _, d := range data {
		total += d["monto"].(int64)
	}
	promedio := int64(0)
	if len(data) > 0 {
		promedio = total / int64(len(data))
	}

	var result []dto.DashboardYearlyResponse
	for _, d := range data {
		result = append(result, dto.DashboardYearlyResponse{
			Mes:      d["mes"].(string),
			Monto:    d["monto"].(int64),
			Promedio: promedio,
		})
	}
	return result, nil
}

func (s *DashboardService) GetHistory(ctx context.Context) ([]dto.DashboardHistoryResponse, error) {
	data, err := s.repo.GetHistoryData(ctx)
	if err != nil {
		return nil, err
	}

	var result []dto.DashboardHistoryResponse
	for _, d := range data {
		result = append(result, dto.DashboardHistoryResponse{
			Mes:            d["mes"].(string),
			Monto:          d["monto"].(int64),
			Promedio:       d["promedio"].(int64),
			PromedioGlobal: d["promedio_global"].(int64),
		})
	}
	return result, nil
}
