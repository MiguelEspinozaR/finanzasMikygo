package service

import (
	"context"
	"fmt"
	"time"

	"finanzasMikygo/internal/config"
	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/model"
	"finanzasMikygo/internal/repository"
)

type IngresoService struct {
	repo      *repository.IngresoRepository
	splitSvc  *SplitService
}

func NewIngresoService(repo *repository.IngresoRepository, splitSvc *SplitService) *IngresoService {
	return &IngresoService{repo: repo, splitSvc: splitSvc}
}

func (s *IngresoService) Create(ctx context.Context, req dto.CreateIngresoRequest) (*dto.IngresoResponse, error) {
	fechaPago, err := time.ParseInLocation("2006-01-02", req.FechaPago, config.Location)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_pago: %w", err)
	}

	var fechasTrabajo []model.FechaTrabajo
	for _, f := range req.FechasTrabajo {
		fecha, err := time.ParseInLocation("2006-01-02", f.Fecha, config.Location)
		if err != nil {
			return nil, fmt.Errorf("invalid fecha_trabajo: %w", err)
		}
		fechasTrabajo = append(fechasTrabajo, model.FechaTrabajo{Fecha: fecha})
	}

	ingreso := &model.Ingreso{
		FechaPago:     fechaPago,
		MontoEnteros:  req.MontoEnteros,
		Tipo:          req.Tipo,
		Comentario:    req.Comentario,
		ImagenRuta:    req.ImagenRuta,
		FechasTrabajo: fechasTrabajo,
	}

	s.splitMonto(ingreso)

	if err := s.repo.Create(ctx, ingreso); err != nil {
		return nil, err
	}

	s.splitSvc.GenerarSplits(ctx, ingreso.ID, ingreso.MontoEnteros)

	return s.toResponse(ingreso), nil
}

func (s *IngresoService) splitMonto(ingreso *model.Ingreso) {
	n := len(ingreso.FechasTrabajo)
	if n == 0 {
		return
	}

	total := ingreso.MontoEnteros
	base := total / int64(n)

	for i := range ingreso.FechasTrabajo {
		if i < n-1 {
			ingreso.FechasTrabajo[i].MontoEnteros = base
		} else {
			ingreso.FechasTrabajo[i].MontoEnteros = total - base*int64(n-1)
		}
	}
}



func (s *IngresoService) GetAll(ctx context.Context, fechaInicio, fechaFin *time.Time, tipo *string, page, pageSize int) (*dto.IngresoListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	ingresos, total, err := s.repo.GetAll(ctx, fechaInicio, fechaFin, tipo, page, pageSize)
	if err != nil {
		return nil, err
	}

	var responses []dto.IngresoResponse
	for _, ing := range ingresos {
		responses = append(responses, *s.toResponse(&ing))
	}

	return &dto.IngresoListResponse{
		Data:     responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *IngresoService) GetByID(ctx context.Context, id int64) (*dto.IngresoResponse, error) {
	ingreso, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.toResponse(ingreso), nil
}

func (s *IngresoService) Update(ctx context.Context, id int64, req dto.UpdateIngresoRequest) (*dto.IngresoResponse, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.FechaPago != nil {
		fecha, err := time.ParseInLocation("2006-01-02", *req.FechaPago, config.Location)
		if err != nil {
			return nil, fmt.Errorf("invalid fecha_pago: %w", err)
		}
		existing.FechaPago = fecha
	}
	if req.MontoEnteros != nil {
		existing.MontoEnteros = *req.MontoEnteros
	}
	if req.Tipo != nil {
		existing.Tipo = *req.Tipo
	}
	if req.Comentario != nil {
		existing.Comentario = req.Comentario
	}
	if req.ImagenRuta != nil {
		existing.ImagenRuta = req.ImagenRuta
	}
	if req.FechasTrabajo != nil {
		var fechas []model.FechaTrabajo
		for _, f := range req.FechasTrabajo {
			fecha, err := time.ParseInLocation("2006-01-02", f.Fecha, config.Location)
			if err != nil {
				return nil, fmt.Errorf("invalid fecha_trabajo: %w", err)
			}
			fechas = append(fechas, model.FechaTrabajo{Fecha: fecha})
		}
		existing.FechasTrabajo = fechas
	}

	s.splitMonto(existing)

	if err := s.repo.Update(ctx, id, existing); err != nil {
		return nil, err
	}

	return s.toResponse(existing), nil
}

func (s *IngresoService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *IngresoService) GetFechasOcupadas(ctx context.Context, mes, anio int) (map[string][]string, error) {
	return s.repo.GetFechasOcupadas(ctx, mes, anio)
}

func (s *IngresoService) UpdateImagenRuta(ctx context.Context, id int64, imagenRuta string) error {
	return s.repo.UpdateImagenRuta(ctx, id, imagenRuta)
}

func (s *IngresoService) toResponse(ing *model.Ingreso) *dto.IngresoResponse {
	var fechas []dto.FechaTrabajoResponse
	for _, f := range ing.FechasTrabajo {
		fechas = append(fechas, dto.FechaTrabajoResponse{
			Fecha:        f.Fecha,
			MontoEnteros: f.MontoEnteros,
			MontoDisplay: dto.FormatMonto(f.MontoEnteros),
		})
	}
	return &dto.IngresoResponse{
		ID:            ing.ID,
		FechaPago:     ing.FechaPago,
		MontoEnteros:  ing.MontoEnteros,
		MontoDisplay:  dto.FormatMonto(ing.MontoEnteros),
		Tipo:          ing.Tipo,
		Comentario:    ing.Comentario,
		ImagenRuta:    ing.ImagenRuta,
		FechasTrabajo: fechas,
		CreatedAt:     ing.CreatedAt,
		UpdatedAt:     ing.UpdatedAt,
	}
}
