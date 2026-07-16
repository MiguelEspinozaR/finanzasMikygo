package service

import (
	"context"
	"fmt"
	"math"

	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/model"
	"finanzasMikygo/internal/repository"
)

type SplitService struct {
	splitRepo   *repository.SplitRepository
	cuentaRepo  *repository.CuentaRepository
	ingresoRepo *repository.IngresoRepository
}

func NewSplitService(
	splitRepo *repository.SplitRepository,
	cuentaRepo *repository.CuentaRepository,
	ingresoRepo *repository.IngresoRepository,
) *SplitService {
	return &SplitService{
		splitRepo:   splitRepo,
		cuentaRepo:  cuentaRepo,
		ingresoRepo: ingresoRepo,
	}
}

func (s *SplitService) GetConfiguraciones(ctx context.Context) ([]dto.SplitConfigResponse, error) {
	configs, err := s.splitRepo.GetConfiguraciones(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto.SplitConfigResponse
	for _, c := range configs {
		cuenta, err := s.cuentaRepo.GetByID(ctx, c.CuentaID)
		if err != nil {
			continue
		}
		resp = append(resp, dto.SplitConfigResponse{
			ID:          c.ID,
			CuentaID:    c.CuentaID,
			CuentaAlias: cuenta.Alias,
			CuentaTipo:  cuenta.Tipo,
			Porcentaje:  c.Porcentaje,
			Orden:       c.Orden,
		})
	}

	return resp, nil
}

func (s *SplitService) UpdateConfiguraciones(ctx context.Context, req dto.UpdateAllSplitConfigRequest) error {
	var totalPorcentaje float64
	for _, conf := range req.Configuraciones {
		totalPorcentaje += conf.Porcentaje
	}
	if totalPorcentaje > 100.001 {
		return fmt.Errorf("los porcentajes no pueden superar 100%% (actual: %.1f%%)", totalPorcentaje)
	}

	for _, conf := range req.Configuraciones {
		config, err := s.splitRepo.GetConfiguracionByCuentaID(ctx, conf.CuentaID)
		if err != nil {
			newConfig := &model.SplitConfiguracion{
				CuentaID:   conf.CuentaID,
				Porcentaje: conf.Porcentaje,
				Orden:      len(req.Configuraciones),
			}
			if err := s.splitRepo.CreateConfiguracion(ctx, newConfig); err != nil {
				return err
			}
			continue
		}

		config.Porcentaje = conf.Porcentaje
		if err := s.splitRepo.UpdateConfiguracion(ctx, config.ID, config); err != nil {
			return err
		}

		if conf.AplicarAPendientes {
			splits, err := s.splitRepo.GetAll(ctx)
			if err != nil {
				continue
			}

			for _, split := range splits {
				if split.SplitConfiguracionID == config.ID && !split.Realizado {
					ingreso, err := s.ingresoRepo.GetByID(ctx, split.IngresoID)
					if err != nil {
						continue
					}

					nuevoMonto := s.calcularMontoSplit(ingreso.MontoEnteros, conf.Porcentaje)
					s.splitRepo.UpdateMonto(ctx, split.ID, nuevoMonto)
				}
			}
		}
	}

	return nil
}

func (s *SplitService) CreateCuenta(ctx context.Context, req dto.CreateCuentaRequest) (*dto.CuentaResponse, error) {
	cuenta := &model.Cuenta{
		Alias:        req.Alias,
		Banco:        req.Banco,
		NumeroCuenta: req.NumeroCuenta,
		Tipo:         req.Tipo,
	}

	if err := s.cuentaRepo.Create(ctx, cuenta); err != nil {
		return nil, err
	}

	config := &model.SplitConfiguracion{
		CuentaID:   cuenta.ID,
		Porcentaje: 0,
		Orden:      100,
	}
	if err := s.splitRepo.CreateConfiguracion(ctx, config); err != nil {
		return nil, err
	}

	return &dto.CuentaResponse{
		ID:           cuenta.ID,
		Alias:        cuenta.Alias,
		Banco:        cuenta.Banco,
		NumeroCuenta: cuenta.NumeroCuenta,
		Tipo:         cuenta.Tipo,
		QrRuta:       cuenta.QrRuta,
		CreatedAt:    cuenta.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    cuenta.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *SplitService) DeleteCuenta(ctx context.Context, id int64) error {
	return s.cuentaRepo.Delete(ctx, id)
}

func (s *SplitService) GetAll(ctx context.Context) ([]dto.SplitResponse, error) {
	splits, err := s.splitRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto.SplitResponse
	for _, split := range splits {
		ingreso, err := s.ingresoRepo.GetByID(ctx, split.IngresoID)
		if err != nil {
			continue
		}

		config, err := s.splitRepo.GetConfiguracionByCuentaID(ctx, split.SplitConfiguracionID)
		if err != nil {
			continue
		}

		cuenta, err := s.cuentaRepo.GetByID(ctx, config.CuentaID)
		if err != nil {
			continue
		}

		resp = append(resp, dto.FormatSplitResponse(
			split.ID, split.IngresoID, ingreso.MontoEnteros, split.MontoEnteros,
			ingreso.FechaPago,
			cuenta.ID, cuenta.Alias, cuenta.Tipo, cuenta.QrRuta,
			config.Porcentaje,
			split.Realizado, split.FechaRealizado,
			split.CreatedAt, split.UpdatedAt,
		))
	}

	return resp, nil
}

func (s *SplitService) GetByIngresoID(ctx context.Context, ingresoID int64) ([]dto.SplitResponse, error) {
	splits, err := s.splitRepo.GetByIngresoID(ctx, ingresoID)
	if err != nil {
		return nil, err
	}

	ingreso, err := s.ingresoRepo.GetByID(ctx, ingresoID)
	if err != nil {
		return nil, err
	}

	var resp []dto.SplitResponse
	for _, split := range splits {
		config, err := s.splitRepo.GetConfiguracionByCuentaID(ctx, split.SplitConfiguracionID)
		if err != nil {
			continue
		}

		cuenta, err := s.cuentaRepo.GetByID(ctx, config.CuentaID)
		if err != nil {
			continue
		}

		resp = append(resp, dto.FormatSplitResponse(
			split.ID, split.IngresoID, ingreso.MontoEnteros, split.MontoEnteros,
			ingreso.FechaPago,
			cuenta.ID, cuenta.Alias, cuenta.Tipo, cuenta.QrRuta,
			config.Porcentaje,
			split.Realizado, split.FechaRealizado,
			split.CreatedAt, split.UpdatedAt,
		))
	}

	return resp, nil
}

func (s *SplitService) MarcarRealizado(ctx context.Context, id int64, realizado bool) error {
	return s.splitRepo.MarcarRealizado(ctx, id, realizado)
}

func (s *SplitService) UpdateMonto(ctx context.Context, id int64, montoEnteros int64) error {
	return s.splitRepo.UpdateMonto(ctx, id, montoEnteros)
}

func (s *SplitService) DeleteSplit(ctx context.Context, id int64) error {
	return s.splitRepo.DeleteSplit(ctx, id)
}

func (s *SplitService) GenerarSplits(ctx context.Context, ingresoID int64, montoEnteros int64) error {
	configs, err := s.splitRepo.GetConfiguraciones(ctx)
	if err != nil {
		return err
	}

	if len(configs) == 0 {
		return nil
	}

	var splits []model.Split

	for _, config := range configs {
		montoSplit := s.calcularMontoSplit(montoEnteros, config.Porcentaje)

		splits = append(splits, model.Split{
			IngresoID:            ingresoID,
			SplitConfiguracionID: config.ID,
			MontoEnteros:         montoSplit,
		})
	}

	return s.splitRepo.CreateSplits(ctx, splits)
}

func (s *SplitService) RecalcularSplitsPendientes(ctx context.Context, ingresoID int64, montoEnteros int64) error {
	if err := s.splitRepo.DeletePendingByIngresoID(ctx, ingresoID); err != nil {
		return err
	}

	return s.GenerarSplits(ctx, ingresoID, montoEnteros)
}

func (s *SplitService) EliminarSplitsAlEliminarIngreso(ctx context.Context, ingresoID int64) (bool, error) {
	tieneRealizados, err := s.splitRepo.HasRealizedSplits(ctx, ingresoID)
	if err != nil {
		return false, err
	}

	if tieneRealizados {
		return true, fmt.Errorf("el ingreso tiene splits realizados")
	}

	if err := s.splitRepo.DeletePendingByIngresoID(ctx, ingresoID); err != nil {
		return false, err
	}

	return false, nil
}

func (s *SplitService) calcularMontoSplit(montoTotalEnteros int64, porcentaje float64) int64 {
	montoBOB := float64(montoTotalEnteros / 100)
	montoSplit := math.Floor(montoBOB * porcentaje / 100)
	return int64(montoSplit) * 100
}

func (s *SplitService) UpdateQr(ctx context.Context, id int64, qrRuta *string) error {
	return s.cuentaRepo.UpdateQr(ctx, id, qrRuta)
}

func (s *SplitService) GetCuentaByID(ctx context.Context, id int64) (*dto.CuentaResponse, error) {
	c, err := s.cuentaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &dto.CuentaResponse{
		ID:           c.ID,
		Alias:        c.Alias,
		Banco:        c.Banco,
		NumeroCuenta: c.NumeroCuenta,
		Tipo:         c.Tipo,
		QrRuta:       c.QrRuta,
		CreatedAt:    c.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    c.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *SplitService) UpdateCuenta(ctx context.Context, id int64, req dto.UpdateCuentaRequest) (*dto.CuentaResponse, error) {
	cuenta := &model.Cuenta{}
	if req.Alias != nil {
		cuenta.Alias = *req.Alias
	}
	if req.Tipo != nil {
		cuenta.Tipo = *req.Tipo
	}
	cuenta.Banco = req.Banco
	cuenta.NumeroCuenta = req.NumeroCuenta

	if err := s.cuentaRepo.Update(ctx, id, cuenta); err != nil {
		return nil, err
	}

	return s.GetCuentaByID(ctx, id)
}

func (s *SplitService) GetAllCuentas(ctx context.Context) ([]dto.CuentaResponse, error) {
	cuentas, err := s.cuentaRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto.CuentaResponse
	for _, c := range cuentas {
		resp = append(resp, dto.CuentaResponse{
			ID:           c.ID,
			Alias:        c.Alias,
			Banco:        c.Banco,
			NumeroCuenta: c.NumeroCuenta,
			Tipo:         c.Tipo,
			QrRuta:       c.QrRuta,
			CreatedAt:    c.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:    c.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return resp, nil
}

func (s *SplitService) GetIngresosConSplits(ctx context.Context) ([]int64, error) {
	return s.splitRepo.GetIngresosConSplits(ctx)
}

func (s *SplitService) GenerarPorIngreso(ctx context.Context, ingresoID int64) error {
	alreadyHas, err := s.splitRepo.HasAnySplits(ctx, ingresoID)
	if err != nil {
		return fmt.Errorf("error verificando splits: %w", err)
	}
	if alreadyHas {
		return fmt.Errorf("ya tiene splits")
	}

	ingreso, err := s.ingresoRepo.GetByID(ctx, ingresoID)
	if err != nil {
		return fmt.Errorf("ingreso no encontrado: %w", err)
	}

	return s.GenerarSplits(ctx, ingresoID, ingreso.MontoEnteros)
}
