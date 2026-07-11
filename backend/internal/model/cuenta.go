package model

import "time"

type Cuenta struct {
	ID           int64      `json:"id"`
	Alias        string     `json:"alias"`
	Banco        *string    `json:"banco"`
	NumeroCuenta *string    `json:"numero_cuenta"`
	Tipo         string     `json:"tipo"`
	QrRuta       *string    `json:"qr_ruta"`
	DeletedAt    *time.Time `json:"deleted_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
