package model

import "time"

type SplitConfiguracion struct {
	ID         int64     `json:"id"`
	CuentaID   int64     `json:"cuenta_id"`
	Porcentaje float64   `json:"porcentaje"`
	Orden      int       `json:"orden"`
	FuenteID   *int64    `json:"fuente_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Split struct {
	ID                   int64      `json:"id"`
	IngresoID            int64      `json:"ingreso_id"`
	SplitConfiguracionID int64      `json:"split_configuracion_id"`
	MontoEnteros         int64      `json:"monto_enteros"`
	Realizado            bool       `json:"realizado"`
	FechaRealizado       *time.Time `json:"fecha_realizado"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}
