package dto

import "time"

type CreateFuenteRequest struct {
	Nombre string `json:"nombre" binding:"required"`
	Color  string `json:"color" binding:"required"`
}

type UpdateFuenteRequest struct {
	Nombre *string `json:"nombre"`
	Color  *string `json:"color"`
}

type FuenteResponse struct {
	ID        int64     `json:"id"`
	Nombre    string    `json:"nombre"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FuenteListResponse struct {
	Data []FuenteResponse `json:"data"`
}
