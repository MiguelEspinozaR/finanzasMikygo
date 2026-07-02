package model

import "time"

type Ingreso struct {
	ID            int64             `json:"id"`
	FechaPago     time.Time         `json:"fecha_pago"`
	MontoEnteros  int64             `json:"monto_enteros"`
	Tipo          string            `json:"tipo"`
	Comentario    *string           `json:"comentario"`
	ImagenRuta    *string           `json:"imagen_ruta"`
	FechasTrabajo []FechaTrabajo    `json:"fechas_trabajo"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type FechaTrabajo struct {
	Fecha        time.Time `json:"fecha"`
	MontoEnteros int64     `json:"monto_enteros"`
}
