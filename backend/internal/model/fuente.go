package model

import "time"

type Fuente struct {
	ID        int64     `json:"id"`
	Nombre    string    `json:"nombre"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
