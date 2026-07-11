package service

import (
	"context"
	"fmt"

	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/model"
	"finanzasMikygo/internal/repository"
)

type CuentaService struct {
	repo *repository.CuentaRepository
}

func NewCuentaService(repo *repository.CuentaRepository) *CuentaService {
	return &CuentaService{repo: repo}
}

func (s *CuentaService) Create(ctx context.Context, req dto.CreateCuentaRequest) (*dto.CuentaResponse, error) {
	cuenta := &model.Cuenta{
		Alias:        req.Alias,
		Banco:        req.Banco,
		NumeroCuenta: req.NumeroCuenta,
		Tipo:         req.Tipo,
	}

	if err := s.repo.Create(ctx, cuenta); err != nil {
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

func (s *CuentaService) GetAll(ctx context.Context) ([]dto.CuentaResponse, error) {
	cuentas, err := s.repo.GetAll(ctx)
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

func (s *CuentaService) GetByID(ctx context.Context, id int64) (*dto.CuentaResponse, error) {
	c, err := s.repo.GetByID(ctx, id)
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

func (s *CuentaService) Update(ctx context.Context, id int64, req dto.UpdateCuentaRequest) (*dto.CuentaResponse, error) {
	cuenta := &model.Cuenta{}
	if req.Alias != nil {
		cuenta.Alias = *req.Alias
	}
	if req.Tipo != nil {
		cuenta.Tipo = *req.Tipo
	}
	cuenta.Banco = req.Banco
	cuenta.NumeroCuenta = req.NumeroCuenta

	if err := s.repo.Update(ctx, id, cuenta); err != nil {
		return nil, err
	}

	return s.GetByID(ctx, id)
}

func (s *CuentaService) Delete(ctx context.Context, id int64) error {
	cuenta, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("cuenta not found: %w", err)
	}

	_ = cuenta

	return s.repo.Delete(ctx, id)
}

func (s *CuentaService) UpdateQr(ctx context.Context, id int64, qrRuta *string) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("cuenta not found: %w", err)
	}

	return s.repo.UpdateQr(ctx, id, qrRuta)
}
