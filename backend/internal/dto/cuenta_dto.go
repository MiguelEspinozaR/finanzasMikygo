package dto

import "time"

type CreateCuentaRequest struct {
	Alias        string  `json:"alias" binding:"required"`
	Banco        *string `json:"banco"`
	NumeroCuenta *string `json:"numero_cuenta"`
	Tipo         string  `json:"tipo" binding:"required,oneof=ahorro corriente virtual fisica"`
}

type UpdateCuentaRequest struct {
	Alias        *string `json:"alias"`
	Banco        *string `json:"banco"`
	NumeroCuenta *string `json:"numero_cuenta"`
	Tipo         *string `json:"tipo" binding:"omitempty,oneof=ahorro corriente virtual fisica"`
}

type CuentaResponse struct {
	ID           int64   `json:"id"`
	Alias        string  `json:"alias"`
	Banco        *string `json:"banco"`
	NumeroCuenta *string `json:"numero_cuenta"`
	Tipo         string  `json:"tipo"`
	QrRuta       *string `json:"qr_ruta"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

type CuentaListResponse struct {
	Data []CuentaResponse `json:"data"`
}

func FormatCuentaResponse(c *time.Time, u *time.Time) (string, string) {
	created := ""
	updated := ""
	if c != nil {
		created = c.Format("2006-01-02T15:04:05Z07:00")
	}
	if u != nil {
		updated = u.Format("2006-01-02T15:04:05Z07:00")
	}
	return created, updated
}
