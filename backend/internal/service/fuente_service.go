package service

import (
	"context"

	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/repository"
)

type FuenteService struct {
	repo *repository.FuenteRepository
}

func NewFuenteService(repo *repository.FuenteRepository) *FuenteService {
	return &FuenteService{repo: repo}
}

func (s *FuenteService) GetAll(ctx context.Context) ([]dto.FuenteResponse, error) {
	fuentes, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto.FuenteResponse
	for _, f := range fuentes {
		resp = append(resp, dto.FuenteResponse{
			ID:        f.ID,
			Nombre:    f.Nombre,
			Color:     f.Color,
			CreatedAt: f.CreatedAt,
			UpdatedAt: f.UpdatedAt,
		})
	}

	return resp, nil
}

func (s *FuenteService) GetByID(ctx context.Context, id int64) (*dto.FuenteResponse, error) {
	f, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &dto.FuenteResponse{
		ID:        f.ID,
		Nombre:    f.Nombre,
		Color:     f.Color,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}, nil
}

func (s *FuenteService) Create(ctx context.Context, req dto.CreateFuenteRequest) (*dto.FuenteResponse, error) {
	f, err := s.repo.Create(ctx, req.Nombre, req.Color)
	if err != nil {
		return nil, err
	}

	return &dto.FuenteResponse{
		ID:        f.ID,
		Nombre:    f.Nombre,
		Color:     f.Color,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}, nil
}

func (s *FuenteService) Update(ctx context.Context, id int64, req dto.UpdateFuenteRequest) (*dto.FuenteResponse, error) {
	f, err := s.repo.Update(ctx, id, req.Nombre, req.Color)
	if err != nil {
		return nil, err
	}

	return &dto.FuenteResponse{
		ID:        f.ID,
		Nombre:    f.Nombre,
		Color:     f.Color,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}, nil
}

func (s *FuenteService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}
